import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, Player } from './game/GameEngine';
import { ClassType, GameState, Item } from './game/types';
import { getSpriteDataURL } from './game/sprites';
import { motion } from 'framer-motion';
import { Sword, Shield, Heart, Zap, Star, Package, X, ArrowUpCircle } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [replacingSkill, setReplacingSkill] = useState<Item | null>(null);
  const [invFilter, setInvFilter] = useState<'all' | 'equipment' | 'consumable' | 'skill'>('all');

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'i' && (gameState === 'PLAY' || gameState === 'INV')) {
        setGameState(prev => prev === 'PLAY' ? 'INV' : 'PLAY');
      }
      if (e.key === 'Escape' && gameState === 'INV') {
        setGameState('PLAY');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  useEffect(() => {
    if (engine) {
      engine.paused = gameState === 'INV' || gameState === 'LEVELUP';
    }
  }, [gameState, engine]);

  const startGame = (classType: ClassType) => {
    if (engine) engine.stop();
    if (canvasRef.current) {
      const newEngine = new GameEngine(
        canvasRef.current,
        (state) => setGameState(state),
        (p) => setPlayerData(Object.assign(Object.create(Object.getPrototypeOf(p)), p)) // clone for react state
      );
      setEngine(newEngine);
      setGameState('PLAY');
      newEngine.start(classType);
      setPlayerData(newEngine.player);
    }
  };

  const resumeGame = () => {
    if (engine) {
      setGameState('PLAY');
      engine.input.keys = {}; // clear stuck keys
    }
  };

  const handleEquip = (item: Item) => {
    if (!engine) return;
    if (item.type === 'consumable') {
      engine.player.hp = Math.min(engine.player.hpTotal, engine.player.hp + (item.stats.healHp || 0));
      engine.player.mp = Math.min(engine.player.mpTotal, engine.player.mp + (item.stats.healMp || 0));
      engine.player.inventory = engine.player.inventory.filter(i => i.id !== item.id);
    } else if (item.type === 'active_skill') {
      if (item.equipped) {
        // Unequip
        const slot = engine.player.hotbar.findIndex(s => s === item.skillId);
        if (slot !== -1) engine.player.hotbar[slot] = null;
        item.equipped = false;
      } else {
        const emptySlot = engine.player.hotbar.findIndex(s => s === null);
        if (emptySlot !== -1) {
          engine.player.hotbar[emptySlot] = item.skillId!;
          item.equipped = true;
        } else {
          setReplacingSkill(item);
          return;
        }
      }
    } else if (item.type === 'passive_skill') {
      item.equipped = !item.equipped;
      engine.player.recalc();
    } else {
      // unequip same type
      engine.player.inventory.forEach(i => {
        if (i.type === item.type && i.id !== item.id) i.equipped = false;
      });
      item.equipped = !item.equipped;
      engine.player.recalc();
    }
    setPlayerData(Object.assign(Object.create(Object.getPrototypeOf(engine.player)), engine.player));
  };

  const handleReplaceSkill = (slotIndex: number) => {
    if (!engine || !replacingSkill) return;
    
    // Unequip old skill
    const oldSkillId = engine.player.hotbar[slotIndex];
    if (oldSkillId) {
      const oldItem = engine.player.inventory.find(i => i.skillId === oldSkillId);
      if (oldItem) oldItem.equipped = false;
    }
    
    // Equip new skill
    engine.player.hotbar[slotIndex] = replacingSkill.skillId!;
    replacingSkill.equipped = true;
    
    setReplacingSkill(null);
    setPlayerData(Object.assign(Object.create(Object.getPrototypeOf(engine.player)), engine.player));
  };

  const handleLevelUp = (stat: number) => {
    if (!engine) return;
    if (stat === 0) engine.player.atk += 5;
    if (stat === 1) engine.player.def += 3;
    if (stat === 2) { engine.player.maxHp += 20; engine.player.hp += 20; }
    if (stat === 3) { engine.player.maxMp += 15; engine.player.mp += 15; }
    engine.player.pts -= 1;
    engine.player.recalc();
    setPlayerData(Object.assign(Object.create(Object.getPrototypeOf(engine.player)), engine.player));
    if (engine.player.pts <= 0) {
      resumeGame();
    }
  };

  useEffect(() => {
    if (gameState === 'TRANSITION') {
      const timer = setTimeout(() => {
        if (engine) {
          engine.generateFloor();
          engine.onPlayerUpdate(engine.player);
          setGameState('LEVELUP');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState, engine]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-purple-500/30">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ display: gameState === 'MENU' || gameState === 'CLASS' || gameState === 'TRANSITION' ? 'none' : 'block', imageRendering: 'pixelated' }}
      />

      {/* TRANSITION */}
      {gameState === 'TRANSITION' && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            <h1 className="text-6xl md:text-8xl font-light text-white mb-6 tracking-[0.2em] uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              FLOOR CLEARED
            </h1>
            <p className="text-xl text-white/50 font-mono tracking-widest uppercase mb-12">
              Ascending to Floor {engine?.floor}
            </p>
            
            <div className="relative w-32 h-32 mx-auto">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-white/20 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center relative overflow-hidden">
                  {engine && (
                    <motion.img 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      src={getSpriteDataURL(engine.player.classType, 16)} 
                      alt="Player" 
                      className="w-16 h-16 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  )}
                </div>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="mt-16"
            >
              <div className="w-64 h-1 bg-white/10 rounded-full mx-auto overflow-hidden relative">
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-white/50 w-1/2 rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* HUD */}
      {gameState === 'PLAY' && playerData && engine && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl pointer-events-auto w-72">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg text-white uppercase tracking-widest">{playerData.classType}</h2>
                <span className="text-white/50 font-mono text-sm">LVL {playerData.level}</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest mb-1.5"><span className="text-red-400">HP</span><span className="text-white/70">{Math.floor(playerData.hp)}/{playerData.hpTotal}</span></div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-red-500 transition-all duration-200 shadow-[0_0_10px_rgba(239,68,68,0.8)]" style={{width: `${(playerData.hp/playerData.hpTotal)*100}%`}}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest mb-1.5"><span className="text-blue-400">MP</span><span className="text-white/70">{Math.floor(playerData.mp)}/{playerData.mpTotal}</span></div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-200 shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{width: `${(playerData.mp/playerData.mpTotal)*100}%`}}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest mb-1.5"><span className="text-yellow-400">XP</span><span className="text-white/70">{Math.floor(playerData.xp)}/{playerData.xpNext}</span></div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 transition-all duration-200 shadow-[0_0_10px_rgba(234,179,8,0.8)]" style={{width: `${(playerData.xp/playerData.xpNext)*100}%`}}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest mb-1.5"><span className="text-green-400">STAMINA</span></div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-green-500 transition-all duration-200 shadow-[0_0_10px_rgba(34,197,94,0.8)]" style={{width: `${(playerData.stamina/playerData.maxStamina)*100}%`}}></div></div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-white/80 font-mono uppercase tracking-widest">
                <div className="flex items-center gap-2"><Sword size={14} className="text-red-400"/> ATK: {playerData.atkTotal}</div>
                <div className="flex items-center gap-2"><Shield size={14} className="text-blue-400"/> DEF: {playerData.defTotal}</div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest mb-1.5">
                  <span className="text-purple-400">CLASS SKILL</span>
                  <span className="text-white/70">{playerData.skillCd > 0 ? (playerData.skillCd / 60).toFixed(1) + 's' : 'READY'}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 transition-all duration-200 shadow-[0_0_10px_rgba(168,85,247,0.8)]" style={{width: `${playerData.skillCd > 0 ? (playerData.skillCd / playerData.maxSkillCd) * 100 : 100}%`}}></div>
                </div>
              </div>
              
              {playerData.pts > 0 && (
                <div className="mt-5 text-center text-xs font-bold text-yellow-400 tracking-widest uppercase animate-pulse">
                  {playerData.pts} Points Available! (Press I)
                </div>
              )}
            </div>

            <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] text-center">
              <div className="text-white/40 text-[10px] font-mono uppercase tracking-[0.3em] mb-2">Floor</div>
              <div className="text-4xl font-light text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{engine.floor} <span className="text-white/20 text-2xl">/ 100</span></div>
              {engine.floorModifier !== 'none' && (
                <div className="mt-2 text-[10px] font-mono uppercase tracking-widest text-purple-400 animate-pulse">
                  Modifier: {engine.floorModifier}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[0, 1, 2].map(i => {
                const skillId = playerData.hotbar[i];
                const cd = playerData.hotbarCd[i];
                const maxCd = skillId === 'slash' ? 40 : skillId === 'fireball' ? 60 : skillId === 'shadow_bolt' ? 30 : skillId === 'multishot' ? 45 : skillId === 'lightning' ? 80 : skillId === 'heal' ? 120 : skillId === 'dash' ? 30 : skillId === 'meteor' ? 100 : skillId === 'poison_nova' ? 60 : 1;
                return (
                  <div key={i} className="relative w-14 h-14 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <span className="absolute -top-2 -left-2 bg-slate-800 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full border border-white/20 font-mono z-10">{i + 1}</span>
                    {skillId ? (
                      <>
                        <div className="text-white/90 text-[10px] font-bold font-mono uppercase tracking-tighter text-center leading-tight drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                          {skillId.substring(0, 4)}
                        </div>
                        {cd > 0 && (
                          <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center backdrop-blur-[2px]">
                            <span className="text-white font-mono text-xs drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">{(cd / 60).toFixed(1)}s</span>
                          </div>
                        )}
                        {cd > 0 && (
                          <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full rounded-b-xl overflow-hidden">
                            <div className="h-full bg-white/80 shadow-[0_0_5px_rgba(255,255,255,0.8)]" style={{ width: `${(cd / maxCd) * 100}%` }} />
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-white/20 text-[10px] font-mono uppercase">Empty</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center text-white/40 text-[10px] font-mono uppercase tracking-widest bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 py-3 px-6 rounded-full mx-auto shadow-2xl">
              WASD: Move <span className="mx-2 opacity-30">|</span> Left Click: Attack <span className="mx-2 opacity-30">|</span> Right Click: Class Skill <span className="mx-2 opacity-30">|</span> 1-3: Hotbar <span className="mx-2 opacity-30">|</span> I: Inventory
            </div>
          </div>
        </div>
      )}

      {replacingSkill && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full">
            <h2 className="text-2xl font-light text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Equip Skill</h2>
            <p className="text-white/50 text-sm mb-6">Your hotbar is full. Select a slot to replace with <span className="text-yellow-400 font-bold">{replacingSkill.name}</span>.</p>
            
            <div className="space-y-3">
              {[0, 1, 2].map(i => {
                const skillId = playerData?.hotbar[i];
                const skillName = skillId ? skillId.replace('_', ' ').toUpperCase() : 'EMPTY';
                return (
                  <button
                    key={i}
                    onClick={() => handleReplaceSkill(i)}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <span className="bg-white/10 text-white/50 w-8 h-8 flex items-center justify-center rounded-lg font-mono text-sm">{i + 1}</span>
                      <span className="text-white font-mono uppercase tracking-widest text-sm">{skillName}</span>
                    </div>
                    <span className="text-white/30 text-xs uppercase tracking-widest">Replace</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setReplacingSkill(null)}
              className="mt-6 w-full py-3 bg-transparent hover:bg-white/5 border border-white/10 text-white rounded-xl transition-colors uppercase tracking-widest text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MENUS */}
      {gameState === 'MENU' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#050505] overflow-hidden">
          {/* Atmospheric Background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_rgba(76,29,149,0.15)_0%,_transparent_60%)]" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative z-10 text-center flex flex-col items-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="mb-6 flex items-center gap-4 text-purple-400/70 text-xs tracking-[0.4em] font-mono uppercase"
            >
              <div className="w-8 h-[1px] bg-purple-500/30" />
              <span>System Initialization</span>
              <div className="w-8 h-[1px] bg-purple-500/30" />
            </motion.div>

            <h1 className="text-7xl md:text-9xl font-black text-white mb-6 tracking-tighter" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              SHADOW<br/>ASCENSION
            </h1>
            
            <p className="text-slate-400/80 mb-16 max-w-md mx-auto text-base font-light tracking-wide">
              The gates have opened. The world needs a hunter. Will you answer the call?
            </p>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setGameState('CLASS')}
              className="group relative px-12 py-4 bg-white text-black font-bold text-sm tracking-[0.2em] uppercase overflow-hidden rounded-full"
            >
              <span className="relative z-10 flex items-center gap-3">
                ARISE
                <motion.span 
                  animate={{ x: [0, 4, 0] }} 
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </span>
            </motion.button>
          </motion.div>
        </div>
      )}

      {gameState === 'CLASS' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#050505] overflow-y-auto py-12">
          {/* Subtle grid background */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          <div className="max-w-7xl w-full p-8 relative z-10">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block border border-white/10 bg-white/5 px-6 py-2 rounded-full text-white/70 font-mono text-xs tracking-widest uppercase mb-6"
              >
                System Alert: Player Awakening
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>SELECT YOUR CLASS</h2>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              {[
                { id: 'warrior', name: 'Warrior', desc: 'High HP, Melee Arc Attacks. Balanced and sturdy.', color: 'from-blue-500/20 to-transparent', iconColor: 'text-blue-400', borderColor: 'group-hover:border-blue-500/50' },
                { id: 'mage', name: 'Mage', desc: 'High MP, Ranged Magic. Glass cannon with area damage.', color: 'from-purple-500/20 to-transparent', iconColor: 'text-purple-400', borderColor: 'group-hover:border-purple-500/50' },
                { id: 'archer', name: 'Archer', desc: 'Fast movement, Rapid ranged attacks. Hit and run.', color: 'from-emerald-500/20 to-transparent', iconColor: 'text-emerald-400', borderColor: 'group-hover:border-emerald-500/50' },
                { id: 'assassin', name: 'Assassin', desc: 'Very fast, High melee damage. Lethal strikes.', color: 'from-red-500/20 to-transparent', iconColor: 'text-red-400', borderColor: 'group-hover:border-red-500/50' },
                { id: 'necromancer', name: 'Necromancer', desc: 'Master of death. Left click shoots shadow bolts that revive corpses.', color: 'from-slate-500/20 to-transparent', iconColor: 'text-slate-400', borderColor: 'group-hover:border-slate-500/50' },
              ].map((cls, idx) => (
                <motion.button
                  key={cls.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  onClick={() => startGame(cls.id as ClassType)}
                  className={`w-full md:w-[280px] bg-[#0a0a0a] border border-white/10 p-8 text-left transition-all group relative overflow-hidden flex flex-col rounded-2xl ${cls.borderColor}`}
                >
                  {/* Hover Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-b ${cls.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className="flex justify-center mb-8 relative">
                    <img 
                      src={getSpriteDataURL(cls.id, 8)} 
                      alt={cls.name} 
                      className="w-24 h-24 relative z-10 group-hover:scale-110 transition-transform duration-500" 
                      style={{ imageRendering: 'pixelated' }} 
                    />
                  </div>
                  
                  <h3 className={`text-xl font-bold mb-3 uppercase tracking-widest ${cls.iconColor}`}>{cls.name}</h3>
                  <p className="text-white/50 text-sm leading-relaxed flex-grow font-light">{cls.desc}</p>
                  
                  <div className="mt-8 text-xs font-mono text-white/30 group-hover:text-white/70 transition-colors flex items-center justify-between uppercase tracking-widest">
                    <span>Select</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0 duration-300">→</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {gameState === 'INV' && playerData && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8 z-50">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-6">
                <h2 className="text-xl font-medium tracking-widest uppercase flex items-center gap-3 text-white/90">
                  <Package className="text-white/50" size={20}/> Inventory
                </h2>
                <div className="flex gap-2">
                  {['all', 'equipment', 'consumable', 'skill'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setInvFilter(filter as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors ${invFilter === filter ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={resumeGame} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              {playerData.inventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/30 font-light">
                  <Package size={48} className="mb-4 opacity-20" />
                  <p>Inventory is empty.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {playerData.inventory.filter(item => {
                    if (invFilter === 'all') return true;
                    if (invFilter === 'equipment') return ['weapon', 'armor', 'accessory'].includes(item.type);
                    if (invFilter === 'consumable') return item.type === 'consumable';
                    if (invFilter === 'skill') return ['active_skill', 'passive_skill'].includes(item.type);
                    return true;
                  }).map(item => {
                    const colors = {
                      Common: 'border-white/10 text-white/70',
                      Rare: 'border-blue-500/30 text-blue-400',
                      Epic: 'border-purple-500/30 text-purple-400',
                      Legendary: 'border-yellow-500/30 text-yellow-400',
                      Mythic: 'border-red-500/30 text-red-400'
                    };
                    
                    const equippedSameType = playerData.inventory.find(i => i.type === item.type && i.equipped && i.id !== item.id);
                    
                    const getStatDisplay = (statName: 'atk' | 'def' | 'maxHp' | 'maxMp' | 'critChance' | 'lifeSteal', label: string) => {
                      if (!item.stats[statName]) return null;
                      const val = item.stats[statName]!;
                      let isBetter = false;
                      let diff = 0;
                      let isWorse = false;
                      
                      if (!item.equipped && ['weapon', 'armor', 'accessory'].includes(item.type)) {
                        const equippedVal = equippedSameType?.stats[statName] || 0;
                        if (val > equippedVal) {
                          isBetter = true;
                          diff = val - equippedVal;
                        } else if (val < equippedVal) {
                          isWorse = true;
                          diff = equippedVal - val;
                        }
                      }
                      
                      return (
                        <span className={`px-2 py-1 rounded ${isBetter ? 'bg-green-500/20 text-green-400 font-bold' : isWorse ? 'bg-red-500/20 text-red-400' : 'bg-white/5'}`}>
                          {label} +{val}{statName === 'critChance' || statName === 'lifeSteal' ? '%' : ''} {isBetter && `(↑${diff})`} {isWorse && `(↓${diff})`}
                        </span>
                      );
                    };

                    const getElementalDisplay = () => {
                      if (!item.stats.elementalDamage) return null;
                      const { type, amount } = item.stats.elementalDamage;
                      const colors = { fire: 'text-red-400', ice: 'text-blue-400', lightning: 'text-yellow-400', poison: 'text-green-400' };
                      return (
                        <span className={`px-2 py-1 rounded bg-white/5 ${colors[type]}`}>
                          {type.toUpperCase()} +{amount}
                        </span>
                      );
                    };

                    return (
                      <div key={item.id} className={`relative p-5 rounded-xl border bg-white/[0.02] flex flex-col justify-between gap-4 transition-all hover:bg-white/[0.04] ${colors[item.rarity]} ${item.equipped ? 'ring-1 ring-white/50 bg-white/[0.05]' : ''}`}>
                        {item.equipped && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-white/80" />}
                        <div>
                          <div className="text-xs font-mono uppercase tracking-wider opacity-60 mb-1">{item.rarity} {item.type.replace('_', ' ')}</div>
                          <div className="font-medium text-lg leading-tight text-white mb-3">{item.name}</div>
                          <div className="flex flex-wrap gap-2 text-xs font-mono text-white/50">
                            {getStatDisplay('atk', 'ATK')}
                            {getStatDisplay('def', 'DEF')}
                            {getStatDisplay('maxHp', 'HP')}
                            {getStatDisplay('maxMp', 'MP')}
                            {getStatDisplay('critChance', 'CRIT')}
                            {getStatDisplay('lifeSteal', 'LIFESTEAL')}
                            {getElementalDisplay()}
                            {item.stats.healHp && <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">Heal {item.stats.healHp} HP</span>}
                            {item.stats.healMp && <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Heal {item.stats.healMp} MP</span>}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleEquip(item)}
                          className={`w-full py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors ${item.equipped ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-black hover:bg-white/90'}`}
                        >
                          {item.type === 'consumable' ? 'Use' : (item.equipped ? 'Unequip' : 'Equip')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {gameState === 'LEVELUP' && playerData && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0a0a0a] border border-white/10 p-10 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
            <div className="text-center mb-10">
              <ArrowUpCircle className="w-12 h-12 text-yellow-500/80 mx-auto mb-6" strokeWidth={1.5} />
              <h2 className="text-2xl font-light tracking-widest text-white mb-2 uppercase">Level Up</h2>
              <p className="text-white/50 text-sm font-light">Distribute your attribute points.</p>
              <div className="mt-6 inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-1.5 rounded-full">
                <span className="text-yellow-500 font-bold">{playerData.pts}</span>
                <span className="text-yellow-500/70 text-xs uppercase tracking-wider">Points Available</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {[
                { id: 0, name: 'Strength', desc: '+5 Attack Damage', icon: <Sword size={18}/>, color: 'text-orange-400' },
                { id: 1, name: 'Vitality', desc: '+3 Defense', icon: <Shield size={18}/>, color: 'text-cyan-400' },
                { id: 2, name: 'Endurance', desc: '+20 Max HP', icon: <Heart size={18}/>, color: 'text-red-400' },
                { id: 3, name: 'Intelligence', desc: '+15 Max MP', icon: <Zap size={18}/>, color: 'text-blue-400' },
              ].map(stat => (
                <button
                  key={stat.id}
                  onClick={() => handleLevelUp(stat.id)}
                  className="w-full flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] hover:border-white/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 bg-white/5 rounded-lg ${stat.color} group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                    <div className="text-left">
                      <div className="font-medium text-white/90 tracking-wide">{stat.name}</div>
                      <div className="text-xs text-white/40 font-light">{stat.desc}</div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/50 group-hover:bg-white group-hover:text-black group-hover:border-white transition-all">+</div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {gameState === 'DIALOG' && engine && engine.interactingHunter && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
          <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-2xl max-w-md w-full text-center shadow-2xl">
            <h2 className="text-2xl font-light tracking-widest text-white mb-4 uppercase">Lost Hunter Found</h2>
            <div className="w-12 h-[1px] bg-white/20 mx-auto mb-6" />
            <p className="text-white/60 mb-10 font-light leading-relaxed">A veteran hunter is resting here. They look exhausted but heavily armed. What will you do?</p>
            <div className="flex flex-col gap-3 justify-center">
              <button onClick={() => { engine.resolveHunter('save'); setGameState('PLAY'); }} className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm tracking-widest uppercase transition-colors">Save (Ally)</button>
              <button onClick={() => { engine.resolveHunter('kill'); setGameState('PLAY'); }} className="px-6 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm tracking-widest uppercase transition-colors">Kill (Boss Fight)</button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/95 backdrop-blur-xl z-50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(239,68,68,0.15)_0%,_transparent_60%)]" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center relative z-10"
          >
            <h2 className="text-7xl md:text-9xl font-black text-red-600 mb-6 tracking-[0.3em] uppercase drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>YOU DIED</h2>
            <div className="w-24 h-[1px] bg-red-500/50 mx-auto mb-8" />
            <p className="text-xl text-white/70 mb-12 font-mono uppercase tracking-[0.3em]">Floor Reached: <span className="text-red-400 font-bold">{engine?.floor}</span></p>
            <button 
              onClick={() => {
                if (engine) engine.stop();
                setGameState('MENU');
              }}
              className="px-12 py-5 bg-transparent border border-red-500/50 hover:bg-red-500/20 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] text-red-400 rounded-full text-sm tracking-[0.3em] uppercase transition-all duration-300"
            >
              Return to Menu
            </button>
          </motion.div>
        </div>
      )}

      {gameState === 'WIN' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="text-center">
            <h2 className="text-6xl md:text-8xl font-light text-yellow-500 mb-6 tracking-[0.2em] uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>VICTORY</h2>
            <p className="text-lg text-white/60 mb-12 font-light max-w-md mx-auto leading-relaxed">You conquered the 100th floor and became the Shadow Monarch.</p>
            <button 
              onClick={() => {
                if (engine) engine.stop();
                setGameState('MENU');
              }}
              className="px-10 py-4 bg-white text-black hover:bg-white/90 rounded-full text-sm tracking-[0.2em] uppercase transition-colors font-bold"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

