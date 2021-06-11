import fs = require('fs');
const PNG = require('pngjs').PNG;
import pixelmatch = require('pixelmatch');
import { SnapshotComparisonArgs } from './models';

let currentRun: Cypress.BeforeRunDetails | undefined;
let currentSpec: Cypress.Spec | undefined;

export function addCypressSnapshotsPlugin(
  on: Cypress.PluginEvents,
  conf: Cypress.PluginConfig
): void {
  on('before:run', (data: Cypress.BeforeRunDetails) => {
    currentRun = data;
  });
  on('before:spec', (spec: Cypress.Spec) => {
    currentSpec = spec;
  });
  on('after:screenshot', ({ path }) => {
    // Override previous screenshot, so on test refresh the newest is accessed.
    if (path.includes('__snapshot__')) {
      fs.renameSync(path, path.replace(/ \(\d*\)/i, ''));
    }
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
    updateSnapshots: process.env['npm_config_updateSnapshots'] || false,
  };

  // Make sure all necessary directories are created.
  if (!fs.existsSync(config.snapshotAbsolute)) {
    fs.mkdirSync(config.snapshotAbsolute, { recursive: true });
  }

  // Get currently screenshoted image.
  const actualImage = PNG.sync.read(
    fs.readFileSync(
      `${config.screenshotsAbsolute}__snapshot__${config.snapshotName}.png`
    )
  );
  // Save currently screenshoted image to snapshots folder as actual.
  fs.writeFileSync(
    `${config.snapshotAbsolute}actual.png`,
    PNG.sync.write(actualImage)
  );
  const { width, height } = actualImage;

  // Get previously saved and expected image.
  let expectedImage: any | undefined;
  try {
    expectedImage = PNG.sync.read(
      fs.readFileSync(`${config.snapshotAbsolute}expected.png`)
    );
  } catch {}

  // Create diff image.
  const diff = new PNG({ width, height });
  let pixelDiffCount: number | undefined;
  try {
    pixelDiffCount = pixelmatch(
      expectedImage.data,
      actualImage.data,
      diff.data,
      width,
      height,
      args.pixelmatch
    );
  } catch (ex) {
    // If images are not the same size pixelmatch will throw an error.
    pixelDiffCount = width * height;
  }

  // Save diff image to snapshots folder as diff.
  fs.writeFileSync(`${config.snapshotAbsolute}diff.png`, PNG.sync.write(diff));

  // If any pixel has changed and update snapshots is configured, override expected image with actual.
  if (config.updateSnapshots && pixelDiffCount) {
    fs.writeFileSync(
      `${config.snapshotAbsolute}expected.png`,
      PNG.sync.write(actualImage)
    );
    throw new Error(
      `The "${config.snapshotName}" snapshot has been updated and should be re-tested. See ${config.snapshotAbsolute}`
    );
  }
  // Fail if no update is configured and expected image is missing.
  else if (!expectedImage) {
    throw new Error(
      `An expected "${config.snapshotName}" snapshot has not been yet defined. See ${config.snapshotAbsolute}`
    );
  }
  // Fail if any pixel has changed and update has not been configured.
  else if (pixelDiffCount && !config.updateSnapshots) {
    throw new Error(
      `The "${config.snapshotName}" snapshot has changed. ${pixelDiffCount} pixels does not match. See ${config.snapshotAbsolute}`
    );
  }
  // Happy-case.
  else {
    return null;
  }
}
