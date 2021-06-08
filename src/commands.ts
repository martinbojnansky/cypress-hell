export function addCypressHellCommands(): void {
	Cypress.Commands.add('expectSnapshot', (name: string) => {
		return expectSnapshot(name);
	});
}

export function expectSnapshot(name: string): Cypress.Chainable {
	// Take a screenshot with specific name
	return cy.screenshot(name).then(() => {
		// Runs comparison of expected snapshot and actual screenshot.
		cy.task('runSnapshotComparison', name);
	});
}