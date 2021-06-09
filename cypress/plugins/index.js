/// <reference types="cypress" />

const { addCypressSnapshotsPlugin } = require('../../dist/plugin');
/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  addCypressSnapshotsPlugin(on, config);
}
