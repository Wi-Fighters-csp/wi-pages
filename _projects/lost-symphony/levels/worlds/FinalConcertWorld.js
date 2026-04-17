export default class FinalConcertWorld {
  constructor(definition) {
    this.definition = definition;
  }

  getLayout() {
    return {
      sceneTitle: 'Final Concert Layout',
      sceneCopy: 'The finale is the reunion stage where recovered sections assemble, perform, and unlock the PSO recording reward.',
      objectives: [
        'Verify all reclaimed sections are present',
        'Set the orchestra on stage for the finale sequence',
        'Unlock and present a real PSO recording'
      ],
      encounterTrigger: 'No normal battle. The finale activates when all four main section worlds are reclaimed.',
      visualAnchors: ['Main stage', 'Full orchestra risers', 'Recording unlock panel'],
      transitionNote: 'This is the capstone reward space for the whole game.'
    };
  }
}