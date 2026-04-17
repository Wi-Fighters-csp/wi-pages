export default class StringForestWorld {
  constructor(definition) {
    this.definition = definition;
  }

  getLayout() {
    return {
      sceneTitle: 'String Forest Layout',
      sceneCopy: 'The first world emphasizes speed, repetition, and melodic recovery through a forest of string pathways.',
      objectives: [
        'Explore the forest trail network',
        'Locate the missing string player or instrument',
        'Trigger the corrupted strings battle encounter'
      ],
      encounterTrigger: 'Recover the melody shard hidden behind a rhythm-vine barrier.',
      visualAnchors: ['Bow-bridge crossings', 'Resonance glade', 'Violin shrine'],
      transitionNote: 'Winning here returns Strings to the orchestra and opens Brass Fortress.'
    };
  }
}