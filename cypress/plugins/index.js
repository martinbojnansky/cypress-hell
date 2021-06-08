/// <reference types="cypress" />

const { addCypressHellPlugin } = require('../../dist/src/plugin');
/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  addCypressHellPlugin(on, config);
}
