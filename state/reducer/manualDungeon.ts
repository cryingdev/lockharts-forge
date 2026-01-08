import { GameState, ManualDungeonSession, RoomType } from '../../types/game-state';
import { DUNGEONS } from '../../data/dungeons';
import { handleClaimExpedition } from './expedition';
import { TILLY_FOOTLOOSE } from '../../data/mercenaries';

const generateManualGrid = (width: number, height: number, locked: boolean, dungeonId: string, knownMercs: any[]) => {
    const grid: RoomType[][] = Array.from({ length: height }, () => Array(width).fill('EMPTY'));
    const visited: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));

    // 1. Entrance
    const startX = Math.floor(Math.random() * width);
    const startY = Math.floor(Math.random() * height);
    grid[startY][startX] = 'ENTRANCE';
    visited[startY][startX] = true;

    // 2. Boss
    let bossX, bossY;
    do {
        bossX = Math.floor(Math.random() * width);
        bossY = Math.floor(Math.random() * height);
    } while (Math.abs(bossX - startX) + Math.abs(bossY - startY) < 2);
    grid[bossY][bossX] = 'BOSS';

    // 3. Key (if locked)
    if (locked) {
        let keyX, keyY;
        do {
            keyX = Math.floor(Math.random() * width);
            keyY = Math.floor(Math.random() * height);
        } while (grid[keyY][keyX] !== 'EMPTY');
        grid[keyY][keyX] = 'KEY';
    }

    // 4. Hidden NPC (Tilly in Rat Cellar)
    if (dungeonId === 'dungeon_t1_rats' && !knownMercs.some(m => m.id === 'tilly_footloose')) {
        let npcX, npcY;
        do {
            npcX = Math.floor(Math.random() * width);
            npcY = Math.floor(Math.random() * height);
        } while (grid[npcY][npcX] !== 'EMPTY');
        grid[npcY][npcX] = 'NPC';
    }

    // 5. Random Gold Piles & Traps
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

    const session: ManualDungeonSession = {
        dungeonId: dungeon.id,
        partyIds: payload.partyIds,
        grid,
        visited,
        playerPos,
        hasKey: false,
        isBossLocked: !!dungeon.isBossLocked,
        isBossDefeated: false,
        goldCollected: 0
    };

    // Update participating mercenaries status to ON_EXPEDITION
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
        logs: [`Squad has entered ${dungeon.name}. Tread carefully.`, ...state.logs]
    };
};

export const handleMoveManualDungeon = (state: GameState, payload: { x: number, y: number }): GameState => {
    const session = state.activeManualDungeon;
    if (!session) return state;

    const dungeon = DUNGEONS.find(d => d.id === session.dungeonId);
    if (!dungeon) return state;

    const newX = session.playerPos.x + payload.x;
    const newY = session.playerPos.y + payload.y;

    if (newX < 0 || newX >= dungeon.gridWidth || newY < 0 || newY >= dungeon.gridHeight) return state;

    const targetRoom = session.grid[newY][newX];
    const isAlreadyVisited = session.visited[newY][newX];
    
    // 이미 밝혀진(방문한) 공간은 이동 비용이 -1임 (에너지가 1 회복됨)
    const cost = isAlreadyVisited ? -1 : (targetRoom === 'BOSS' ? dungeon.bossEnergy : dungeon.moveEnergy);

    const party = state.knownMercenaries.filter(m => session.partyIds.includes(m.id));
    
    // 에너지가 부족한지 체크 (회복될 때는 체크 통과)
    const canMove = cost < 0 || party.every(m => (m.expeditionEnergy || 0) >= cost);

    if (!canMove) {
        return {
            ...state,
            logs: [`Your squad is too exhausted to move.`, ...state.logs]
        };
    }

    if (targetRoom === 'BOSS' && session.isBossLocked && !session.hasKey) {
        return {
            ...state,
            logs: [`The Boss chamber is sealed. You need a key.`, ...state.logs]
        };
    }

    let updatedMercs = state.knownMercenaries.map(m => {
        if (session.partyIds.includes(m.id)) {
            // 에너지는 최대 100까지 회복/소모
            let nextEnergy = Math.max(0, Math.min(100, (m.expeditionEnergy || 0) - cost));
            let nextHp = m.currentHp;

            // Trap Logic: -25 HP to everyone in the party
            if (targetRoom === 'TRAP' && !isAlreadyVisited) {
                nextHp = Math.max(0, m.currentHp - 25);
            }

            return { ...m, expeditionEnergy: nextEnergy, currentHp: nextHp };
        }
        return m;
    });

    const newVisited = [...session.visited.map(row => [...row])];
    newVisited[newY][newX] = true;

    // Grid modification logic
    let extraGold = 0;
    let newGrid = [...session.grid.map(row => [...row])];
    let logMsg = '';
    let isBossDefeated = session.isBossDefeated;

    if (targetRoom === 'GOLD') {
        const tier = dungeon.tier || 1;
        const roll = Math.random();
        
        if (roll < 0.65) {
            extraGold = tier * 25;
            logMsg = `Looted a small pouch of gold! (+${extraGold} G)`;
        } else if (roll < 0.90) {
            extraGold = tier * 50;
            logMsg = `Found a stash of coins! (+${extraGold} G)`;
        } else {
            extraGold = tier * 75;
            logMsg = `Discovered an ancient gold cache! (+${extraGold} G)`;
        }
        
        newGrid[newY][newX] = 'EMPTY';
    } else if (targetRoom === 'TRAP' && !isAlreadyVisited) {
        logMsg = `IT'S A TRAP! The squad took heavy damage. (-25 HP)`;
    } else if (targetRoom === 'KEY') {
        logMsg = `Found a rusted key!`;
        newGrid[newY][newX] = 'EMPTY'; // 열쇠 획득 시 타일 비움
    } else if (targetRoom === 'NPC' && !session.npcFound) {
        logMsg = `Spotted a survivor hiding in the shadows!`;
    } else if (targetRoom === 'BOSS') {
        logMsg = `BOSS DEFEATED! Area secured.`;
        isBossDefeated = true;
    }

    const newSession: ManualDungeonSession = {
        ...session,
        grid: newGrid,
        playerPos: { x: newX, y: newY },
        visited: newVisited,
        hasKey: targetRoom === 'KEY' ? true : session.hasKey,
        isBossDefeated,
        goldCollected: session.goldCollected + extraGold
    };

    return {
        ...state,
        knownMercenaries: updatedMercs,
        activeManualDungeon: newSession,
        logs: logMsg ? [logMsg, ...state.logs] : state.logs
    };
};

