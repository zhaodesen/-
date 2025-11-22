import React from 'react';
import { 
    Zap, Crosshair, Copy, ArrowUpFromLine, CircleDot, Heart, Gauge, ShieldPlus, 
    Activity, Target, Disc, Move, Satellite, Orbit, Bomb, Snowflake, Ghost, Skull, 
    Flame, ChevronsRight, TrendingUp, Layers, Magnet, Sword, Rocket, Sparkles, 
    AlertTriangle, Hexagon, Cpu, Radio, Anchor, Aperture, Atom, Biohazard, 
    Codepen, Component, Crown, Globe, Infinity as InfinityIcon, Maximize, 
    Minimize, Power, Radar, RefreshCw, ShieldAlert, Siren, Sun, Triangle, 
    UserPlus, VenetianMask, Workflow, ZapOff
} from 'lucide-react';
import { gameEvents, EVENTS } from '../game/events';

// --- Upgrade Generation System ---

interface UpgradeDefinition {
    id: string;
    name: string;
    desc: string;
    icon: React.ReactNode;
    tier: 'T1' | 'T2' | 'T3' | 'CURSE';
    weight: number; // Higher = more common
}

const ICONS = {
    Dmg: <Sword />, Spd: <Zap />, Hp: <Heart />, Mov: <Move />, Crit: <Crosshair />,
    Tech: <Cpu />, Def: <ShieldPlus />, Wild: <Flame />
};

// Generators
const generateStatUpgrades = (): UpgradeDefinition[] => {
    const tiers = [
        { t: 'T1', n: 'I', val: 1, w: 50 },
        { t: 'T2', n: 'II', val: 2, w: 30 },
        { t: 'T3', n: 'III', val: 3, w: 10 },
    ] as const;
    
    const types = [
        { id: 'dmg', name: '火力强化', desc: '伤害增加', base: 5, icon: ICONS.Dmg },
        { id: 'spd', name: '快速装填', desc: '攻速增加', base: 5, unit: '%', icon: ICONS.Spd },
        { id: 'mov', name: '引擎超频', desc: '移速增加', base: 10, unit: '%', icon: ICONS.Mov },
        { id: 'hp', name: '结构加固', desc: '最大生命', base: 30, icon: ICONS.Hp },
        { id: 'crit', name: '弱点扫描', desc: '暴击率', base: 5, unit: '%', icon: ICONS.Crit },
        { id: 'arm', name: '纳米镀层', desc: '护甲值', base: 2, icon: ICONS.Def },
        { id: 'reg', name: '生体修复', desc: '每秒回血', base: 1, icon: ICONS.Hp },
    ];

    const list: UpgradeDefinition[] = [];
    types.forEach(type => {
        tiers.forEach(tier => {
            list.push({
                id: `${type.id}_${tier.val}`,
                name: `${type.name} ${tier.n}`,
                desc: `${type.desc} +${type.base * tier.val}${type.unit || ''}`,
                icon: type.icon,
                tier: tier.t,
                weight: tier.w
            });
        });
    });
    return list;
};

