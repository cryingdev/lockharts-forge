import { GameState, ManualDungeonSession, RoomType, DungeonResult } from '../../types/game-state';
import { DUNGEONS } from '../../data/dungeons';
import { handleClaimExpedition } from './expedition';
import { MONSTERS } from '../../data/monsters';
import { calculateMaxHp, calculateMaxMp, mergePrimaryStats } from '../../models/Stats';

// Helper to generate the dungeon grid for manual assault mode
const generateManualGrid = (width: number, height: number, dungeonId: string): RoomType[][] => {
    const grid: RoomType[][] = Array.from({ length: height }, () => Array(width).fill('EMPTY'));
    // Entry point is always at the top-left
    grid[0][0] = 'ENTRANCE';
    
    // Boss room is typically at the bottom-right
    grid[height - 1][width - 1] = 'BOSS';
    
    // Randomly place exactly one key required for some dungeons
    let keyPlaced = false;
    let attempts = 0;
    while (!keyPlaced && attempts < 100) {
        let kx = Math.floor(Math.random() * width);
        let ky = Math.floor(Math.random() * height);
        if (grid[ky][kx] === 'EMPTY') {
            grid[ky][kx] = 'KEY';
            keyPlaced = true;
        }
        attempts++;
    }

    // Populate the rest of the grid with random points of interest
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (grid[y][x] === 'EMPTY') {
                const r = Math.random();
                if (r < 0.12) grid[y][x] = 'GOLD';
                else if (r < 0.22) grid[y][x] = 'TRAP';
                else if (r < 0.25) grid[y][x] = 'NPC';
            }
        }
    }
    
    return grid;
};

/**
 * handleStartManualDungeon
 * Initializes a new manual dungeon session, consumes entry energy, and prepares the grid.
 */
export const handleStartManualDungeon = (state: GameState, payload: { dungeonId: string; partyIds: string[] }): GameState => {
    const dungeon = DUNGEONS.find(d => d.id === payload.dungeonId);
    if (!dungeon) return state;

    const party = state.knownMercenaries.filter(m => payload.partyIds.includes(m.id));
    if (party.some(m => (m.expeditionEnergy || 0) < dungeon.energyCost)) {
        return { ...state, logs: [`Your squad is too exhausted to enter ${dungeon.name}.`, ...state.logs] };
    }

    // Update mercenary status and energy levels
    const updatedMercs = state.knownMercenaries.map(m => {
        if (payload.partyIds.includes(m.id)) {
            return { 
                ...m, 
                expeditionEnergy: Math.max(0, (m.expeditionEnergy || 0) - dungeon.energyCost), 
                status: 'ON_EXPEDITION' as const 
            };
        }
        return m;
    });

    const grid = generateManualGrid(dungeon.gridWidth, dungeon.gridHeight, dungeon.id);
    const visited = Array.from({ length: dungeon.gridHeight }, () => Array(dungeon.gridWidth).fill(false));
    // Reveal the starting location
    visited[0][0] = true;

    const session: ManualDungeonSession = {
        dungeonId: dungeon.id,
        partyIds: payload.partyIds,
        grid,
        visited,
        playerPos: { x: 0, y: 0 },
        pathHistory: [{ x: 0, y: 0 }],
        hasKey: false,
        isBossLocked: dungeon.isBossLocked ?? true,
        goldCollected: 0,
        encounterStatus: 'NONE'
    };

    return {
        ...state,
        knownMercenaries: updatedMercs,
        activeManualDungeon: session,
        showManualDungeonOverlay: true,
        logs: [`Direct assault initiated: ${dungeon.name}.`, ...state.logs]
    };
};

