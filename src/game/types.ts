export type ClassType = 'warrior' | 'mage' | 'archer' | 'assassin' | 'necromancer';
export type GameState = 'MENU' | 'CLASS' | 'PLAY' | 'INV' | 'LEVELUP' | 'GAMEOVER' | 'WIN' | 'DIALOG' | 'TRANSITION';
export type MobTier = 'low' | 'med' | 'high' | 'boss' | 'hunter';
export type FloorModifier = 'none' | 'poison' | 'darkness' | 'reflection' | 'regeneration' | 'elemental';

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'active_skill' | 'passive_skill';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  stats: { atk?: number; def?: number; maxHp?: number; maxMp?: number; healHp?: number; healMp?: number; critChance?: number; lifeSteal?: number; elementalDamage?: { type: 'fire' | 'ice' | 'lightning' | 'poison', amount: number } };
  skillId?: string;
  equipped: boolean;
  value: number;
}
