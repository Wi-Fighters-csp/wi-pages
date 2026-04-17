import LostSymphonyState from '/assets/js/projects/lost-symphony/model/LostSymphonyState.js';
import { WORLD_DATA, WORLD_SEQUENCE } from '/assets/js/projects/lost-symphony/model/worldData.js';
import OverworldHubWorld from '/assets/js/projects/lost-symphony/levels/worlds/OverworldHubWorld.js';
import StringForestWorld from '/assets/js/projects/lost-symphony/levels/worlds/StringForestWorld.js';
import BrassFortressWorld from '/assets/js/projects/lost-symphony/levels/worlds/BrassFortressWorld.js';
import WoodwindWildsWorld from '/assets/js/projects/lost-symphony/levels/worlds/WoodwindWildsWorld.js';
import PercussionPeaksWorld from '/assets/js/projects/lost-symphony/levels/worlds/PercussionPeaksWorld.js';
import FinalConcertWorld from '/assets/js/projects/lost-symphony/levels/worlds/FinalConcertWorld.js';
import BattleOfTheSections from '/assets/js/projects/lost-symphony/levels/minigames/BattleOfTheSections.js';
import LostSymphonyRenderer from '/assets/js/projects/lost-symphony/levels/layout/LostSymphonyRenderer.js?v=20260417d';

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

const OPENING_CUTSCENE = {
  title: 'The First Silence',
  sceneLabel: 'Opening Cutscene',
  setting: 'Scene opens inside the concert hall. Warm golden lighting. Soft murmurs from the audience. Programs rustling. The stage is fully set.',
  pointOfView: 'POV: You are already seated in the middle of the hall.',
  imagePath: '/images/projects/lost-symphony/scene1.png',
  dialogue: [
    {
      speaker: 'Player',
      tone: 'internal thought',
      text: 'Poway Symphony Orchestra... spring concert. I can still feel the ticket edge pressing against my thumb.'
    },
    {
      speaker: 'Player',
      tone: 'internal thought',
      text: 'I really didn\'t think I\'d make it tonight. For a while, it felt like the whole day was trying to keep me away from this room.'
    },
    {
      speaker: 'Stage Direction',
      tone: 'direction',
      text: 'You lift your eyes toward the stage as the house lights soften and the last whispers in the hall begin to thin.'
    },
    {
      speaker: 'Player',
      tone: 'internal thought',
      text: 'Mom said these seats were good. Close enough to see every stand, far enough to take in the whole orchestra at once.'
    },
    {
      speaker: 'Stage Direction',
      tone: 'direction',
      text: 'Onstage, bows settle, brass catches the light, and a final ribbon of tuning slips through the hall before vanishing into the hush.'
    },
    {
      speaker: 'Player',
      tone: 'internal thought',
      text: 'From here it always looks calm, almost sacred, like nothing inside that glow could ever fall out of place.'
    },
    {
      speaker: 'Player',
      tone: 'internal thought',
      text: 'Like nothing could possibly go wrong. Like the first note is already waiting somewhere in the air.'
    }
  ]
};

class LostSymphonyGame {
  constructor(root, options = {}) {
    this.root = root;
    this.options = options;
    this.typingTimer = null;
    this.activeTypingTarget = null;
    this.activeTypingText = '';
    this.isTyping = false;
    this.state = options.forceFreshStart ? LostSymphonyState.clear() : LostSymphonyState.load();
    this.activeCutsceneIndex = this.state.openingSceneSeen ? OPENING_CUTSCENE.dialogue.length - 1 : 0;
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

  getOpeningScene() {
    const dialogue = OPENING_CUTSCENE.dialogue;
    const currentIndex = Math.min(this.activeCutsceneIndex, dialogue.length - 1);

    return {
      ...OPENING_CUTSCENE,
      currentIndex,
      currentLine: dialogue[currentIndex],
      hasNext: currentIndex < dialogue.length - 1,
      isVisible: !this.state.openingSceneSeen
    };
  }

  advanceOpeningScene() {
    if (this.state.openingSceneSeen) return;

    if (this.isTyping) {
      this.finishTypingAnimation();
      return;
    }

    if (this.activeCutsceneIndex < OPENING_CUTSCENE.dialogue.length - 1) {
      this.activeCutsceneIndex += 1;
      this.render();
      return;
    }

    this.dismissOpeningScene();
  }

  dismissOpeningScene() {
    this.finishTypingAnimation();
    this.state.openingSceneSeen = true;
    this.activeCutsceneIndex = OPENING_CUTSCENE.dialogue.length - 1;
    this.saveState();
    this.render();
  }

  replayOpeningScene() {
    this.finishTypingAnimation();
    this.state.openingSceneSeen = false;
    this.activeCutsceneIndex = 0;
    this.saveState();
    this.render();
  }

  finishTypingAnimation() {
    if (this.typingTimer) {
      window.clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }

    if (this.activeTypingTarget) {
      this.activeTypingTarget.textContent = this.activeTypingText;
      this.activeTypingTarget.classList.remove('is-typing');
    }

    this.activeTypingTarget = null;
    this.activeTypingText = '';
    this.isTyping = false;
  }

  animateOpeningDialogue() {
    const line = this.root.querySelector('[data-opening-line]');
    if (!line) return;

    const fullText = line.dataset.fullText || '';
    if (!fullText) return;

    this.finishTypingAnimation();
    this.activeTypingTarget = line;
    this.activeTypingText = fullText;
    this.isTyping = true;
    line.textContent = '';
    line.classList.add('is-typing');

    let index = 0;
    const step = () => {
      if (!this.activeTypingTarget) return;

      index += 1;
      line.textContent = fullText.slice(0, index);

      if (index >= fullText.length) {
        line.classList.remove('is-typing');
        this.typingTimer = null;
        this.activeTypingTarget = null;
        this.activeTypingText = '';
        this.isTyping = false;
        return;
      }

      const currentCharacter = fullText[index - 1];
      const delay = /[,.!?]/.test(currentCharacter) ? 38 : 18;
      this.typingTimer = window.setTimeout(step, delay);
    };

    this.typingTimer = window.setTimeout(step, 18);
  }

  bindEvents() {
    const nextIntroButton = this.root.querySelector('[data-opening-next]');
    if (nextIntroButton) {
      nextIntroButton.addEventListener('click', () => this.advanceOpeningScene());
    }

    const skipIntroButton = this.root.querySelector('[data-opening-skip]');
    if (skipIntroButton) {
      skipIntroButton.addEventListener('click', () => this.dismissOpeningScene());
    }
  }

  render() {
    this.finishTypingAnimation();
    this.root.innerHTML = LostSymphonyRenderer.render({
      openingScene: this.getOpeningScene()
    });

    this.bindEvents();
    this.animateOpeningDialogue();
  }
}

export function mountLostSymphonyGame(rootId = 'pso-lost-symphony-root', options = {}) {
  let root = typeof rootId === 'string' ? document.getElementById(rootId) : rootId;

  if (!root && typeof rootId === 'string') {
    const gameContainer = document.querySelector('.gameContainer') || document.querySelector('[id^="game-container-"]');
    if (gameContainer) {
      root = document.createElement('div');
      root.id = rootId;
      gameContainer.replaceChildren(root);
    }
  }

  if (!root) {
    throw new Error('Lost Symphony root element not found.');
  }

  return new LostSymphonyGame(root, options);
}