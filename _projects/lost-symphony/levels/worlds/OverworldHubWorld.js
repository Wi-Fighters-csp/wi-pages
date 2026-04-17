export default class OverworldHubWorld {
  constructor(definition) {
    this.definition = definition;
  }

  getLayout() {
    return {
      sceneTitle: 'Concert Hall Overworld',
      sceneCopy: 'This hub acts as the main map. Each door leads to a section world where a missing musician or instrument can be reclaimed.',
      objectives: [
        'Show all available section doors',
        'Display reclaimed sections returning to stage',
        'Gate the final concert until every core section is restored'
      ],
      encounterTrigger: 'Selecting a world door transitions from the hub into that section realm.',
      visualAnchors: ['Main stage', 'Section doors', 'Recovered roster balcony'],
      transitionNote: 'Use the hub as the central return point after each battle victory.'
    };
  }
}