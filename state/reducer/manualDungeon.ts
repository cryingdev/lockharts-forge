
import { GameState, ManualDungeonSession, RoomType, DungeonResult, InventoryItem } from '../../types/index';
import { DUNGEONS } from '../../data/dungeons';
import { handleClaimExpedition } from './expedition';
import { MONSTERS } from '../../data/monsters';
import { materials } from '../../data/materials';
import { calculateMaxHp, calculateMaxMp, mergePrimaryStats } from '../../models/Stats';
import { Monster } from '../../models/Monster';
import { MONSTER_DROPS } from '../../data/monster-drops';

/**
 * 랜덤한 입구와 그에 따른 가장 먼 출구를 포함한 그리드를 생성합니다.
 */
const generateManualGrid = (width: number, height: number, dungeonId: string, floor: number, maxFloors: number, canSpawnNPC: boolean = false): { grid: RoomType[][], startPos: { x: number, y: number } } => {
    const grid: RoomType[][] = Array.from({ length: height }, () => Array(width).fill('EMPTY'));
    
    // 1. 입구 위치 랜덤 결정 (외곽 벽면 중 하나)
    let startX, startY;
    if (Math.random() < 0.5) {
        startX = Math.random() < 0.5 ? 0 : width - 1;
        startY = Math.floor(Math.random() * height);
    } else {
        startX = Math.floor(Math.random() * width);
        startY = Math.random() < 0.5 ? 0 : height - 1;
    }
    
    grid[startY][startX] = 'ENTRANCE';

    // 2. 입구에서 가장 먼 반대편 코너를 출구로 설정
    const endX = startX < width / 2 ? width - 1 : 0;
    const endY = startY < height / 2 ? height - 1 : 0;
    
    if (floor === maxFloors) {
        grid[endY][endX] = 'BOSS';
    } else {
        grid[endY][endX] = 'STAIRS';
    }
    
    // 3. 열쇠 배치 (보스 층인 경우)
    if (floor === maxFloors) {
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
    }

    // 4. 기타 요소들 배치 (적, 자원, 함정 등)
    let npcPlaced = false;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (grid[y][x] === 'EMPTY') {
                const r = Math.random();
                if (r < 0.18) grid[y][x] = 'ENEMY'; 
                else if (r < 0.33) grid[y][x] = 'RESOURCE'; 
                else if (r < 0.38) grid[y][x] = 'GOLD';
                else if (r < 0.45) grid[y][x] = 'TRAP';
                // GATED: Only spawn NPC if allowed and not already placed
                else if (canSpawnNPC && r < 0.47 && !npcPlaced) {
                    grid[y][x] = 'NPC';
                    npcPlaced = true;
                }
            }
        }
    }

    // NPC 강제 배치 (출현 확률 보정 - 1층에서만 발생)
    if (canSpawnNPC && !npcPlaced && floor === 1) {
        let attempts = 0;
        while (!npcPlaced && attempts < 50) {
            const rx = Math.floor(Math.random() * width);
            const ry = Math.floor(Math.random() * height);
            if (grid[ry][rx] === 'EMPTY') {
                grid[ry][rx] = 'NPC';
                npcPlaced = true;
            }
            attempts++;
        }
    }
    
    return { grid, startPos: { x: startX, y: startY } };
};

/**
 * 몬스터 조우 시 적 풀을 생성하는 헬퍼 함수
 */
const generateEnemiesForSession = (dungeonId: string, currentFloor: number, isBoss: boolean): Monster[] => {
    const dungeon = DUNGEONS.find(d => d.id === dungeonId);
    if (!dungeon) return [];

    let monsters: Monster[] = [];
    if (isBoss) {
        const monsterId = dungeon.bossVariantId || 'plague_rat_king';
        const monsterBase = MONSTERS[monsterId] || MONSTERS['giant_rat'];
        monsters = [{ ...monsterBase, currentHp: monsterBase.stats.maxHp }];
    } else {
        const pool = dungeon.monsterPools.find(p => currentFloor >= p.minFloor && currentFloor <= p.maxFloor);
        const mobIds = pool ? pool.monsterIds : ['giant_rat'];
        let monsterCount = Math.floor(Math.random() * dungeon.tier) + 1;
        if (currentFloor > 3) monsterCount += 1;
        monsterCount = Math.min(4, Math.max(1, monsterCount));

        for (let i = 0; i < monsterCount; i++) {
            const monsterId = mobIds[Math.floor(Math.random() * mobIds.length)];
            const monsterBase = MONSTERS[monsterId] || MONSTERS['giant_rat'];
            monsters.push({ ...monsterBase, currentHp: monsterBase.stats.maxHp });
        }
    }
    return monsters;
};

