import fs = require('fs');
const PNG = require('pngjs').PNG;
import pixelmatch = require('pixelmatch');
import { SnapshotComparisonArgs } from './models';

let currentRun: Cypress.BeforeRunDetails | undefined;
let currentSpec: Cypress.Spec | undefined;

export function addCypressSnapshotsPlugin(on: Cypress.PluginEvents, conf: Cypress.PluginConfig): void {
  on('before:run', (data: Cypress.BeforeRunDetails) => {
    currentRun = data;
  });
  on('before:spec', (spec: Cypress.Spec) => {
    currentSpec = spec;
  });
  on('task', {
    runSnapshotComparison(args: SnapshotComparisonArgs) {
      return runSnapshotComparison(args);
    },
  });
  on('after:spec', (spec: Cypress.Spec) => {
    currentSpec = undefined;
  });
  on('after:run', (data: any) => {
    currentRun = undefined;
  });
}

function runSnapshotComparison(args: SnapshotComparisonArgs) {
  // Define path variables.
  const config = {
    specName: currentSpec?.name,
    specRelative: currentSpec?.relative,
    specAbsolute: currentSpec?.absolute,
    specType: currentSpec?.specType,
    snapshotName: args.name,
    snapshotRelative: `${currentSpec?.relative}-snapshots/${args.name}/`,
    snapshotAbsolute: `${currentSpec?.absolute}-snapshots/${args.name}/`,
    snapshotsRelative: `${currentSpec?.relative}-snapshots/`,
    snapshotsAbsolute: `${currentSpec?.absolute}-snapshots/`,
    screenshotsAbsolute: `${currentSpec?.absolute?.replace(
      currentSpec?.specType || 'integration',
      (currentRun?.config?.screenshotsFolder || '').split('\\').reverse()[0]
    )}/`,
  };

  // Make sure all necessary directories are created.
  if (!fs.existsSync(config.snapshotAbsolute)) {
    fs.mkdirSync(config.snapshotAbsolute, { recursive: true });
  }

  // Get currently screenshoted image.
  const actualImage = PNG.sync.read(fs.readFileSync(`${config.screenshotsAbsolute}${config.snapshotName}.png`));
  // Save currently screenshoted image to snapshots folder as actual.
  fs.writeFileSync(`${config.snapshotAbsolute}actual.png`, PNG.sync.write(actualImage));

  // Get previously saved and expected snapshot image.
  let expectedImage: any | undefined;
  let width = 0;
  let height = 0;
  try {
    expectedImage = PNG.sync.read(fs.readFileSync(`${config.snapshotAbsolute}expected.png`));
    width = expectedImage.width;
    height = expectedImage.height;
  } catch {
    throw new Error(
      `An expected snapshot '${config.snapshotName}' does not yet exist.\n\nReview the 'actual.png' in '${config.snapshotAbsolute}' and rename it to 'expected.png' if you approve the changes.`
    );
  }

  // Create diff image.
  const diff = new PNG({ width, height });
  let pixelDiffCount: number | undefined;
  try {
    pixelDiffCount = pixelmatch(expectedImage.data, actualImage.data, diff.data, width, height, args.pixelmatch);
    // Save diff image to snapshots folder as diff.
    fs.writeFileSync(`${config.snapshotAbsolute}diff.png`, PNG.sync.write(diff));
  } catch (ex) {
    // Fail if images are not the same size.
    pixelDiffCount = 1;
  }

  // If update snapshots is configured, do not fail the test,
  // but override expected image with actual.
  if (args?.updateSnapshots) {
    fs.writeFileSync(`${config.snapshotAbsolute}expected.png`, PNG.sync.write(actualImage));
    console.log(
      `The expected '${config.snapshotName}' snapshot has been updated.\n\nReview the 'expected.png' in '${config.snapshotAbsolute}' and revert the update was not intended.`
    );
  }

  // Throw error in order to fail test if any pixel differences has been found.
  if (pixelDiffCount && !args.updateSnapshots) {
    throw new Error(
      `The '${config.snapshotName}' snapshot has changed.\n\nReview the 'diff.png' in '${config.snapshotAbsolute}' and rename 'actual.png' to 'expected.png' if you approve the changes.`
    );
  }

  return null;
}
