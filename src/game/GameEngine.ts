import { ClassType, GameState, Item, MobTier } from './types';
import { getSprite } from './sprites';

export class InputManager {
  keys: Record<string, boolean> = {};
  mouse = { x: 0, y: 0, left: false, right: false };

  constructor() {
    window.addEventListener('keydown', (e) => (this.keys[e.key.toLowerCase()] = true));
    window.addEventListener('keyup', (e) => (this.keys[e.key.toLowerCase()] = false));
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.left = true;
      if (e.button === 2) this.mouse.right = true;
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.left = false;
      if (e.button === 2) this.mouse.right = false;
    });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }
}

export class Player {
  x: number; y: number; r: number = 16;
  hp: number; maxHp: number; mp: number; maxMp: number;
  atk: number; def: number; speed: number;
  hpTotal: number; mpTotal: number; atkTotal: number; defTotal: number; baseSpeed: number;
  level: number = 1; xp: number = 0; xpNext: number = 100;
  gold: number = 0; pts: number = 0;
  classType: ClassType;
  inventory: Item[] = [];
  hotbar: (string | null)[] = [null, null, null];
  hotbarCd: number[] = [0, 0, 0];
  shadows: Shadow[] = [];
  maxShadows: number = 3;
  atkCd: number = 0;
  skillCd: number = 0;
  facingLeft: boolean = false;
  passives: Set<string> = new Set();
  
  isInvisible: boolean = false;
  invisibleTimer: number = 0;
  isChanneling: boolean = false;
  channelTimer: number = 0;
  channelAngle: number = 0;

  constructor(x: number, y: number, classType: ClassType) {
    this.x = x; this.y = y; this.classType = classType;
    if (classType === 'warrior') { this.maxHp = 150; this.maxMp = 30; this.atk = 15; this.def = 10; this.baseSpeed = 3; }
    else if (classType === 'mage') { this.maxHp = 80; this.maxMp = 100; this.atk = 25; this.def = 4; this.baseSpeed = 3; }
    else if (classType === 'archer') { this.maxHp = 100; this.maxMp = 50; this.atk = 20; this.def = 6; this.baseSpeed = 4; }
    else if (classType === 'assassin') { this.maxHp = 90; this.maxMp = 40; this.atk = 30; this.def = 5; this.baseSpeed = 4.5; }
    else { this.maxHp = 100; this.maxMp = 80; this.atk = 18; this.def = 6; this.baseSpeed = 3.5; } // necromancer
    this.hp = this.maxHp; this.mp = this.maxMp;
    this.hpTotal = this.maxHp; this.mpTotal = this.maxMp; this.atkTotal = this.atk; this.defTotal = this.def; this.speed = this.baseSpeed;
  }

  recalc() {
    this.hpTotal = this.maxHp; this.mpTotal = this.maxMp;
    this.atkTotal = this.atk; this.defTotal = this.def;
    this.passives.clear();
    for (const item of this.inventory) {
      if (item.equipped) {
        if (item.stats.maxHp) this.hpTotal += item.stats.maxHp;
        if (item.stats.maxMp) this.mpTotal += item.stats.maxMp;
        if (item.stats.atk) this.atkTotal += item.stats.atk;
        if (item.stats.def) this.defTotal += item.stats.def;
        if (item.type === 'passive_skill' && item.skillId) this.passives.add(item.skillId);
      }
    }
    this.speed = this.passives.has('speed_boost') ? this.baseSpeed * 1.5 : this.baseSpeed;
  }

