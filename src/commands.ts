import { SnapshotComparisonArgs } from './models';

export function addCypressSnapshotsCommands(): void {
  Cypress.Commands.add('expectSnapshot', { prevSubject: 'optional' }, ($subject: Cypress.PrevSubject, name: string) => {
    const args: SnapshotComparisonArgs = {
      name: name,
      updateSnapshots: Cypress.env('updateSnapshots') || false,
    };

    // Take a screenshot with specific name
    return ($subject ? cy.wrap($subject) : cy).screenshot(args.name).then(() => {
      // Runs comparison of expected snapshot and actual screenshot.
      cy.task('runSnapshotComparison', args);
    });
  });
}
