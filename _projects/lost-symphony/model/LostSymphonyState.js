const STORAGE_KEY = 'pso_lost_symphony_state';

const DEFAULT_STATE = {
  currentWorldId: 'hub',
  unlockedWorldIds: ['hub', 'strings'],
  reclaimedSections: [],
  battleVictories: [],
  finalConcertUnlocked: false,
  openingSceneSeen: false,
  lastVisitedAt: null
};

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

export default class LostSymphonyState {
  static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneDefaultState();
      const parsed = JSON.parse(raw);
      return {
        ...cloneDefaultState(),
        ...parsed,
        unlockedWorldIds: Array.isArray(parsed.unlockedWorldIds) ? parsed.unlockedWorldIds : ['hub', 'strings'],
        reclaimedSections: Array.isArray(parsed.reclaimedSections) ? parsed.reclaimedSections : [],
        battleVictories: Array.isArray(parsed.battleVictories) ? parsed.battleVictories : []
      };
    } catch (error) {
      console.warn('Unable to load Lost Symphony state.', error);
      return cloneDefaultState();
    }
  }

  static save(state) {
    const nextState = {
      ...cloneDefaultState(),
      ...state,
      unlockedWorldIds: Array.isArray(state.unlockedWorldIds) ? Array.from(new Set(state.unlockedWorldIds)) : ['hub', 'strings'],
      reclaimedSections: Array.isArray(state.reclaimedSections) ? Array.from(new Set(state.reclaimedSections)) : [],
      battleVictories: Array.isArray(state.battleVictories) ? Array.from(new Set(state.battleVictories)) : []
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    return nextState;
  }

  static clear() {
    localStorage.removeItem(STORAGE_KEY);
    return cloneDefaultState();
  }
}