  gainXp(amount: number) {
    this.xp += amount;
    let leveled = false;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = Math.floor(this.xpNext * 1.5);
      this.maxHp += 10; this.maxMp += 5; this.atk += 2; this.def += 1;
      leveled = true;
    }
    this.recalc();
    if (leveled) { this.hp = this.hpTotal; this.mp = this.mpTotal; }
  }

  update(input: InputManager, engine: GameEngine) {
    let dx = 0, dy = 0;
    if (input.keys['w']) dy -= 1;
    if (input.keys['s']) dy += 1;
    if (input.keys['a']) dx -= 1;
    if (input.keys['d']) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      const nx = this.x + (dx / len) * this.speed;
      const ny = this.y + (dy / len) * this.speed;
      if (!engine.isWall(nx, this.y)) this.x = nx;
      if (!engine.isWall(this.x, ny)) this.y = ny;
      if (dx < 0) this.facingLeft = true;
      if (dx > 0) this.facingLeft = false;
    }

    if (this.atkCd > 0) this.atkCd--;
    if (this.skillCd > 0) this.skillCd--;
    if (this.mp < this.mpTotal && engine.ticks % 10 === 0) this.mp++;

    // Passives
    if (this.passives.has('orbiting_shields')) {
      const time = Date.now() / 500;
      for (let i = 0; i < 3; i++) {
        const angle = time + (i * Math.PI * 2) / 3;
        const sx = this.x + Math.cos(angle) * 40;
        const sy = this.y + Math.sin(angle) * 40;
        for (const m of engine.monsters) {
          if (Math.hypot(m.x - sx, m.y - sy) < m.r + 10 && m.cd <= 0) {
            m.takeDamage(this.atkTotal * 0.5);
            engine.floatingTexts.push(new FloatingText(m.x, m.y, `-${Math.floor(this.atkTotal * 0.5)}`, '#eab308'));
            m.cd = 20;
          }
        }
      }
    }
    if (this.passives.has('aoe_aura') && engine.ticks % 60 === 0) {
      engine.particles.push(new Particle(this.x, this.y, 'ring', 0, 100, 0, '#ef4444'));
      for (const m of engine.monsters) {
        if (Math.hypot(m.x - this.x, m.y - this.y) < 100 + m.r) {
          m.takeDamage(this.atkTotal * 0.2);
          engine.floatingTexts.push(new FloatingText(m.x, m.y, `-${Math.floor(this.atkTotal * 0.2)}`, '#ef4444'));
        }
      }
    }
    if (this.passives.has('mana_regen') && engine.ticks % 30 === 0) {
      this.mp = Math.min(this.mpTotal, this.mp + 2);
    }

    // Basic Attack (Left Click)
    if (input.mouse.left && this.atkCd <= 0 && !this.isChanneling) {
      const wx = input.mouse.x + engine.camera.x;
      const wy = input.mouse.y + engine.camera.y;
      const angle = Math.atan2(wy - this.y, wx - this.x);
      if (wx < this.x) this.facingLeft = true;
      else this.facingLeft = false;

      if (this.classType === 'warrior') {
        const range = 60;
        engine.particles.push(new Particle(this.x, this.y, 'slash', angle, range, 0.8, '#94a3b8'));
        for (const m of engine.monsters) {
          if (Math.hypot(m.x - this.x, m.y - this.y) < range + m.r) {
            let diff = Math.abs(Math.atan2(m.y - this.y, m.x - this.x) - angle);
            if (diff > Math.PI) diff = 2 * Math.PI - diff;
            if (diff < 0.8) {
              const d = m.takeDamage(this.atkTotal);
              if (this.passives.has('lifesteal')) this.hp = Math.min(this.hpTotal, this.hp + d * 0.2);
              engine.floatingTexts.push(new FloatingText(m.x, m.y, `-${d}`, '#ef4444'));
            }
          }
        }
        this.atkCd = 25;
      } else if (this.classType === 'assassin') {
        const range = 40;
        engine.particles.push(new Particle(this.x, this.y, 'slash', angle, range, 0.8, '#ef4444'));
        for (const m of engine.monsters) {
          if (Math.hypot(m.x - this.x, m.y - this.y) < range + m.r) {
            let diff = Math.abs(Math.atan2(m.y - this.y, m.x - this.x) - angle);
            if (diff > Math.PI) diff = 2 * Math.PI - diff;
            if (diff < 1.0) {
              const dmg = this.isInvisible ? this.atkTotal * 2 : this.atkTotal;
              const d = m.takeDamage(dmg);
              if (this.passives.has('lifesteal')) this.hp = Math.min(this.hpTotal, this.hp + d * 0.2);
              engine.floatingTexts.push(new FloatingText(m.x, m.y, `-${d}`, '#ef4444'));
            }
          }
        }
        if (this.isInvisible) {
          this.isInvisible = false;
          engine.particles.push(new Particle(this.x, this.y, 'ring', 0, 30, 0, '#ef4444'));
        }
        this.atkCd = 20;
      } else if (this.classType === 'mage') {
        engine.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 12, this.atkTotal, 'player', '#3b82f6', 4, 'normal'));
        engine.particles.push(new Particle(this.x + Math.cos(angle)*20, this.y + Math.sin(angle)*20, 'spark', angle, 10, 0.8, '#3b82f6'));
        this.atkCd = 20;
      } else if (this.classType === 'archer') {
        engine.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 16, this.atkTotal, 'player', '#22c55e', 3, 'normal'));
        engine.particles.push(new Particle(this.x + Math.cos(angle)*20, this.y + Math.sin(angle)*20, 'spark', angle, 10, 0.8, '#22c55e'));
        this.atkCd = 15;
      } else if (this.classType === 'necromancer') {
        engine.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 10, this.atkTotal, 'player', '#a855f7', 6, 'normal'));
        engine.particles.push(new Particle(this.x + Math.cos(angle)*20, this.y + Math.sin(angle)*20, 'spark', angle, 10, 0.8, '#a855f7'));
        this.atkCd = 25;
      }
    }

    // Channeling Logic
    if (this.isChanneling) {
      this.channelTimer--;
      if (this.channelTimer <= 0 || !input.mouse.right) {
        this.isChanneling = false;
      } else {
        const wx = input.mouse.x + engine.camera.x;
        const wy = input.mouse.y + engine.camera.y;
        this.channelAngle = Math.atan2(wy - this.y, wx - this.x);
        if (wx < this.x) this.facingLeft = true;
        else this.facingLeft = false;

        // Laser damage
        if (engine.ticks % 5 === 0) {
          const range = 300;
          engine.particles.push(new Particle(this.x + Math.cos(this.channelAngle) * range / 2, this.y + Math.sin(this.channelAngle) * range / 2, 'laser', this.channelAngle, range, 0.2, '#3b82f6'));
          for (const m of engine.monsters) {
            const dist = Math.hypot(m.x - this.x, m.y - this.y);
            if (dist < range) {
              let diff = Math.abs(Math.atan2(m.y - this.y, m.x - this.x) - this.channelAngle);
              if (diff > Math.PI) diff = 2 * Math.PI - diff;
              if (diff < 0.2) {
                const d = m.takeDamage(this.atkTotal * 0.5);
                engine.floatingTexts.push(new FloatingText(m.x, m.y, `-${d}`, '#3b82f6'));
              }
            }
          }
        }
      }
    }

    // Invisibility Logic
    if (this.isInvisible) {
      this.invisibleTimer--;
      if (this.invisibleTimer <= 0) {
        this.isInvisible = false;
        engine.particles.push(new Particle(this.x, this.y, 'ring', 0, 30, 0, '#ef4444'));
      }
    }

    // Active Skill (Right Click)
    if (input.mouse.right && this.skillCd <= 0 && !this.isChanneling) {
      const wx = input.mouse.x + engine.camera.x;
      const wy = input.mouse.y + engine.camera.y;
      const angle = Math.atan2(wy - this.y, wx - this.x);
      if (wx < this.x) this.facingLeft = true;
      else this.facingLeft = false;

      if (this.classType === 'warrior') {
        if (this.mp >= 15) {
          this.mp -= 15;
          // Dash forward
          let dx = Math.cos(angle); let dy = Math.sin(angle);
          let newX = this.x; let newY = this.y;
          for (let i = 0; i < 100; i += 5) {
            if (!engine.isWall(newX + dx * 5, newY + dy * 5)) { newX += dx * 5; newY += dy * 5; } else break;
          }
          this.x = newX; this.y = newY;
          // Spin AoE
          engine.particles.push(new Particle(this.x, this.y, 'slash', angle, 80, 0.8, '#94a3b8'));
          engine.particles.push(new Particle(this.x, this.y, 'slash', angle + Math.PI, 80, 0.8, '#94a3b8'));
          engine.particles.push(new Particle(this.x, this.y, 'ring', 0, 80, 0, '#94a3b8'));
          for (const m of engine.monsters) {
            if (Math.hypot(m.x - this.x, m.y - this.y) < 80 + m.r) {
              const d = m.takeDamage(this.atkTotal * 2);
              engine.floatingTexts.push(new FloatingText(m.x, m.y, `-${d}`, '#ef4444'));
            }
          }
          this.skillCd = 300; // 5s (60 ticks/s)
        }
      } else if (this.classType === 'mage') {
        if (this.mp >= 30) {
          this.mp -= 30;
          this.isChanneling = true;
          this.channelTimer = 120; // 2 seconds
          this.channelAngle = angle;
          this.skillCd = 1200; // 20s
        }
      } else if (this.classType === 'archer') {
        if (this.mp >= 20) {
          this.mp -= 20;
          // Dash backward
          let dx = -Math.cos(angle); let dy = -Math.sin(angle);
          let newX = this.x; let newY = this.y;
          for (let i = 0; i < 100; i += 5) {
            if (!engine.isWall(newX + dx * 5, newY + dy * 5)) { newX += dx * 5; newY += dy * 5; } else break;
          }
          this.x = newX; this.y = newY;
          // Shoot 5 arrows
          for (let i = -2; i <= 2; i++) {
            const a = angle + i * 0.15;
            engine.projectiles.push(new Projectile(this.x, this.y, Math.cos(a), Math.sin(a), 18, this.atkTotal * 1.5, 'player', '#22c55e', 4, 'normal'));
          }
          this.skillCd = 600; // 10s
        }
      } else if (this.classType === 'assassin') {
        if (this.mp >= 20) {
          this.mp -= 20;
          this.isInvisible = true;
          this.invisibleTimer = 300; // 5s
          engine.particles.push(new Particle(this.x, this.y, 'ring', 0, 30, 0, '#000000'));
          this.skillCd = 600; // 10s
        }
      } else if (this.classType === 'necromancer') {
        if (this.mp >= 20) {
          // Find corpse near mouse
          let targetCorpse = null;
          let minDist = 50;
          for (let i = 0; i < engine.corpses.length; i++) {
            const c = engine.corpses[i];
            const d = Math.hypot(c.x - wx, c.y - wy);
            if (d < minDist) { minDist = d; targetCorpse = i; }
          }
          if (targetCorpse !== null && this.shadows.length < this.maxShadows) {
            this.mp -= 20;
            const c = engine.corpses[targetCorpse];
            engine.corpses.splice(targetCorpse, 1);
            this.shadows.push(new Shadow(c.x, c.y, this.level, this.hpTotal * 0.5, this.atkTotal * 0.8, this.defTotal * 0.5, this));
            engine.particles.push(new Particle(c.x, c.y, 'ring', 0, 40, 0, '#a855f7'));
            this.skillCd = 600; // 10s
          }
        }
      }
    }

    // Hotbar Skills (1, 2, 3)
    for (let i = 0; i < 3; i++) {
      if (this.hotbarCd[i] > 0) this.hotbarCd[i]--;
      if (input.keys[(i + 1).toString()] && this.hotbarCd[i] <= 0 && this.hotbar[i]) {
        const skill = this.hotbar[i];
        const wx = input.mouse.x + engine.camera.x;
        const wy = input.mouse.y + engine.camera.y;
        const angle = Math.atan2(wy - this.y, wx - this.x);
        
        if (skill === 'slash') {
          const range = 70;
          engine.particles.push(new Particle(this.x, this.y, 'slash', angle, range, 0.8, '#3b82f6'));
          for (const m of engine.monsters) {
            if (Math.hypot(m.x - this.x, m.y - this.y) < range + m.r) {
              let diff = Math.abs(Math.atan2(m.y - this.y, m.x - this.x) - angle);
              if (diff > Math.PI) diff = 2 * Math.PI - diff;
              if (diff < 1.0) {
                const d = m.takeDamage(this.atkTotal * 1.5);
                if (this.passives.has('lifesteal')) this.hp = Math.min(this.hpTotal, this.hp + d * 0.2);
                engine.floatingTexts.push(new FloatingText(m.x, m.y, `-${d}`, '#ef4444'));
              }
            }
          }
          this.hotbarCd[i] = 40;
        } else if (skill === 'fireball') {
          if (this.mp >= 10) {
            this.mp -= 10;
            engine.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 8, this.atkTotal * 2, 'player', '#ef4444', 10, 'fireball'));
            this.hotbarCd[i] = 60;
          }
        } else if (skill === 'shadow_bolt') {
          if (this.mp >= 5) {
            this.mp -= 5;
            engine.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 10, this.atkTotal * 1.5, 'player', '#a855f7', 8, 'shadow_bolt'));
            this.hotbarCd[i] = 30;
          }
        } else if (skill === 'multishot') {
          if (this.mp >= 8) {
            this.mp -= 8;
            for (let j = -2; j <= 2; j++) {
              const a = angle + j * 0.15;
              engine.projectiles.push(new Projectile(this.x, this.y, Math.cos(a), Math.sin(a), 14, this.atkTotal * 0.8, 'player', '#22c55e', 4, 'normal'));
            }
            this.hotbarCd[i] = 45;
          }
        } else if (skill === 'lightning') {
          if (this.mp >= 15) {
            this.mp -= 15;
            engine.particles.push(new Particle(wx, wy, 'ring', 0, 80, 0, '#eab308'));
            for (const m of engine.monsters) {
              if (Math.hypot(m.x - wx, m.y - wy) < 80 + m.r) {
                const d = m.takeDamage(this.atkTotal * 2.5);
                if (this.passives.has('lifesteal')) this.hp = Math.min(this.hpTotal, this.hp + d * 0.2);
                engine.floatingTexts.push(new FloatingText(m.x, m.y, `-${d}`, '#eab308'));
              }
            }
            this.hotbarCd[i] = 80;
          }
        } else if (skill === 'heal') {
          if (this.mp >= 20) {
            this.mp -= 20;
            const heal = this.maxHp * 0.4;
            this.hp = Math.min(this.maxHp, this.hp + heal);
            engine.floatingTexts.push(new FloatingText(this.x, this.y, `+${Math.floor(heal)}`, '#22c55e'));
            engine.particles.push(new Particle(this.x, this.y, 'ring', 0, 40, 0, '#22c55e'));
            this.hotbarCd[i] = 120;
          }
        } else if (skill === 'dash') {
          if (this.mp >= 5) {
            this.mp -= 5;
            let dx = Math.cos(angle);
            let dy = Math.sin(angle);
            let dist = 120;
            let newX = this.x;
            let newY = this.y;
            for (let j = 0; j < dist; j += 5) {
              if (!engine.isWall(newX + dx * 5, newY + dy * 5)) {
                newX += dx * 5;
                newY += dy * 5;
              } else {
                break;
              }
            }
            this.x = newX;
            this.y = newY;
            engine.particles.push(new Particle(this.x, this.y, 'ring', 0, 20, 0, '#ffffff'));
            this.hotbarCd[i] = 30;
          }
        } else if (skill === 'meteor') {
          if (this.mp >= 30) {
            this.mp -= 30;
            engine.particles.push(new Particle(wx, wy, 'ring', 0, 120, 0, '#ef4444'));
            for (const m of engine.monsters) {
              if (Math.hypot(m.x - wx, m.y - wy) < 120 + m.r) {
                const d = m.takeDamage(this.atkTotal * 4);
                engine.floatingTexts.push(new FloatingText(m.x, m.y, `-${d}`, '#ef4444'));
              }
            }
            this.hotbarCd[i] = 100;
          }
        } else if (skill === 'poison_nova') {
          if (this.mp >= 15) {
            this.mp -= 15;
            for (let j = 0; j < 8; j++) {
              const a = (j * Math.PI * 2) / 8;
              engine.projectiles.push(new Projectile(this.x, this.y, Math.cos(a), Math.sin(a), 6, this.atkTotal * 1.2, 'player', '#22c55e', 6, 'normal'));
            }
            this.hotbarCd[i] = 60;
          }
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number, mouseX: number, mouseY: number) {
    if (this.isInvisible) ctx.globalAlpha = 0.3;
    ctx.save();
    ctx.translate(this.x - cx, this.y - cy);
    if (this.facingLeft) ctx.scale(-1, 1);
    const sprite = getSprite(this.classType, 4);
    ctx.drawImage(sprite, -16, -16, 32, 32);
    ctx.restore();

    // Draw weapon pointing at mouse
    const wx = mouseX + cx;
    const wy = mouseY + cy;
    const angle = this.isChanneling ? this.channelAngle : Math.atan2(wy - this.y, wx - this.x);
    ctx.save();
    ctx.translate(this.x - cx, this.y - cy);
    ctx.rotate(angle);
    let weaponSpriteName = this.classType + 'Weapon';
    if (this.classType === 'necromancer') weaponSpriteName = 'necromancerWeapon';
    const weaponSprite = getSprite(weaponSpriteName, 4);
    ctx.drawImage(weaponSprite, 10, -16, 32, 32);
    ctx.restore();

    if (this.isInvisible) ctx.globalAlpha = 1.0;

    if (this.passives.has('orbiting_shields')) {
      const time = Date.now() / 500;
      for (let i = 0; i < 3; i++) {
        const a = time + (i * Math.PI * 2) / 3;
        const sx = this.x - cx + Math.cos(a) * 40;
        const sy = this.y - cy + Math.sin(a) * 40;
        ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#eab308'; ctx.fill();
      }
    }
    if (this.passives.has('aoe_aura')) {
      ctx.beginPath(); ctx.arc(this.x - cx, this.y - cy, 100, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)'; ctx.lineWidth = 2; ctx.stroke();
    }
  }
}

