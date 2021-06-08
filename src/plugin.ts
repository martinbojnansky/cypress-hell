import fs = require('fs');
const PNG = require('pngjs').PNG;
import pixelmatch = require('pixelmatch');

export function addCypressHellPlugin(
	on: Cypress.PluginEvents,
	conf: Cypress.PluginConfig
): void {
	on('before:run', (data: Cypress.BeforeRunDetails) => {
		console.log('before all', data.config);
	});
	on('before:spec', (spec: any) => {
		console.log('before describe', spec);
	});
	on('after:spec', (spec: any) => {
		console.log('after describe', spec);
	});
	on('after:run', (data: any) => {
		console.log('after all', data);
	});
}