export const handleStartManualDungeon = (state: GameState, payload: { dungeonId: string; partyIds: string[]; startFloor?: number }): GameState => {
    const dungeon = DUNGEONS.find(d => d.id === payload.dungeonId);
    if (!dungeon) return state;

    const startFloor = payload.startFloor || 1;
    const party = state.knownMercenaries.filter(m => payload.partyIds.includes(m.id));
    
    if (party.some(m => (m.expeditionEnergy || 0) < dungeon.energyCost)) {
        return { ...state, logs: [`Your squad is too exhausted to enter ${dungeon.name}.`, ...state.logs] };
    }

    // --- RESCUE CHECK: Only spawn NPC if they are not already in the known pool ---
    const rescueId = dungeon.rescueMercenaryId;
    const isNpcAlreadySaved = rescueId ? state.knownMercenaries.some(m => m.id === rescueId) : true;
    const canSpawnNPC = !!rescueId && !isNpcAlreadySaved;

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

    const { grid, startPos } = generateManualGrid(dungeon.gridWidth, dungeon.gridHeight, dungeon.id, startFloor, dungeon.maxFloors, canSpawnNPC);
    
    const visited = Array.from({ length: dungeon.gridHeight }, () => Array(dungeon.gridWidth).fill(false));
    visited[startPos.y][startPos.x] = true;

    const session: ManualDungeonSession = {
        dungeonId: dungeon.id,
        partyIds: payload.partyIds,
        grid,
        visited,
        playerPos: startPos,
        pathHistory: [startPos],
        hasKey: false,
        isBossLocked: dungeon.isBossLocked ?? true,
        goldCollected: 0,
        collectedLoot: [],
        sessionXp: payload.partyIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}),
        encounterStatus: 'NONE',
        lastActionMessage: `The air is thick with dampness. We've entered Sector ${startFloor}.`,
        currentFloor: startFloor,
        maxFloors: dungeon.maxFloors
    };

    return {
        ...state,
        knownMercenaries: updatedMercs,
        activeManualDungeon: session,
        showManualDungeonOverlay: true,
        logs: [`The squad has descended into ${dungeon.name}. Light is fading.`, ...state.logs]
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
            activeManualDungeon: { ...session, lastActionMessage: "The wall here is solid rock. No way through." }
        };
    }

    const targetRoom = session.grid[newY][newX];
    if (targetRoom === 'WALL') return state;

    const isAlreadyVisited = session.visited[newY][newX];

    let updatedMercs = state.knownMercenaries.map(m => {
        if (session.partyIds.includes(m.id)) {
            let nextHp = m.currentHp;
            if (targetRoom === 'TRAP' && !isAlreadyVisited) nextHp = Math.max(0, m.currentHp - 15);
            return { ...m, currentHp: nextHp };
        }
        return m;
    });

    const isWipedOut = updatedMercs.filter(m => session.partyIds.includes(m.id)).every(m => m.currentHp <= 0);
    if (isWipedOut) return handleRetreatManualDungeon({ ...state, knownMercenaries: updatedMercs });

    const newVisited = [...session.visited.map(row => [...row])];
    newVisited[newY][newX] = true;

    let extraGold = 0;
    let newGrid = [...session.grid.map(row => [...row])];
    let newInventory = [...state.inventory];
    let logMsg = '';
    let actionMsg = session.lastActionMessage;
    let encounterStatus: ManualDungeonSession['encounterStatus'] = 'NONE';
    let newMaxFloorReached = { ...state.maxFloorReached };

    if (targetRoom === 'GOLD' && !isAlreadyVisited) {
        extraGold = (dungeon.tier || 1) * 30;
        newGrid[newY][newX] = 'EMPTY';
        actionMsg = `Hidden amongst the debris, we found an old pouch containing ${extraGold} Gold!`;
    } else if (targetRoom === 'RESOURCE' && !isAlreadyVisited) {
        const possibleResources = ['copper_ore', 'tin_ore', 'leather_strips', 'charcoal', 'hide_patch'];
        const resId = possibleResources[Math.floor(Math.random() * possibleResources.length)];
        const count = 1 + Math.floor(Math.random() * 2);
        const matDef = materials[resId];
        
        const existing = newInventory.find(i => i.id === resId);
        if (existing) {
            newInventory = newInventory.map(i => i.id === resId ? { ...i, quantity: i.quantity + count } : i);
        } else {
            newInventory.push({ ...matDef, quantity: count } as InventoryItem);
        }
        
        newGrid[newY][newX] = 'EMPTY';
        actionMsg = `Spotted something useful. Salvaged ${matDef.name} x${count} for the forge.`;
        logMsg = `Recovered valuable materials from the ruins.`;
    } else if (targetRoom === 'TRAP' && !isAlreadyVisited) {
        actionMsg = `A click from beneath! A concealed trap springs, striking the squad!`;
    } else if (targetRoom === 'KEY' && !isAlreadyVisited) {
        logMsg = `The heavy iron key is now in our possession.`;
        actionMsg = `A heavy iron key... It likely unlocks the path to the sector's master.`;
        newGrid[newY][newX] = 'EMPTY';
    } else if (targetRoom === 'ENEMY' && !isAlreadyVisited) {
        encounterStatus = 'ENCOUNTERED';
        actionMsg = `Shadows shift ahead... movement detected. steel yourselves!`;
    } else if (targetRoom === 'BOSS') {
        encounterStatus = 'ENCOUNTERED';
        actionMsg = session.isBossDefeated 
            ? `The champion of this lair lies defeated. We should secure the area.` 
            : `The air hums with a terrifying presence. We have reached the source of the corruption.`;
    } else if (targetRoom === 'STAIRS') {
        encounterStatus = 'STAIRS';
        actionMsg = `A narrow flight of stairs winds deeper into the darkness. Do we descend?`;
        const nextFloor = session.currentFloor + 1;
        newMaxFloorReached[session.dungeonId] = Math.max(newMaxFloorReached[session.dungeonId] || 1, nextFloor);
    }

    return {
        ...state,
        knownMercenaries: updatedMercs,
        inventory: newInventory,
        maxFloorReached: newMaxFloorReached,
        activeManualDungeon: {
            ...session,
            grid: newGrid,
            playerPos: { x: newX, y: newY },
            pathHistory: [{ x: newX, y: newY }, ...session.pathHistory].slice(0, 50),
            visited: newVisited,
            hasKey: targetRoom === 'KEY' ? true : session.hasKey,
            encounterStatus,
            goldCollected: session.goldCollected + extraGold,
            lastActionMessage: actionMsg
        },
        logs: logMsg ? [logMsg, ...state.logs] : state.logs
    };
};

