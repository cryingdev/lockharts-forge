import { JobClass } from '../../models/JobClass';
import type { Mercenary, MercenaryEquipment } from '../../models/Mercenary';
import { calculateMaxHp, calculateMaxMp, mergePrimaryStats, type PrimaryStats } from '../../models/Stats';
import type { EquipmentSlotType } from '../../models/Equipment';
import type { EquipmentItem } from '../../types/inventory';
import { generateEquipment } from '../../utils/craftingLogic';
import { TIER1_ITEMS } from '../equipment/tier1';

export type ArenaOpponentDifficultyTag = 'LOW' | 'STANDARD' | 'HIGH' | 'ELITE';

export interface ArenaDummyOpponentDefinition {
    id: string;
    displayName: string;
    rating: number;
    rankLabel: string;
    difficultyTag: ArenaOpponentDifficultyTag;
    winPoints: number;
    lossPoints: number;
    party: Mercenary[];
}

type ArenaEquipmentSpec = {
    recipeId: string;
    quality?: number;
    enhancement?: number;
};

type ArenaMercenaryProfile = {
    stats?: PrimaryStats;
    allocatedStats?: PrimaryStats;
    equipment?: Partial<Record<EquipmentSlotType, ArenaEquipmentSpec>>;
    skillIds?: string[];
    temperament?: Mercenary['temperament'];
    voice?: Mercenary['voice'];
};

const EMPTY_ARENA_EQUIPMENT: MercenaryEquipment = {
    MAIN_HAND: null,
    OFF_HAND: null,
    HEAD: null,
    BODY: null,
    HANDS: null,
    FEET: null,
    LEGS: null,
    WAIST: null,
    ACCESSORY: null,
};

const zeroStats = (): PrimaryStats => ({
    str: 0,
    vit: 0,
    dex: 0,
    int: 0,
    luk: 0,
});

const equipmentRecipes = new Map<string, EquipmentItem>(TIER1_ITEMS.map((item) => [item.id, item]));

const buildArenaEquipment = (
    specs: Partial<Record<EquipmentSlotType, ArenaEquipmentSpec>> = {}
): MercenaryEquipment => {
    const equipment: MercenaryEquipment = { ...EMPTY_ARENA_EQUIPMENT };

    (Object.entries(specs) as Array<[EquipmentSlotType, ArenaEquipmentSpec]>).forEach(([slot, spec]) => {
        const recipe = equipmentRecipes.get(spec.recipeId);
        if (!recipe) {
            throw new Error(`Missing arena equipment recipe: ${spec.recipeId}`);
        }
        equipment[slot] = generateEquipment(recipe, spec.quality ?? 88, 0, spec.enhancement ?? 0, 'Arena Steward');
    });

    return equipment;
};

const distributeAllocatedStats = (points: number, priorities: Array<keyof PrimaryStats>): PrimaryStats => {
    const allocated = zeroStats();
    for (let index = 0; index < points; index += 1) {
        const key = priorities[index % priorities.length];
        allocated[key] += 1;
    }
    return allocated;
};

const getArenaAllocatedStats = (job: JobClass, level: number): PrimaryStats => {
    const points = Math.max(0, (level - 1) * 3);

    switch (job) {
        case JobClass.FIGHTER:
            return distributeAllocatedStats(points, ['str', 'vit', 'str', 'dex']);
        case JobClass.ROGUE:
            return distributeAllocatedStats(points, ['dex', 'luk', 'dex', 'str']);
        case JobClass.MAGE:
            return distributeAllocatedStats(points, ['int', 'int', 'vit', 'luk']);
        case JobClass.CLERIC:
            return distributeAllocatedStats(points, ['int', 'vit', 'int', 'luk']);
        case JobClass.NOVICE:
        default:
            return distributeAllocatedStats(points, ['str', 'vit', 'dex', 'luk', 'int']);
    }
};

const createArenaDummyMercenary = (
    id: string,
    name: string,
    job: JobClass,
    level: number,
    gender: Mercenary['gender'] = 'Male',
    profile: ArenaMercenaryProfile = {}
): Mercenary => {
    const baseStats = profile.stats ?? { str: 8, vit: 8, dex: 8, int: 8, luk: 8 };
    const allocatedStats = profile.allocatedStats ?? getArenaAllocatedStats(job, level);
    const mergedPrimary = mergePrimaryStats(baseStats, allocatedStats);
    const maxHp = calculateMaxHp(mergedPrimary, level);
    const maxMp = calculateMaxMp(mergedPrimary, level);

    return {
        id,
        name,
        gender,
        job,
        level,
        stats: baseStats,
        allocatedStats,
        bonusStatPoints: 0,
        currentHp: maxHp,
        maxHp,
        currentMp: maxMp,
        maxMp,
        affinity: 0,
        visitCount: 0,
        isUnique: false,
        temperament: profile.temperament ?? 'stoic',
        voice: profile.voice ?? 'formal',
        status: 'HIRED',
        expeditionEnergy: 100,
        currentXp: 0,
        xpToNextLevel: 100,
        skillIds: profile.skillIds,
        equipment: buildArenaEquipment(profile.equipment),
    };
};

