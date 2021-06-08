/// <reference types="cypress" />

describe('index.html', () => {
	beforeEach(() => {
		cy.visit('');
	});

	it('should render', () => {
		cy.expectSnapshot('index--rendered');
	});
});