export const handleProceedToNextFloorManual = (state: GameState): GameState => {
    const session = state.activeManualDungeon;
    if (!session || session.encounterStatus !== 'STAIRS') return state;

    const dungeon = DUNGEONS.find(d => d.id === session.dungeonId);
    if (!dungeon) return state;

    const nextFloor = session.currentFloor + 1;
    // Check if NPC should still spawn on deeper floors (rarely, but possible if missed)
    const rescueId = dungeon.rescueMercenaryId;
    const isNpcAlreadySaved = rescueId ? state.knownMercenaries.some(m => m.id === rescueId) : true;
    const canSpawnNPC = !!rescueId && !isNpcAlreadySaved && !session.npcFound;

    const { grid: nextGrid, startPos: nextStartPos } = generateManualGrid(dungeon.gridWidth, dungeon.gridHeight, dungeon.id, nextFloor, session.maxFloors, canSpawnNPC);
    
    const nextVisited = Array.from({ length: dungeon.gridHeight }, () => Array(dungeon.gridWidth).fill(false));
    nextVisited[nextStartPos.y][nextStartPos.x] = true;
    
    return {
        ...state,
        activeManualDungeon: {
            ...session,
            grid: nextGrid,
            visited: nextVisited,
            playerPos: nextStartPos,
            pathHistory: [nextStartPos],
            currentFloor: nextFloor,
            encounterStatus: 'NONE',
            lastActionMessage: `The stairs were long, but we've reached Sector ${nextFloor}. Stay alert.`
        },
        logs: [`The squad has descended deeper into the abyss. Floor ${nextFloor}.`, ...state.logs]
    };
};