const arenaProfiles = {
    noviceScavenger: (): ArenaMercenaryProfile => ({
        skillIds: ['endurance'],
        equipment: {
            MAIN_HAND: { recipeId: 'sword_bronze_t1', quality: 82 },
            BODY: { recipeId: 'armor_leather_t1', quality: 84 },
            FEET: { recipeId: 'boots_leather_t1', quality: 82 },
        },
        temperament: 'cautious',
    }),
    fighterFrontliner: (): ArenaMercenaryProfile => ({
        equipment: {
            MAIN_HAND: { recipeId: 'sword_bronze_long_t1', quality: 88 },
            OFF_HAND: { recipeId: 'shield_wood_t1', quality: 86 },
            HEAD: { recipeId: 'helm_01_t1', quality: 84 },
            BODY: { recipeId: 'armor_leather_t1', quality: 86 },
            LEGS: { recipeId: 'pants_leather_t1', quality: 84 },
            FEET: { recipeId: 'boots_leather_t1', quality: 84 },
        },
        temperament: 'bold',
        voice: 'blunt',
    }),
    fighterBulwark: (): ArenaMercenaryProfile => ({
        skillIds: ['stalwart_defense'],
        equipment: {
            MAIN_HAND: { recipeId: 'sword_bronze_fang_t1', quality: 94, enhancement: 1 },
            OFF_HAND: { recipeId: 'shield_wood_buckled_t1', quality: 94, enhancement: 1 },
            HEAD: { recipeId: 'helm_copper_mosspad_t1', quality: 92 },
            BODY: { recipeId: 'armor_leather_patched_t1', quality: 92, enhancement: 1 },
            LEGS: { recipeId: 'pants_patched_t1', quality: 90 },
            FEET: { recipeId: 'boots_bone_splint_t1', quality: 90 },
            WAIST: { recipeId: 'belt_moss_padded_t1', quality: 90 },
        },
        temperament: 'stoic',
        voice: 'formal',
    }),
    fighterRaider: (): ArenaMercenaryProfile => ({
        skillIds: ['brute_strength'],
        equipment: {
            MAIN_HAND: { recipeId: 'axe_copper_hooked_t1', quality: 95, enhancement: 2 },
            HEAD: { recipeId: 'helm_copper_mosspad_t1', quality: 90 },
            BODY: { recipeId: 'armor_leather_patched_t1', quality: 90 },
            HANDS: { recipeId: 'gloves_leather_t1', quality: 88 },
            FEET: { recipeId: 'boots_bone_splint_t1', quality: 90 },
            WAIST: { recipeId: 'belt_scavenger_t1', quality: 88 },
        },
        temperament: 'bold',
        voice: 'blunt',
    }),
    rogueScout: (): ArenaMercenaryProfile => ({
        equipment: {
            MAIN_HAND: { recipeId: 'dagger_copper_t1', quality: 88 },
            BODY: { recipeId: 'armor_leather_t1', quality: 84 },
            HANDS: { recipeId: 'gloves_leather_silkgrip_t1', quality: 90 },
            FEET: { recipeId: 'boots_leather_t1', quality: 86 },
            LEGS: { recipeId: 'pants_leather_t1', quality: 86 },
            WAIST: { recipeId: 'belt_scavenger_t1', quality: 86 },
        },
        temperament: 'greedy',
        voice: 'dry',
    }),
    rogueExecutioner: (): ArenaMercenaryProfile => ({
        skillIds: ['lethal_precision', 'shadow_reflex'],
        equipment: {
            MAIN_HAND: { recipeId: 'dagger_copper_viper_t1', quality: 98, enhancement: 2 },
            BODY: { recipeId: 'armor_leather_patched_t1', quality: 90 },
            HANDS: { recipeId: 'gloves_leather_silkgrip_t1', quality: 94, enhancement: 1 },
            FEET: { recipeId: 'boots_bone_splint_t1', quality: 92 },
            LEGS: { recipeId: 'pants_patched_t1', quality: 92 },
            WAIST: { recipeId: 'belt_scavenger_t1', quality: 92 },
            ACCESSORY: { recipeId: 'ring_tarnished_t1', quality: 90 },
        },
        temperament: 'cautious',
        voice: 'blunt',
    }),
    mageChanneler: (): ArenaMercenaryProfile => ({
        skillIds: ['mana_well'],
        equipment: {
            MAIN_HAND: { recipeId: 'staff_oak_t1', quality: 88 },
            BODY: { recipeId: 'armor_leather_t1', quality: 82 },
            HANDS: { recipeId: 'gloves_leather_t1', quality: 84 },
            FEET: { recipeId: 'boots_leather_t1', quality: 82 },
            ACCESSORY: { recipeId: 'ring_copper_t1', quality: 90 },
        },
        temperament: 'cautious',
        voice: 'formal',
    }),
    mageArcanist: (): ArenaMercenaryProfile => ({
        skillIds: ['mana_well'],
        equipment: {
            MAIN_HAND: { recipeId: 'staff_oak_silkbind_t1', quality: 98, enhancement: 2 },
            BODY: { recipeId: 'armor_leather_patched_t1', quality: 88 },
            HANDS: { recipeId: 'gloves_leather_silkgrip_t1', quality: 90 },
            FEET: { recipeId: 'boots_leather_t1', quality: 86 },
            ACCESSORY: { recipeId: 'ring_emberward_t1', quality: 96, enhancement: 1 },
        },
        temperament: 'cautious',
        voice: 'dry',
    }),
    clericWarden: (): ArenaMercenaryProfile => ({
        equipment: {
            MAIN_HAND: { recipeId: 'mace_wood_t1', quality: 88 },
            OFF_HAND: { recipeId: 'shield_wood_t1', quality: 86 },
            BODY: { recipeId: 'armor_leather_t1', quality: 84 },
            HANDS: { recipeId: 'gloves_leather_t1', quality: 84 },
            FEET: { recipeId: 'boots_leather_t1', quality: 84 },
            ACCESSORY: { recipeId: 'ring_tarnished_t1', quality: 86 },
        },
        temperament: 'kind',
        voice: 'formal',
    }),
    clericBastion: (): ArenaMercenaryProfile => ({
        equipment: {
            MAIN_HAND: { recipeId: 'mace_wood_bonebound_t1', quality: 94, enhancement: 1 },
            OFF_HAND: { recipeId: 'shield_wood_buckled_t1', quality: 92 },
            HEAD: { recipeId: 'helm_copper_mosspad_t1', quality: 88 },
            BODY: { recipeId: 'armor_leather_patched_t1', quality: 90 },
            FEET: { recipeId: 'boots_bone_splint_t1', quality: 88 },
            LEGS: { recipeId: 'pants_patched_t1', quality: 88 },
            ACCESSORY: { recipeId: 'ring_emberward_t1', quality: 94 },
        },
        temperament: 'kind',
        voice: 'formal',
    }),
};

