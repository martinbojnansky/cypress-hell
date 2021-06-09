/// <reference types="cypress" />

describe('index.html', () => {
	beforeEach(() => {
		cy.visit('');
	});

	it('should render page', () => {
		cy.expectSnapshot('index__page--rendered');
	});

	it('should render title', () => {
		cy.get('h1').first().expectSnapshot('index__title--rendered');
	});
});