export class Monster {
  x: number; y: number; r: number;
  hp: number; maxHp: number; atk: number; def: number; speed: number;
  level: number; xp: number; gold: number;
  cd: number = 0; abilityCd: number = 0; sprite: string; tier: MobTier;
  isInvisible: boolean = false; invisibilityTimer: number = 0;

  constructor(x: number, y: number, level: number, tier: MobTier, player: Player, theme: string) {
    this.x = x; this.y = y; this.level = level; this.tier = tier;
    
    if (tier === 'low') {
      this.maxHp = this.hp = 80 + level * 15; this.atk = 15 + level * 3;
    } else if (tier === 'med') {
      this.maxHp = this.hp = 120 + level * 20; this.atk = 40 + level * 4;
    } else if (tier === 'high') {
      this.maxHp = this.hp = player.hpTotal * 2.5; this.atk = player.atkTotal * 2.5;
    } else if (tier === 'boss') {
      this.maxHp = this.hp = player.hpTotal * 5; this.atk = player.atkTotal * 5;
    } else { // hunter
      this.maxHp = this.hp = player.hpTotal * 3.5; this.atk = player.atkTotal * 3.5;
    }

    if (tier === 'boss') {
      this.sprite = 'boss'; this.r = 40;
    } else if (tier === 'hunter') {
      this.sprite = 'hunter'; this.r = 24;
    } else {
      const themeSprites: Record<string, string[]> = {
        forest: ['slime', 'spider', 'goblin', 'orc', 'dog'],
        cave: ['bat', 'skeleton', 'zombie', 'golem'],
        snow: ['slime', 'skeleton', 'vampire'],
        temple: ['knight', 'assassin_mob', 'vampire'],
        volcano: ['demon', 'dragon', 'golem']
      };
      const sprites = themeSprites[theme] || themeSprites.cave;
      this.sprite = sprites[Math.floor(Math.random() * sprites.length)];
      this.r = tier === 'low' ? 16 : tier === 'med' ? 20 : 28;
    }

    this.def = Math.floor(this.atk / 2);
    this.speed = 2.5 + level * 0.1;
    this.xp = this.maxHp; this.gold = this.maxHp / 5;
  }