export const handleMoveManualDungeon = (state: GameState, payload: { x: number, y: number }): GameState => {
    const session = state.activeManualDungeon;
    if (!session || session.encounterStatus === 'ENCOUNTERED' || session.encounterStatus === 'BATTLE') return state;

    const dungeon = DUNGEONS.find(d => d.id === session.dungeonId);
    if (!dungeon) return state;

    const newX = session.playerPos.x + payload.x;
    const newY = session.playerPos.y + payload.y;

    if (newX < 0 || newX >= dungeon.gridWidth || newY < 0 || newY >= dungeon.gridHeight) {
        return { ...state, toastQueue: [...state.toastQueue, "Area boundary reached."] };
    }

    const targetRoom = session.grid[newY][newX];
    if (targetRoom === 'WALL') return state;

    const isAlreadyVisited = session.visited[newY][newX];
    const cost = isAlreadyVisited ? -1 : (targetRoom === 'BOSS' ? dungeon.bossEnergy : dungeon.moveEnergy);

    const party = state.knownMercenaries.filter(m => session.partyIds.includes(m.id));
    if (cost > 0 && party.some(m => (m.expeditionEnergy || 0) < cost)) {
        return { ...state, logs: [`Your squad is too exhausted to move.`, ...state.logs] };
    }

    let updatedMercs = state.knownMercenaries.map(m => {
        if (session.partyIds.includes(m.id)) {
            let nextEnergy = Math.max(0, (m.expeditionEnergy || 0) - cost);
            let nextHp = m.currentHp;
            if (targetRoom === 'TRAP' && !isAlreadyVisited) nextHp = Math.max(0, m.currentHp - 25);
            return { ...m, expeditionEnergy: nextEnergy, currentHp: nextHp };
        }
        return m;
    });

    // 전멸 체크: 모든 파티원의 체력이 0이 되면 탈락
    const isWipedOut = updatedMercs.filter(m => session.partyIds.includes(m.id)).every(m => m.currentHp <= 0);
    if (isWipedOut) {
        return handleRetreatManualDungeon({ ...state, knownMercenaries: updatedMercs });
    }

    const newVisited = [...session.visited.map(row => [...row])];
    newVisited[newY][newX] = true;

    let extraGold = 0;
    let newGrid = [...session.grid.map(row => [...row])];
    let logMsg = '';
    let encounterStatus: ManualDungeonSession['encounterStatus'] = 'NONE';

    if (targetRoom === 'GOLD' && !isAlreadyVisited) {
        extraGold = (dungeon.tier || 1) * 50;
        newGrid[newY][newX] = 'EMPTY';
        logMsg = `Cache secured. (+${extraGold} G)`;
    } else if (targetRoom === 'TRAP' && !isAlreadyVisited) {
        logMsg = `AMBUSH: Squad hit by a trap! (-25 HP)`;
    } else if (targetRoom === 'KEY' && !isAlreadyVisited) {
        logMsg = `Chamber key recovered.`;
        newGrid[newY][newX] = 'EMPTY';
    } else if (targetRoom === 'BOSS' && !session.isBossDefeated) {
        encounterStatus = 'ENCOUNTERED';
        logMsg = `CRITICAL ALERT: Boss identified.`;
    }

    return {
        ...state,
        knownMercenaries: updatedMercs,
        activeManualDungeon: {
            ...session,
            grid: newGrid,
            playerPos: { x: newX, y: newY },
            pathHistory: [{ x: newX, y: newY }, ...session.pathHistory].slice(0, 50),
            visited: newVisited,
            hasKey: targetRoom === 'KEY' ? true : session.hasKey,
            encounterStatus,
            goldCollected: session.goldCollected + extraGold
        },
        logs: logMsg ? [logMsg, ...state.logs] : state.logs
    };
};

/**
 * handleFinishManualDungeon
 * Successfully concludes a manual dungeon run, processing rewards and clearing the session.
 */
export const handleFinishManualDungeon = (state: GameState): GameState => {
    const session = state.activeManualDungeon;
    if (!session) return state;

    // We reuse handleClaimExpedition by simulating a completed expedition object
    const tempExpId = `temp_manual_${Date.now()}`;
    const tempExp = {
        id: tempExpId,
        dungeonId: session.dungeonId,
        partyIds: session.partyIds,
        startTime: 0,
        endTime: 0,
        status: 'COMPLETED' as const
    };

    const stateWithTempExp = {
        ...state,
        activeExpeditions: [...state.activeExpeditions, tempExp]
    };

    // Calculate standard rewards and potential NPC rescues
    const claimedState = handleClaimExpedition(stateWithTempExp, { 
        expeditionId: tempExpId, 
        rescuedNpcId: session.rescuedNpcId 
    });

    // Finalize manually collected currency
    if (session.goldCollected > 0) {
        claimedState.stats.gold += session.goldCollected;
        if (claimedState.dungeonResult) {
            claimedState.dungeonResult.goldGained = (claimedState.dungeonResult.goldGained || 0) + session.goldCollected;
        }
    }

    return {
        ...claimedState,
        activeManualDungeon: null,
        showManualDungeonOverlay: false
    };
};

/**
 * handleStartCombatManual
 * Spawns the boss monster and transitions the session into the combat view.
 */
export const handleStartCombatManual = (state: GameState): GameState => {
    const session = state.activeManualDungeon;
    if (!session || session.encounterStatus !== 'ENCOUNTERED') return state;

    const dungeon = DUNGEONS.find(d => d.id === session.dungeonId);
    if (!dungeon) return state;

    // Select boss based on dungeon variant availability and player clears
    let bossId = 'rat_man'; 
    if (dungeon.bossVariantId && MONSTERS[dungeon.bossVariantId]) {
        const clears = state.dungeonClearCounts[dungeon.id] || 0;
        if (clears >= (dungeon.bossUnlockReq || 0)) {
            bossId = dungeon.bossVariantId;
        }
    }

    const monsterBase = MONSTERS[bossId] || MONSTERS['rat_man'];
    const bossEntity = { ...monsterBase, currentHp: monsterBase.stats.maxHp };

    return {
        ...state,
        activeManualDungeon: {
            ...session,
            encounterStatus: 'BATTLE',
            bossEntity
        }
    };
};