export const handleStartCombatManual = (state: GameState): GameState => {
    const session = state.activeManualDungeon;
    if (!session || session.encounterStatus !== 'ENCOUNTERED') return state;

    const currentRoom = session.grid[session.playerPos.y][session.playerPos.x];
    if (currentRoom === 'BOSS' && session.isBossDefeated) return state;

    const enemies = generateEnemiesForSession(session.dungeonId, session.currentFloor, currentRoom === 'BOSS');

    return {
        ...state,
        activeManualDungeon: {
            ...session,
            encounterStatus: 'BATTLE',
            enemies: enemies
        }
    };
};

export const handleResolveCombatManual = (state: GameState, payload: { win: boolean, flee: boolean, finalParty: any[] }): GameState => {
    const session = state.activeManualDungeon;
    if (!session) return state;

    const currentRoom = session.grid[session.playerPos.y][session.playerPos.x];
    const dungeon = DUNGEONS.find(d => d.id === session.dungeonId);
    
    let logMsg = '';
    const livingMembers = payload.finalParty.filter(p => p.currentHp > 0);
    
    let totalXpGained = 0;
    const gainedLootInCombat: { id: string; count: number; name: string }[] = [];

    if (payload.win && session.enemies) {
        totalXpGained = session.enemies.reduce((sum, e) => sum + e.rewardXp, 0);

        session.enemies.forEach(enemy => {
            const drops = MONSTER_DROPS[enemy.id];
            if (drops) {
                drops.forEach(drop => {
                    if (Math.random() <= drop.chance) {
                        const qty = Math.floor(Math.random() * (drop.maxQuantity - drop.minQuantity + 1)) + drop.minQuantity;
                        if (qty > 0) {
                            const mat = materials[drop.itemId];
                            if (mat) {
                                gainedLootInCombat.push({ id: drop.itemId, count: qty, name: mat.name });
                            }
                        }
                    }
                });
            }
        });
    }
    
    const xpPerMemberBase = (payload.win && totalXpGained > 0 && livingMembers.length > 0) 
        ? Math.floor(totalXpGained / livingMembers.length) 
        : 0;

    const avgEnemyLevel = (session.enemies && session.enemies.length > 0)
        ? session.enemies.reduce((acc, e) => acc + e.level, 0) / session.enemies.length
        : 1;

    if (payload.win) {
        logMsg = `The last of them has fallen. The area is quiet again.`;
    }

    const nextSessionXp = { ...session.sessionXp };

    const newKnownMercenaries = state.knownMercenaries.map(m => {
        const combatant = payload.finalParty.find(p => p.id === m.id);
        if (combatant) {
            let nextXp = m.currentXp;
            let nextLevel = m.level;
            let nextMaxHp = m.maxHp;
            let nextMaxMp = m.maxMp;
            let nextCurrentHp = combatant.currentHp;
            let bonusStatPoints = m.bonusStatPoints || 0;

            if (payload.win && combatant.currentHp > 0) {
                const levelDiff = Math.max(0, m.level - Math.floor(avgEnemyLevel));
                const penaltyMult = Math.max(0.1, 1 - (levelDiff * 0.1));
                const xpToAdd = Math.floor(xpPerMemberBase * penaltyMult);

                nextXp += xpToAdd;
                nextSessionXp[m.id] = (nextSessionXp[m.id] || 0) + xpToAdd;
                
                while (nextXp >= m.xpToNextLevel) {
                    nextXp -= m.xpToNextLevel;
                    nextLevel++;
                    const merged = mergePrimaryStats(m.stats, m.allocatedStats);
                    nextMaxHp = calculateMaxHp(merged, nextLevel);
                    nextMaxMp = calculateMaxMp(merged, nextLevel);
                    nextCurrentHp = nextMaxHp;
                    bonusStatPoints += 3;
                }
            }

            return { 
                ...m, 
                currentHp: nextCurrentHp, 
                currentMp: combatant.currentMp,
                currentXp: nextXp,
                level: nextLevel,
                bonusStatPoints,
                maxHp: nextMaxHp,
                maxMp: nextMaxMp,
                xpToNextLevel: nextLevel * 100
            };
        }
        return m;
    });

    const isBossDefeatedNow = currentRoom === 'BOSS' && payload.win;
    const isBossDefeated = isBossDefeatedNow || session.isBossDefeated;

    const nextCollectedLoot = [...session.collectedLoot];
    gainedLootInCombat.forEach(item => {
        const existing = nextCollectedLoot.find(l => l.id === item.id);
        if (existing) existing.count += item.count;
        else nextCollectedLoot.push(item);
    });

    let nextGrid = [...session.grid.map(row => [...row])];
    if (payload.win && currentRoom === 'ENEMY') {
        nextGrid[session.playerPos.y][session.playerPos.x] = 'EMPTY';
    }

    const isDefeat = !payload.win && !payload.flee;
    
    if (isDefeat) {
        return handleRetreatManualDungeon({
            ...state,
            knownMercenaries: newKnownMercenaries,
            activeManualDungeon: {
                ...session,
                sessionXp: nextSessionXp,
                encounterStatus: 'DEFEAT'
            }
        });
    }

    return {
        ...state,
        knownMercenaries: newKnownMercenaries,
        activeManualDungeon: {
            ...session,
            grid: nextGrid,
            collectedLoot: nextCollectedLoot,
            sessionXp: nextSessionXp,
            encounterStatus: payload.win ? 'VICTORY' : (payload.flee ? 'NONE' : 'DEFEAT'),
            isBossDefeated,
            lastActionMessage: payload.win 
                ? `Area neutralized. Squad, catch your breath.`
                : (payload.flee ? `We managed to pull back. Steel yourselves.` : `Everything's gone wrong... we need to get out.`)
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
                xpGained: session.sessionXp[m.id] || 0,
                currentXp: m.currentXp, xpToNext: m.xpToNextLevel, statusChange
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
            rewards: session.collectedLoot,
            goldGained: session.goldCollected,
            mercenaryResults: mercResults,
            isDefeat: true
        } : state.dungeonResult,
        activeManualDungeon: null,
        showManualDungeonOverlay: false,
        logs: [isDefeat ? 'CRITICAL FAILURE: The squad has been overwhelmed.' : 'Orderly withdrawal from the zone confirmed.', ...state.logs]
    };
};

