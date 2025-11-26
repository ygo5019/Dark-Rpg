import React, { useState } from 'react';
import { Button, Card } from '../components/UI';
import { Player } from '../types';
import { DEFAULT_PLAYER } from '../constants';

interface LoginProps {
    onLogin: (player: Player) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = () => {
        if (!username || !password) {
            setError('Please fill in all fields');
            return;
        }
        const stored = localStorage.getItem(`rpg_user_${username}`);
        if (!stored) {
            setError('User not found');
            return;
        }
        try {
            const data = JSON.parse(stored);
            if (data.password === password) {
                onLogin(data.playerData);
            } else {
                setError('Incorrect password');
            }
        } catch (e) {
            setError('Data corruption error');
        }
    };

    const handleRegister = () => {
        if (!username || !password) {
            setError('Please fill in all fields');
            return;
        }
        if (localStorage.getItem(`rpg_user_${username}`)) {
            setError('User already exists');
            return;
        }
        const newAccount = {
            password,
            playerData: { ...DEFAULT_PLAYER, username }
        };
        localStorage.setItem(`rpg_user_${username}`, JSON.stringify(newAccount));
        setError('');
        alert('Account created! You can now login.');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 to-black">
            <Card className="w-full max-w-sm text-center border-neutral-700">
                <h1 className="text-3xl font-bold mb-8 text-white tracking-widest">DARK RPG</h1>
                <div className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="Username" 
                        className="w-full bg-black/50 border border-neutral-700 rounded p-3 text-white focus:border-white transition-colors"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        className="w-full bg-black/50 border border-neutral-700 rounded p-3 text-white focus:border-white transition-colors"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex gap-4 mt-6">
                        <Button onClick={handleLogin} className="flex-1">Login</Button>
                        <Button variant="secondary" onClick={handleRegister} className="flex-1">Register</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};