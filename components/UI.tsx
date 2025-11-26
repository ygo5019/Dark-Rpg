import React from 'react';
import { LucideIcon, X, Info, Sword, Shield, Zap, Archive, Gem, Hammer, Shirt, Box, Beaker, FlaskConical, Feather, Skull, Scroll, Crown, Star } from 'lucide-react';
import { ItemDetails, ItemType } from '../types';
import { ITEM_REGISTRY } from '../constants';

// --- Icon Mapping Logic ---
const getItemIcon = (item: ItemDetails): LucideIcon => {
    const name = item.name.toLowerCase();
    
    if (item.type === 'chest') return Box;
    if (item.type === 'potion') return FlaskConical;
    if (item.type === 'consumable') return Beaker;

    // Specific Items
    if (name.includes('sword') || name.includes('blade') || name.includes('reaper')) return Sword;
    if (name.includes('axe') || name.includes('pickaxe')) return Hammer;
    if (name.includes('dagger') || name.includes('fang')) return Sword; // Dagger icon fallback
    
    if (name.includes('shirt') || name.includes('vest') || name.includes('armor') || name.includes('plate') || name.includes('cloak') || name.includes('mail')) return Shirt;
    
    if (name.includes('ring') || name.includes('amulet') || name.includes('eye') || name.includes('crown')) return Gem;
    
    if (name.includes('bone') || name.includes('skull')) return Skull;
    if (name.includes('tail') || name.includes('pelt') || name.includes('scale') || name.includes('claw')) return Feather;
    if (name.includes('rune') || name.includes('essence') || name.includes('core')) return Zap;
    if (name.includes('bar')) return Archive;

    return Star; // Fallback
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'premium' | 'diamond' }> = ({ 
    className = '', 
    variant = 'primary', 
    children, 
    ...props 
}) => {
    const baseStyle = "px-5 py-2.5 rounded font-bold uppercase text-xs tracking-wider transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm";
    
    const variants = {
        primary: "bg-white text-black border border-white hover:bg-neutral-200 shadow-md",
        secondary: "bg-black/40 text-neutral-300 border border-neutral-700 hover:border-neutral-500 hover:text-white hover:bg-black/60",
        danger: "bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40 hover:text-red-300 hover:border-red-700",
        premium: "bg-gradient-to-r from-yellow-700 to-yellow-600 text-black border border-yellow-500 hover:brightness-110 shadow-lg shadow-yellow-900/20",
        diamond: "bg-gradient-to-r from-cyan-900 to-blue-900 text-cyan-100 border border-cyan-500/50 hover:brightness-110 shadow-lg shadow-cyan-900/20"
    };

    return (
        <button 
            className={`${baseStyle} ${variants[variant]} disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = '', onClick }) => (
    <div 
        onClick={onClick}
        className={`
            bg-[#121212] border border-white/5 rounded-xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md
            ${onClick ? 'cursor-pointer hover:border-white/20 hover:bg-[#181818] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1' : ''} 
            ${className}
        `}
    >
        {/* Subtle noise texture or gradient overlay could go here */}
        {children}
    </div>
);

export const ProgressBar: React.FC<{ current: number, max: number, color?: string, height?: string }> = ({ 
    current, 
    max, 
    color = "bg-white",
    height = "h-2"
}) => {
    const percent = Math.min(100, Math.max(0, (current / max) * 100));
    return (
        <div className={`w-full ${height} bg-black/40 border border-white/5 rounded-full overflow-hidden backdrop-blur-sm`}>
            <div 
                className={`h-full transition-all duration-500 ease-out shadow-[0_0_10px_currentColor] ${color}`} 
                style={{ width: `${percent}%` }}
            />
        </div>
    );
};

export const CircularProgress: React.FC<{ current: number, max: number, size?: number, strokeWidth?: number, children?: React.ReactNode }> = ({
    current,
    max,
    size = 100,
    strokeWidth = 4,
    children
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const percent = Math.min(100, Math.max(0, (current / max) * 100));
    const offset = circumference - (percent / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center drop-shadow-2xl" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#222"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#fbbf24" // Amber-400
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                {children}
            </div>
        </div>
    );
};

export const StatRow: React.FC<{ icon: LucideIcon, label: string, value: string | number, subValue?: string, valueColor?: string }> = ({ icon: Icon, label, value, subValue, valueColor = "text-neutral-200" }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0 group hover:bg-white/5 px-2 rounded transition-colors">
        <div className="flex items-center gap-3 text-neutral-400 group-hover:text-white transition-colors">
            <Icon size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-right">
            <div className={`font-mono font-bold group-hover:text-white ${valueColor}`}>{value}</div>
            {subValue && <div className="text-[10px] text-green-400">{subValue}</div>}
        </div>
    </div>
);

export const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#141414] border border-neutral-800 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl scale-100" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50 rounded-t-xl">
                    <h2 className="text-lg font-bold text-white uppercase tracking-widest">{title}</h2>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const ItemRarity: React.FC<{ itemName: string, count?: number, showStats?: boolean }> = ({ itemName, count, showStats = true }) => {
    const item = ITEM_REGISTRY[itemName];
    if (!item) return <span className="text-neutral-500">{itemName}</span>;

    const Icon = getItemIcon(item);

    // Rarity Color Logic
    let colorClass = "text-neutral-300"; // Common
    let borderClass = "border-neutral-800 bg-neutral-900/50";
    let iconClass = "text-neutral-500";

    if (item.type === 'weapon' || item.type === 'armor') {
        colorClass = "text-green-400"; // Uncommon
        borderClass = "border-green-900/30 bg-green-900/10";
        iconClass = "text-green-600";
    }
    if (item.price >= 400 && (item.type === 'weapon' || item.type === 'armor')) {
        colorClass = "text-blue-400"; // Rare
        borderClass = "border-blue-900/30 bg-blue-900/10";
        iconClass = "text-blue-500";
    }
    if (item.price >= 1000) {
        colorClass = "text-yellow-500 drop-shadow-sm"; // Legendary
        borderClass = "border-yellow-900/30 bg-yellow-900/10";
        iconClass = "text-yellow-600";
    }
    if (item.type === 'chest') {
        colorClass = "text-purple-400 font-bold";
        borderClass = "border-purple-900/30 bg-purple-900/10";
        iconClass = "text-purple-500";
    }
    if (item.type === 'potion') {
        colorClass = "text-cyan-400";
        borderClass = "border-cyan-900/30 bg-cyan-900/10";
        iconClass = "text-cyan-500";
    }

    // Season Exclusive override
    if (item.description.includes("SEASON EXCLUSIVE")) {
         colorClass = "text-rose-400 font-bold drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]";
         borderClass = "border-rose-900/40 bg-rose-900/10";
         iconClass = "text-rose-500";
    }

    // Removed Hover Tooltip Logic

    return (
        <div className="group relative flex items-center gap-3 w-full">
            {/* Icon Box */}
            <div className={`w-10 h-10 rounded flex items-center justify-center border ${borderClass} shadow-inner`}>
                <Icon size={20} className={iconClass} />
            </div>

            <div className="flex-1 min-w-0">
                <div className={`truncate font-medium ${colorClass}`}>{item.name}</div>
                {count !== undefined && <div className="text-xs text-neutral-500">Qty: {count}</div>}
            </div>
        </div>
    );
};

export const ToastContainer: React.FC<{ toasts: {id: number, message: string, type: 'success' | 'error' | 'info' | 'loot'}[] }> = ({ toasts }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            {toasts.map(toast => (
                <div 
                    key={toast.id} 
                    className={`
                        pointer-events-auto min-w-[280px] max-w-sm p-4 rounded-lg shadow-2xl border-l-4 text-sm font-medium animate-in slide-in-from-right fade-in duration-300 backdrop-blur-md
                        ${toast.type === 'success' ? 'bg-green-950/80 border-green-500 text-green-100' : ''}
                        ${toast.type === 'error' ? 'bg-red-950/80 border-red-500 text-red-100' : ''}
                        ${toast.type === 'info' ? 'bg-blue-950/80 border-blue-500 text-blue-100' : ''}
                        ${toast.type === 'loot' ? 'bg-purple-950/80 border-purple-500 text-purple-100' : ''}
                    `}
                >
                    <div className="flex items-start gap-3">
                        {toast.type === 'success' && <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_currentColor]" /></div>}
                        {toast.type === 'error' && <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_currentColor]" /></div>}
                        {toast.type === 'info' && <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_currentColor]" /></div>}
                        {toast.type === 'loot' && <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_currentColor]" /></div>}
                        <div className="leading-relaxed">{toast.message}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};