const SPECIAL_UPGRADES: UpgradeDefinition[] = [
    // Weapons (Rare T2/T3)
    { id: 'w_multi', name: '分裂枪管', desc: '子弹数量 +1', icon: <Copy />, tier: 'T2', weight: 15 },
    { id: 'w_multi_2', name: '多重打击', desc: '子弹数量 +2', icon: <Layers />, tier: 'T3', weight: 5 },
    { id: 'w_side', name: '侧翼火炮', desc: '增加侧面火力', icon: <Satellite />, tier: 'T2', weight: 15 },
    { id: 'w_rear', name: '尾部机炮', desc: '增加后方火力', icon: <Orbit />, tier: 'T2', weight: 15 },
    { id: 'w_missile', name: '九头蛇导弹', desc: '定期发射追踪导弹', icon: <Rocket />, tier: 'T3', weight: 8 },
    { id: 'w_orbit', name: '环绕飞刃', desc: '增加护身飞刃', icon: <Hexagon />, tier: 'T2', weight: 15 },

    // Utility (Common/Rare)
    { id: 'u_heal', name: '紧急修复', desc: '立刻回满 HP', icon: <Heart />, tier: 'T1', weight: 20 },
    { id: 'u_magnet', name: '引力发生器', desc: '拾取范围 +100%', icon: <Magnet />, tier: 'T1', weight: 20 },

    // Effects (Rare/Legendary)
    { id: 'e_pierce', name: '相位穿透', desc: '子弹穿透 +1', icon: <ArrowUpFromLine />, tier: 'T2', weight: 15 },
    { id: 'e_bounce', name: '反射涂层', desc: '子弹弹射 +1', icon: <Radio />, tier: 'T2', weight: 15 },
    { id: 'e_size', name: '引力透镜', desc: '子弹体积 +25%', icon: <Disc />, tier: 'T1', weight: 25 },
    { id: 'e_freeze', name: '低温停滞', desc: '攻击减速敌人', icon: <Snowflake />, tier: 'T2', weight: 12 },
    { id: 'e_shock', name: '特斯拉线圈', desc: '几率触发连锁闪电', icon: <Zap />, tier: 'T3', weight: 8 },
    { id: 'e_nova', name: '静电新星', desc: '周期性释放电圈', icon: <CircleDot />, tier: 'T2', weight: 12 },
    { id: 'e_repel', name: '斥力场', desc: '击退周围敌人', icon: <Radar />, tier: 'T2', weight: 12 },
    { id: 'e_bomb', name: '尸爆协议', desc: '敌人死后爆炸', icon: <Bomb />, tier: 'T3', weight: 8 },
    { id: 'e_homing', name: '智能制导', desc: '子弹自动追踪', icon: <Move />, tier: 'T3', weight: 5 },
    { id: 'e_thorns', name: '反伤装甲', desc: '触碰反弹伤害', icon: <AlertTriangle />, tier: 'T2', weight: 15 },
    { id: 'e_exec', name: '斩杀程序', desc: '对低血量造成3倍伤害', icon: <Skull />, tier: 'T3', weight: 8 },
    { id: 'e_dodge', name: '相位闪避', desc: '闪避率 +10%', icon: <Ghost />, tier: 'T2', weight: 12 },
    { id: 'e_leech', name: '能量汲取', desc: '击杀小概率回血', icon: <TrendingUp />, tier: 'T3', weight: 5 },

    // Cursed (T4) - Very Rare, High Risk
    { id: 'c_glass', name: '玻璃大炮', desc: '伤害翻倍，HP减半', icon: <VenetianMask />, tier: 'CURSE', weight: 2 },
    { id: 'c_wild', name: '狂暴射击', desc: '攻速极大提升，精度归零', icon: <Flame />, tier: 'CURSE', weight: 2 },
    { id: 'c_heavy', name: '重型弹药', desc: '伤害大幅提升，移速大幅降低', icon: <Anchor />, tier: 'CURSE', weight: 2 },
    { id: 'c_blood', name: '鲜血渴望', desc: '强力吸血，每秒流失生命', icon: <Biohazard />, tier: 'CURSE', weight: 2 },
];

const FULL_UPGRADE_LIST = [...generateStatUpgrades(), ...SPECIAL_UPGRADES];

// --- Styling ---
const TIER_STYLES = {
    'T1': { text: 'text-cyan-400', border: 'border-cyan-500/50', shadow: 'shadow-cyan-500/20', bg: 'bg-slate-900/90' },
    'T2': { text: 'text-purple-400', border: 'border-purple-500/50', shadow: 'shadow-purple-500/20', bg: 'bg-slate-900/90' },
    'T3': { text: 'text-amber-400', border: 'border-amber-500/50', shadow: 'shadow-amber-500/20', bg: 'bg-yellow-950/80' },
    'CURSE': { text: 'text-red-500', border: 'border-red-600/50', shadow: 'shadow-red-600/20', bg: 'bg-red-950/80' },
};

