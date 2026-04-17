export default class BrassFortressWorld {
  constructor(definition) {
    this.definition = definition;
  }

  getLayout() {
    return {
      sceneTitle: 'Brass Fortress Layout',
      sceneCopy: 'A vertical fortress world built around resonance chambers, heavy gates, and powerful pitch-based encounters.',
      objectives: [
        'Climb the fortress approach',
        'Find the imprisoned brass captain',
        'Trigger the corrupted brass battle in the resonance tower'
      ],
      encounterTrigger: 'Insert the valve key into the top chamber fanfare engine.',
      visualAnchors: ['Gate courtyard', 'Valve lift', 'Fanfare tower'],
      transitionNote: 'A brass victory opens the route into the woodwind realm.'
    };
  }
}