  takeDamage(d: number) {
    const real = Math.max(1, Math.floor(d - this.def / 2));
    this.hp -= real;
    return real;
  }

  update(engine: GameEngine) {
    if (this.cd > 0) this.cd--;
    if (this.invisibilityTimer > 0) {
      this.invisibilityTimer--;
      if (this.invisibilityTimer <= 0) {
        this.isInvisible = false;
        engine.particles.push(new Particle(this.x, this.y, 'ring', 0, 30, 0, '#8b5cf6'));
      }
    }
    let target: {x: number, y: number} | null = engine.player;
    let minDist = Math.hypot(engine.player.x - this.x, engine.player.y - this.y);
    
    // If player is invisible, enemies can't see them
    if (engine.player.isInvisible) {
      target = null;
      minDist = Infinity;
    }

    for (const s of engine.player.shadows) {
      const d = Math.hypot(s.x - this.x, s.y - this.y);
      if (d < minDist) { minDist = d; target = s; }
    }
    for (const a of engine.allies) {
      const d = Math.hypot(a.x - this.x, a.y - this.y);
      if (d < minDist) { minDist = d; target = a; }
    }

    if (target && minDist < 500) {
      if (this.abilityCd > 0) this.abilityCd--;

      let dx = ((target.x - this.x) / minDist) * this.speed;
      let dy = ((target.y - this.y) / minDist) * this.speed;

      // Separation behavior: avoid clumping with other monsters
      let sepX = 0;
      let sepY = 0;
      let neighbors = 0;
      for (const m of engine.monsters) {
        if (m === this) continue;
        const distToM = Math.hypot(m.x - this.x, m.y - this.y);
        if (distToM < this.r * 2.5) {
          sepX += (this.x - m.x);
          sepY += (this.y - m.y);
          neighbors++;
        }
      }
      if (neighbors > 0) {
        dx += (sepX / neighbors) * 0.1;
        dy += (sepY / neighbors) * 0.1;
      }

      // High tier/boss dash behavior occasionally
      if ((this.tier === 'high' || this.tier === 'boss' || this.tier === 'hunter') && minDist > 50 && minDist < 200 && Math.random() < 0.02) {
        dx *= 3;
        dy *= 3;
        engine.particles.push(new Particle(this.x, this.y, 'ring', 0, 30, 0, '#ef4444'));
      }

      // Ability usage
      if (this.abilityCd <= 0 && minDist < 300) {
        if (this.sprite === 'dragon' || this.sprite === 'demon') {
          const angle = Math.atan2(target.y - this.y, target.x - this.x);
          engine.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 8, this.atk, 'enemy', '#ef4444', 6, 'fireball'));
          this.abilityCd = 120;
        } else if (this.sprite === 'goblin' || this.sprite === 'skeleton') {
          const angle = Math.atan2(target.y - this.y, target.x - this.x);
          engine.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 10, this.atk, 'enemy', '#cbd5e1', 4, 'normal'));
          this.abilityCd = 100;
        } else if (this.sprite === 'assassin_mob' || this.sprite === 'vampire') {
          this.isInvisible = true;
          this.invisibilityTimer = 60;
          engine.particles.push(new Particle(this.x, this.y, 'ring', 0, 30, 0, '#8b5cf6'));
          
          const angle = Math.atan2(target.y - this.y, target.x - this.x);
          const nx = target.x + Math.cos(angle) * 40;
          const ny = target.y + Math.sin(angle) * 40;
          if (!engine.isWall(nx, ny)) {
            this.x = nx;
            this.y = ny;
          }
          this.abilityCd = 150;
        } else if (this.sprite === 'golem' || this.sprite === 'orc') {
          if (minDist < 60) {
            engine.particles.push(new Particle(this.x, this.y, 'ring', 0, 60, 0, '#eab308'));
            if (target === engine.player) engine.player.hp -= this.atk * 1.5;
            else target.hp -= this.atk * 1.5;
            this.abilityCd = 120;
          }
        } else if (this.sprite === 'boss') {
          for (let i = -1; i <= 1; i++) {
            const angle = Math.atan2(target.y - this.y, target.x - this.x) + i * 0.2;
            engine.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 8, this.atk, 'enemy', '#ef4444', 6, 'fireball'));
          }
          dx *= 5; dy *= 5;
          this.abilityCd = 90;
        } else if (this.sprite === 'hunter') {
          const skills = ['multishot', 'fireball', 'heal', 'dash'];
          const skill = skills[Math.floor(Math.random() * skills.length)];
          if (skill === 'multishot') {
            for (let i = -2; i <= 2; i++) {
              const angle = Math.atan2(target.y - this.y, target.x - this.x) + i * 0.15;
              engine.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 12, this.atk, 'enemy', '#cbd5e1', 4, 'normal'));
            }
          } else if (skill === 'fireball') {
            const angle = Math.atan2(target.y - this.y, target.x - this.x);
            engine.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 8, this.atk * 1.5, 'enemy', '#ef4444', 8, 'fireball'));
          } else if (skill === 'heal') {
            this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.2);
            engine.particles.push(new Particle(this.x, this.y, 'ring', 0, 40, 0, '#22c55e'));
            engine.floatingTexts.push(new FloatingText(this.x, this.y, `+${Math.floor(this.maxHp * 0.2)}`, '#22c55e'));
          } else if (skill === 'dash') {
            const angle = Math.atan2(target.y - this.y, target.x - this.x);
            dx = Math.cos(angle) * 20;
            dy = Math.sin(angle) * 20;
            engine.particles.push(new Particle(this.x, this.y, 'ring', 0, 30, 0, '#3b82f6'));
          }
          this.abilityCd = 100;
        }
      }

      if (!engine.isWall(this.x + dx, this.y)) this.x += dx;
      if (!engine.isWall(this.x, this.y + dy)) this.y += dy;

      if (minDist < this.r + 20 && this.cd <= 0) {
        if (target === engine.player) {
          const dmg = Math.max(1, this.atk - Math.floor(engine.player.defTotal / 2));
          engine.player.hp -= dmg;
          engine.floatingTexts.push(new FloatingText(engine.player.x, engine.player.y, `-${dmg}`, '#ef4444'));
          if (engine.player.passives.has('thorns')) {
            const thornDmg = Math.max(1, Math.floor(dmg * 0.5));
            this.takeDamage(thornDmg);
            engine.floatingTexts.push(new FloatingText(this.x, this.y, `-${thornDmg}`, '#eab308'));
          }
        } else if (target instanceof Shadow || target instanceof Ally) {
          const dmg = Math.max(1, this.atk - Math.floor(target.def / 2));
          target.hp -= dmg;
          engine.floatingTexts.push(new FloatingText(target.x, target.y, `-${dmg}`, '#ef4444'));
        }
        this.cd = 50; // slightly faster attack rate
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    if (this.isInvisible) ctx.globalAlpha = 0.2;
    const sprite = getSprite(this.sprite, this.r === 40 ? 8 : 4);
    ctx.drawImage(sprite, this.x - cx - this.r, this.y - cy - this.r, this.r * 2, this.r * 2);
    if (this.isInvisible) ctx.globalAlpha = 1.0;
    
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x - cx - 15, this.y - cy - this.r - 10, 30 * (this.hp / this.maxHp), 4);
  }
}

