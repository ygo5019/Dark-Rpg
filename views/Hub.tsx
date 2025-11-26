import React, { useState } from 'react';
import { Player, ActiveAction, Dungeon, ItemDetails, Equipment, Buff, ToastMessage, ItemType } from '../types';
import { ITEM_REGISTRY, DUNGEONS, SEASON_CONFIG } from '../constants';
import { Button, Card, ProgressBar, StatRow, Modal, CircularProgress, ItemRarity } from '../components/UI';
import { Sword, Shield, Wind, Heart, Coins, LogOut, Backpack, Moon, Zap, Map, ShoppingBag, Shirt, Gem, Crosshair, Timer, Box, Settings, Download, Upload, Trophy, Search, Filter, Crown, Lock, Check, Skull, ArrowRightLeft, ChevronsRight } from 'lucide-react';

interface HubProps {
    player: Player;
    onUpdatePlayer: (p: Player) => void;
    onNavigate: (view: 'combat' | 'hub' | 'auto-combat', data?: any) => void;
    onLogout: () => void;
    onExportSave: () => void;
    onImportSave: (s: string) => void;
    addToast: (msg: string, type?: ToastMessage['type']) => void;
}

export const Hub: React.FC<HubProps> = ({ player, onUpdatePlayer, onNavigate, onLogout, onExportSave, onImportSave, addToast }) => {
    const [subView, setSubView] = useState<'menu' | 'train' | 'dungeon' | 'inn' | 'shop' | 'rank' | 'season'>('menu');
    const [showInventory, setShowInventory] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showExchange, setShowExchange] = useState(false);
    const [importString, setImportString] = useState('');

    // Shop State
    const [shopSearch, setShopSearch] = useState('');
    const [shopFilter, setShopFilter] = useState<ItemType | 'all'>('all');

    // --- Helpers ---
    const isLegacyBoostActive = () => Date.now() < player.boostExpires;

    const getStats = () => {
        let atk = player.attack;
        let def = player.defense;
        let dodge = player.dodge;
        let crit = player.critChance;

        const equipList = [player.equipment.weapon, player.equipment.armor, player.equipment.accessory];
        equipList.forEach(itemName => {
            if (itemName && ITEM_REGISTRY[itemName]?.stats) {
                const s = ITEM_REGISTRY[itemName].stats!;
                if (s.atk) atk += s.atk;
                if (s.def) def += s.def;
                if (s.dodge) dodge += s.dodge;
                if (s.critChance) crit += s.critChance;
            }
        });

        return { atk, def, dodge: parseFloat(dodge.toFixed(2)), crit: parseFloat(crit.toFixed(2)) };
    };

    const stats = getStats();
    
    // --- Actions ---
    const handleSellItem = (itemName: string) => {
        const itemIdx = player.inventory.indexOf(itemName);
        if (itemIdx === -1) return;
        
        const price = ITEM_REGISTRY[itemName]?.price || 1;
        const newInventory = [...player.inventory];
        newInventory.splice(itemIdx, 1);

        onUpdatePlayer({
            ...player,
            gold: player.gold + price,
            inventory: newInventory
        });
        addToast(`Sold ${itemName} for ${price}g`, "info");
    };

    const handleEquip = (itemName: string) => {
        const item = ITEM_REGISTRY[itemName];
        if (!item) return;

        let slot: keyof Equipment | null = null;
        if (item.type === 'weapon') slot = 'weapon';
        if (item.type === 'armor') slot = 'armor';
        if (item.type === 'accessory') slot = 'accessory';

        if (!slot) return; // Can't equip materials

        const newInventory = [...player.inventory];
        const itemIdx = newInventory.indexOf(itemName);
        if (itemIdx === -1) return;
        
        // Remove item being equipped from inventory
        newInventory.splice(itemIdx, 1);

        // If something is already equipped, put it back in inventory
        if (player.equipment[slot]) {
            newInventory.push(player.equipment[slot]!);
        }

        onUpdatePlayer({
            ...player,
            inventory: newInventory,
            equipment: {
                ...player.equipment,
                [slot]: itemName
            }
        });
        addToast(`Equipped ${itemName}`, "success");
    };

    const handleUnequip = (slot: keyof Equipment) => {
        const item = player.equipment[slot];
        if (!item) return;

        onUpdatePlayer({
            ...player,
            inventory: [...player.inventory, item],
            equipment: {
                ...player.equipment,
                [slot]: null
            }
        });
        addToast(`Unequipped ${item}`, "info");
    };

    const handleBuy = (itemName: string) => {
        const item = ITEM_REGISTRY[itemName];
        const stock = player.shopStock[itemName] || 0;

        if (player.gold < item.price) {
            addToast("Not enough gold!", "error");
            return;
        }
        if (stock <= 0) {
            addToast("Out of stock!", "error");
            return;
        }

        onUpdatePlayer({
            ...player,
            gold: player.gold - item.price,
            inventory: [...player.inventory, itemName],
            shopStock: {
                ...player.shopStock,
                [itemName]: stock - 1
            }
        });
        addToast(`Bought ${itemName}`, "success");
    };

    const startTraining = (type: ActiveAction['type'], mins: number) => {
        if (player.activeAction) {
            if (!confirm("Stop current action to start this one?")) return;
        }
        
        const totalMs = mins * 60 * 1000;
        onUpdatePlayer({
            ...player,
            activeAction: {
                type,
                totalTime: totalMs,
                remainingTime: totalMs,
                lastTick: Date.now()
            }
        });
        setSubView('menu');
        addToast("Training started!", "info");
    };

    const finishTrainingInstant = () => {
        if (!player.activeAction) return;
        const timeLeftMins = Math.ceil(player.activeAction.remainingTime / 60000);
        // Cost: 1 Diamond per 5 mins remaining (min 1)
        const cost = Math.max(1, Math.ceil(timeLeftMins / 5));

        if (player.diamonds < cost) {
            addToast(`Need ${cost} Diamonds!`, "error");
            return;
        }

        if (confirm(`Finish instantly for ${cost} Diamonds?`)) {
            // Set time to 0 to trigger completion in next tick
            onUpdatePlayer({
                ...player,
                diamonds: player.diamonds - cost,
                activeAction: {
                    ...player.activeAction,
                    remainingTime: 0
                }
            });
            // Toast handled by completion logic in App.tsx
        }
    };

    const healPlayer = () => {
        const missing = player.maxHp - player.currentHp;
        if (missing <= 0) return addToast("Health full!", "info");
        const cost = Math.ceil(missing * 1);
        
        if (player.gold < cost) return addToast("Not enough gold!", "error");
        
        onUpdatePlayer({
            ...player,
            gold: player.gold - cost,
            currentHp: player.maxHp
        });
        addToast("Fully healed!", "success");
    };

    const restSleep = () => {
        const missing = player.maxHp - player.currentHp;
        if (missing <= 0) return addToast("Not tired.", "info");
        const mins = Math.ceil(missing / 10); // 1 min per 10 HP
        
        if (confirm(`Sleep for ${mins} minutes to recover health?`)) {
            startTraining('resting', mins);
        }
    };

    const exchangeGold = () => {
        if (player.gold < 1000) {
            addToast("Need at least 1000 Gold", "error");
            return;
        }
        onUpdatePlayer({
            ...player,
            gold: player.gold - 1000,
            diamonds: player.diamonds + 1
        });
        addToast("Exchanged 1000G for 1 Diamond", "success");
    };

    // --- New Feature Actions ---

    const handleOpenChest = (itemName: string) => {
        const idx = player.inventory.indexOf(itemName);
        if (idx === -1) return;

        const newInventory = [...player.inventory];
        newInventory.splice(idx, 1); // Remove chest

        // Loot logic
        let rewards = [];
        let earnedGold = 0;
        let earnedXp = 0;
        let tier = 1;

        if (itemName === "Common Chest") tier = 1;
        if (itemName === "Uncommon Chest") tier = 2;
        if (itemName === "Rare Chest") tier = 3;
        if (itemName === "Legendary Chest") tier = 5;

        // Gold
        earnedGold = Math.floor((Math.random() * 50 + 10) * tier);
        
        // XP
        earnedXp = Math.floor((Math.random() * 20 + 5) * tier);

        // Item Chance
        const possibleItems = Object.keys(ITEM_REGISTRY).filter(k => 
            ITEM_REGISTRY[k].type !== 'chest' && ITEM_REGISTRY[k].price < tier * 3000
        );
        
        if (Math.random() < 0.3 * tier && possibleItems.length > 0) {
            const randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
            rewards.push(randomItem);
            newInventory.push(randomItem);
        }

        // Potion Chance
        const potions = ["Minor XP Potion", "Minor Speed Potion"];
        if (tier > 2) potions.push("Major XP Potion", "Major Speed Potion");
        
        if (Math.random() < 0.1 * tier) {
            const pot = potions[Math.floor(Math.random() * potions.length)];
            rewards.push(pot);
            newInventory.push(pot);
        }

        onUpdatePlayer({
            ...player,
            gold: player.gold + earnedGold,
            currentXp: player.currentXp + earnedXp,
            inventory: newInventory
        });

        addToast(`Opened ${itemName}! +${earnedGold}g, +${earnedXp}xp`, "loot");
        if (rewards.length) addToast(`Found items: ${rewards.join(', ')}`, "loot");
    };

    const handleDrinkPotion = (itemName: string) => {
        const item = ITEM_REGISTRY[itemName];
        const stats = item?.stats;
        if (!item || !stats?.buffType || !stats?.buffDuration) return;

        const idx = player.inventory.indexOf(itemName);
        if (idx === -1) return;

        const newInventory = [...player.inventory];
        newInventory.splice(idx, 1);

        const newBuff: Buff = {
            id: Date.now(),
            type: stats.buffType,
            multiplier: stats.buffMultiplier || 1,
            expiresAt: Date.now() + (stats.buffDuration * 60 * 1000),
            name: item.name
        };

        onUpdatePlayer({
            ...player,
            inventory: newInventory,
            activeBuffs: [...player.activeBuffs, newBuff]
        });
        
        addToast(`Drank ${itemName}! Buff applied.`, "success");
    };

    // --- Season Pass Logic ---
    const handleBuySeasonPremium = () => {
        if (player.gold < SEASON_CONFIG.premiumCost) {
            addToast("Not enough gold to upgrade!", "error");
            return;
        }
        if (player.seasonStats.isPremium) return;

        onUpdatePlayer({
            ...player,
            gold: player.gold - SEASON_CONFIG.premiumCost,
            seasonStats: {
                ...player.seasonStats,
                isPremium: true
            }
        });
        addToast("Premium Season Pass Purchased!", "success");
    };

    const skipSeasonLevel = () => {
        const cost = 50; // Diamonds
        if (player.diamonds < cost) {
            addToast(`Need ${cost} Diamonds!`, "error");
            return;
        }
        if (player.seasonStats.level >= SEASON_CONFIG.maxLevel) {
            addToast("Max Level Reached!", "error");
            return;
        }

        if (confirm(`Skip level for ${cost} Diamonds?`)) {
            onUpdatePlayer({
                ...player,
                diamonds: player.diamonds - cost,
                seasonStats: {
                    ...player.seasonStats,
                    level: player.seasonStats.level + 1,
                    xp: 0 // Reset current XP on skip
                }
            });
            addToast("Season Level Skipped!", "success");
        }
    };

    const handleClaimSeasonReward = (level: number, type: 'free' | 'premium') => {
        const reward = SEASON_CONFIG.rewards.find(r => r.level === level);
        if (!reward) return;

        // Validation
        if (player.seasonStats.level < level) {
            addToast("Reach this level first!", "error");
            return;
        }
        if (type === 'premium' && !player.seasonStats.isPremium) {
            addToast("Premium Pass required!", "error");
            return;
        }
        if (type === 'free' && player.seasonStats.claimedFree.includes(level)) return;
        if (type === 'premium' && player.seasonStats.claimedPremium.includes(level)) return;

        const newInventory = [...player.inventory];
        
        const item = type === 'free' ? reward.freeItem : reward.premiumItem;
        const amount = type === 'free' ? reward.freeAmount : reward.premiumAmount;

        if (item) {
            for (let i = 0; i < amount; i++) {
                newInventory.push(item);
            }
        }

        const newStats = { ...player.seasonStats };
        if (type === 'free') newStats.claimedFree.push(level);
        else newStats.claimedPremium.push(level);

        onUpdatePlayer({
            ...player,
            inventory: newInventory,
            seasonStats: newStats
        });
        addToast(`Claimed Level ${level} ${type} reward!`, "success");
    };

    // --- Sub-Components ---
    
    const InventoryList = () => {
        const counts: Record<string, number> = {};
        player.inventory.forEach(i => counts[i] = (counts[i] || 0) + 1);
        
        return (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {Object.keys(counts).length === 0 && <p className="text-center text-neutral-500 py-4">Backpack is empty.</p>}
                {Object.entries(counts).map(([name, count]) => {
                    const item = ITEM_REGISTRY[name];
                    if (!item) return null;
                    const isEquippable = ['weapon', 'armor', 'accessory'].includes(item.type);
                    const isChest = item.type === 'chest';
                    const isPotion = item.type === 'potion';
                    const isConsumable = item.type === 'consumable' && item.name === 'Old Cheese';

                    return (
                        <div key={name} className="flex flex-col sm:flex-row justify-between items-center p-3 bg-neutral-900/50 rounded border border-neutral-800 hover:border-neutral-600 transition-colors group gap-3">
                            <ItemRarity itemName={name} count={count} />
                            
                            <div className="flex gap-2 w-full sm:w-auto justify-end">
                                {isEquippable && (
                                    <Button className="py-1 px-3 text-[10px]" onClick={() => handleEquip(name)}>Equip</Button>
                                )}
                                {isChest && (
                                    <Button className="py-1 px-3 text-[10px] bg-purple-900/30 border-purple-700 hover:bg-purple-900" onClick={() => handleOpenChest(name)}>Open</Button>
                                )}
                                {isPotion && (
                                    <Button className="py-1 px-3 text-[10px] bg-cyan-900/30 border-cyan-700 hover:bg-cyan-900" onClick={() => handleDrinkPotion(name)}>Drink</Button>
                                )}
                                {isConsumable && (
                                    <Button className="py-1 px-3 text-[10px] bg-green-900/30 border-green-700 hover:bg-green-900" onClick={() => {
                                        // Simple consumable logic for old items
                                        if (player.currentHp >= player.maxHp) { addToast("Full HP", "info"); return; }
                                        const newInv = [...player.inventory];
                                        newInv.splice(newInv.indexOf(name), 1);
                                        onUpdatePlayer({ ...player, currentHp: Math.min(player.maxHp, player.currentHp + 5), inventory: newInv });
                                        addToast("Ate cheese. Gross.", "success");
                                    }}>Eat</Button>
                                )}
                                <Button variant="secondary" className="py-1 px-3 text-[10px]" onClick={() => handleSellItem(name)}>Sell</Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const ActiveActionPanel = () => {
        if (!player.activeAction) return <div className="text-neutral-500 text-xs mb-4 text-center">Status: Idle</div>;
        
        const actionNames: Record<string, string> = {
            'train_atk': 'Training Strength',
            'train_def': 'Training Defense',
            'train_dodge': 'Training Agility',
            'train_crit': 'Training Critical',
            'resting': 'Sleeping'
        };
        
        const timeLeft = Math.max(0, Math.floor(player.activeAction.remainingTime / 1000));
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        
        // Calculate Total Speed
        let speedMult = isLegacyBoostActive() ? 3.0 : 1.25;
        player.activeBuffs.forEach(b => { if(b.type === 'speed') speedMult *= b.multiplier; });

        return (
            <div className="bg-yellow-900/10 border border-yellow-700/30 p-3 rounded mb-4 backdrop-blur-sm">
                <div className="flex justify-between text-yellow-500 text-xs font-bold mb-1 uppercase tracking-wider">
                    <span>⚡ {actionNames[player.activeAction.type]}</span>
                    <span>{speedMult.toFixed(2)}x Speed</span>
                </div>
                <div className="text-white font-mono text-center text-sm mb-2">
                    {mins}:{secs.toString().padStart(2, '0')} remaining
                </div>
                <button 
                    onClick={finishTrainingInstant}
                    className="w-full bg-cyan-900/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-200 text-[10px] font-bold py-1 rounded transition-colors flex items-center justify-center gap-1"
                >
                    <Gem size={10} /> Finish Now
                </button>
            </div>
        );
    };

    const BuffsPanel = () => {
        if (player.activeBuffs.length === 0) return null;
        return (
            <div className="mb-4 space-y-1">
                {player.activeBuffs.map(buff => {
                    const timeLeft = Math.max(0, Math.ceil((buff.expiresAt - Date.now()) / 60000));
                    return (
                        <div key={buff.id} className="flex justify-between items-center bg-blue-900/20 border border-blue-800/50 p-2 rounded text-[10px]">
                            <span className="text-blue-300 font-bold flex items-center gap-2">
                                {buff.type === 'xp' ? <Gem size={10}/> : <Timer size={10}/>}
                                {buff.name}
                            </span>
                            <span className="text-neutral-400">{timeLeft}m</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const EquipmentSlot = ({ slot, icon: Icon, item }: { slot: keyof Equipment, icon: any, item: string | null }) => (
        <div 
            className={`flex items-center gap-3 p-2 rounded border border-dashed ${item ? 'border-yellow-600/50 bg-yellow-900/5' : 'border-neutral-800'} cursor-pointer hover:bg-white/5 transition-colors`}
            onClick={() => item && handleUnequip(slot)}
            title={item ? "Click to Unequip" : "Empty Slot"}
        >
            <div className={`p-2 rounded ${item ? 'text-yellow-500' : 'text-neutral-600'}`}>
                <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[10px] text-neutral-500 uppercase tracking-widest">{slot}</div>
                <div className={`text-sm truncate ${item ? 'text-white' : 'text-neutral-600'}`}>
                    {item ? <ItemRarity itemName={item} showStats={false} /> : "Empty"}
                </div>
            </div>
        </div>
    );

    // --- Main Render ---

    return (
        <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto w-full">
            {/* Left Panel: Stats */}
            <aside className="w-full md:w-80 space-y-4 shrink-0">
                <Card>
                    {/* New Profile Circular XP */}
                    <div className="flex flex-col items-center mb-6 border-b border-white/5 pb-4 relative">
                         <div className="relative mb-2">
                            <CircularProgress current={player.currentXp} max={player.maxXp} size={90}>
                                <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-neutral-800 text-neutral-200 shadow-inner">
                                    {player.username.charAt(0).toUpperCase()}
                                </div>
                            </CircularProgress>
                            <div className="absolute -bottom-2 -right-2 bg-yellow-600 text-black font-bold w-8 h-8 rounded-full flex items-center justify-center border-4 border-[#121212] shadow-lg">
                                {player.level}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-lg text-white tracking-wide">{player.username}</div>
                            <div className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold">Adventurer Rank {player.level >= 20 ? 'B' : 'C'}</div>
                            <div className="text-yellow-500 text-xs mt-1 font-mono">{player.currentXp} / {player.maxXp} XP</div>
                        </div>
                        
                        <button 
                            onClick={() => setShowSettings(true)}
                            className="absolute top-0 right-0 p-2 text-neutral-600 hover:text-white transition-colors"
                        >
                            <Settings size={16} />
                        </button>
                    </div>

                    <ActiveActionPanel />
                    <BuffsPanel />

                    {/* Equipment Grid */}
                    <div className="grid grid-cols-1 gap-2 mb-6">
                        <EquipmentSlot slot="weapon" icon={Sword} item={player.equipment.weapon} />
                        <EquipmentSlot slot="armor" icon={Shirt} item={player.equipment.armor} />
                        <EquipmentSlot slot="accessory" icon={Gem} item={player.equipment.accessory} />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-[10px] uppercase tracking-wider text-neutral-500 mb-1 font-bold">Health Points</div>
                            <ProgressBar current={player.currentHp} max={player.maxHp} color="bg-red-600" />
                            <div className="text-right text-xs mt-1 text-neutral-400 font-mono">{player.currentHp}/{player.maxHp}</div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-1">
                        <StatRow 
                            icon={Sword} 
                            label="Attack" 
                            value={stats.atk} 
                            subValue={stats.atk > player.attack ? `(+${stats.atk - player.attack})` : ''} 
                        />
                        <StatRow 
                            icon={Shield} 
                            label="Defense" 
                            value={stats.def} 
                            subValue={stats.def > player.defense ? `(+${stats.def - player.defense})` : ''}
                        />
                        <StatRow 
                            icon={Wind} 
                            label="Dodge" 
                            value={`${stats.dodge}%`} 
                            subValue={stats.dodge > player.dodge ? `(+${(stats.dodge - player.dodge).toFixed(1)}%)` : ''}
                        />
                        <StatRow 
                            icon={Crosshair} 
                            label="Crit Chance" 
                            value={`${stats.crit}%`} 
                            subValue={stats.crit > player.critChance ? `(+${(stats.crit - player.critChance).toFixed(1)}%)` : ''} 
                        />
                        <StatRow icon={Coins} label="Gold" value={player.gold} valueColor="text-yellow-400" />
                        <StatRow icon={Gem} label="Diamonds" value={player.diamonds} valueColor="text-cyan-400" />
                    </div>
                </Card>

                <Button variant="secondary" className="w-full" onClick={onLogout}>
                    <LogOut size={16} /> Logout
                </Button>
            </aside>

            {/* Right Panel: Content */}
            <main className="flex-1 min-w-0">
                {/* Top Bar inside main area on mobile, or just header */}
                {subView !== 'menu' && (
                    <Button variant="secondary" className="mb-4" onClick={() => setSubView('menu')}>
                        ← Back to Menu
                    </Button>
                )}

                {subView === 'menu' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card onClick={() => setSubView('dungeon')} className="group border-neutral-800 hover:border-red-900/50">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Map size={64} />
                            </div>
                            <Map className="w-8 h-8 text-neutral-500 mb-4 group-hover:text-red-500 transition-colors" />
                            <h3 className="text-xl font-bold mb-2 text-white">Dungeons</h3>
                            <p className="text-neutral-500 text-sm">Explore dangerous places and fight monsters for loot and XP.</p>
                        </Card>
                        <Card onClick={() => setSubView('train')} className="group border-neutral-800 hover:border-blue-900/50">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Sword size={64} />
                            </div>
                            <Sword className="w-8 h-8 text-neutral-500 mb-4 group-hover:text-blue-500 transition-colors" />
                            <h3 className="text-xl font-bold mb-2 text-white">Training</h3>
                            <p className="text-neutral-500 text-sm">Train attributes AFK. Use potions to speed up!</p>
                        </Card>
                        <Card onClick={() => setSubView('shop')} className="group border-neutral-800 hover:border-green-900/50">
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <ShoppingBag size={64} />
                            </div>
                            <ShoppingBag className="w-8 h-8 text-neutral-500 mb-4 group-hover:text-green-500 transition-colors" />
                            <h3 className="text-xl font-bold mb-2 text-white">Item Shop</h3>
                            <p className="text-neutral-500 text-sm">Buy gear, chests, and potions with your hard earned gold.</p>
                        </Card>
                         <Card onClick={() => setSubView('season')} className="group border-yellow-900/30 hover:border-yellow-500/50 bg-gradient-to-br from-[#1a1500] to-transparent">
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Crown size={64} />
                            </div>
                            <Crown className="w-8 h-8 text-yellow-600 mb-4 group-hover:text-yellow-400 transition-colors" />
                            <h3 className="text-xl font-bold mb-2 text-yellow-500">Season Pass</h3>
                            <p className="text-neutral-500 text-sm">Earn exclusive rewards and legendary items this season!</p>
                        </Card>
                         <Card onClick={() => setSubView('rank')} className="group border-neutral-800 hover:border-purple-900/50">
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Trophy size={64} />
                            </div>
                            <Trophy className="w-8 h-8 text-neutral-500 mb-4 group-hover:text-purple-500 transition-colors" />
                            <h3 className="text-xl font-bold mb-2 text-white">Rankings</h3>
                            <p className="text-neutral-500 text-sm">View your Hunter Rank and the global leaderboard.</p>
                        </Card>
                        <Card onClick={() => setSubView('inn')} className="group border-neutral-800 hover:border-orange-900/50">
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Moon size={64} />
                            </div>
                            <Moon className="w-8 h-8 text-neutral-500 mb-4 group-hover:text-orange-500 transition-colors" />
                            <h3 className="text-xl font-bold mb-2 text-white">The Inn</h3>
                            <p className="text-neutral-500 text-sm">Rest to recover HP or buy drinks to heal wounds instantly.</p>
                        </Card>
                        <Card onClick={() => setShowInventory(true)} className="group md:col-span-3 border-neutral-800 hover:border-neutral-600">
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Backpack size={64} />
                            </div>
                            <Backpack className="w-8 h-8 text-neutral-500 mb-4 group-hover:text-white transition-colors" />
                            <h3 className="text-xl font-bold mb-2 text-white">Inventory</h3>
                            <p className="text-neutral-500 text-sm">Open chests, drink potions, equip gear and manage your loot.</p>
                        </Card>
                    </div>
                )}

                {subView === 'season' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-yellow-950 via-black to-black border border-yellow-900/50 p-8 rounded-xl relative overflow-hidden shadow-2xl">
                            <Crown className="absolute -right-10 -top-10 text-yellow-500/10 rotate-12" size={200} />
                            <div className="relative z-10">
                                <div className="text-yellow-500 text-xs font-bold uppercase tracking-[0.2em] mb-2">Current Season</div>
                                <h2 className="text-4xl font-black text-white italic uppercase tracking-wider mb-2">{SEASON_CONFIG.name}</h2>
                                <p className="text-neutral-400 text-sm mb-6 max-w-lg">Complete battles to earn Season XP. Upgrade to Premium to unlock legendary rewards like the Infinity Blade.</p>
                                
                                <div className="flex flex-col md:flex-row items-end md:items-center gap-6 mb-8">
                                    <div className="flex-1 w-full">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                                            <span className="text-white">Level {player.seasonStats.level}</span>
                                            <span className="text-yellow-500">{player.seasonStats.level >= SEASON_CONFIG.maxLevel ? "MAX" : `${player.seasonStats.xp} / ${SEASON_CONFIG.xpPerLevel} XP`}</span>
                                        </div>
                                        <ProgressBar 
                                            current={player.seasonStats.level >= SEASON_CONFIG.maxLevel ? 100 : player.seasonStats.xp} 
                                            max={SEASON_CONFIG.xpPerLevel} 
                                            color="bg-gradient-to-r from-yellow-600 to-yellow-400" 
                                            height="h-4"
                                        />
                                    </div>
                                    <div className="shrink-0 flex gap-2">
                                        <Button onClick={skipSeasonLevel} variant="diamond" className="px-4 py-3 text-sm">
                                            <ChevronsRight size={14} /> Skip Lvl (50 <Gem size={10} className="inline"/>)
                                        </Button>
                                         {!player.seasonStats.isPremium ? (
                                            <Button onClick={handleBuySeasonPremium} variant="premium" className="px-8 py-3 text-sm">
                                                Unlock Premium ({SEASON_CONFIG.premiumCost.toLocaleString()} G)
                                            </Button>
                                        ) : (
                                            <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 font-bold rounded uppercase text-xs tracking-widest flex items-center gap-2">
                                                <Check size={14} /> Premium Active
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Season Track (Horizontal Scroll) */}
                        <div className="bg-[#121212] border border-white/5 rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-4 uppercase tracking-widest text-neutral-400">Reward Track</h3>
                            <div className="overflow-x-auto custom-scrollbar pb-6">
                                <div className="flex gap-4 min-w-max">
                                    {SEASON_CONFIG.rewards.map((reward) => {
                                        const isReached = player.seasonStats.level >= reward.level;
                                        const freeClaimed = player.seasonStats.claimedFree.includes(reward.level);
                                        const premiumClaimed = player.seasonStats.claimedPremium.includes(reward.level);
                                        const isCurrent = player.seasonStats.level === reward.level;

                                        return (
                                            <div key={reward.level} className={`w-40 flex flex-col gap-2 ${isReached ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                                {/* Level Header */}
                                                <div className={`text-center p-1 rounded-t font-bold text-xs ${isCurrent ? 'bg-yellow-600 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                                                    LEVEL {reward.level}
                                                </div>

                                                {/* Premium Slot */}
                                                <div className={`
                                                    h-32 border border-yellow-900/30 bg-gradient-to-b from-yellow-900/10 to-transparent rounded p-2 flex flex-col items-center justify-between relative
                                                    ${!player.seasonStats.isPremium ? 'opacity-70' : ''}
                                                `}>
                                                    <div className="text-[10px] text-yellow-600 font-bold uppercase tracking-wider mb-1">Premium</div>
                                                    {reward.premiumItem ? (
                                                        <>
                                                            <div className="flex-1 flex items-center justify-center">
                                                                <ItemRarity itemName={reward.premiumItem} showStats={false} />
                                                            </div>
                                                            <div className="text-[10px] text-neutral-400">x{reward.premiumAmount}</div>
                                                            {isReached && player.seasonStats.isPremium && !premiumClaimed && (
                                                                <button onClick={() => handleClaimSeasonReward(reward.level, 'premium')} className="absolute inset-0 bg-yellow-500/20 hover:bg-yellow-500/40 flex items-center justify-center font-bold text-yellow-400 uppercase text-xs tracking-wider backdrop-blur-sm transition-all">Claim</button>
                                                            )}
                                                            {premiumClaimed && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
                                                                    <Check className="text-yellow-500" />
                                                                </div>
                                                            )}
                                                             {!player.seasonStats.isPremium && <Lock className="absolute top-2 right-2 text-yellow-900" size={12} />}
                                                        </>
                                                    ) : <span className="text-neutral-700">-</span>}
                                                </div>

                                                {/* Free Slot */}
                                                <div className="h-32 border border-neutral-800 bg-neutral-900/30 rounded p-2 flex flex-col items-center justify-between relative">
                                                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Free</div>
                                                    {reward.freeItem ? (
                                                        <>
                                                            <div className="flex-1 flex items-center justify-center">
                                                                <ItemRarity itemName={reward.freeItem} showStats={false} />
                                                            </div>
                                                            <div className="text-[10px] text-neutral-400">x{reward.freeAmount}</div>
                                                            {isReached && !freeClaimed && (
                                                                <button onClick={() => handleClaimSeasonReward(reward.level, 'free')} className="absolute inset-0 bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-white uppercase text-xs tracking-wider backdrop-blur-sm transition-all">Claim</button>
                                                            )}
                                                            {freeClaimed && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
                                                                    <Check className="text-green-500" />
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : <span className="text-neutral-700">-</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {subView === 'rank' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Hunter Rankings</h2>
                            <div className="text-neutral-400 text-sm">Season 1</div>
                        </div>

                        {/* Player Rank Card */}
                        <div className="bg-gradient-to-r from-purple-900/20 to-black border border-purple-500/20 p-8 rounded-xl flex items-center gap-8 relative overflow-hidden">
                            <Trophy className="absolute right-0 top-0 text-purple-500/5 -rotate-12" size={200} />
                            <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-purple-900 rounded-full flex items-center justify-center text-5xl font-black text-white border-4 border-purple-950/50 shadow-2xl relative z-10">
                                {player.level >= 50 ? 'S' : player.level >= 30 ? 'A' : player.level >= 20 ? 'B' : player.level >= 10 ? 'C' : player.level >= 5 ? 'D' : 'E'}
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold text-white mb-1">Your Rank: {player.level >= 50 ? 'S-Class' : player.level >= 30 ? 'A-Class' : player.level >= 20 ? 'B-Class' : player.level >= 10 ? 'C-Class' : player.level >= 5 ? 'D-Class' : 'E-Class'}</h3>
                                <p className="text-purple-400 font-bold">Level {player.level} Adventurer</p>
                                <p className="text-neutral-500 text-sm mt-2">Total Combat Power: {player.attack + player.defense}</p>
                            </div>
                        </div>

                        {/* Simulated Leaderboard */}
                        <div className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden shadow-xl">
                            <div className="p-4 border-b border-white/5 font-bold bg-white/5 uppercase text-xs tracking-wider text-neutral-400">Global Leaderboard</div>
                            <div className="divide-y divide-white/5">
                                {/* Mock Entries */}
                                <div className="p-4 flex justify-between items-center text-neutral-400 hover:bg-white/5 transition-colors">
                                    <span className="w-8 font-bold text-yellow-500">1</span>
                                    <span className="flex-1 font-medium text-white">Kaelthas</span>
                                    <span className="text-yellow-600 font-bold bg-yellow-900/10 px-2 py-1 rounded text-xs border border-yellow-900/30">Lvl 99</span>
                                </div>
                                <div className="p-4 flex justify-between items-center text-neutral-400 hover:bg-white/5 transition-colors">
                                    <span className="w-8 font-bold text-neutral-300">2</span>
                                    <span className="flex-1 font-medium text-white">ShadowHunter</span>
                                    <span className="text-neutral-500 font-bold bg-neutral-900/50 px-2 py-1 rounded text-xs border border-neutral-800">Lvl 85</span>
                                </div>
                                <div className="p-4 flex justify-between items-center text-neutral-400 hover:bg-white/5 transition-colors">
                                    <span className="w-8 font-bold text-orange-700">3</span>
                                    <span className="flex-1 font-medium text-white">IronWall</span>
                                    <span className="text-neutral-500 font-bold bg-neutral-900/50 px-2 py-1 rounded text-xs border border-neutral-800">Lvl 72</span>
                                </div>
                                {/* Player Entry in Context */}
                                <div className="p-4 flex justify-between items-center bg-purple-900/10 border-l-2 border-purple-500">
                                    <span className="w-8 font-bold text-neutral-500">99+</span>
                                    <span className="flex-1 font-bold text-purple-300">{player.username} (You)</span>
                                    <span className="text-purple-400 font-bold">Lvl {player.level}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {subView === 'shop' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Item Shop</h2>
                            <div className="flex gap-2">
                                <Button variant="diamond" onClick={() => setShowExchange(true)} className="px-3">
                                    <ArrowRightLeft size={14}/> Exchange
                                </Button>
                                <div className="flex items-center gap-2 text-yellow-500 font-bold bg-yellow-900/10 border border-yellow-900/30 px-4 py-2 rounded-lg">
                                    <Coins size={16} /> {player.gold.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Filters & Search */}
                        <div className="bg-[#121212] p-4 rounded-xl border border-white/5 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search items..." 
                                    className="w-full bg-black/50 border border-neutral-800 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:border-neutral-500 outline-none transition-colors"
                                    value={shopSearch}
                                    onChange={(e) => setShopSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                {(['all', 'weapon', 'armor', 'accessory', 'potion', 'chest', 'material'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setShopFilter(f)}
                                        className={`px-4 py-1.5 text-xs rounded-full border whitespace-nowrap uppercase font-bold transition-all ${
                                            shopFilter === f 
                                            ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' 
                                            : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-500 hover:text-white'
                                        }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {Object.entries(player.shopStock)
                                .filter(([itemName]) => {
                                    const item = ITEM_REGISTRY[itemName];
                                    if (!item) return false;
                                    // Search logic
                                    const matchesSearch = item.name.toLowerCase().includes(shopSearch.toLowerCase());
                                    // Filter logic
                                    const matchesFilter = shopFilter === 'all' || item.type === shopFilter;
                                    return matchesSearch && matchesFilter;
                                })
                                .map(([itemName, stock]) => {
                                    const item = ITEM_REGISTRY[itemName];
                                    if (!item) return null;
                                    
                                    const canAfford = player.gold >= item.price;
                                    const hasStock = stock > 0;

                                    return (
                                        <div key={itemName} className={`bg-[#121212] border border-white/5 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 ${!hasStock ? 'opacity-50 grayscale' : ''} hover:bg-white/5 transition-colors`}>
                                            <div className="flex-1 w-full">
                                                <div className="mb-2">
                                                    <ItemRarity itemName={itemName} showStats={false} />
                                                </div>
                                                
                                                {item.stats && (
                                                    <div className="flex flex-wrap gap-2 mt-2 text-[10px] uppercase font-bold tracking-wider opacity-80 pl-[52px]">
                                                        {item.stats.atk && <span className="text-red-400 bg-red-900/10 px-1 rounded">ATK +{item.stats.atk}</span>}
                                                        {item.stats.def && <span className="text-blue-400 bg-blue-900/10 px-1 rounded">DEF +{item.stats.def}</span>}
                                                        {item.stats.dodge && <span className="text-green-400 bg-green-900/10 px-1 rounded">DODGE +{item.stats.dodge}%</span>}
                                                        {item.stats.critChance && <span className="text-yellow-500 bg-yellow-900/10 px-1 rounded">CRIT +{item.stats.critChance}%</span>}
                                                        {item.stats.hp && <span className="text-pink-400 bg-pink-900/10 px-1 rounded">HEAL {item.stats.hp}</span>}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-0 w-full md:w-auto justify-between md:justify-center">
                                                <div>
                                                    <div className="text-lg font-bold text-yellow-500">{item.price} G</div>
                                                    <div className={`text-[10px] uppercase font-bold ${hasStock ? 'text-green-500' : 'text-red-500'}`}>{stock} Left</div>
                                                </div>
                                                <Button 
                                                    disabled={!canAfford || !hasStock}
                                                    onClick={() => handleBuy(itemName)}
                                                    className="w-auto md:mt-2"
                                                >
                                                    {hasStock ? 'Purchase' : 'Sold Out'}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            
                            {/* Empty State for Search */}
                            {Object.entries(player.shopStock).filter(([n]) => ITEM_REGISTRY[n]?.name.toLowerCase().includes(shopSearch.toLowerCase()) && (shopFilter === 'all' || ITEM_REGISTRY[n]?.type === shopFilter)).length === 0 && (
                                <div className="text-center text-neutral-500 py-10 col-span-full">
                                    <Filter className="mx-auto mb-2 opacity-50" />
                                    No items match your filters.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {subView === 'train' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-bold mb-6">Training Grounds</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card onClick={() => startTraining('train_atk', 5)} className="text-center group border-red-900/20 hover:border-red-500/50">
                                <Sword className="mx-auto mb-4 text-red-500 group-hover:scale-110 transition-transform" size={32} />
                                <h3 className="font-bold text-lg mb-1">Strength Training</h3>
                                <p className="text-xs text-neutral-500 mb-4">+1 Attack Power</p>
                                <span className="text-[10px] font-bold uppercase tracking-wider border border-neutral-700 px-3 py-1 rounded bg-neutral-900 text-neutral-300">5 Minutes</span>
                            </Card>
                            <Card onClick={() => startTraining('train_def', 5)} className="text-center group border-blue-900/20 hover:border-blue-500/50">
                                <Shield className="mx-auto mb-4 text-blue-500 group-hover:scale-110 transition-transform" size={32} />
                                <h3 className="font-bold text-lg mb-1">Defense Training</h3>
                                <p className="text-xs text-neutral-500 mb-4">+1 Defense</p>
                                <span className="text-[10px] font-bold uppercase tracking-wider border border-neutral-700 px-3 py-1 rounded bg-neutral-900 text-neutral-300">5 Minutes</span>
                            </Card>
                            <Card onClick={() => startTraining('train_dodge', 3)} className="text-center group border-green-900/20 hover:border-green-500/50">
                                <Wind className="mx-auto mb-4 text-green-500 group-hover:scale-110 transition-transform" size={32} />
                                <h3 className="font-bold text-lg mb-1">Agility Training</h3>
                                <p className="text-xs text-neutral-500 mb-4">+0.1% Dodge Chance</p>
                                <span className="text-[10px] font-bold uppercase tracking-wider border border-neutral-700 px-3 py-1 rounded bg-neutral-900 text-neutral-300">3 Minutes</span>
                            </Card>
                            <Card onClick={() => startTraining('train_crit', 10)} className="text-center group border-yellow-900/20 hover:border-yellow-500/50">
                                <Crosshair className="mx-auto mb-4 text-yellow-500 group-hover:scale-110 transition-transform" size={32} />
                                <h3 className="font-bold text-lg mb-1">Precision Training</h3>
                                <p className="text-xs text-neutral-500 mb-4">+0.5% Critical Chance</p>
                                <span className="text-[10px] font-bold uppercase tracking-wider border border-neutral-700 px-3 py-1 rounded bg-neutral-900 text-neutral-300">10 Minutes</span>
                            </Card>
                        </div>
                    </div>
                )}

                {subView === 'inn' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-bold mb-6">The Inn</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card onClick={healPlayer} className="text-center border-red-900/20 hover:border-red-500/50 group">
                                <Heart className="mx-auto mb-4 text-red-500 group-hover:scale-110 transition-transform" size={32} />
                                <h3 className="font-bold text-lg mb-2">Quick Heal</h3>
                                <p className="text-sm text-neutral-500 mb-4">Instantly restore full HP for a price.</p>
                                <p className="text-yellow-500 font-bold bg-yellow-900/10 inline-block px-4 py-2 rounded">
                                    Cost: {Math.max(0, player.maxHp - player.currentHp)} Gold
                                </p>
                            </Card>
                            <Card onClick={restSleep} className="text-center border-blue-900/20 hover:border-blue-500/50 group">
                                <Moon className="mx-auto mb-4 text-blue-500 group-hover:scale-110 transition-transform" size={32} />
                                <h3 className="font-bold text-lg mb-2">Rest</h3>
                                <p className="text-sm text-neutral-500 mb-4">Sleep to recover HP over time.</p>
                                <p className="text-green-500 font-bold bg-green-900/10 inline-block px-4 py-2 rounded">Free (Time)</p>
                            </Card>
                        </div>
                    </div>
                )}

                {subView === 'dungeon' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-bold mb-6">Select Dungeon</h2>
                        <div className="grid grid-cols-1 gap-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar pb-10">
                            {DUNGEONS.map(d => {
                                const locked = player.level < d.reqLevel;
                                return (
                                    <div key={d.id} className={`bg-[#121212] border ${locked ? 'border-neutral-800 opacity-50 grayscale' : 'border-neutral-700 hover:border-white'} p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-6 transition-all`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${locked ? 'bg-neutral-900 text-neutral-600' : 'bg-red-900/20 text-red-500'}`}>
                                                {locked ? <Lock size={20} /> : <Skull size={24} />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-white">{d.name}</h3>
                                                <div className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-1">Req. Level {d.reqLevel}</div>
                                                <p className="text-sm text-neutral-400">Boss: <span className="text-red-400">{d.enemy.name}</span></p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                                             <div className="text-xs text-yellow-500 bg-yellow-900/10 px-2 py-1 rounded border border-yellow-900/30 text-center w-full md:w-auto mb-2">
                                                ~{d.enemy.gold} Gold | {d.enemy.xp} XP
                                            </div>
                                            <div className="flex gap-2 w-full md:w-auto">
                                                <Button 
                                                    disabled={locked || player.currentHp <= 0}
                                                    onClick={() => onNavigate('combat', { dungeonId: d.id })}
                                                    className="flex-1 md:flex-none"
                                                >
                                                    {locked ? 'Locked' : 'Manual Fight'}
                                                </Button>
                                                <Button 
                                                    disabled={locked || player.currentHp <= 0}
                                                    variant="secondary"
                                                    onClick={() => onNavigate('auto-combat', { dungeonId: d.id })}
                                                    className="flex-1 md:flex-none"
                                                >
                                                    {locked ? 'Locked' : 'Auto Fight'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            <Modal isOpen={showInventory} onClose={() => setShowInventory(false)} title="Backpack">
                <InventoryList />
            </Modal>

            <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-white font-bold mb-2">Save Management</h3>
                        <p className="text-neutral-500 text-sm mb-4">Export your save code to keep it safe or move to another device.</p>
                        
                        <div className="flex gap-2 mb-4">
                            <Button onClick={onExportSave} className="flex-1">
                                <Download size={16} /> Export Save
                            </Button>
                        </div>
                        
                        <div className="border-t border-neutral-800 pt-4">
                            <h3 className="text-white font-bold mb-2">Import Save</h3>
                            <textarea 
                                className="w-full bg-black/50 border border-neutral-700 rounded p-3 text-xs text-neutral-300 mb-2 h-24 focus:border-white outline-none font-mono"
                                placeholder="Paste save code here..."
                                value={importString}
                                onChange={e => setImportString(e.target.value)}
                            />
                            <Button variant="secondary" onClick={() => onImportSave(importString)} className="w-full">
                                <Upload size={16} /> Import Data
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showExchange} onClose={() => setShowExchange(false)} title="Currency Exchange">
                <div className="text-center">
                    <div className="flex justify-center items-center gap-4 mb-8">
                        <div className="text-center">
                            <div className="text-yellow-500 font-bold text-2xl mb-1">{player.gold}</div>
                            <div className="text-xs uppercase text-neutral-500">Gold</div>
                        </div>
                        <ArrowRightLeft className="text-neutral-600" />
                        <div className="text-center">
                            <div className="text-cyan-400 font-bold text-2xl mb-1">{player.diamonds}</div>
                            <div className="text-xs uppercase text-neutral-500">Diamonds</div>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 mb-6">
                        <p className="text-sm text-neutral-300 mb-2">Exchange Rate</p>
                        <div className="text-xl font-bold flex items-center justify-center gap-2">
                            <span className="text-yellow-500">1000 G</span> = <span className="text-cyan-400">1 Diamond</span>
                        </div>
                    </div>

                    <Button variant="diamond" onClick={exchangeGold} className="w-full mb-2">
                        Exchange 1000 G
                    </Button>
                    <p className="text-xs text-neutral-500 mt-4">Diamonds allow you to skip training times and season levels.</p>
                </div>
            </Modal>
        </div>
    );
};