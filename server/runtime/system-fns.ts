/**
 * @file system-fns.ts
 * @description External functions exposed to Ink runtime.
 * These are the ONLY ways Ink can modify system state - enforces consistency and testability.
 * @module server/runtime
 */

import type { SystemState } from "./system-state";

/**
 * API object returned by createSystemFns.
 * Each function corresponds to an EXTERNAL declaration in .ink files.
 */
export interface SystemFnsApi {
  // Stats
  GetStat: (key: "money" | "heat" | "time") => number;
  AddStat: (key: "money" | "heat" | "time", delta: number) => number;
  Spend: (key: "money", amount: number) => boolean;

  // Inventory
  HasItem: (id: string, qty?: number) => boolean;
  AddItem: (id: string, qty?: number) => number;
  RemoveItem: (id: string, qty?: number) => boolean;

  // Reputation
  GetRep: (faction: string) => number;
  AddRep: (faction: string, delta: number) => number;

  // Flags
  GetFlag: (id: string) => boolean;
  SetFlag: (id: string, value: boolean) => boolean;

  // Skill checks
  Check: (skill: string, dc: number) => boolean;

  // UI (placeholder - actual UI events should use tags)
  Toast: (text: string) => void;
}

/**
 * Creates the system functions API bound to a specific state and RNG.
 * All mutations happen on the passed state object (by reference).
 *
 * @param state - Mutable system state object
 * @param rngNext - Deterministic RNG function from mulberry32
 * @returns API object to bind to Ink story
 *
 * @example
 * const state = defaultSystemState();
 * const rng = mulberry32(seed);
 * const api = createSystemFns(state, rng);
 * story.BindExternalFunction("Spend", api.Spend);
 */
export function createSystemFns(
  state: SystemState,
  rngNext: () => number
): SystemFnsApi {
  const api: SystemFnsApi = {
    // --- Stats ---

    GetStat: (key: "money" | "heat" | "time") => state[key],

    AddStat: (key: "money" | "heat" | "time", delta: number) => {
      state[key] += Math.trunc(delta);
      return state[key];
    },

    Spend: (key: "money", amount: number) => {
      amount = Math.trunc(amount);
      if (amount <= 0) return true;
      if (state[key] < amount) return false;
      state[key] -= amount;
      return true;
    },

    // --- Inventory ---

    HasItem: (id: string, qty = 1) => (state.inv[id] ?? 0) >= Math.trunc(qty),

    AddItem: (id: string, qty = 1) => {
      state.inv[id] = (state.inv[id] ?? 0) + Math.trunc(qty);
      return state.inv[id];
    },

    RemoveItem: (id: string, qty = 1) => {
      qty = Math.trunc(qty);
      const cur = state.inv[id] ?? 0;
      if (cur < qty) return false;
      const next = cur - qty;
      if (next <= 0) {
        delete state.inv[id];
      } else {
        state.inv[id] = next;
      }
      return true;
    },

    // --- Reputation ---

    GetRep: (faction: string) => state.rep[faction] ?? 0,

    AddRep: (faction: string, delta: number) => {
      state.rep[faction] = (state.rep[faction] ?? 0) + Math.trunc(delta);
      return state.rep[faction];
    },

    // --- Flags ---

    GetFlag: (id: string) => state.flags[id] ?? false,

    SetFlag: (id: string, value: boolean) => {
      state.flags[id] = !!value;
      return state.flags[id];
    },

    // --- Skill Checks ---

    Check: (_skill: string, dc: number) => {
      // Simplified: skill not modeled yet, pure RNG vs DC
      // Future: could add skill modifiers from state
      const roll = Math.floor(rngNext() * 100) + 1; // 1-100
      return roll >= Math.trunc(dc);
    },

    // --- UI (placeholder) ---

    Toast: (_text: string) => {
      // MVP: actual toasts should use #ui:toast:xxx tags
      // This is a no-op placeholder to prevent Ink errors
    },
  };

  return api;
}