export class Shadow {
  x: number; y: number; r: number = 16;
  hp: number; maxHp: number; atk: number; def: number; speed: number = 4;
  owner: Player; cd: number = 0; facingLeft: boolean = false;

  constructor(x: number, y: number, level: number, maxHp: number, atk: number, def: number, owner: Player) {
    this.x = x; this.y = y; this.owner = owner;
    this.maxHp = this.hp = maxHp; this.atk = atk; this.def = def;
  }

  update(engine: GameEngine) {
    if (this.cd > 0) this.cd--;
    let target = null; let minDist = Infinity;
    for (const m of engine.monsters) {
      const d = Math.hypot(m.x - this.x, m.y - this.y);
      if (d < minDist) { minDist = d; target = m; }
    }
    if (target && minDist < 300) {
      const dx = ((target.x - this.x) / minDist) * this.speed;
      const dy = ((target.y - this.y) / minDist) * this.speed;
      if (!engine.isWall(this.x + dx, this.y)) this.x += dx;
      if (!engine.isWall(this.x, this.y + dy)) this.y += dy;
      if (dx < 0) this.facingLeft = true; if (dx > 0) this.facingLeft = false;

      if (minDist < this.r + target.r + 10 && this.cd <= 0) {
        const dmg = target.takeDamage(this.atk);
        engine.floatingTexts.push(new FloatingText(target.x, target.y, `-${dmg}`, '#a855f7'));
        this.cd = 30;
      }
    } else {
      const distToPlayer = Math.hypot(this.owner.x - this.x, this.owner.y - this.y);
      if (distToPlayer > 60) {
        const dx = ((this.owner.x - this.x) / distToPlayer) * this.speed;
        const dy = ((this.owner.y - this.y) / distToPlayer) * this.speed;
        if (!engine.isWall(this.x + dx, this.y)) this.x += dx;
        if (!engine.isWall(this.x, this.y + dy)) this.y += dy;
        if (dx < 0) this.facingLeft = true; if (dx > 0) this.facingLeft = false;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.save();
    ctx.translate(this.x - cx, this.y - cy);
    if (this.facingLeft) ctx.scale(-1, 1);
    const sprite = getSprite('shadow', 4);
    ctx.drawImage(sprite, -16, -16, 32, 32);
    ctx.restore();
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(this.x - cx - 15, this.y - cy - 26, 30 * (this.hp / this.maxHp), 4);
  }
}

export class Ally {
  x: number; y: number; r: number = 16;
  hp: number; maxHp: number; atk: number; def: number; speed: number;
  owner: Player; cd: number = 0; facingLeft: boolean = false;

  constructor(x: number, y: number, owner: Player) {
    this.x = x; this.y = y; this.owner = owner;
    this.maxHp = this.hp = owner.hpTotal * 2; this.atk = owner.atkTotal; this.def = owner.defTotal; this.speed = owner.speed;
  }

  update(engine: GameEngine) {
    if (this.cd > 0) this.cd--;
    let target = null; let minDist = Infinity;
    for (const m of engine.monsters) {
      const d = Math.hypot(m.x - this.x, m.y - this.y);
      if (d < minDist) { minDist = d; target = m; }
    }
    if (target && minDist < 400) {
      if (minDist > 100) {
        const dx = ((target.x - this.x) / minDist) * this.speed;
        const dy = ((target.y - this.y) / minDist) * this.speed;
        if (!engine.isWall(this.x + dx, this.y)) this.x += dx;
        if (!engine.isWall(this.x, this.y + dy)) this.y += dy;
        if (dx < 0) this.facingLeft = true; if (dx > 0) this.facingLeft = false;
      }
      if (this.cd <= 0) {
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        engine.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 10, this.atk, 'player', '#3b82f6', 4, 'normal'));
        this.cd = 40;
      }
    } else {
      const distToPlayer = Math.hypot(this.owner.x - this.x, this.owner.y - this.y);
      if (distToPlayer > 80) {
        const dx = ((this.owner.x - this.x) / distToPlayer) * this.speed;
        const dy = ((this.owner.y - this.y) / distToPlayer) * this.speed;
        if (!engine.isWall(this.x + dx, this.y)) this.x += dx;
        if (!engine.isWall(this.x, this.y + dy)) this.y += dy;
        if (dx < 0) this.facingLeft = true; if (dx > 0) this.facingLeft = false;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.save();
    ctx.translate(this.x - cx, this.y - cy);
    if (this.facingLeft) ctx.scale(-1, 1);
    const sprite = getSprite('hunter', 4);
    ctx.drawImage(sprite, -16, -16, 32, 32);
    ctx.restore();
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(this.x - cx - 15, this.y - cy - 26, 30 * (this.hp / this.maxHp), 4);
  }
}

export class Projectile {
  x: number; y: number; dx: number; dy: number; speed: number; damage: number;
  owner: 'player' | 'enemy'; color: string; r: number; alive: boolean = true; type: string;

  constructor(x: number, y: number, dx: number, dy: number, speed: number, damage: number, owner: 'player' | 'enemy', color: string, r: number, type: string = 'normal') {
    this.x = x; this.y = y; this.dx = dx; this.dy = dy; this.speed = speed; this.damage = damage;
    this.owner = owner; this.color = color; this.r = r; this.type = type;
  }

  update(engine: GameEngine) {
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;
    if (engine.isWall(this.x, this.y)) {
      if (this.type === 'fireball') this.explode(engine);
      this.alive = false; return;
    }

    if (this.owner === 'player') {
      for (const m of engine.monsters) {
        if (Math.hypot(m.x - this.x, m.y - this.y) < m.r + this.r) {
          const d = m.takeDamage(this.damage);
          if (engine.player.passives.has('lifesteal')) engine.player.hp = Math.min(engine.player.hpTotal, engine.player.hp + d * 0.2);
          engine.floatingTexts.push(new FloatingText(m.x, m.y, `-${d}`, '#ef4444'));
          if (this.type === 'fireball') this.explode(engine);
          if (this.type !== 'shadow_bolt') this.alive = false;
          break;
        }
      }
      if (this.type === 'shadow_bolt') {
        for (let i = engine.corpses.length - 1; i >= 0; i--) {
          const c = engine.corpses[i];
          if (Math.hypot(c.x - this.x, c.y - this.y) < c.r + this.r) {
            if (engine.player.shadows.length >= engine.player.maxShadows) engine.player.shadows.shift();
            engine.player.shadows.push(new Shadow(c.x, c.y, c.level, c.maxHp, c.atk, c.def, engine.player));
            engine.corpses.splice(i, 1);
            engine.floatingTexts.push(new FloatingText(c.x, c.y, "ARISE!", '#a855f7'));
          }
        }
      }
    } else {
      let hit = false;
      if (Math.hypot(engine.player.x - this.x, engine.player.y - this.y) < engine.player.r + this.r) {
        const d = Math.max(1, this.damage - Math.floor(engine.player.defTotal / 2));
        engine.player.hp -= d;
        engine.floatingTexts.push(new FloatingText(engine.player.x, engine.player.y, `-${d}`, '#ef4444'));
        hit = true;
      }
      if (!hit) {
        for (const a of engine.allies) {
          if (Math.hypot(a.x - this.x, a.y - this.y) < a.r + this.r) {
            const d = Math.max(1, this.damage - Math.floor(a.def / 2));
            a.hp -= d;
            engine.floatingTexts.push(new FloatingText(a.x, a.y, `-${d}`, '#ef4444'));
            hit = true;
            break;
          }
        }
      }
      if (!hit) {
        for (const s of engine.player.shadows) {
          if (Math.hypot(s.x - this.x, s.y - this.y) < s.r + this.r) {
            const d = Math.max(1, this.damage - Math.floor(s.def / 2));
            s.hp -= d;
            engine.floatingTexts.push(new FloatingText(s.x, s.y, `-${d}`, '#ef4444'));
            hit = true;
            break;
          }
        }
      }
      if (hit) {
        if (this.type === 'fireball') this.explode(engine);
        this.alive = false;
      }
    }
  }

  explode(engine: GameEngine) {
    engine.particles.push(new Particle(this.x, this.y, 'ring', 0, 80, 0, '#ef4444'));
    if (this.owner === 'player') {
      for (const m of engine.monsters) {
        if (Math.hypot(m.x - this.x, m.y - this.y) < 80 + m.r) {
          m.takeDamage(this.damage * 0.5);
          engine.floatingTexts.push(new FloatingText(m.x, m.y, `-${Math.floor(this.damage * 0.5)}`, '#ef4444'));
        }
      }
    } else {
      if (Math.hypot(engine.player.x - this.x, engine.player.y - this.y) < 80 + engine.player.r) {
        const d = Math.max(1, Math.floor(this.damage * 0.5) - Math.floor(engine.player.defTotal / 2));
        engine.player.hp -= d;
        engine.floatingTexts.push(new FloatingText(engine.player.x, engine.player.y, `-${d}`, '#ef4444'));
      }
      for (const a of engine.allies) {
        if (Math.hypot(a.x - this.x, a.y - this.y) < 80 + a.r) {
          const d = Math.max(1, Math.floor(this.damage * 0.5) - Math.floor(a.def / 2));
          a.hp -= d;
          engine.floatingTexts.push(new FloatingText(a.x, a.y, `-${d}`, '#ef4444'));
        }
      }
      for (const s of engine.player.shadows) {
        if (Math.hypot(s.x - this.x, s.y - this.y) < 80 + s.r) {
          const d = Math.max(1, Math.floor(this.damage * 0.5) - Math.floor(s.def / 2));
          s.hp -= d;
          engine.floatingTexts.push(new FloatingText(s.x, s.y, `-${d}`, '#ef4444'));
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.beginPath(); ctx.arc(this.x - cx, this.y - cy, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color; ctx.fill();
  }
}

export class Corpse {
  x: number; y: number; r: number = 16; level: number; maxHp: number; atk: number; def: number; life: number = 600;
  constructor(x: number, y: number, level: number, maxHp: number, atk: number, def: number) {
    this.x = x; this.y = y; this.level = level; this.maxHp = maxHp; this.atk = atk; this.def = def;
  }
  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.fillStyle = `rgba(100, 0, 0, ${this.life / 600})`;
    ctx.beginPath(); ctx.arc(this.x - cx, this.y - cy, this.r, 0, Math.PI * 2); ctx.fill();
  }
}

export class Chest {
  x: number; y: number; r: number = 24; opened: boolean = false;
  constructor(x: number, y: number) { this.x = x; this.y = y; }
  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const sprite = getSprite('chest', 4);
    ctx.drawImage(sprite, this.x - cx - 16, this.y - cy - 16, 32, 32);
    if (!this.opened) { ctx.fillStyle = '#eab308'; ctx.fillText("?", this.x - cx - 4, this.y - cy - 20); }
  }
}

export class HunterNPC {
  x: number; y: number; r: number = 16;
  constructor(x: number, y: number) { this.x = x; this.y = y; }
  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const sprite = getSprite('hunter', 4);
    ctx.drawImage(sprite, this.x - cx - 16, this.y - cy - 16, 32, 32);
    ctx.fillStyle = '#3b82f6'; ctx.fillText("!", this.x - cx - 4, this.y - cy - 20);
  }
}

export class Particle {
  x: number; y: number; type: string; angle: number; range: number; life: number = 1; color: string;
  constructor(x: number, y: number, type: string, angle: number, range: number, life: number, color: string) {
    this.x = x; this.y = y; this.type = type; this.angle = angle; this.range = range; this.life = life; this.color = color;
  }
  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.save(); ctx.translate(this.x - cx, this.y - cy);
    if (this.type === 'arc') {
      ctx.rotate(this.angle); ctx.beginPath(); ctx.arc(0, 0, this.range, -0.8, 0.8);
      ctx.strokeStyle = this.color; ctx.lineWidth = 4 * this.life; ctx.stroke();
    } else if (this.type === 'ring') {
      ctx.beginPath(); ctx.arc(0, 0, this.range * (1 - this.life), 0, Math.PI * 2);
      ctx.strokeStyle = this.color; ctx.lineWidth = 2; ctx.stroke();
    } else if (this.type === 'laser') {
      ctx.rotate(this.angle);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.life;
      ctx.fillRect(0, -10, this.range, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, -4, this.range, 8);
      ctx.globalAlpha = 1;
    } else if (this.type === 'slash') {
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(this.range / 2, -this.range / 2, this.range, 0);
      ctx.quadraticCurveTo(this.range / 2, this.range / 2, 0, 0);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.life;
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (this.type === 'spark') {
      ctx.rotate(this.angle);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.life;
      ctx.fillRect(this.range * (1 - this.life), -2, 10 * this.life, 4);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}

export class FloatingText {
  x: number; y: number; text: string; color: string; life: number = 1;
  constructor(x: number, y: number, text: string, color: string) {
    this.x = x; this.y = y; this.text = text; this.color = color;
  }
  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.fillStyle = this.color; ctx.globalAlpha = this.life;
    ctx.font = 'bold 16px monospace'; ctx.fillText(this.text, this.x - cx, this.y - cy - (1 - this.life) * 20);
    ctx.globalAlpha = 1;
  }
}

export class GameEngine {
  canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D;
  input: InputManager; player!: Player;
  monsters: Monster[] = []; projectiles: Projectile[] = [];
  corpses: Corpse[] = []; particles: Particle[] = []; floatingTexts: FloatingText[] = [];
  chests: Chest[] = []; hunters: HunterNPC[] = []; allies: Ally[] = [];
  camera = { x: 0, y: 0 }; floor: number = 1; ticks: number = 0;
  grid: number[][] = []; tileSize = 64; mapSize = 30;
  onStateChange: (state: GameState) => void;
  onPlayerUpdate: (p: Player) => void;
  interactingHunter: HunterNPC | null = null;
  theme: 'cave' | 'temple' | 'forest' | 'snow' | 'volcano' = 'cave';
  stopped: boolean = false;

  constructor(canvas: HTMLCanvasElement, onStateChange: (s: GameState) => void, onPlayerUpdate: (p: Player) => void) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.input = new InputManager();
    this.onStateChange = onStateChange; this.onPlayerUpdate = onPlayerUpdate;
  }

  stop() {
    this.stopped = true;
  }

  start(classType: ClassType) {
    this.floor = 1; this.ticks = 0;
    this.player = new Player(this.mapSize * this.tileSize / 2, this.mapSize * this.tileSize / 2, classType);
    this.allies = [];
    this.generateFloor();
    this.onPlayerUpdate(this.player);
    this.loop();
  }

  generateFloor() {
    this.monsters = []; this.projectiles = []; this.corpses = []; this.chests = []; this.hunters = [];
    this.player.shadows = [];
    
    const themes: ('cave' | 'temple' | 'forest' | 'snow' | 'volcano')[] = ['forest', 'cave', 'snow', 'temple', 'volcano'];
    this.theme = themes[Math.floor((this.floor - 1) / 2) % themes.length];
    
    this.grid = Array(this.mapSize).fill(0).map(() => Array(this.mapSize).fill(1));
    const cx = Math.floor(this.mapSize / 2); const cy = Math.floor(this.mapSize / 2);
    this.grid[cy][cx] = 0;
    let floorTiles = [{x: cx, y: cy}];
    const targetTiles = Math.floor(this.mapSize * this.mapSize * 0.4);
    while (floorTiles.length < targetTiles) {
      const t = floorTiles[Math.floor(Math.random() * floorTiles.length)];
      const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
      const d = dirs[Math.floor(Math.random() * dirs.length)];
      const nx = t.x + d[0]; const ny = t.y + d[1];
      if (nx > 1 && nx < this.mapSize - 2 && ny > 1 && ny < this.mapSize - 2 && this.grid[ny][nx] === 1) {
        this.grid[ny][nx] = 0; floorTiles.push({x: nx, y: ny});
      }
    }

    this.player.x = cx * this.tileSize + this.tileSize / 2;
    this.player.y = cy * this.tileSize + this.tileSize / 2;
    for (const a of this.allies) { a.x = this.player.x; a.y = this.player.y; }

    const isBoss = this.floor % 10 === 0;
    let tier: MobTier = 'low';
    if (isBoss) tier = 'boss';
    else {
      const cycle = this.floor % 10;
      if (cycle >= 1 && cycle <= 3) tier = 'low';
      else if (cycle >= 4 && cycle <= 6) tier = 'med';
      else tier = 'high';
    }

    const numMonsters = isBoss ? 1 : 5 + Math.floor(this.floor * 1.5);
    for (let i = 0; i < numMonsters; i++) {
      const {x, y} = this.getValidPos();
      this.monsters.push(new Monster(x, y, this.floor, tier, this.player, this.theme));
    }

    const numChests = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numChests; i++) {
      const {x, y} = this.getValidPos();
      this.chests.push(new Chest(x, y));
    }

    if (!isBoss && Math.random() < 0.2) {
      const {x, y} = this.getValidPos();
      this.hunters.push(new HunterNPC(x, y));
    }
  }

  getValidPos() {
    while (true) {
      const x = Math.floor(Math.random() * this.mapSize);
      const y = Math.floor(Math.random() * this.mapSize);
      if (this.grid[y][x] === 0 && Math.hypot(x * this.tileSize - this.player.x, y * this.tileSize - this.player.y) > 200) {
        return { x: x * this.tileSize + this.tileSize / 2, y: y * this.tileSize + this.tileSize / 2 };
      }
    }
  }

  isWall(x: number, y: number) {
    const tx = Math.floor(x / this.tileSize);
    const ty = Math.floor(y / this.tileSize);
    if (tx < 0 || tx >= this.mapSize || ty < 0 || ty >= this.mapSize) return true;
    return this.grid[ty][tx] === 1;
  }

  generateItem(level: number): Item {
    const r = Math.random();
    let rarity: Item['rarity'] = 'Common';
    if (r > 0.95) rarity = 'Mythic'; else if (r > 0.8) rarity = 'Legendary'; else if (r > 0.5) rarity = 'Epic'; else if (r > 0.2) rarity = 'Rare';
    const mult = { 'Common': 1, 'Rare': 2, 'Epic': 4, 'Legendary': 7, 'Mythic': 12 }[rarity];
    const types: Item['type'][] = ['weapon', 'armor', 'accessory', 'consumable', 'active_skill', 'passive_skill'];
    const type = types[Math.floor(Math.random() * types.length)];
    const stats: any = {}; let name = `${rarity} ${type}`; let skillId = undefined;

    if (type === 'weapon') {
      stats.atk = Math.floor((5 + level * 2) * mult);
      const prefixes = ['Rusty', 'Iron', 'Steel', 'Mithril', 'Adamantite', 'Shadow', 'Void', 'Celestial'];
      const suffixes = ['of the Bear', 'of the Wolf', 'of the Dragon', 'of the Void', 'of the King'];
      const prefix = prefixes[Math.min(prefixes.length - 1, Math.floor(level / 10) + (mult > 4 ? 2 : 0))];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      name = `${rarity} ${prefix} Weapon ${mult > 2 ? suffix : ''}`.trim();
    }
    if (type === 'armor') {
      stats.def = Math.floor((2 + level) * mult); stats.maxHp = Math.floor((20 + level * 5) * mult);
      const prefixes = ['Tattered', 'Leather', 'Chainmail', 'Platemail', 'Dragonscale', 'Shadow', 'Void'];
      const prefix = prefixes[Math.min(prefixes.length - 1, Math.floor(level / 10) + (mult > 4 ? 2 : 0))];
      name = `${rarity} ${prefix} Armor`;
    }
    if (type === 'accessory') {
      stats.atk = Math.floor(level * mult); stats.maxMp = Math.floor((10 + level * 2) * mult);
      const types = ['Ring', 'Amulet', 'Pendant', 'Charm'];
      name = `${rarity} ${types[Math.floor(Math.random() * types.length)]} of Power`;
    }
    if (type === 'consumable') {
      stats.healHp = 50 * mult; stats.healMp = 20 * mult;
      name = `${rarity} Potion`;
    }
    
    if (type === 'active_skill') {
      const skills = ['slash', 'fireball', 'shadow_bolt', 'multishot', 'lightning', 'heal', 'dash', 'meteor', 'poison_nova'];
      skillId = skills[Math.floor(Math.random() * skills.length)];
      const skillNames: Record<string, string> = {
        'slash': 'Heavy Slash', 'fireball': 'Fireball', 'shadow_bolt': 'Shadow Bolt',
        'multishot': 'Multishot', 'lightning': 'Chain Lightning', 'heal': 'Healing Light',
        'dash': 'Shadow Dash', 'meteor': 'Meteor Strike', 'poison_nova': 'Poison Nova'
      };
      name = `Skill: ${skillNames[skillId]}`;
    }
    if (type === 'passive_skill') {
      const skills = ['orbiting_shields', 'aoe_aura', 'speed_boost', 'lifesteal', 'mana_regen', 'thorns'];
      skillId = skills[Math.floor(Math.random() * skills.length)];
      const skillNames: Record<string, string> = {
        'orbiting_shields': 'Orbiting Shields', 'aoe_aura': 'Burning Aura', 'speed_boost': 'Swiftness',
        'lifesteal': 'Vampirism', 'mana_regen': 'Mana Font', 'thorns': 'Thorns'
      };
      name = `Passive: ${skillNames[skillId]}`;
    }

    return { id: Math.random().toString(36).substr(2, 9), name, type, rarity, stats, skillId, equipped: false, value: 10 * mult };
  }

  resolveHunter(action: 'save' | 'kill') {
    if (!this.interactingHunter) return;
    const h = this.interactingHunter;
    if (action === 'save') {
      this.allies.push(new Ally(h.x, h.y, this.player));
      this.floatingTexts.push(new FloatingText(h.x, h.y, "Joined Party!", '#22c55e'));
    } else {
      this.monsters.push(new Monster(h.x, h.y, this.floor, 'hunter', this.player));
      this.floatingTexts.push(new FloatingText(h.x, h.y, "Betrayal!", '#ef4444'));
    }
    this.hunters = this.hunters.filter(x => x !== h);
    this.interactingHunter = null;
  }

  update() {
    if (this.interactingHunter) return; // Paused for dialog
    this.ticks++;
    this.player.update(this.input, this);
    if (this.player.hp <= 0) { this.onStateChange('GAMEOVER'); return; }

    for (const h of this.hunters) {
      if (Math.hypot(this.player.x - h.x, this.player.y - h.y) < this.player.r + h.r + 20) {
        this.interactingHunter = h;
        this.onStateChange('DIALOG');
        this.input.keys = {}; return;
      }
    }

    for (const c of this.chests) {
      if (!c.opened && Math.hypot(this.player.x - c.x, this.player.y - c.y) < this.player.r + c.r) {
        c.opened = true;
        const numItems = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numItems; i++) this.player.inventory.push(this.generateItem(this.floor));
        this.floatingTexts.push(new FloatingText(c.x, c.y, "Loot Found!", '#eab308'));
      }
    }

    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      m.update(this);
      if (m.hp <= 0) {
        this.player.gainXp(m.xp); this.player.gold += m.gold;
        this.corpses.push(new Corpse(m.x, m.y, m.level, m.maxHp, m.atk, m.def));
        if (Math.random() < 0.2) this.player.inventory.push(this.generateItem(this.floor));
        this.monsters.splice(i, 1);
      }
    }

    for (let i = this.player.shadows.length - 1; i >= 0; i--) {
      const s = this.player.shadows[i];
      s.update(this);
      if (s.hp <= 0) this.player.shadows.splice(i, 1);
    }
    for (let i = this.allies.length - 1; i >= 0; i--) {
      const a = this.allies[i];
      a.update(this);
      if (a.hp <= 0) this.allies.splice(i, 1);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(this);
      if (!p.alive) this.projectiles.splice(i, 1);
    }

    for (let i = this.corpses.length - 1; i >= 0; i--) {
      this.corpses[i].life--;
      if (this.corpses[i].life <= 0) this.corpses.splice(i, 1);
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].life -= 0.05;
      if (this.particles[i].life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      this.floatingTexts[i].life -= 0.02;
      if (this.floatingTexts[i].life <= 0) this.floatingTexts.splice(i, 1);
    }

    if (this.monsters.length === 0) {
      this.floor++; this.player.pts += 5;
      this.onStateChange('LEVELUP');
      this.generateFloor();
      this.onPlayerUpdate(this.player);
      return;
    }

    this.camera.x = this.player.x - this.canvas.width / 2;
    this.camera.y = this.player.y - this.canvas.height / 2;
    if (this.ticks % 10 === 0) this.onPlayerUpdate(this.player);
  }

