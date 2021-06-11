/// <reference types="cypress" />

describe('index.html', () => {
  beforeEach(() => {
    cy.visit('');
  });

  function basicTests(ctx) {
    it('should render page', () => {
      cy.expectSnapshot(`page--${ctx}`);
    });

    it('should render title', () => {
      cy.get('[data-tid=title]').first().expectSnapshot(`title--${ctx}`);
    });

    it('should render paragraph', () => {
      cy.get('[data-tid=paragraph]').first().expectSnapshot(`paragraph--${ctx}`);
    });

    it('should render svg', () => {
      cy.get('[data-tid=svg]').first().expectSnapshot(`svg--${ctx}`);
    });

    it('should render scrollable', () => {
      cy.get('[data-tid=scrollable-wrapper]').first().expectSnapshot(`scrollable-wrapper--${ctx}`);
      // Does not test scrolled content.
      cy.get('[data-tid=scrollable-content]').first().expectSnapshot(`scrollable-content--${ctx}`);
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