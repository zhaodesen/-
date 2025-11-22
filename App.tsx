import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { gameConfig } from './game/game';
import { gameEvents, EVENTS, GameStats } from './game/events';
import { UpgradeModal } from './components/UpgradeModal';
import { HUD } from './components/HUD';
import { Play, RotateCcw } from 'lucide-react';

const Toast = ({ msg }: { msg: string }) => (
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none z-50 animate-in fade-in zoom-in duration-300">
        <div className="bg-red-950/60 border border-red-500/50 backdrop-blur-md px-8 py-4 rounded-sm skew-x-[-10deg] shadow-[0_0_20px_rgba(220,38,38,0.4)]">
            <div className="skew-x-[10deg]">
                <h2 className="text-2xl font-orbitron text-red-100 text-center tracking-widest drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]">
                    {msg}
                </h2>
            </div>
        </div>
    </div>
);

export default function App() {
    const gameRef = useRef<Phaser.Game | null>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'upgrade' | 'gameover'>('start');
    const [stats, setStats] = useState<GameStats>({ score: 0, hp: 100, maxHp: 100, energy: 0, maxEnergy: 20, time: 0 });
    const [finalScore, setFinalScore] = useState(0);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        if (!gameRef.current) {
            const config = {
                ...gameConfig,
                scale: {
                    ...gameConfig.scale,
                    width: Math.max(320, window.innerWidth || 1024),
                    height: Math.max(480, window.innerHeight || 768),
                }
            };
            gameRef.current = new Phaser.Game(config);
            
            gameEvents.on(EVENTS.UPDATE_HUD, (newStats: GameStats) => setStats(newStats));
            gameEvents.on(EVENTS.LEVEL_UP, () => setGameState('upgrade'));
            gameEvents.on(EVENTS.RESUME_GAME, () => setGameState('playing'));
            gameEvents.on(EVENTS.GAME_OVER, (score: number) => {
                setFinalScore(score);
                setGameState('gameover');
            });
            gameEvents.on(EVENTS.SHOW_TOAST, (msg: string) => {
                setToast(msg);
                setTimeout(() => setToast(null), 3000);
            });
        }

        return () => {
            gameEvents.removeAllListeners();
            gameRef.current?.destroy(true);
            gameRef.current = null;
        };
    }, []);

    const startGame = () => {
        setGameState('playing');
        const scene = gameRef.current?.scene.getScene('GameScene');
        if (scene) scene.scene.restart();
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden select-none font-sans text-white">
            <div id="game-container" className="absolute inset-0" />

            {gameState === 'playing' && <HUD stats={stats} />}
            {gameState === 'upgrade' && <UpgradeModal />}
            {toast && <Toast msg={toast} />}

            {/* Start Screen */}
            {gameState === 'start' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black">
                    <div className="text-center z-10 px-4">
                        <div className="mb-8 relative">
                            <h1 className="text-5xl md:text-9xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-700 filter drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                                星际防线
                            </h1>
                            <div className="absolute -inset-4 bg-cyan-500/10 blur-3xl -z-10 rounded-full"></div>
                            <h2 className="text-2xl md:text-3xl font-rajdhani text-cyan-400 tracking-[0.6em] uppercase mt-2">
                                飞升协议
                            </h2>
                        </div>
                        
                        <div className="bg-slate-900/50 backdrop-blur border-l-2 border-r-2 border-cyan-500/50 p-6 md:p-8 max-w-lg mx-auto mb-12 transform skew-x-[-5deg]">
                            <div className="transform skew-x-[5deg] space-y-4 text-gray-300 font-rajdhani text-lg md:text-xl text-left">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_5px_cyan]"></div>
                                    <p>拖动 / 鼠标 操控战机</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_5px_cyan]"></div>
                                    <p>收集 <span className="text-green-400">数据核心</span> 进化机体</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_5px_cyan]"></div>
                                    <p>全自动武器系统上线</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={startGame}
                            className="group relative px-12 py-4 md:px-16 md:py-5 bg-cyan-700 hover:bg-cyan-600 text-white font-orbitron font-bold text-xl md:text-2xl skew-x-[-10deg] transition-all duration-200 hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:-translate-y-1"
                        >
                            <span className="flex items-center gap-3 skew-x-[10deg]">
                                启动引擎 <Play fill="currentColor" className="ml-2" />
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Game Over Screen */}
            {gameState === 'gameover' && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-950/90 backdrop-blur-sm z-50 animate-in fade-in zoom-in duration-300">
                    <div className="text-center max-w-2xl px-6 w-full">
                        <div className="relative mb-8">
                            <h1 className="text-5xl md:text-7xl font-black font-orbitron text-red-500 tracking-tighter drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]">
                                临界故障
                            </h1>
                            <p className="text-red-200 font-rajdhani text-xl md:text-2xl tracking-widest uppercase mt-2">装甲完全损毁</p>
                        </div>
                        
                        <div className="bg-black/60 border border-red-500/30 p-8 md:p-10 rounded-lg mb-10 backdrop-blur-md relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
                            <p className="text-gray-500 text-sm uppercase tracking-[0.3em] mb-2 font-orbitron">最终得分</p>
                            <p className="text-5xl md:text-7xl font-mono text-white font-bold drop-shadow-md">{finalScore.toLocaleString()}</p>
                        </div>

                        <button 
                            onClick={startGame}
                            className="group px-10 py-4 md:px-12 md:py-5 bg-gradient-to-r from-red-700 to-orange-700 text-white font-orbitron font-bold text-lg md:text-xl rounded-sm transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] flex items-center gap-3 mx-auto"
                        >
                            <RotateCcw className="group-hover:rotate-180 transition-transform duration-500" /> 重启系统
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}