export const UpgradeModal: React.FC = () => {
    const options = React.useMemo(() => {
        // Weighted Random Selection
        const opts: UpgradeDefinition[] = [];
        const pool = [...FULL_UPGRADE_LIST];
        
        while (opts.length < 3 && pool.length > 0) {
            const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
            let r = Math.random() * totalWeight;
            for (let i = 0; i < pool.length; i++) {
                r -= pool[i].weight;
                if (r <= 0) {
                    opts.push(pool[i]);
                    pool.splice(i, 1); // Remove to avoid duplicates
                    break;
                }
            }
        }
        return opts;
    }, []);

    const handleSelect = (id: string) => {
        gameEvents.emit(EVENTS.APPLY_UPGRADE, id);
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 animate-in fade-in duration-300">
            <div className="flex flex-col w-full h-full md:h-auto md:max-w-6xl px-4 py-8 md:py-12 overflow-y-auto">
                
                {/* Header */}
                <div className="text-center mb-8 md:mb-12 shrink-0">
                    <h2 className="text-4xl md:text-6xl font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 mb-4 tracking-widest uppercase drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                        系统重构
                    </h2>
                    <div className="flex items-center justify-center gap-4 text-cyan-500/60">
                        <div className="h-px w-16 bg-current"></div>
                        <p className="font-rajdhani text-xl tracking-[0.3em]">SELECT UPGRADE MODULE</p>
                        <div className="h-px w-16 bg-current"></div>
                    </div>
                </div>
                
                {/* Cards Container */}
                <div className="flex flex-col md:flex-row gap-4 md:gap-8 justify-center items-stretch w-full max-w-md md:max-w-none mx-auto">
                    {options.map((opt, idx) => {
                        const style = TIER_STYLES[opt.tier];
                        return (
                            <button
                                key={opt.id}
                                onClick={() => handleSelect(opt.id)}
                                style={{ animationDelay: `${idx * 100}ms` }}
                                className={`
                                    group relative flex flex-row md:flex-col items-center 
                                    w-full md:w-80 p-4 md:p-8 
                                    rounded-xl border-2 ${style.border} ${style.bg} 
                                    ${style.shadow} shadow-lg backdrop-blur-xl
                                    transition-all duration-300 
                                    hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(0,0,0,0.5)]
                                    active:scale-95 animate-in slide-in-from-bottom-8 fade-in fill-mode-backwards
                                `}
                            >
                                {/* Tier Label (Mobile: Top Right, Desktop: Top Center) */}
                                <div className={`
                                    absolute top-2 right-2 md:top-4 md:right-auto md:left-1/2 md:-translate-x-1/2
                                    px-3 py-0.5 rounded-full text-xs font-orbitron font-bold border border-current
                                    bg-black/50 backdrop-blur ${style.text}
                                `}>
                                    {opt.tier === 'CURSE' ? 'ANOMALY' : `TIER ${opt.tier.substring(1)}`}
                                </div>

                                {/* Icon Container */}
                                <div className={`
                                    relative shrink-0 w-16 h-16 md:w-24 md:h-24 rounded-lg md:rounded-2xl 
                                    flex items-center justify-center 
                                    bg-gradient-to-br from-white/10 to-transparent 
                                    border border-white/10 mb-0 md:mb-6 mr-4 md:mr-0
                                    group-hover:scale-110 transition-transform duration-300
                                `}>
                                    <div className={`${style.text} drop-shadow-[0_0_10px_currentColor] transform scale-150`}>
                                        {opt.icon}
                                    </div>
                                </div>

                                {/* Text Content */}
                                <div className="flex flex-col flex-1 text-left md:text-center">
                                    <h3 className={`text-xl md:text-2xl font-bold font-orbitron mb-1 md:mb-3 ${style.text}`}>
                                        {opt.name}
                                    </h3>
                                    <p className="text-gray-300 font-rajdhani text-sm md:text-lg leading-tight md:leading-normal">
                                        {opt.desc}
                                    </p>
                                </div>

                                {/* Selection Indicator */}
                                <div className={`
                                    absolute inset-0 rounded-xl border-2 border-transparent 
                                    group-hover:border-current opacity-0 group-hover:opacity-50 
                                    transition-all duration-300 pointer-events-none ${style.text}
                                `}></div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};