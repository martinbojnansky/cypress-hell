/// <reference types="cypress" />

describe('index.html', () => {
	beforeEach(() => {
		cy.visit('');
	});

	it('should something', () => {
		cy.get('h1').should('have.text', 'hello');
	});
});