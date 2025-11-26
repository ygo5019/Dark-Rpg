import React, { useState, useEffect } from 'react';
import { Player, ViewState, Dungeon, ToastMessage } from './types';
import { DUNGEONS, DEFAULT_SHOP_STOCK } from './constants';
import { Login } from './views/Login';
import { Hub } from './views/Hub';
import { Combat } from './views/Combat';
import { AutoCombat } from './views/AutoCombat';
import { ToastContainer } from './components/UI';

const App: React.FC = () => {
    const [player, setPlayer] = useState<Player | null>(null);
    const [view, setView] = useState<ViewState>('login');
    const [activeDungeon, setActiveDungeon] = useState<Dungeon | null>(null);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // --- Notification System ---
    const addToast = (message: string, type: ToastMessage['type'] = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    // --- Persistence & Migration ---
    const updatePlayer = (newData: Player) => {
        setPlayer(newData);
        const key = `rpg_user_${newData.username}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            const acc = JSON.parse(stored);
            acc.playerData = newData;
            localStorage.setItem(key, JSON.stringify(acc));
        }
    };

    const handleLogin = (p: Player) => {
        // Migration Check for old saves
        const updatedPlayer = { ...p };
        if (!updatedPlayer.equipment) updatedPlayer.equipment = { weapon: null, armor: null, accessory: null };
        if (!updatedPlayer.shopStock) updatedPlayer.shopStock = { ...DEFAULT_SHOP_STOCK };
        if (updatedPlayer.critChance === undefined) updatedPlayer.critChance = 1.5;
        if (updatedPlayer.diamonds === undefined) updatedPlayer.diamonds = 0;
        if (!updatedPlayer.activeBuffs) updatedPlayer.activeBuffs = [];
        if (!updatedPlayer.seasonStats) {
            updatedPlayer.seasonStats = {
                level: 1,
                xp: 0,
                isPremium: false,
                claimedFree: [],
                claimedPremium: []
            };
        }
        
        // Calculate offline progress
        const now = Date.now();
        
        // Clean expired buffs immediately on load
        updatedPlayer.activeBuffs = updatedPlayer.activeBuffs.filter(b => b.expiresAt > now);

        if (updatedPlayer.activeAction) {
            const lastTick = updatedPlayer.activeAction.lastTick;
            const elapsed = now - lastTick;
            
            // Check boost (offline boost logic from original: if boost active, 3x)
            const isLegacyBoost = now < updatedPlayer.boostExpires;
            
            // Calculate speed multiplier from buffs
            let speedMult = isLegacyBoost ? 3.0 : 1.0;
            updatedPlayer.activeBuffs.forEach(buff => {
                if (buff.type === 'speed') {
                    speedMult *= buff.multiplier;
                }
            });
            
            updatedPlayer.activeAction.remainingTime -= (elapsed * speedMult);
            updatedPlayer.activeAction.lastTick = now;

            if (updatedPlayer.activeAction.remainingTime <= 0) {
                 const completed = completeAction(updatedPlayer);
                 setPlayer(completed);
                 setView('hub');
                 addToast("Offline action completed!", "success");
                 return;
            }
        }
        
        setPlayer(updatedPlayer);
        setView('hub');
    };

    // --- Game Loop ---
    useEffect(() => {
        if (!player) return;

        const interval = setInterval(() => {
            setPlayer(prev => {
                if (!prev) return null;

                const now = Date.now();
                
                // 1. Clean expired buffs
                const validBuffs = prev.activeBuffs.filter(b => b.expiresAt > now);
                const buffsChanged = validBuffs.length !== prev.activeBuffs.length;
                if (buffsChanged) {
                    addToast("A buff has expired.", "info");
                }
                
                let nextPlayer = buffsChanged ? { ...prev, activeBuffs: validBuffs } : prev;

                // 2. Process Action
                if (nextPlayer.activeAction) {
                    const delta = now - nextPlayer.activeAction.lastTick;
                    
                    // Speed multiplier logic
                    const isLegacyBoost = now < nextPlayer.boostExpires;
                    let speedMult = isLegacyBoost ? 3.0 : 1.25; // 1.25 base online speed

                    nextPlayer.activeBuffs.forEach(buff => {
                        if (buff.type === 'speed') {
                            speedMult *= buff.multiplier;
                        }
                    });

                    const effectiveDelta = delta * speedMult;
                    const newRemaining = nextPlayer.activeAction.remainingTime - effectiveDelta;

                    if (newRemaining <= 0) {
                        return completeAction(nextPlayer);
                    }

                    // Just update tick
                    nextPlayer = {
                        ...nextPlayer,
                        activeAction: {
                            ...nextPlayer.activeAction,
                            remainingTime: newRemaining,
                            lastTick: now
                        }
                    };
                }
                
                // Save state
                const key = `rpg_user_${nextPlayer.username}`;
                const stored = localStorage.getItem(key);
                if (stored) {
                    const acc = JSON.parse(stored);
                    acc.playerData = nextPlayer;
                    localStorage.setItem(key, JSON.stringify(acc));
                }

                return nextPlayer;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [player?.activeAction, player?.activeBuffs]);

    const completeAction = (p: Player): Player => {
        if (!p.activeAction) return p;
        
        let msg = "";
        let nextP = { ...p };
        
        switch (p.activeAction.type) {
            case 'train_atk':
                nextP.attack += 1;
                msg = "Training Complete: +1 Attack!";
                break;
            case 'train_def':
                nextP.defense += 1;
                msg = "Training Complete: +1 Defense!";
                break;
            case 'train_dodge':
                nextP.dodge = parseFloat((nextP.dodge + 0.1).toFixed(2));
                msg = "Training Complete: +0.1% Dodge!";
                break;
            case 'train_crit':
                nextP.critChance = parseFloat((nextP.critChance + 0.5).toFixed(2));
                msg = "Training Complete: +0.5% Crit Chance!";
                break;
            case 'resting':
                nextP.currentHp = nextP.maxHp;
                msg = "Rested: Health fully restored!";
                break;
        }
        
        nextP.activeAction = null;
        
        // Persist completion
        const key = `rpg_user_${nextP.username}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            const acc = JSON.parse(stored);
            acc.playerData = nextP;
            localStorage.setItem(key, JSON.stringify(acc));
        }

        addToast(msg, "success");
        return nextP;
    };

    // --- Save Management ---
    const handleExportSave = () => {
        if (!player) return;
        const key = `rpg_user_${player.username}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            const base64 = btoa(stored);
            navigator.clipboard.writeText(base64).then(() => {
                addToast("Save copied to clipboard!", "success");
            }).catch(() => {
                addToast("Failed to copy save.", "error");
            });
        }
    };

    const handleImportSave = (saveString: string) => {
        try {
            const decoded = atob(saveString);
            const data = JSON.parse(decoded);
            if (data && data.playerData && data.password) {
                // Ensure key matches username
                const key = `rpg_user_${data.playerData.username}`;
                localStorage.setItem(key, JSON.stringify(data));
                addToast("Save imported! Logging you in...", "success");
                setTimeout(() => {
                    handleLogin(data.playerData);
                }, 1000);
            } else {
                addToast("Invalid save file.", "error");
            }
        } catch (e) {
            addToast("Corrupt save string.", "error");
        }
    };

    // --- Navigation ---
    const handleNavigate = (target: ViewState | 'combat' | 'auto-combat', data?: any) => {
        if ((target === 'combat' || target === 'auto-combat') && data?.dungeonId !== undefined) {
            const dungeon = DUNGEONS.find(d => d.id === data.dungeonId);
            if (dungeon) {
                setActiveDungeon(dungeon);
                setView(target);
            }
        } else {
            setView(target as ViewState);
        }
    };

    if (!player) return <Login onLogin={handleLogin} />;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans antialiased">
            <ToastContainer toasts={toasts} />
            
            {view === 'hub' && (
                <Hub 
                    player={player} 
                    onUpdatePlayer={updatePlayer} 
                    onNavigate={handleNavigate}
                    onLogout={() => { setPlayer(null); setView('login'); }}
                    onExportSave={handleExportSave}
                    onImportSave={handleImportSave}
                    addToast={addToast}
                />
            )}
            {view === 'combat' && activeDungeon && (
                <Combat 
                    player={player} 
                    dungeon={activeDungeon} 
                    onUpdatePlayer={updatePlayer}
                    onExit={() => {
                        setActiveDungeon(null);
                        setView('hub');
                    }}
                />
            )}
            {view === 'auto-combat' && activeDungeon && (
                <AutoCombat 
                    player={player} 
                    dungeon={activeDungeon} 
                    onUpdatePlayer={updatePlayer}
                    onExit={() => {
                        setActiveDungeon(null);
                        setView('hub');
                    }}
                />
            )}
        </div>
    );
};

export default App;