import Phaser from 'phaser';

// Singleton Event Emitter
export const gameEvents = new Phaser.Events.EventEmitter();

export const EVENTS = {
    GAME_START: 'game-start',
    GAME_OVER: 'game-over',
    UPDATE_HUD: 'update-hud',
    LEVEL_UP: 'level-up', // Triggered when energy fills
    RESUME_GAME: 'resume-game',
    APPLY_UPGRADE: 'apply-upgrade',
    SHOW_TOAST: 'show-toast',
};

export interface GameStats {
    score: number;
    hp: number;
    maxHp: number;
    energy: number;
    maxEnergy: number;
    time: number;
}