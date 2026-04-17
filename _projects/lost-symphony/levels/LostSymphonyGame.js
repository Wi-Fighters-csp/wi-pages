import LostSymphonyState from '/assets/js/projects/lost-symphony/model/LostSymphonyState.js';
import { WORLD_DATA, WORLD_SEQUENCE } from '/assets/js/projects/lost-symphony/model/worldData.js';
import OverworldHubWorld from '/assets/js/projects/lost-symphony/levels/worlds/OverworldHubWorld.js';
import StringForestWorld from '/assets/js/projects/lost-symphony/levels/worlds/StringForestWorld.js';
import BrassFortressWorld from '/assets/js/projects/lost-symphony/levels/worlds/BrassFortressWorld.js';
import WoodwindWildsWorld from '/assets/js/projects/lost-symphony/levels/worlds/WoodwindWildsWorld.js';
import PercussionPeaksWorld from '/assets/js/projects/lost-symphony/levels/worlds/PercussionPeaksWorld.js';
import FinalConcertWorld from '/assets/js/projects/lost-symphony/levels/worlds/FinalConcertWorld.js';
import BattleOfTheSections from '/assets/js/projects/lost-symphony/levels/minigames/BattleOfTheSections.js';
import LostSymphonyRenderer from '/assets/js/projects/lost-symphony/levels/layout/LostSymphonyRenderer.js';

const WORLD_CLASSES = {
  hub: OverworldHubWorld,
  strings: StringForestWorld,
  brass: BrassFortressWorld,
  woodwinds: WoodwindWildsWorld,
  percussion: PercussionPeaksWorld,
  finale: FinalConcertWorld
};

function unique(values) {
  return Array.from(new Set(values));
}

class LostSymphonyGame {
  constructor(root) {
    this.root = root;
    this.state = LostSymphonyState.load();
    this.ensureStyles();
    this.syncUnlocks();
    this.render();
  }

  ensureStyles() {
    if (document.getElementById('lost-symphony-layout-styles')) return;
    const style = document.createElement('style');
    style.id = 'lost-symphony-layout-styles';
    style.textContent = LostSymphonyRenderer.styles();
    document.head.appendChild(style);
  }

  syncUnlocks() {
    const unlocked = new Set(this.state.unlockedWorldIds || ['hub', 'strings']);
    unlocked.add('hub');
    unlocked.add('strings');

    if (this.state.reclaimedSections.includes('Strings')) unlocked.add('brass');
    if (this.state.reclaimedSections.includes('Brass')) unlocked.add('woodwinds');
    if (this.state.reclaimedSections.includes('Woodwinds')) unlocked.add('percussion');
    if (this.state.reclaimedSections.includes('Percussion')) unlocked.add('finale');

    this.state.finalConcertUnlocked = unlocked.has('finale');
    this.state.unlockedWorldIds = unique(Array.from(unlocked));
  }

  saveState() {
    this.state.lastVisitedAt = new Date().toISOString();
    this.state = LostSymphonyState.save(this.state);
  }

  getActiveWorldId() {
    const current = this.state.currentWorldId || 'hub';
    if (this.state.unlockedWorldIds.includes(current) || current === 'hub') return current;
    return 'hub';
  }

  getWorldDefinition(worldId) {
    return WORLD_DATA[worldId] || WORLD_DATA.hub;
  }

  createWorldLayout(worldId) {
    const definition = this.getWorldDefinition(worldId);
    const WorldClass = WORLD_CLASSES[worldId] || OverworldHubWorld;
    const world = new WorldClass(definition);
    return world.getLayout();
  }

  selectWorld(worldId) {
    if (!(this.state.unlockedWorldIds.includes(worldId) || worldId === 'hub')) return;
    this.state.currentWorldId = worldId;
    this.saveState();
    this.render();
  }

  bindEvents() {
    this.root.querySelectorAll('[data-world-select]').forEach((button) => {
      button.addEventListener('click', () => this.selectWorld(button.dataset.worldSelect));
    });
  }

  render() {
    const activeWorldId = this.getActiveWorldId();
    const activeWorld = this.getWorldDefinition(activeWorldId);
    const activeLayout = this.createWorldLayout(activeWorldId);
    const battleLayout = new BattleOfTheSections(activeWorld).getLayout();
    const worldOrder = ['hub', ...WORLD_SEQUENCE].map((worldId) => this.getWorldDefinition(worldId));
    const fileMap = [
      { label: 'Main Controller', title: 'Lost Symphony orchestrator', path: '_projects/lost-symphony/levels/LostSymphonyGame.js' },
      { label: 'Mini-Game Shell', title: 'Battle of the Sections scaffold', path: '_projects/lost-symphony/levels/minigames/BattleOfTheSections.js' },
      { label: 'Shared State', title: 'Saved progression model', path: '_projects/lost-symphony/model/LostSymphonyState.js' },
      { label: 'World Registry', title: 'Section world metadata', path: '_projects/lost-symphony/model/worldData.js' },
      { label: 'Hub World', title: 'Concert hall overworld', path: '_projects/lost-symphony/levels/worlds/OverworldHubWorld.js' },
      { label: 'World File', title: `${activeWorld.title} scaffold`, path: `_projects/lost-symphony/levels/worlds/${WORLD_CLASSES[activeWorldId]?.name || 'OverworldHubWorld'}.js` }
    ];

    this.root.innerHTML = LostSymphonyRenderer.render({
      state: this.state,
      activeWorld,
      activeLayout,
      battleLayout,
      worldOrder,
      fileMap
    });

    this.bindEvents();
  }
}

export function mountLostSymphonyGame(rootId = 'pso-lost-symphony-root') {
  const root = typeof rootId === 'string' ? document.getElementById(rootId) : rootId;
  if (!root) {
    throw new Error('Lost Symphony root element not found.');
  }

  return new LostSymphonyGame(root);
}