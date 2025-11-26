export interface ActiveAction {
    type: 'train_atk' | 'train_def' | 'train_dodge' | 'train_crit' | 'resting';
    totalTime: number;
    remainingTime: number;
    lastTick: number;
}

export type ItemType = 'material' | 'weapon' | 'armor' | 'accessory' | 'consumable' | 'chest' | 'potion';

export interface ItemStats {
    atk?: number;
    def?: number;
    dodge?: number;
    critChance?: number;
    hp?: number;
    // Potion specific
    buffType?: 'xp' | 'speed';
    buffMultiplier?: number;
    buffDuration?: number; // in minutes
}

export interface ItemDetails {
    name: string;
    type: ItemType;
    price: number;
    stats?: ItemStats;
    description: string;
}

export interface Equipment {
    weapon: string | null;
    armor: string | null;
    accessory: string | null;
}

export interface Buff {
    id: number;
    type: 'xp' | 'speed';
    multiplier: number;
    expiresAt: number;
    name: string;
}

export interface SeasonStats {
    level: number;
    xp: number;
    isPremium: boolean;
    claimedFree: number[]; // Array of Level IDs
    claimedPremium: number[]; // Array of Level IDs
}

export interface Player {
    username: string;
    level: number;
    currentHp: number;
    maxHp: number;
    currentXp: number;
    maxXp: number;
    attack: number;
    defense: number;
    dodge: number;
    critChance: number;
    gold: number;
    diamonds: number; // New Premium Currency
    inventory: string[];
    equipment: Equipment;
    shopStock: Record<string, number>;
    activeAction: ActiveAction | null;
    boostExpires: number; // Legacy boost
    activeBuffs: Buff[];
    seasonStats: SeasonStats;
}

export interface Enemy {
    name: string;
    hp: number;
    maxHp: number;
    atk: number;
    xp: number;
    gold: number;
}

export interface Drop {
    item: string;
    chance: number;
}

export interface Dungeon {
    id: number;
    name: string;
    reqLevel: number;
    enemy: Enemy;
    drops: Drop[];
}

export interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'loot';
}

export interface SeasonReward {
    level: number;
    freeItem: string | null;
    freeAmount: number;
    premiumItem: string | null;
    premiumAmount: number;
}

export interface SeasonConfig {
    name: string;
    maxLevel: number;
    xpPerLevel: number;
    premiumCost: number;
    rewards: SeasonReward[];
}

export type ViewState = 'login' | 'hub' | 'combat' | 'auto-combat' | 'train' | 'inn' | 'shop';