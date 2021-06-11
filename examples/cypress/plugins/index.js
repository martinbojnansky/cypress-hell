/// <reference types="cypress" />

const { addCypressSnapshotsPlugin } = require('cypress-snapshots');
/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  addCypressSnapshotsPlugin(on, config);
}
