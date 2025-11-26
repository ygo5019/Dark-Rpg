import { Dungeon, ItemDetails, Player, SeasonConfig } from './types';

export const ITEM_REGISTRY: Record<string, ItemDetails> = {
    // --- Tier 1 (Starter) ---
    "Rat Tail": { name: "Rat Tail", type: 'material', price: 2, description: "A gross rat tail." },
    "Old Cheese": { name: "Old Cheese", type: 'consumable', price: 10, description: "Smells terrible. Heals 5 HP.", stats: { hp: 5 } },
    "Wolf Pelt": { name: "Wolf Pelt", type: 'material', price: 15, description: "Warm wolf fur." },
    "Sharp Fang": { name: "Sharp Fang", type: 'material', price: 25, description: "Sharp enough to cut glass." },
    "Bone": { name: "Bone", type: 'material', price: 10, description: "Spooky calcium." },
    "Gold Bar": { name: "Gold Bar", type: 'material', price: 200, description: "Shiny and heavy." },
    
    // Weapons T1
    "Rusty Sword": { name: "Rusty Sword", type: 'weapon', price: 50, stats: { atk: 1 }, description: "Better than bare hands." },
    "Pickaxe": { name: "Pickaxe", type: 'weapon', price: 150, stats: { atk: 3 }, description: "Designed for rocks, works on skulls." },
    "Iron Dagger": { name: "Iron Dagger", type: 'weapon', price: 400, stats: { atk: 6, dodge: 2 }, description: "Light and deadly." },
    "Steel Sword": { name: "Steel Sword", type: 'weapon', price: 1000, stats: { atk: 12 }, description: "Standard issue adventurer gear." },

    // Armor T1
    "Linen Shirt": { name: "Linen Shirt", type: 'armor', price: 50, stats: { def: 1 }, description: "Provides minimal protection." },
    "Leather Vest": { name: "Leather Vest", type: 'armor', price: 250, stats: { def: 4 }, description: "Tough leather armor." },
    "Chainmail": { name: "Chainmail", type: 'armor', price: 800, stats: { def: 10, dodge: -2 }, description: "Heavy but protective." },

    // Accessories T1
    "Lucky Ring": { name: "Lucky Ring", type: 'accessory', price: 500, stats: { dodge: 3 }, description: "You feel luckier." },
    "Strength Amulet": { name: "Strength Amulet", type: 'accessory', price: 1500, stats: { atk: 5 }, description: "Pulses with power." },

    // --- Tier 2 (Intermediate) ---
    "Rune Stone": { name: "Rune Stone", type: 'material', price: 50, description: "Glowing with ancient magic." },
    "Golem Core": { name: "Golem Core", type: 'material', price: 120, description: "Still humming with energy." },
    
    "Battle Axe": { name: "Battle Axe", type: 'weapon', price: 2500, stats: { atk: 18, dodge: -2 }, description: "Heavy damage, slow swing." },
    "Rune Plate": { name: "Rune Plate", type: 'armor', price: 3000, stats: { def: 18 }, description: "Infused with magic protection." },
    "Berserker Ring": { name: "Berserker Ring", type: 'accessory', price: 4000, stats: { atk: 8, def: -2 }, description: "Trade safety for power." },

    // --- Tier 3 (Advanced) ---
    "Dragon Scale": { name: "Dragon Scale", type: 'material', price: 300, description: "Hot to the touch." },
    "Wyvern Claw": { name: "Wyvern Claw", type: 'material', price: 450, description: "Incredibly sharp and toxic." },

    "Dragon Blade": { name: "Dragon Blade", type: 'weapon', price: 8500, stats: { atk: 35 }, description: "Forged in dragon fire." },
    "Scale Armor": { name: "Scale Armor", type: 'armor', price: 9000, stats: { def: 30, dodge: 2 }, description: "Lightweight and impervious." },
    "Dragon Eye": { name: "Dragon Eye", type: 'accessory', price: 12000, stats: { atk: 10, dodge: 5 }, description: "See attacks before they happen." },

    // --- Tier 4 (Endgame) ---
    "Void Essence": { name: "Void Essence", type: 'material', price: 1000, description: "Stares back at you." },
    
    "Soul Reaper": { name: "Soul Reaper", type: 'weapon', price: 25000, stats: { atk: 60, hp: 5 }, description: "Steals life from enemies." },
    "Shadow Cloak": { name: "Shadow Cloak", type: 'armor', price: 22000, stats: { def: 45, dodge: 10 }, description: "Become one with the shadows." },

    // --- SEASON EXCLUSIVE ---
    "King's Crown": { 
        name: "King's Crown", 
        type: 'accessory', 
        price: 99999, 
        stats: { atk: 25, def: 25, dodge: 5 }, 
        description: "SEASON EXCLUSIVE. A crown for the true ruler." 
    },
    "Infinity Blade": { 
        name: "Infinity Blade", 
        type: 'weapon', 
        price: 99999, 
        stats: { atk: 100, critChance: 10 }, 
        description: "SEASON EXCLUSIVE. Slices through time itself." 
    },

    // Chests
    "Common Chest": { name: "Common Chest", type: 'chest', price: 100, description: "Contains basic loot." },
    "Uncommon Chest": { name: "Uncommon Chest", type: 'chest', price: 300, description: "Contains decent loot." },
    "Rare Chest": { name: "Rare Chest", type: 'chest', price: 1000, description: "Contains valuable loot." },
    "Legendary Chest": { name: "Legendary Chest", type: 'chest', price: 5000, description: "Contains legendary loot." },

    // Potions
    "Minor XP Potion": { 
        name: "Minor XP Potion", 
        type: 'potion', 
        price: 200, 
        description: "+25% XP for 25 mins.", 
        stats: { buffType: 'xp', buffMultiplier: 1.25, buffDuration: 25 } 
    },
    "Minor Speed Potion": { 
        name: "Minor Speed Potion", 
        type: 'potion', 
        price: 200, 
        description: "1.25x Action Speed for 25 mins.", 
        stats: { buffType: 'speed', buffMultiplier: 1.25, buffDuration: 25 } 
    },
    "Major XP Potion": { 
        name: "Major XP Potion", 
        type: 'potion', 
        price: 500, 
        description: "+50% XP for 10 mins.", 
        stats: { buffType: 'xp', buffMultiplier: 1.5, buffDuration: 10 } 
    },
    "Major Speed Potion": { 
        name: "Major Speed Potion", 
        type: 'potion', 
        price: 500, 
        description: "1.5x Action Speed for 10 mins.", 
        stats: { buffType: 'speed', buffMultiplier: 1.5, buffDuration: 10 } 
    }
};

