import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { gameConfig } from './game/game';
import { gameEvents, EVENTS, GameStats } from './game/events';
import { UpgradeModal } from './components/UpgradeModal';
import { HUD } from './components/HUD';
import { Play, RotateCcw, Zap } from 'lucide-react';

// Toast Component
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
    const [stats, setStats] = useState<GameStats>({ score: 0, hp: 100, maxHp: 100, energy: 0, maxEnergy: 3, time: 0 });
    const [finalScore, setFinalScore] = useState(0);
    const [toast, setToast] = useState<string | null>(null);

    // Initialize Game
    useEffect(() => {
        if (!gameRef.current) {
            // Ensure we use the current window size for initialization
            // This prevents 0x0 dimensions which can cause "Framebuffer status: Incomplete Attachment" errors
            const config = {
                ...gameConfig,
                scale: {
                    ...gameConfig.scale,
                    width: window.innerWidth || 1024,
                    height: window.innerHeight || 768,
                }
            };
            gameRef.current = new Phaser.Game(config);
            
            // Listen to Phaser events
            gameEvents.on(EVENTS.UPDATE_HUD, (newStats: GameStats) => setStats(newStats));
            
            gameEvents.on(EVENTS.LEVEL_UP, () => {
                setGameState('upgrade');
            });
            
            // FIX: Listen for resume game to close modal
            gameEvents.on(EVENTS.RESUME_GAME, () => {
                setGameState('playing');
            });
            
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
            {/* Phaser Container */}
            <div id="game-container" className="absolute inset-0" />

            {/* UI Overlays */}
            {gameState === 'playing' && <HUD stats={stats} />}
            {gameState === 'upgrade' && <UpgradeModal />}
            {toast && <Toast msg={toast} />}

            {/* Start Screen */}
            {gameState === 'start' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black">
                    <div className="text-center z-10">
                        <div className="mb-8 relative">
                            <h1 className="text-7xl md:text-9xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-700 filter drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                                STAR DEFENSE
                            </h1>
                            <div className="absolute -inset-4 bg-cyan-500/10 blur-3xl -z-10 rounded-full"></div>
                            <h2 className="text-3xl font-rajdhani text-cyan-400 tracking-[0.6em] uppercase mt-2">
                                Ascension Protocol
                            </h2>
                        </div>
                        
                        <div className="bg-slate-900/50 backdrop-blur border-l-2 border-r-2 border-cyan-500/50 p-8 max-w-lg mx-auto mb-12 transform skew-x-[-5deg]">
                            <div className="transform skew-x-[5deg] space-y-4 text-gray-300 font-rajdhani text-xl text-left">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_5px_cyan]"></div>
                                    <p>Pilot the interceptor with your mouse.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_5px_cyan]"></div>
                                    <p>Collect <span className="text-green-400">Data Cubes</span> to upgrade systems.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_5px_cyan]"></div>
                                    <p>Weapons auto-lock. Focus on evasion.</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={startGame}
                            className="group relative px-16 py-5 bg-cyan-700 hover:bg-cyan-600 text-white font-orbitron font-bold text-2xl skew-x-[-10deg] transition-all duration-200 hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:-translate-y-1"
                        >
                            <span className="flex items-center gap-3 skew-x-[10deg]">
                                INITIATE LAUNCH <Play fill="currentColor" className="ml-2" />
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
                            <h1 className="text-7xl font-black font-orbitron text-red-500 tracking-tighter drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]">
                                CRITICAL FAILURE
                            </h1>
                            <p className="text-red-200 font-rajdhani text-2xl tracking-widest uppercase mt-2">Hull Integrity Compromised</p>
                        </div>
                        
                        <div className="bg-black/60 border border-red-500/30 p-10 rounded-lg mb-10 backdrop-blur-md relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
                            <p className="text-gray-500 text-sm uppercase tracking-[0.3em] mb-2 font-orbitron">Final Combat Score</p>
                            <p className="text-7xl font-mono text-white font-bold drop-shadow-md">{finalScore.toLocaleString()}</p>
                        </div>

                        <button 
                            onClick={startGame}
                            className="group px-12 py-5 bg-gradient-to-r from-red-700 to-orange-700 text-white font-orbitron font-bold text-xl rounded-sm transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] flex items-center gap-3 mx-auto"
                        >
                            <RotateCcw className="group-hover:rotate-180 transition-transform duration-500" /> REBOOT SYSTEM
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}