export const handleResolveCombatManual = (state: GameState, payload: { win: boolean, flee: boolean, finalParty: any[] }): GameState => {
    const session = state.activeManualDungeon;
    if (!session) return state;

    let logMsg = '';
    
    // 경험치 분배: 승리 시 보스 경험치를 생존 파티원 수로 나눔
    const livingMembers = payload.finalParty.filter(p => p.currentHp > 0);
    const xpPerMember = (payload.win && session.bossEntity && livingMembers.length > 0) 
        ? Math.floor(session.bossEntity.rewardXp / livingMembers.length) 
        : 0;

    if (payload.win && xpPerMember > 0) {
        logMsg = `VICTORY: ${session.bossEntity?.name} defeated! ${livingMembers.length} members gained ${xpPerMember} XP.`;
    }

    const newKnownMercenaries = state.knownMercenaries.map(m => {
        const combatant = payload.finalParty.find(p => p.id === m.id);
        if (combatant) {
            let nextXp = m.currentXp;
            let nextLevel = m.level;
            let nextMaxHp = m.maxHp;
            let nextMaxMp = m.maxMp;
            let nextCurrentHp = combatant.currentHp;

            if (payload.win && combatant.currentHp > 0) {
                nextXp += xpPerMember;
                while (nextXp >= m.xpToNextLevel) {
                    nextXp -= m.xpToNextLevel;
                    nextLevel++;
                    const merged = mergePrimaryStats(m.stats, m.allocatedStats);
                    nextMaxHp = calculateMaxHp(merged, nextLevel);
                    nextMaxMp = calculateMaxMp(merged, nextLevel);
                    nextCurrentHp = nextMaxHp; // 레벨업 시 완치
                    logMsg += ` ${m.name} reached Level ${nextLevel}!`;
                }
            }

            return { 
                ...m, 
                currentHp: nextCurrentHp, 
                currentMp: combatant.currentMp,
                currentXp: nextXp,
                level: nextLevel,
                maxHp: nextMaxHp,
                maxMp: nextMaxMp,
                xpToNextLevel: nextLevel * 100
            };
        }
        return m;
    });

    return {
        ...state,
        knownMercenaries: newKnownMercenaries,
        activeManualDungeon: {
            ...session,
            encounterStatus: payload.win ? 'VICTORY' : (payload.flee ? 'NONE' : 'DEFEAT'),
            isBossDefeated: payload.win || session.isBossDefeated
        },
        logs: logMsg ? [logMsg, ...state.logs] : state.logs
    };
};

export const handleRetreatManualDungeon = (state: GameState): GameState => {
    const session = state.activeManualDungeon;
    if (!session) return state;

    const isDefeat = session.encounterStatus === 'DEFEAT' || 
                    state.knownMercenaries.filter(m => session.partyIds.includes(m.id)).every(m => m.currentHp <= 0);
    
    const dungeon = DUNGEONS.find(d => d.id === session.dungeonId);
    const mercResults: DungeonResult['mercenaryResults'] = [];

    const updatedMercs = state.knownMercenaries.map(m => {
        if (session.partyIds.includes(m.id)) {
            let nextStatus: any = 'HIRED';
            let statusChange: 'NONE' | 'INJURED' | 'DEAD' = 'NONE';
            
            if (isDefeat) {
                const roll = Math.random();
                if (roll < 0.1) { nextStatus = 'DEAD'; statusChange = 'DEAD'; }
                else { 
                    nextStatus = 'INJURED'; statusChange = 'INJURED'; 
                    m.recoveryUntilDay = state.stats.day + 2; 
                }
            } else if (m.currentHp <= 0) {
                nextStatus = 'INJURED'; statusChange = 'INJURED';
                m.recoveryUntilDay = state.stats.day + 1;
            }

            mercResults.push({
                id: m.id, name: m.name, job: m.job, levelBefore: m.level, levelAfter: m.level,
                xpGained: 0, currentXp: m.currentXp, xpToNext: m.xpToNextLevel, statusChange
            });

            return { ...m, status: nextStatus, assignedExpeditionId: undefined };
        }
        return m;
    });

    return {
        ...state,
        knownMercenaries: updatedMercs,
        dungeonResult: isDefeat ? {
            dungeonName: dungeon?.name || 'Unknown',
            rewards: [],
            mercenaryResults: mercResults,
            isDefeat: true
        } : state.dungeonResult,
        activeManualDungeon: null,
        showManualDungeonOverlay: false,
        logs: [isDefeat ? 'CRITICAL FAILURE: Squad neutralized.' : 'Squad retreated.', ...state.logs]
    };
};

export const handleRescueNPC = (state: GameState, payload: { npcId: string }): GameState => {
    const currentSession = state.activeManualDungeon;
    if (!currentSession) return state;

    let newGrid = [...currentSession.grid.map(row => [...row])];
    newGrid[currentSession.playerPos.y][currentSession.playerPos.x] = 'EMPTY';

    return {
        ...state,
        activeManualDungeon: { ...currentSession, grid: newGrid, npcFound: true, rescuedNpcId: payload.npcId },
        logs: [`Survivor secured! Initiating extraction.`, ...state.logs]
    };
};
