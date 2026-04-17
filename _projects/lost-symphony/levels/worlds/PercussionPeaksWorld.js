export default class PercussionPeaksWorld {
  constructor(definition) {
    this.definition = definition;
  }

  getLayout() {
    return {
      sceneTitle: 'Percussion Peaks Layout',
      sceneCopy: 'The final section world is a tempo-driven ascent through beat towers and pulse bridges.',
      objectives: [
        'Climb the peak through rhythm checkpoints',
        'Restore the summit pulse core',
        'Trigger the corrupted percussion battle'
      ],
      encounterTrigger: 'Retune the summit metronome and challenge the corrupted rhythm guardian.',
      visualAnchors: ['Pulse bridge', 'Drum gate', 'Summit metronome'],
      transitionNote: 'A percussion win unlocks the final concert in the hub.'
    };
  }
}