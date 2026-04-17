export default class WoodwindWildsWorld {
  constructor(definition) {
    this.definition = definition;
  }

  getLayout() {
    return {
      sceneTitle: 'Woodwind Wilds Layout',
      sceneCopy: 'This world uses phrase paths, shifting wind currents, and more fluid movement between encounter spaces.',
      objectives: [
        'Track phrase currents through the grove',
        'Find the hidden soloist',
        'Trigger the corrupted woodwinds battle'
      ],
      encounterTrigger: 'Complete the phrase compass path and reveal the grove center.',
      visualAnchors: ['Reed bridge', 'Phrase stream', 'Solo clearing'],
      transitionNote: 'Restoring Woodwinds unlocks the percussion summit.'
    };
  }
}