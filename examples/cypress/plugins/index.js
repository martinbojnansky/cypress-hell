/// <reference types="cypress" />

const { addCypressSnapshotsPlugin } = require('../../../plugin/dist');
/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  addCypressSnapshotsPlugin(on, config);
}
