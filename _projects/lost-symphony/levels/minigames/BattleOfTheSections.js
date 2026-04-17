const BATTLE_TEMPLATES = {
  Strings: {
    title: 'Battle of the Sections: Strings',
    prompt: 'Rapid rhythm exchanges and stamina-based phrase defense.',
    mechanics: ['Quick repeated inputs', 'Combo streak meter', 'Melody recovery phase']
  },
  Brass: {
    title: 'Battle of the Sections: Brass',
    prompt: 'Deliberate, powerful pitch windows with slower recovery time.',
    mechanics: ['Pitch matching', 'Charge timing', 'Heavy impact responses']
  },
  Woodwinds: {
    title: 'Battle of the Sections: Woodwinds',
    prompt: 'Phrase recognition and flowing breath-pattern timing.',
    mechanics: ['Phrase loops', 'Call-and-response', 'Air-current routing']
  },
  Percussion: {
    title: 'Battle of the Sections: Percussion',
    prompt: 'Pure rhythm pressure with layered beats and tempo climbs.',
    mechanics: ['Beat lanes', 'Tempo shifts', 'Pulse meter']
  },
  'Full Orchestra': {
    title: 'Final Ensemble Sequence',
    prompt: 'Recovered sections coordinate instead of fighting a corrupted section.',
    mechanics: ['Finale assembly', 'Recording unlock', 'Performance reveal']
  }
};

export default class BattleOfTheSections {
  constructor(worldDefinition) {
    this.worldDefinition = worldDefinition;
  }

  getLayout() {
    const template = BATTLE_TEMPLATES[this.worldDefinition.section] || BATTLE_TEMPLATES['Full Orchestra'];

    return {
      ...template,
      arena: this.worldDefinition.title,
      reward: this.worldDefinition.reward,
      placeholderNote: 'This is only the battle shell. Inputs, enemies, scoring, and fail states will be added world by world.'
    };
  }
}