export const handleRescueNPC = (state: GameState, payload: { npcId: string }): GameState => {
    const currentSession = state.activeManualDungeon;
    if (!currentSession) return state;

    let newGrid = [...currentSession.grid.map(row => [...row])];
    newGrid[currentSession.playerPos.y][currentSession.playerPos.x] = 'EMPTY';

    return {
        ...state,
        activeManualDungeon: { 
            ...currentSession, 
            grid: newGrid, 
            npcFound: true, 
            rescuedNpcId: payload.npcId,
            lastActionMessage: `A survivor secured! Let's escort them back to the surface.`
        },
        logs: [`Escorting a survivor out of the depths.`, ...state.logs]
    };
};

export const handleFinishManualDungeon = (state: GameState): GameState => {
    const session = state.activeManualDungeon;
    if (!session) return state;

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

    let newInventory = [...state.inventory];
    session.collectedLoot.forEach(loot => {
        const existing = newInventory.find(i => i.id === loot.id);
        if (existing) {
            newInventory = newInventory.map(i => i.id === loot.id ? { ...i, quantity: i.quantity + loot.count } : i);
        } else {
            const mat = materials[loot.id];
            if (mat) newInventory.push({ ...mat, quantity: loot.count } as InventoryItem);
        }
    });

    const claimedState = handleClaimExpedition({ ...stateWithTempExp, inventory: newInventory }, { 
        expeditionId: tempExpId, 
        rescuedNpcId: session.rescuedNpcId,
        isFullClear: !!session.isBossDefeated
    });

    if (claimedState.dungeonResult) {
        claimedState.dungeonResult.rewards = session.collectedLoot;
        if (session.goldCollected > 0) {
            claimedState.stats.gold += session.goldCollected;
            claimedState.dungeonResult.goldGained = (claimedState.dungeonResult.goldGained || 0) + session.goldCollected;
        }
        claimedState.dungeonResult.mercenaryResults = claimedState.dungeonResult.mercenaryResults.map(res => ({
            ...res,
            xpGained: session.sessionXp[res.id] || res.xpGained
        }));
    }

    return {
        ...claimedState,
        activeManualDungeon: null,
        showManualDungeonOverlay: false
    };
};