export const handleFinishManualDungeon = (state: GameState): GameState => {
    const session = state.activeManualDungeon;
    if (!session) return state;

    const dummyExpId = `manual_clear_${Date.now()}`;
    const tempState: GameState = {
        ...state,
        activeExpeditions: [{
            id: dummyExpId,
            dungeonId: session.dungeonId,
            partyIds: session.partyIds,
            startTime: Date.now(),
            endTime: Date.now(),
            status: 'COMPLETED' as const
        }]
    };

    const finalState = handleClaimExpedition(tempState, { 
        expeditionId: dummyExpId, 
        rescuedNpcId: session.rescuedNpcId 
    });
    
    const totalManualGold = session.goldCollected;
    
    // Manual Dungeon Summary는 이미 보여줬으므로 전역 결과창은 띄우지 않음
    return { 
        ...finalState, 
        stats: {
            ...finalState.stats,
            gold: finalState.stats.gold + totalManualGold,
            dailyFinancials: {
                ...finalState.stats.dailyFinancials,
                incomeDungeon: finalState.stats.dailyFinancials.incomeDungeon + totalManualGold
            }
        },
        dungeonResult: null, // 결과창 팝업 방지
        activeManualDungeon: null, 
        showManualDungeonOverlay: false 
    };
};

export const handleRetreatManualDungeon = (state: GameState): GameState => {
    const session = state.activeManualDungeon;
    if (!session) return state;

    const updatedMercs = state.knownMercenaries.map(m => {
        if (session.partyIds.includes(m.id)) {
            return { ...m, status: 'HIRED' as const };
        }
        return m;
    });

    return {
        ...state,
        knownMercenaries: updatedMercs,
        activeManualDungeon: null,
        showManualDungeonOverlay: false,
        logs: ['The squad retreated from the area.', ...state.logs]
    };
};

export const handleRescueNPC = (state: GameState, payload: { npcId: string }): GameState => {
    if (state.knownMercenaries.some(m => m.id === payload.npcId)) return state;
    if (state.activeManualDungeon?.rescuedNpcId === payload.npcId) return state;

    // NPC 구출 시 현재 그리드에서 해당 NPC 아이콘 제거 (EMPTY로 변경)
    const currentSession = state.activeManualDungeon;
    let newGrid = currentSession ? [...currentSession.grid.map(row => [...row])] : null;
    if (newGrid && currentSession) {
        newGrid[currentSession.playerPos.y][currentSession.playerPos.x] = 'EMPTY';
    }

    const newSession = currentSession ? {
        ...currentSession,
        grid: newGrid as RoomType[][],
        npcFound: true,
        rescuedNpcId: payload.npcId
    } : null;

    return {
        ...state,
        activeManualDungeon: newSession,
        logs: [`Rescue initiated for survivor. Secure the objective to escort them out.`, ...state.logs]
    };
};