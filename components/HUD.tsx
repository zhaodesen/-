import React from 'react';
import { Shield, Clock, Trophy, AlertCircle } from 'lucide-react';
import { GameStats } from '../game/events';

interface HUDProps {
    stats: GameStats;
}

export const HUD: React.FC<HUDProps> = ({ stats }) => {
    const hpPct = Math.max(0, (stats.hp / stats.maxHp) * 100);
    
    return (
        <div className="absolute inset-0 pointer-events-none p-4 md:p-8 flex flex-col justify-between overflow-hidden">
            {/* Top Bar */}
            <div className="flex justify-between items-start">
                
                {/* Left: Score & Time */}
                <div className="flex flex-col gap-3">
                    <div className="group flex items-center gap-4 bg-black/60 backdrop-blur border-l-4 border-yellow-500 px-6 py-2 skew-x-[-15deg]">
                        <div className="skew-x-[15deg] flex items-center gap-3">
                            <Trophy className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" size={24} />
                            <div>
                                <div className="text-xs text-yellow-500 font-orbitron tracking-widest">SCORE</div>
                                <span className="text-3xl font-mono font-bold text-white tracking-widest">{stats.score.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-black/60 backdrop-blur border-l-4 border-cyan-500 px-6 py-1 skew-x-[-15deg] w-fit">
                        <div className="skew-x-[15deg] flex items-center gap-3">
                            <Clock className="text-cyan-400" size={18} />
                            <span className="text-xl font-rajdhani font-semibold text-cyan-100">{stats.time.toFixed(1)}s</span>
                        </div>
                    </div>
                </div>

                {/* Right: HP Bar */}
                <div className="flex flex-col items-end w-72 md:w-96">
                    <div className="flex items-center justify-between w-full mb-1 px-2">
                        <span className="text-rose-500 font-orbitron text-xs tracking-widest animate-pulse">{hpPct < 30 ? 'CRITICAL' : 'SYSTEM STATUS'}</span>
                        <div className="flex items-center gap-2 text-rose-400">
                            <Shield size={18} />
                            <span className="font-rajdhani font-bold text-xl">{Math.ceil(stats.hp)}%</span>
                        </div>
                    </div>
                    
                    {/* HP Container */}
                    <div className="w-full h-6 bg-slate-900/80 border border-slate-700 skew-x-[-20deg] p-1 relative overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-300 ease-out relative ${hpPct < 30 ? 'bg-red-600 animate-pulse' : 'bg-gradient-to-r from-rose-600 to-rose-400'}`}
                            style={{ width: `${hpPct}%` }}
                        >
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')] opacity-50"></div>
                        </div>
                        {/* Glass Shine */}
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20"></div>
                    </div>
                </div>
            </div>

            {/* Bottom Center - Energy / XP */}
            <div className="flex flex-col items-center mb-6">
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-green-500"></div>
                    <span className="font-orbitron text-green-400 tracking-[0.2em] text-sm shadow-green-500 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                        UPGRADE SEQUENCE
                    </span>
                    <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-green-500"></div>
                </div>
                
                <div className="flex gap-2">
                    {Array.from({ length: stats.maxEnergy }).map((_, i) => (
                        <div 
                            key={i}
                            className={`w-16 h-3 skew-x-[-20deg] border border-green-900 transition-all duration-300 ${
                                i < stats.energy 
                                    ? 'bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.8)] border-green-400 scale-110' 
                                    : 'bg-black/40'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};