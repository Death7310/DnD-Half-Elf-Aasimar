import type { FxLevel } from '../fx/types';
import { normalizeCharacter, type Character } from '../systems/dnd5e/model';

export interface Settings {
  sound: boolean;
  volume: number;
  fx: FxLevel;
  flashes: boolean;
  theme: 'system' | 'light' | 'dark';
}

export interface Saved {
  characters: Character[];
  currentId: string;
  settings: Settings;
}

const KEY = 'arcane-folio:v1';

export function defaultSettings(): Settings {
  let reduce = false;
  try {
    reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    /* no matchMedia */
  }
  return { sound: true, volume: 0.7, fx: reduce ? 'reduced' : 'full', flashes: !reduce, theme: 'system' };
}

/** Everything lives in this browser only. Storage can be blocked (private windows), so every access is guarded. */
export function load(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<Saved>;
    const characters = (data.characters ?? []).flatMap((c) => {
      try {
        return [normalizeCharacter(c)];
      } catch {
        return [];
      }
    });
    if (!characters.length) return null;
    return {
      characters,
      currentId: characters.some((c) => c.id === data.currentId) ? data.currentId! : characters[0].id,
      settings: { ...defaultSettings(), ...data.settings },
    };
  } catch {
    return null;
  }
}

export function save(s: Saved): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
