// Simple synth audio manager to avoid loading external assets
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

export const SoundSys = {
    play: (freq: number, type: OscillatorType, dur: number, vol = 0.1, slide = 0) => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        if (slide) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq + slide), audioCtx.currentTime + dur);
        }
        
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + dur);
    },
    shoot: () => SoundSys.play(600, 'square', 0.1, 0.03, -300),
    hit: () => SoundSys.play(150, 'sawtooth', 0.1, 0.05),
    explode: () => { 
        SoundSys.play(100, 'sawtooth', 0.3, 0.1, -50); 
        setTimeout(() => SoundSys.play(60, 'square', 0.4, 0.1), 50);
    },
    collect: () => { 
        SoundSys.play(800, 'sine', 0.1, 0.05); 
        setTimeout(() => SoundSys.play(1200, 'sine', 0.15, 0.05), 80); 
    },
    upgrade: () => {
        SoundSys.play(400, 'sine', 0.1, 0.1);
        setTimeout(() => SoundSys.play(600, 'sine', 0.1, 0.1), 100);
        setTimeout(() => SoundSys.play(800, 'sine', 0.2, 0.1), 200);
    },
    god: () => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 2);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 1);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 2.5);
    }
};