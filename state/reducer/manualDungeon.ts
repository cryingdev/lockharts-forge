
import { GameState, ManualDungeonSession, RoomType } from '../../types/game-state';
import { DUNGEONS } from '../../data/dungeons';
import { handleClaimExpedition } from './expedition';

const generateManualGrid = (width: number, height: number, locked: boolean) => {
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

    return { grid, visited, playerPos: { x: startX, y: startY } };
};

export const handleStartManualDungeon = (state: GameState, payload: { dungeonId: string, partyIds: string[] }): GameState => {
    const dungeon = DUNGEONS.find(d => d.id === payload.dungeonId);
    if (!dungeon) return state;

    const { grid, visited, playerPos } = generateManualGrid(dungeon.gridWidth, dungeon.gridHeight, !!dungeon.isBossLocked);

    const session: ManualDungeonSession = {
        dungeonId: dungeon.id,
        partyIds: payload.partyIds,
        grid,
        visited,
        playerPos,
        hasKey: false,
        isBossLocked: !!dungeon.isBossLocked
    };

    return {
        ...state,
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
    const cost = targetRoom === 'BOSS' ? dungeon.bossEnergy : dungeon.moveEnergy;

    const party = state.knownMercenaries.filter(m => session.partyIds.includes(m.id));
    const canMove = party.every(m => (m.expeditionEnergy || 0) >= cost);

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

    const updatedMercs = state.knownMercenaries.map(m => {
        if (session.partyIds.includes(m.id)) {
            return { ...m, expeditionEnergy: Math.max(0, (m.expeditionEnergy || 0) - cost) };
        }
        return m;
    });

    const newVisited = [...session.visited.map(row => [...row])];
    newVisited[newY][newX] = true;

    const newSession: ManualDungeonSession = {
        ...session,
        playerPos: { x: newX, y: newY },
        visited: newVisited,
        hasKey: targetRoom === 'KEY' ? true : session.hasKey
    };

    return {
        ...state,
        knownMercenaries: updatedMercs,
        activeManualDungeon: newSession,
        logs: targetRoom === 'KEY' ? [`Found a rusted key!`, ...state.logs] : state.logs
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

    const finalState = handleClaimExpedition(tempState, { expeditionId: dummyExpId });
    return { 
        ...finalState, 
        activeManualDungeon: null, 
        showManualDungeonOverlay: false 
    };
};
