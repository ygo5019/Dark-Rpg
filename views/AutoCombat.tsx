import React, { useState, useEffect, useRef } from 'react';
import { Player, Dungeon, Enemy } from '../types';
import { Button, ProgressBar } from '../components/UI';
import { LogOut, Zap, Sword, Shield, Skull } from 'lucide-react';
import { ITEM_REGISTRY, SEASON_CONFIG } from '../constants';

interface AutoCombatProps {
    player: Player;
    dungeon: Dungeon;
    onUpdatePlayer: (p: Player) => void;
    onExit: () => void;
}

export const AutoCombat: React.FC<AutoCombatProps> = ({ player, dungeon, onUpdatePlayer, onExit }) => {
    const [enemy, setEnemy] = useState<Enemy | null>(null);
    const [battleState, setBattleState] = useState<'searching' | 'fighting'>('searching');
    const [stats, setStats] = useState({ atk: 0, def: 0, dodge: 0, crit: 0 });
    const [killCount, setKillCount] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    
    // Log container for scrolling
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Initial Stats Calc
    useEffect(() => {
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
        setStats({ atk, def, dodge, crit });
    }, [player.equipment, player.attack, player.defense, player.dodge, player.critChance]);

    // Auto Scroll Logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const addLog = (msg: string) => {
        setLogs(prev => {
            const newLogs = [...prev, msg];
            if (newLogs.length > 50) return newLogs.slice(newLogs.length - 50);
            return newLogs;
        });
    };

    // The Game Loop
    useEffect(() => {
        const interval = setInterval(() => {
            if (player.currentHp <= 0) {
                addLog("You have fallen! Returning to Hub...");
                clearInterval(interval);
                setTimeout(onExit, 2000);
                return;
            }

            if (battleState === 'searching') {
                if (Math.random() > 0.3) { // 70% chance to find enemy per tick
                    setEnemy({ ...dungeon.enemy });
                    setBattleState('fighting');
                    addLog(`Found a ${dungeon.enemy.name}!`);
                } else {
                    addLog("Searching for enemies...");
                }
            } else if (battleState === 'fighting' && enemy) {
                // --- Player Attack ---
                const isCrit = Math.random() * 100 < stats.crit;
                let dmg = Math.floor(stats.atk * (0.8 + Math.random() * 0.4));
                if (isCrit) dmg *= 2;

                const newEnemyHp = enemy.hp - dmg;
                
                // --- Enemy Death Check ---
                if (newEnemyHp <= 0) {
                    if (isCrit) addLog(`CRITICAL HIT! Dealt ${dmg} damage.`);
                    handleVictory();
                    return;
                }

                // --- Enemy Attack ---
                // Enemy fights back immediately in auto mode
                const hitChance = 100 - stats.dodge;
                const roll = Math.random() * 100;
                let playerDmg = 0;

                if (roll <= hitChance) {
                    const rawDmg = Math.floor(dungeon.enemy.atk * (0.8 + Math.random() * 0.4));
                    const mitigation = Math.floor(stats.def / 4);
                    playerDmg = Math.max(1, rawDmg - mitigation);
                    
                    const newPlayerHp = player.currentHp - playerDmg;
                    
                    // Update Player HP live
                    onUpdatePlayer({ ...player, currentHp: newPlayerHp });

                    if (newPlayerHp <= 0) {
                        setEnemy(null); // Stop fighting
                        return; // Loop will catch death at start of next tick
                    }
                }

                // Update Enemy State locally
                setEnemy(prev => prev ? { ...prev, hp: newEnemyHp } : null);
            }
        }, 1000); // 1 Tick per second

        return () => clearInterval(interval);
    }, [battleState, enemy, player, stats, dungeon]);

    const handleVictory = () => {
        if (!enemy) return;

        setKillCount(prev => prev + 1);
        setBattleState('searching');
        setEnemy(null);

        const earnedGold = dungeon.enemy.gold;
        
        // XP Buff Calculation
        let xpMult = 1;
        player.activeBuffs.forEach(b => { if(b.type === 'xp') xpMult *= b.multiplier; });
        const earnedXp = Math.floor(dungeon.enemy.xp * xpMult);

        let newInventory = [...player.inventory];
        let lootMsg = "";

        // Loot calculation
        dungeon.drops.forEach(drop => {
            if (Math.random() * 100 <= drop.chance) {
                newInventory.push(drop.item);
                lootMsg += ` Found ${drop.item}!`;
            }
        });

        // Global Treasure Chest Drops
        const roll = Math.random() * 100;
        if (roll <= 5) {
            newInventory.push("Common Chest");
            lootMsg += " +Common Treasure!";
        } else if (roll <= 8) {
            newInventory.push("Uncommon Chest");
            lootMsg += " +Uncommon Treasure!";
        } else if (roll <= 9) {
            newInventory.push("Rare Chest");
            lootMsg += " +Rare Treasure!";
        }

        // Season Progress
        let newSeasonStats = { ...player.seasonStats };
        const seasonXpGain = 5; 
        newSeasonStats.xp += seasonXpGain;
        if (newSeasonStats.level < SEASON_CONFIG.maxLevel) {
            if (newSeasonStats.xp >= SEASON_CONFIG.xpPerLevel) {
                newSeasonStats.xp -= SEASON_CONFIG.xpPerLevel;
                newSeasonStats.level += 1;
                addLog(`SEASON UP! Level ${newSeasonStats.level}`);
            }
        }

        addLog(`Victory! +${earnedGold}g +${earnedXp}xp.${lootMsg}`);

        // Update Player Stats (Gold, XP, Level)
        let newXp = player.currentXp + earnedXp;
        let newLevel = player.level;
        let newMaxXp = player.maxXp;
        let newMaxHp = player.maxHp;
        let newAtk = player.attack;
        let newDef = player.defense;
        let currentHp = player.currentHp;

        if (newXp >= newMaxXp) {
            newLevel++;
            newXp -= newMaxXp;
            newMaxXp = Math.floor(newMaxXp * 1.5);
            newMaxHp += 10;
            currentHp = newMaxHp; // Full heal on level up
            newAtk += 1;
            newDef += 1;
            addLog(`*** LEVEL UP! Level ${newLevel} ***`);
        }

        onUpdatePlayer({
            ...player,
            gold: player.gold + earnedGold,
            currentXp: newXp,
            level: newLevel,
            maxXp: newMaxXp,
            maxHp: newMaxHp,
            currentHp: currentHp,
            attack: newAtk,
            defense: newDef,
            inventory: newInventory,
            seasonStats: newSeasonStats
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-4 flex flex-col h-[calc(100vh-100px)]">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 bg-neutral-900 p-4 rounded border border-neutral-800">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Zap className="text-yellow-500" /> Auto-Battle: {dungeon.name}
                    </h2>
                    <p className="text-neutral-500 text-sm">Enemies defeated: {killCount}</p>
                </div>
                <Button variant="danger" onClick={onExit}>
                    <LogOut size={16} /> Stop Exploring
                </Button>
            </div>

            {/* Main Area */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Battle View */}
                <div className="flex flex-col gap-6">
                    {/* Player Card */}
                    <div className="bg-[#141414] border border-neutral-800 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold">{player.username} (Lvl {player.level})</span>
                            <span className="text-sm text-neutral-400">HP: {player.currentHp}/{player.maxHp}</span>
                        </div>
                        <ProgressBar current={player.currentHp} max={player.maxHp} color="bg-green-600" />
                        <div className="mt-2 flex gap-4 text-xs text-neutral-500">
                            <span className="flex items-center gap-1"><Sword size={12}/> {stats.atk}</span>
                            <span className="flex items-center gap-1"><Shield size={12}/> {stats.def}</span>
                            <span className="flex items-center gap-1 text-orange-400"><Zap size={12}/> {stats.crit.toFixed(1)}% Crit</span>
                        </div>
                    </div>

                    {/* VS / Status */}
                    <div className="text-center py-4">
                        {battleState === 'searching' ? (
                            <div className="animate-pulse text-neutral-500 text-lg">Searching for enemies...</div>
                        ) : (
                            <div className="text-red-500 font-bold text-2xl animate-bounce">FIGHTING</div>
                        )}
                    </div>

                    {/* Enemy Card */}
                    <div className={`bg-[#141414] border border-neutral-800 p-4 rounded-lg transition-opacity duration-300 ${battleState === 'searching' ? 'opacity-30' : 'opacity-100'}`}>
                        {enemy ? (
                            <>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-red-400">{enemy.name}</span>
                                    <span className="text-sm text-neutral-400">HP: {enemy.hp}/{enemy.maxHp}</span>
                                </div>
                                <ProgressBar current={enemy.hp} max={enemy.maxHp} color="bg-red-600" />
                                <div className="mt-2 text-center text-xs text-neutral-600">
                                    Reward: {enemy.gold}g | {enemy.xp}xp
                                </div>
                            </>
                        ) : (
                            <div className="h-20 flex items-center justify-center text-neutral-600">
                                <Skull size={32} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Log View */}
                <div className="bg-black border border-neutral-800 rounded-lg p-4 overflow-hidden flex flex-col">
                    <h3 className="text-sm font-bold text-neutral-500 uppercase mb-2 border-b border-neutral-900 pb-2">Combat Log</h3>
                    <div className="flex-1 overflow-y-auto font-mono text-sm space-y-1 custom-scrollbar">
                        {logs.map((log, i) => (
                            <div key={i} className="text-neutral-300">
                                <span className="text-neutral-600 mr-2">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                                {log}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};