export const DUMMY_ARENA_OPPONENTS: ArenaDummyOpponentDefinition[] = [
    {
        id: 'arena_dummy_iron_pack',
        displayName: 'Iron Kennel Pack',
        rating: 120,
        rankLabel: 'Bronze',
        difficultyTag: 'LOW',
        winPoints: 12,
        lossPoints: 6,
        party: [
            createArenaDummyMercenary('arena_ikp_1', 'Bran', JobClass.FIGHTER, 3, 'Male', arenaProfiles.fighterFrontliner()),
            createArenaDummyMercenary('arena_ikp_2', 'Mira', JobClass.ROGUE, 3, 'Female', arenaProfiles.rogueScout()),
            createArenaDummyMercenary('arena_ikp_3', 'Tov', JobClass.NOVICE, 2, 'Male', arenaProfiles.noviceScavenger()),
        ],
    },
    {
        id: 'arena_dummy_copper_hall',
        displayName: 'Copper Hall Retainers',
        rating: 180,
        rankLabel: 'Bronze',
        difficultyTag: 'STANDARD',
        winPoints: 13,
        lossPoints: 6,
        party: [
            createArenaDummyMercenary('arena_chr_1', 'Alden', JobClass.FIGHTER, 4, 'Male', arenaProfiles.fighterFrontliner()),
            createArenaDummyMercenary('arena_chr_2', 'Bea', JobClass.CLERIC, 3, 'Female', arenaProfiles.clericWarden()),
            createArenaDummyMercenary('arena_chr_3', 'Cobb', JobClass.NOVICE, 3, 'Male', arenaProfiles.noviceScavenger()),
        ],
    },
    {
        id: 'arena_dummy_cinder_watch',
        displayName: 'Cinder Watch',
        rating: 240,
        rankLabel: 'Silver',
        difficultyTag: 'STANDARD',
        winPoints: 14,
        lossPoints: 7,
        party: [
            createArenaDummyMercenary('arena_cw_1', 'Gideon', JobClass.FIGHTER, 5, 'Male', arenaProfiles.fighterFrontliner()),
            createArenaDummyMercenary('arena_cw_2', 'Serin', JobClass.CLERIC, 4, 'Female', arenaProfiles.clericWarden()),
            createArenaDummyMercenary('arena_cw_3', 'Joss', JobClass.ROGUE, 4, 'Male', arenaProfiles.rogueScout()),
            createArenaDummyMercenary('arena_cw_4', 'Pella', JobClass.NOVICE, 4, 'Female', arenaProfiles.noviceScavenger()),
        ],
    },
    {
        id: 'arena_dummy_twin_fangs',
        displayName: 'Twin Fangs',
        rating: 310,
        rankLabel: 'Silver',
        difficultyTag: 'HIGH',
        winPoints: 15,
        lossPoints: 8,
        party: [
            createArenaDummyMercenary('arena_tf_1', 'Nyx', JobClass.ROGUE, 5, 'Female', arenaProfiles.rogueExecutioner()),
            createArenaDummyMercenary('arena_tf_2', 'Rafe', JobClass.ROGUE, 5, 'Male', arenaProfiles.rogueExecutioner()),
            createArenaDummyMercenary('arena_tf_3', 'Iria', JobClass.MAGE, 4, 'Female', arenaProfiles.mageChanneler()),
        ],
    },
    {
        id: 'arena_dummy_chapel_guard',
        displayName: 'Ash Chapel Guard',
        rating: 390,
        rankLabel: 'Gold',
        difficultyTag: 'HIGH',
        winPoints: 17,
        lossPoints: 9,
        party: [
            createArenaDummyMercenary('arena_acg_1', 'Thorne', JobClass.FIGHTER, 6, 'Male', arenaProfiles.fighterBulwark()),
            createArenaDummyMercenary('arena_acg_2', 'Yara', JobClass.CLERIC, 6, 'Female', arenaProfiles.clericBastion()),
            createArenaDummyMercenary('arena_acg_3', 'Nox', JobClass.ROGUE, 6, 'Male', arenaProfiles.rogueExecutioner()),
            createArenaDummyMercenary('arena_acg_4', 'Iven', JobClass.MAGE, 5, 'Male', arenaProfiles.mageChanneler()),
        ],
    },
    {
        id: 'arena_dummy_gilded_chalice',
        displayName: 'Gilded Chalice Circle',
        rating: 470,
        rankLabel: 'Gold',
        difficultyTag: 'HIGH',
        winPoints: 18,
        lossPoints: 10,
        party: [
            createArenaDummyMercenary('arena_gcc_1', 'Lucan', JobClass.CLERIC, 6, 'Male', arenaProfiles.clericBastion()),
            createArenaDummyMercenary('arena_gcc_2', 'Maeve', JobClass.MAGE, 6, 'Female', arenaProfiles.mageArcanist()),
            createArenaDummyMercenary('arena_gcc_3', 'Oren', JobClass.FIGHTER, 6, 'Male', arenaProfiles.fighterBulwark()),
            createArenaDummyMercenary('arena_gcc_4', 'Sia', JobClass.ROGUE, 5, 'Female', arenaProfiles.rogueExecutioner()),
        ],
    },
    {
        id: 'arena_dummy_crimson_standard',
        displayName: 'Crimson Standard',
        rating: 520,
        rankLabel: 'Champion',
        difficultyTag: 'ELITE',
        winPoints: 20,
        lossPoints: 12,
        party: [
            createArenaDummyMercenary('arena_cs_1', 'Vale', JobClass.FIGHTER, 7, 'Male', arenaProfiles.fighterRaider()),
            createArenaDummyMercenary('arena_cs_2', 'Eris', JobClass.MAGE, 7, 'Female', arenaProfiles.mageArcanist()),
            createArenaDummyMercenary('arena_cs_3', 'Hollis', JobClass.CLERIC, 7, 'Male', arenaProfiles.clericBastion()),
            createArenaDummyMercenary('arena_cs_4', 'Kest', JobClass.ROGUE, 7, 'Male', arenaProfiles.rogueExecutioner()),
        ],
    },
    {
        id: 'arena_dummy_ember_throne',
        displayName: 'Ember Throne',
        rating: 680,
        rankLabel: 'Champion',
        difficultyTag: 'ELITE',
        winPoints: 22,
        lossPoints: 12,
        party: [
            createArenaDummyMercenary('arena_et_1', 'Cassian', JobClass.FIGHTER, 8, 'Male', arenaProfiles.fighterRaider()),
            createArenaDummyMercenary('arena_et_2', 'Selene', JobClass.MAGE, 8, 'Female', arenaProfiles.mageArcanist()),
            createArenaDummyMercenary('arena_et_3', 'Bram', JobClass.CLERIC, 8, 'Male', arenaProfiles.clericBastion()),
            createArenaDummyMercenary('arena_et_4', 'Vex', JobClass.ROGUE, 8, 'Male', arenaProfiles.rogueExecutioner()),
        ],
    },
];
