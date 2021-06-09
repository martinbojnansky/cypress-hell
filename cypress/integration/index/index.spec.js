/// <reference types="cypress" />

describe('index.html', () => {
  beforeEach(() => {
    cy.visit('');
  });

  function basicTests(context) {
    it('should render page', () => {
      cy.expectSnapshot(`index--${context}__page--rendered`);
    });

    it('should render title', () => {
      cy.get('h1').first().expectSnapshot(`index--${context}__title--rendered`);
    });
  }

  context('desktop', () => {
    beforeEach(() => {
      cy.viewport(1250, 720);
    });

    basicTests('desktop');
  });

  context('mobile', () => {
    beforeEach(() => {
      cy.viewport('iphone-5');
    });

    basicTests('mobile');
  });
});