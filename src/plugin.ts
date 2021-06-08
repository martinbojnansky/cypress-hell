import fs = require('fs');
const PNG = require('pngjs').PNG;
import pixelmatch = require('pixelmatch');

let currentRun: Cypress.BeforeRunDetails | undefined;
let currentSpec: Cypress.Spec | undefined;

export function addCypressHellPlugin(
	on: Cypress.PluginEvents,
	conf: Cypress.PluginConfig
): void {
	on('before:run', (data: Cypress.BeforeRunDetails) => {
		currentRun = data;
	});
	on('before:spec', (spec: Cypress.Spec) => {
		currentSpec = spec;
	});
	on('task', {
		runSnapshotComparison(name: string) {
			return runSnapshotComparison(name);
		},
	});
	on('after:spec', (spec: Cypress.Spec) => {
		currentSpec = undefined;
	});
	on('after:run', (data: any) => {
		currentRun = undefined;
	});
}

function runSnapshotComparison(name: string) {
	// Define path variables.
	const opts = {
		specName: currentSpec?.name,
		specRelative: currentSpec?.relative,
		specAbsolute: currentSpec?.absolute,
		specType: currentSpec?.specType,
		snapshotName: name,
		snapshotRelative: `${currentSpec?.relative}-snapshots/${name}/`,
		snapshotAbsolute: `${currentSpec?.absolute}-snapshots/${name}/`,
		snapshotsRelative: `${currentSpec?.relative}-snapshots/`,
		snapshotsAbsolute: `${currentSpec?.absolute}-snapshots/`,
		screenshotsAbsolute: `${currentSpec?.absolute?.replace(currentSpec?.specType || 'integration', (currentRun?.config?.screenshotsFolder || '').split('\\').reverse()[0])}/`
	};
	console.log(currentSpec, opts)


	// Get previously saved and expected snapshot image.
	let expectedImage: any | undefined;
	let width = 0;
	let height = 0;
	try {
		expectedImage = PNG.sync.read(
			fs.readFileSync(`${opts.snapshotAbsolute}expected.png`)
		);
		width = expectedImage.width;
		height = expectedImage.height;
	} catch {
		// TODO: Log no image yet
	}

	// Get currently screenshoted image.
	const actualImage = PNG.sync.read(
		fs.readFileSync(`${opts.screenshotsAbsolute}${opts.snapshotName}.png`)
	);
	// Save currently screenshoted image to snapshots folder as actual.
	fs.writeFileSync(
		`${opts.snapshotAbsolute}actual.png`,
		PNG.sync.write(actualImage)
	);

	// Create diff image.
	const diff = new PNG({ width, height });
	const pixelDiffCount = pixelmatch(
		expectedImage.data,
		actualImage.data,
		diff.data,
		width,
		height,
		{
			threshold: 0.1,
		}
	);
	// Save diff image to snapshots folder as diff.
	fs.writeFileSync(`${opts.snapshotAbsolute}diff.png`, PNG.sync.write(diff));

	// Throw error in order to fail test if any pixel differences has been found.
	if (pixelDiffCount) {
		throw new Error(
			`'${opts.snapshotName}' snapshot has changed.\n\nReview the 'diff.png' in '${opts.snapshotAbsolute}' and rename 'actual.png' to 'expected.png' if you approve the changes.`
		);
	}

	return null;
}