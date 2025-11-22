import React from 'react';
import { Zap, Crosshair, Copy, ArrowUpFromLine, CircleDot, Heart } from 'lucide-react';
import { gameEvents, EVENTS } from '../game/events';

interface UpgradeOption {
    id: string;
    name: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
    border: string;
    shadow: string;
}

const UPGRADES: UpgradeOption[] = [
    { 
        id: 'rapid', name: 'Overclock', desc: 'Attack Speed +30%', 
        icon: <Zap size={40} />, 
        color: 'text-cyan-400', border: 'border-cyan-500', shadow: 'shadow-cyan-500' 
    },
    { 
        id: 'dmg', name: 'Antimatter', desc: 'Damage +50%', 
        icon: <Crosshair size={40} />, 
        color: 'text-rose-500', border: 'border-rose-500', shadow: 'shadow-rose-500' 
    },
    { 
        id: 'multi', name: 'Split Core', desc: 'Projectiles +2', 
        icon: <Copy size={40} />, 
        color: 'text-yellow-400', border: 'border-yellow-500', shadow: 'shadow-yellow-500' 
    },
    { 
        id: 'pierce', name: 'Phase Round', desc: 'Penetrate enemies', 
        icon: <ArrowUpFromLine size={40} />, 
        color: 'text-orange-400', border: 'border-orange-500', shadow: 'shadow-orange-500' 
    },
    { 
        id: 'repel', name: 'Repulsion', desc: 'Push enemies away', 
        icon: <CircleDot size={40} />, 
        color: 'text-purple-400', border: 'border-purple-500', shadow: 'shadow-purple-500' 
    },
    { 
        id: 'heal', name: 'Nanobots', desc: 'Restores 50 Hull Integrity', 
        icon: <Heart size={40} />, 
        color: 'text-green-400', border: 'border-green-500', shadow: 'shadow-green-500' 
    },
];

export const UpgradeModal: React.FC = () => {
    // Pick 3 random
    const options = React.useMemo(() => {
        return [...UPGRADES].sort(() => 0.5 - Math.random()).slice(0, 3);
    }, []);

    const handleSelect = (id: string) => {
        gameEvents.emit(EVENTS.APPLY_UPGRADE, id);
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-lg z-50 animate-in fade-in duration-300">
            <div className="flex flex-col items-center w-full max-w-5xl px-4">
                <div className="text-center mb-10">
                    <h2 className="text-5xl font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 mb-2 tracking-widest uppercase drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">System Upgrade</h2>
                    <div className="h-1 w-32 bg-cyan-500 mx-auto shadow-[0_0_10px_cyan]"></div>
                    <p className="text-gray-400 mt-4 font-rajdhani text-2xl tracking-wide">Choose augmentation module</p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-8 justify-center w-full">
                    {options.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => handleSelect(opt.id)}
                            className={`group relative w-full md:w-72 h-96 bg-slate-900/60 border-2 ${opt.border} rounded-sm skew-x-[-5deg] overflow-hidden hover:scale-105 hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:${opt.shadow} flex flex-col`}
                        >
                            {/* Header color bar */}
                            <div className={`absolute top-0 left-0 w-full h-2 bg-current opacity-50 ${opt.color}`}></div>
                            
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 skew-x-[5deg]">
                                <div className={`mb-8 p-6 rounded-full bg-slate-800/80 ${opt.color} shadow-[0_0_20px_currentColor] group-hover:scale-110 transition-transform duration-300`}>
                                    {opt.icon}
                                </div>
                                <h3 className={`text-3xl font-bold font-orbitron mb-4 ${opt.color}`}>{opt.name}</h3>
                                <p className="text-gray-300 font-rajdhani text-xl leading-tight border-t border-gray-700 pt-4 w-full">{opt.desc}</p>
                            </div>

                            {/* Tech Background Patterns */}
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-20"></div>
                            <div className={`absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 ${opt.border} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                            <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 ${opt.border} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                            
                            {/* Hover Glow Overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 group-hover:opacity-20 transition-opacity duration-300`}></div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};