export const DEFAULT_SHOP_STOCK: Record<string, number> = {
    // Consumables
    "Old Cheese": 50,
    "Minor XP Potion": 10,
    "Minor Speed Potion": 10,
    "Major XP Potion": 5,
    "Major Speed Potion": 5,
    "Common Chest": 5,
    "Uncommon Chest": 2,

    // Gear T1
    "Rusty Sword": 5,
    "Pickaxe": 3,
    "Iron Dagger": 2,
    "Steel Sword": 1,
    "Linen Shirt": 5,
    "Leather Vest": 3,
    "Chainmail": 1,
    "Lucky Ring": 2,
    "Strength Amulet": 1,

    // Gear T2
    "Battle Axe": 1,
    "Rune Plate": 1,
    "Berserker Ring": 1,

    // Gear T3 (Rare)
    "Dragon Blade": 1,
    "Scale Armor": 1
};

export const DUNGEONS: Dungeon[] = [
    { 
        id: 0, 
        name: "Rat Cave", 
        reqLevel: 1, 
        // Diff Up: HP 20->30, Atk 1->2. Rewards Down: XP 40->30, Gold 10->5
        enemy: { name: "Giant Rat", hp: 30, maxHp: 30, atk: 2, xp: 30, gold: 5 }, 
        drops: [{ item: "Rat Tail", chance: 40 }, { item: "Old Cheese", chance: 15 }] 
    },
    { 
        id: 1, 
        name: "Shadow Forest", 
        reqLevel: 3, // Req level up 
        // Diff Up: HP 60->80, Atk 4->8. Rewards Down: XP 120->90
        enemy: { name: "Dire Wolf", hp: 80, maxHp: 80, atk: 8, xp: 90, gold: 20 }, 
        drops: [{ item: "Wolf Pelt", chance: 35 }, { item: "Sharp Fang", chance: 10 }] 
    },
    { 
        id: 2, 
        name: "Forgotten Crypt", 
        reqLevel: 8, // Req level up
        // Diff Up: HP 150->250, Atk 10->18
        enemy: { name: "Skeleton Warrior", hp: 250, maxHp: 250, atk: 18, xp: 220, gold: 60 }, 
        drops: [{ item: "Bone", chance: 50 }, { item: "Rusty Sword", chance: 5 }] 
    },
    { 
        id: 3, 
        name: "Ancient Ruins", 
        reqLevel: 15, 
        // Diff Up: HP 400->800, Atk 25->40
        enemy: { name: "Stone Golem", hp: 800, maxHp: 800, atk: 40, xp: 500, gold: 150 }, 
        drops: [{ item: "Rune Stone", chance: 40 }, { item: "Golem Core", chance: 5 }] 
    },
    { 
        id: 4, 
        name: "Dragon Peak", 
        reqLevel: 30, 
        // Diff Up: HP 1200->2500, Atk 60->100
        enemy: { name: "Young Wyvern", hp: 2500, maxHp: 2500, atk: 100, xp: 1200, gold: 500 }, 
        drops: [{ item: "Dragon Scale", chance: 30 }, { item: "Wyvern Claw", chance: 10 }] 
    },
    { 
        id: 5, 
        name: "Abyssal Void", 
        reqLevel: 50, 
        // Diff Up: HP 5000->10000, Atk 150->300
        enemy: { name: "Void Lord", hp: 10000, maxHp: 10000, atk: 300, xp: 5000, gold: 2000 }, 
        drops: [{ item: "Void Essence", chance: 20 }, { item: "Shadow Cloak", chance: 1 }] 
    }
];

