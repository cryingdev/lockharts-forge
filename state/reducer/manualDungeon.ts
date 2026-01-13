
import { GameState, ManualDungeonSession, RoomType, DungeonResult } from '../../types/game-state';
import { DUNGEONS } from '../../data/dungeons';
import { handleClaimExpedition } from './expedition';
import { TILLY_FOOTLOOSE } from '../../data/mercenaries';
import { MONSTERS } from '../../data/monsters';
import { calculateMaxHp, calculateMaxMp, mergePrimaryStats } from '../../models/Stats';

const generateManualGrid = (width: number, height: number, locked: boolean, dungeonId: string, knownMercs: any[]) => {
    const grid: RoomType[][] = Array.from({ length: height }, () => Array(width).fill('EMPTY'));
    const visited: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));

    const startX = Math.floor(Math.random() * width);
    const startY = Math.floor(Math.random() * height);
    grid[startY][startX] = 'ENTRANCE';
    visited[startY][startX] = true;

    let bossX, bossY;
    do {
        bossX = Math.floor(Math.random() * width);
        bossY = Math.floor(Math.random() * height);
    } while (Math.abs(bossX - startX) + Math.abs(bossY - startY) < 2);
    grid[bossY][bossX] = 'BOSS';

    if (locked) {
        let keyX, keyY;
        do {
            keyX = Math.floor(Math.random() * width);
            keyY = Math.floor(Math.random() * height);
        } while (grid[keyY][keyX] !== 'EMPTY');
        grid[keyY][keyX] = 'KEY';
    }

    if (dungeonId === 'dungeon_t1_rats' && !knownMercs.some(m => m.id === 'tilly_footloose')) {
        let npcX, npcY;
        do {
            npcX = Math.floor(Math.random() * width);
            npcY = Math.floor(Math.random() * height);
        } while (grid[npcY][npcX] !== 'EMPTY');
        grid[npcY][npcX] = 'NPC';
    }

    const totalTiles = width * height;
    const goldSpawnChance = 1 / totalTiles;
    const trapSpawnChance = 1 / totalTiles;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (grid[y][x] === 'EMPTY') {
                const roll = Math.random();
                if (roll < goldSpawnChance) {
                    grid[y][x] = 'GOLD';
                } else if (roll < goldSpawnChance + trapSpawnChance) {
                    grid[y][x] = 'TRAP';
                }
            }
        }
    }

    return { grid, visited, playerPos: { x: startX, y: startY } };
};