  draw() {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const startX = Math.max(0, Math.floor(this.camera.x / this.tileSize));
    const startY = Math.max(0, Math.floor(this.camera.y / this.tileSize));
    const endX = Math.min(this.mapSize, startX + Math.ceil(this.canvas.width / this.tileSize) + 1);
    const endY = Math.min(this.mapSize, startY + Math.ceil(this.canvas.height / this.tileSize) + 1);

    const floorSpriteName = this.theme === 'cave' ? 'caveFloor' : this.theme === 'temple' ? 'templeFloor' : this.theme === 'forest' ? 'forestFloor' : this.theme === 'snow' ? 'snowFloor' : 'volcanoFloor';
    const wallSpriteName = this.theme === 'cave' ? 'caveWall' : this.theme === 'temple' ? 'templeWall' : this.theme === 'forest' ? 'forestWall' : this.theme === 'snow' ? 'snowWall' : 'volcanoWall';
    
    const floorSprite = getSprite(floorSpriteName, this.tileSize / 8);
    const wallSprite = getSprite(wallSpriteName, this.tileSize / 8);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const px = x * this.tileSize - this.camera.x;
        const py = y * this.tileSize - this.camera.y;
        if (this.grid[y][x] === 1) this.ctx.drawImage(wallSprite, px, py);
        else this.ctx.drawImage(floorSprite, px, py);
      }
    }

    for (const c of this.corpses) c.draw(this.ctx, this.camera.x, this.camera.y);
    for (const c of this.chests) c.draw(this.ctx, this.camera.x, this.camera.y);
    for (const h of this.hunters) h.draw(this.ctx, this.camera.x, this.camera.y);
    for (const s of this.player.shadows) s.draw(this.ctx, this.camera.x, this.camera.y);
    for (const a of this.allies) a.draw(this.ctx, this.camera.x, this.camera.y);
    for (const m of this.monsters) m.draw(this.ctx, this.camera.x, this.camera.y);
    this.player.draw(this.ctx, this.camera.x, this.camera.y, this.input.mouse.x, this.input.mouse.y);
    for (const p of this.projectiles) p.draw(this.ctx, this.camera.x, this.camera.y);
    for (const p of this.particles) p.draw(this.ctx, this.camera.x, this.camera.y);
    for (const f of this.floatingTexts) f.draw(this.ctx, this.camera.x, this.camera.y);
  }

  loop = () => {
    if (this.stopped) return;
    this.update(); this.draw();
    requestAnimationFrame(this.loop);
  }
}
