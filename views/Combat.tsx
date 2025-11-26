import React, { useState, useEffect, useRef } from 'react';
import { Player, Dungeon, Enemy } from '../types';
import { Button, ProgressBar, Card } from '../components/UI';
import { Sword, Shield, Skull, LogOut, ArrowLeft } from 'lucide-react';
import { ITEM_REGISTRY, SEASON_CONFIG } from '../constants';

interface CombatProps {
    player: Player;
    dungeon: Dungeon;
    onUpdatePlayer: (p: Player) => void;
    onExit: () => void;
}

type LogType = 'info' | 'player' | 'enemy' | 'gold' | 'loot' | 'crit';

interface CombatLog {
    id: number;
    text: string;
    type: LogType;
}

export const Combat: React.FC<CombatProps> = ({ player, dungeon, onUpdatePlayer, onExit }) => {
    // Combat State
    const [enemy, setEnemy] = useState<Enemy>({ ...dungeon.enemy });
    const [logs, setLogs] = useState<CombatLog[]>([]);
    const [turn, setTurn] = useState<'player' | 'enemy' | 'ended'>('player');
    const [combatResult, setCombatResult] = useState<'victory' | 'defeat' | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Initial log
    useEffect(() => {
        addLog(`Entered ${dungeon.name}. ${enemy.name} appears!`, 'info');
    }, []);

    // Auto scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // Calculate effective stats
    const getEffectiveStats = () => {
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
        return { atk, def, dodge, crit };
    };

    const stats = getEffectiveStats();

    const addLog = (text: string, type: LogType) => {
        setLogs(prev => [...prev, { id: Date.now() + Math.random(), text, type }]);
    };

    const handlePlayerAttack = () => {
        if (turn !== 'player') return;

        // Crit Check
        const isCrit = Math.random() * 100 < stats.crit;
        
        // Damage Calculation
        let dmg = Math.floor(stats.atk * (0.8 + Math.random() * 0.4));
        if (isCrit) {
            dmg *= 2;
            addLog("CRITICAL HIT!", 'crit');
        }

        const newEnemyHp = Math.max(0, enemy.hp - dmg);
        
        setEnemy(prev => ({ ...prev, hp: newEnemyHp }));
        addLog(`You dealt ${dmg} damage!`, 'player');

        if (newEnemyHp <= 0) {
            handleVictory();
        } else {
            setTurn('enemy');
            setTimeout(handleEnemyTurn, 800);
        }
    };

    const handleEnemyTurn = () => {
        // Dodge check
        const hitChance = 100 - stats.dodge;
        const roll = Math.random() * 100;
        
        if (roll > hitChance) {
            addLog(`You dodged ${dungeon.enemy.name}'s attack!`, 'info');
        } else {
            // Damage calc
            // Min damage 1
            const rawDmg = Math.floor(dungeon.enemy.atk * (0.8 + Math.random() * 0.4));
            const mitigation = Math.floor(stats.def / 4);
            const dmg = Math.max(1, rawDmg - mitigation);
            
            const newPlayerHp = Math.max(0, player.currentHp - dmg);
            onUpdatePlayer({ ...player, currentHp: newPlayerHp });
            addLog(`${dungeon.enemy.name} dealt ${dmg} damage!`, 'enemy');

            if (newPlayerHp <= 0) {
                handleDefeat();
                return;
            }
        }
        setTurn('player');
    };

    const handleVictory = () => {
        setTurn('ended');
        setCombatResult('victory');
        
        const newInventory = [...player.inventory];
        const earnedGold = dungeon.enemy.gold;
        
        // XP Buff Calculation
        let xpMult = 1;
        player.activeBuffs.forEach(b => { if(b.type === 'xp') xpMult *= b.multiplier; });
        const earnedXp = Math.floor(dungeon.enemy.xp * xpMult);
        
        addLog(`Victory!`, 'gold');
        addLog(`Gained ${earnedGold} Gold and ${earnedXp} XP.`, 'gold');
        if (xpMult > 1) addLog(`(XP Boosted ${xpMult}x)`, 'info');

        // Loot drops (Dungeon specific)
        dungeon.drops.forEach(drop => {
            if (Math.random() * 100 <= drop.chance) {
                newInventory.push(drop.item);
                addLog(`Looted: ${drop.item}`, 'loot');
            }
        });

        // Global Treasure Chest Drops
        const roll = Math.random() * 100;
        if (roll <= 5) {
            newInventory.push("Common Chest");
            addLog("Found a Common Treasure!", 'loot');
        } else if (roll <= 5 + 3) {
            newInventory.push("Uncommon Chest");
            addLog("Found an Uncommon Treasure!", 'loot');
        } else if (roll <= 5 + 3 + 1) {
            newInventory.push("Rare Chest");
            addLog("Found a Rare Treasure!", 'loot');
        }

        // Season Progress
        let newSeasonStats = { ...player.seasonStats };
        // Fixed 5 XP per kill for season
        const seasonXpGain = 5; 
        newSeasonStats.xp += seasonXpGain;
        // Level up check
        if (newSeasonStats.level < SEASON_CONFIG.maxLevel) {
            if (newSeasonStats.xp >= SEASON_CONFIG.xpPerLevel) {
                newSeasonStats.xp -= SEASON_CONFIG.xpPerLevel;
                newSeasonStats.level += 1;
                addLog(`SEASON PASS LEVEL UP! Level ${newSeasonStats.level}`, 'info');
            }
        }

        // Level Up Logic
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
            currentHp = newMaxHp; // Heal on level up
            newAtk += 1;
            newDef += 1;
            addLog(`LEVEL UP! You are now level ${newLevel}.`, 'info');
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

    const handleDefeat = () => {
        setTurn('ended');
        setCombatResult('defeat');
        addLog('You were defeated...', 'enemy');
        // Penalty: 1 HP remaining
        onUpdatePlayer({ ...player, currentHp: 1 });
    };

    const getLogColor = (type: LogType) => {
        switch(type) {
            case 'player': return 'text-green-400';
            case 'enemy': return 'text-red-400';
            case 'gold': return 'text-yellow-400';
            case 'loot': return 'text-purple-400';
            case 'crit': return 'text-orange-500 font-bold';
            case 'info': return 'text-blue-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-[#111] p-4 rounded border border-neutral-800">
                {/* Player Stats */}
                <div className="w-5/12 text-center">
                    <div className="font-bold text-lg mb-1">{player.username}</div>
                    <div className="text-2xl font-mono text-green-500 mb-2">{player.currentHp}/{player.maxHp}</div>
                    <ProgressBar current={player.currentHp} max={player.maxHp} color="bg-green-600" />
                    <div className="text-xs text-neutral-500 mt-2">
                        Atk: {stats.atk} | Def: {stats.def} | Crit: {stats.crit.toFixed(1)}%
                    </div>
                </div>

                <div className="font-bold text-neutral-600">VS</div>

                {/* Enemy Stats */}
                <div className="w-5/12 text-center">
                    <div className="font-bold text-lg mb-1 text-red-400">{enemy.name}</div>
                    <div className="text-2xl font-mono text-red-500 mb-2">{enemy.hp}/{enemy.maxHp}</div>
                    <ProgressBar current={enemy.hp} max={enemy.maxHp} color="bg-red-600" />
                </div>
            </div>

            {/* Combat Log */}
            <div className="bg-black border border-neutral-800 rounded h-64 overflow-y-auto p-4 font-mono text-sm shadow-inner custom-scrollbar">
                {logs.map(log => (
                    <div key={log.id} className={`mb-1 ${getLogColor(log.type)}`}>
                        <span className="opacity-50 mr-2">{'>'}</span>{log.text}
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4">
                {turn !== 'ended' ? (
                    <>
                        <Button 
                            onClick={handlePlayerAttack} 
                            disabled={turn !== 'player'}
                            className="w-full"
                        >
                            <Sword className="w-4 h-4" /> Attack
                        </Button>
                        <Button 
                            variant="secondary" 
                            onClick={() => {
                                addLog('You fled the battle.', 'info');
                                onExit();
                            }}
                            className="w-full"
                        >
                            <LogOut className="w-4 h-4" /> Flee
                        </Button>
                    </>
                ) : (
                    <Button onClick={onExit} className="col-span-2">
                        <ArrowLeft className="w-4 h-4" /> Return to Hub
                    </Button>
                )}
            </div>
        </div>
    );
};