export const handleStartManualDungeon = (state: GameState, payload: { dungeonId: string, partyIds: string[] }): GameState => {
    const dungeon = DUNGEONS.find(d => d.id === payload.dungeonId);
    if (!dungeon) return state;

    const { grid, visited, playerPos } = generateManualGrid(
        dungeon.gridWidth, 
        dungeon.gridHeight, 
        !!dungeon.isBossLocked,
        dungeon.id,
        state.knownMercenaries
    );

    let bossEntity = undefined;
    if (dungeon.id === 'dungeon_t1_rats') {
        bossEntity = { ...MONSTERS.rat_man };
    }

    const session: ManualDungeonSession = {
        dungeonId: dungeon.id,
        partyIds: payload.partyIds,
        grid,
        visited,
        playerPos,
        pathHistory: [{ ...playerPos }], 
        hasKey: false,
        isBossLocked: !!dungeon.isBossLocked,
        isBossDefeated: false,
        bossEntity,
        goldCollected: 0,
        encounterStatus: 'NONE'
    };

    const updatedMercenaries = state.knownMercenaries.map(m => {
        if (payload.partyIds.includes(m.id)) {
            return { ...m, status: 'ON_EXPEDITION' as const };
        }
        return m;
    });

    return {
        ...state,
        knownMercenaries: updatedMercenaries,
        activeManualDungeon: session,
        showManualDungeonOverlay: true,
        logs: [`Squad has entered ${dungeon.name}. Tactical scanners active.`, ...state.logs]
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
        return {
            ...state,
            toastQueue: [...state.toastQueue, "Reached area boundary. Navigation impossible."]
        };
    }

    const targetRoom = session.grid[newY][newX];
    if (targetRoom === 'WALL') {
        return {
            ...state,
            toastQueue: [...state.toastQueue, "A massive obstruction blocks the path."]
        };
    }

    const isAlreadyVisited = session.visited[newY][newX];
    const cost = isAlreadyVisited ? -1 : (targetRoom === 'BOSS' ? dungeon.bossEnergy : dungeon.moveEnergy);

    const party = state.knownMercenaries.filter(m => session.partyIds.includes(m.id));
    if (cost > 0 && party.some(m => (m.expeditionEnergy || 0) < cost)) {
        return { ...state, logs: [`Your squad is too exhausted to move further.`, ...state.logs] };
    }

    if (targetRoom === 'BOSS' && session.isBossLocked && !session.hasKey) {
        return { ...state, logs: [`The Boss chamber is sealed. You need a key.`, ...state.logs] };
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

    const newVisited = [...session.visited.map(row => [...row])];
    newVisited[newY][newX] = true;

    let extraGold = 0;
    let newGrid = [...session.grid.map(row => [...row])];
    let logMsg = '';
    let encounterStatus: ManualDungeonSession['encounterStatus'] = 'NONE';

    if (targetRoom === 'GOLD' && !isAlreadyVisited) {
        extraGold = (dungeon.tier || 1) * 50;
        newGrid[newY][newX] = 'EMPTY';
        logMsg = `Treasury cache secured. (+${extraGold} G)`;
    } else if (targetRoom === 'TRAP' && !isAlreadyVisited) {
        logMsg = `AMBUSH: Traps detected. Squad took heavy damage. (-25 HP)`;
    } else if (targetRoom === 'KEY' && !isAlreadyVisited) {
        logMsg = `Chamber key recovered.`;
        newGrid[newY][newX] = 'EMPTY';
    } else if (targetRoom === 'BOSS' && !session.isBossDefeated) {
        encounterStatus = 'ENCOUNTERED';
        logMsg = `CRITICAL ALERT: ${session.bossEntity?.name} identified. Defense systems active.`;
    }

    const newPathHistory = [{ x: newX, y: newY }, ...session.pathHistory].slice(0, 50);

    return {
        ...state,
        knownMercenaries: updatedMercs,
        activeManualDungeon: {
            ...session,
            grid: newGrid,
            playerPos: { x: newX, y: newY },
            pathHistory: newPathHistory,
            visited: newVisited,
            hasKey: targetRoom === 'KEY' ? true : session.hasKey,
            encounterStatus,
            goldCollected: session.goldCollected + extraGold
        },
        logs: logMsg ? [logMsg, ...state.logs] : state.logs
    };
};

export const handleStartCombatManual = (state: GameState): GameState => {
    if (!state.activeManualDungeon) return state;
    return {
        ...state,
        activeManualDungeon: {
            ...state.activeManualDungeon,
            encounterStatus: 'BATTLE'
        }
    };
};

export const handleResolveCombatManual = (state: GameState, payload: { win: boolean, flee: boolean, finalParty: any[] }): GameState => {
    const session = state.activeManualDungeon;
    if (!session) return state;

    // 용병 스탯 동기화
    const newKnownMercenaries = state.knownMercenaries.map(m => {
        const combatant = payload.finalParty.find(p => p.id === m.id);
        if (combatant) {
            return { ...m, currentHp: combatant.currentHp, currentMp: combatant.currentMp };
        }
        return m;
    });

    let nextStatus: ManualDungeonSession['encounterStatus'] = payload.win ? 'VICTORY' : (payload.flee ? 'NONE' : 'DEFEAT');
    let nextPos = session.playerPos;
    let nextHistory = session.pathHistory;

    // 도주 시 전술적 후퇴
    if (payload.flee) {
        nextPos = session.pathHistory[1] || session.playerPos;
        nextHistory = session.pathHistory.slice(1);
    }

    return {
        ...state,
        knownMercenaries: newKnownMercenaries,
        activeManualDungeon: {
            ...session,
            playerPos: nextPos,
            pathHistory: nextHistory,
            encounterStatus: nextStatus,
            isBossDefeated: payload.win || session.isBossDefeated
        },
        logs: payload.flee ? ['TACTICAL WITHDRAWAL: Back to safe zone.', ...state.logs] : state.logs
    };
};

export const handleFinishManualDungeon = (state: GameState): GameState => {
    const session = state.activeManualDungeon;
    if (!session) return state;

    const dummyExpId = `manual_clear_${Date.now()}`;
    const tempState: GameState = {
        ...state,
        activeExpeditions: [{
            id: dummyExpId, dungeonId: session.dungeonId, partyIds: session.partyIds,
            startTime: Date.now(), endTime: Date.now(), status: 'COMPLETED' as const
        }]
    };

    const finalState = handleClaimExpedition(tempState, { expeditionId: dummyExpId, rescuedNpcId: session.rescuedNpcId });
    const totalManualGold = session.goldCollected;
    
    return { 
        ...finalState, 
        stats: {
            ...finalState.stats,
            gold: finalState.stats.gold + totalManualGold,
            dailyFinancials: { ...finalState.stats.dailyFinancials, incomeDungeon: finalState.stats.dailyFinancials.incomeDungeon + totalManualGold }
        },
        activeManualDungeon: null, 
        showManualDungeonOverlay: false 
    };
};

export const handleRetreatManualDungeon = (state: GameState): GameState => {
    const session = state.activeManualDungeon;
    if (!session) return state;

    const isDefeat = session.encounterStatus === 'DEFEAT';
    const dungeon = DUNGEONS.find(d => d.id === session.dungeonId);

    const mercResults: DungeonResult['mercenaryResults'] = [];
    const updatedMercs = state.knownMercenaries.map(m => {
        if (session.partyIds.includes(m.id)) {
            let nextStatus: any = 'HIRED';
            let statusChange: 'NONE' | 'INJURED' | 'DEAD' = 'NONE';
            
            if (isDefeat) {
                const roll = Math.random();
                if (roll < 0.10) { nextStatus = 'DEAD'; statusChange = 'DEAD'; }
                else if (roll < 0.50) { nextStatus = 'INJURED'; statusChange = 'INJURED'; }
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
            goldGained: 0,
            mercenaryResults: mercResults,
            isDefeat: true
        } : state.dungeonResult,
        activeManualDungeon: null,
        showManualDungeonOverlay: false,
        logs: [isDefeat ? 'CRITICAL FAILURE: The squad has been wiped out.' : 'The squad retreated to safety.', ...state.logs]
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
        logs: [`Rescue initiated for survivor. Secure the area for extraction.`, ...state.logs]
    };
};