export const SEASON_CONFIG: SeasonConfig = {
    name: "Season 1: Hardcore",
    maxLevel: 20,
    xpPerLevel: 200, // Increased XP req per level
    premiumCost: 15000,
    rewards: [
        // Nerfed Free Track: Replaced chests with materials/gold, reduced amounts
        { level: 1, freeItem: "Old Cheese", freeAmount: 3, premiumItem: "Common Chest", premiumAmount: 2 },
        { level: 2, freeItem: "Rat Tail", freeAmount: 5, premiumItem: "Minor XP Potion", premiumAmount: 2 },
        { level: 3, freeItem: "Gold Bar", freeAmount: 1, premiumItem: "Uncommon Chest", premiumAmount: 1 },
        { level: 4, freeItem: "Bone", freeAmount: 5, premiumItem: "Major Speed Potion", premiumAmount: 1 },
        { level: 5, freeItem: "Common Chest", freeAmount: 1, premiumItem: "Rare Chest", premiumAmount: 1 },
        { level: 6, freeItem: "Gold Bar", freeAmount: 1, premiumItem: "Major XP Potion", premiumAmount: 2 },
        { level: 7, freeItem: "Common Chest", freeAmount: 1, premiumItem: "Rare Chest", premiumAmount: 1 },
        { level: 8, freeItem: "Minor XP Potion", freeAmount: 1, premiumItem: "Legendary Chest", premiumAmount: 1 },
        { level: 9, freeItem: "Uncommon Chest", freeAmount: 1, premiumItem: "Rare Chest", premiumAmount: 2 },
        { level: 10, freeItem: "Rare Chest", freeAmount: 1, premiumItem: "Void Essence", premiumAmount: 2 },
        { level: 11, freeItem: "Gold Bar", freeAmount: 2, premiumItem: "Legendary Chest", premiumAmount: 1 },
        { level: 12, freeItem: "Major XP Potion", freeAmount: 1, premiumItem: "Legendary Chest", premiumAmount: 1 },
        { level: 13, freeItem: "Rare Chest", freeAmount: 1, premiumItem: "Legendary Chest", premiumAmount: 2 },
        { level: 14, freeItem: "Major Speed Potion", freeAmount: 1, premiumItem: "Legendary Chest", premiumAmount: 2 },
        { level: 15, freeItem: "Legendary Chest", freeAmount: 1, premiumItem: "Void Essence", premiumAmount: 5 },
        { level: 16, freeItem: "Gold Bar", freeAmount: 5, premiumItem: "Legendary Chest", premiumAmount: 3 },
        { level: 17, freeItem: "Legendary Chest", freeAmount: 1, premiumItem: "Legendary Chest", premiumAmount: 3 },
        { level: 18, freeItem: "Legendary Chest", freeAmount: 1, premiumItem: "Legendary Chest", premiumAmount: 5 },
        { level: 19, freeItem: "Legendary Chest", freeAmount: 1, premiumItem: "Legendary Chest", premiumAmount: 5 },
        { level: 20, freeItem: "King's Crown", freeAmount: 1, premiumItem: "Infinity Blade", premiumAmount: 1 },
    ]
};

export const DEFAULT_PLAYER: Player = {
    username: "Guest",
    level: 1,
    currentHp: 50,
    maxHp: 50,
    currentXp: 0,
    maxXp: 150, // Harder leveling
    attack: 2,
    defense: 2,
    dodge: 0.5,
    critChance: 1.5,
    gold: 0,
    diamonds: 0, // New Currency
    inventory: ["Old Cheese", "Old Cheese"], // Removed starter chests
    equipment: {
        weapon: null,
        armor: null,
        accessory: null
    },
    shopStock: { ...DEFAULT_SHOP_STOCK },
    activeAction: null,
    boostExpires: 0,
    activeBuffs: [],
    seasonStats: {
        level: 1,
        xp: 0,
        isPremium: false,
        claimedFree: [],
        claimedPremium: []
    }
};