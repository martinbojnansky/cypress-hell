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
    specPath: currentSpec?.relative,
    specType: currentSpec?.specType,
    snapshotName: args.name,
    snapshotPath: `${currentSpec?.relative}-snapshots/${args.name}/`,
    snapshotsPath: `${currentSpec?.relative}-snapshots/`,
    screenshotsPath: `${currentSpec?.relative.replace(
      '/integration/',
      '/screenshots/'
    )}/`, // TODO: Tests folder or screenshots folder can be configured
    updateSnapshots: process.env['npm_config_updatesnapshots'] || false,
    ignoreSnapshotError:
      process.env['npm_config_ignoresnapshoterror'] === 'true' ? true : false,
    snapshotsOs: process.env['npm_config_snapshotsos']
      ? `--${process.env['npm_config_snapshotsos']}`
      : '--unknown',
  };

  // Make sure all necessary directories are created.
  if (!fs.existsSync(config.snapshotPath)) {
    fs.mkdirSync(config.snapshotPath, { recursive: true });
  }

  // Get currently screenshoted image.
  const actualImage = PNG.sync.read(
    fs.readFileSync(
      `${config.screenshotsPath}__snapshot__${config.snapshotName}.png`
    )
  );
  // Save currently screenshoted image to snapshots folder as actual.
  fs.writeFileSync(
    `${config.snapshotPath}actual${config.snapshotsOs}.snap.png`,
    PNG.sync.write(actualImage)
  );
  const { width, height } = actualImage;

  // Get previously saved and expected image.
  let expectedImage: any | undefined;
  try {
    expectedImage = PNG.sync.read(
      fs.readFileSync(
        `${config.snapshotPath}expected${config.snapshotsOs}.snap.png`
      )
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
  fs.writeFileSync(
    `${config.snapshotPath}diff${config.snapshotsOs}.snap.png`,
    PNG.sync.write(diff)
  );

  // If any pixel has changed and update snapshots is configured, override expected image with actual.
  if (config.updateSnapshots && pixelDiffCount) {
    fs.writeFileSync(
      `${config.snapshotPath}expected${config.snapshotsOs}.snap.png`,
      PNG.sync.write(actualImage)
    );
    return throwError(
      `The "${config.snapshotName}" snapshot has been updated and should be re-tested. See ${config.snapshotPath}`,
      config.ignoreSnapshotError
    );
  }
  // Fail if no update is configured and expected image is missing.
  else if (!expectedImage) {
    return throwError(
      `An expected "${config.snapshotName}" snapshot has not been yet defined. See ${config.snapshotPath}`,
      config.ignoreSnapshotError
    );
  }
  // Fail if any pixel has changed and update has not been configured.
  else if (pixelDiffCount && !config.updateSnapshots) {
    return throwError(
      `The "${config.snapshotName}" snapshot has changed. ${pixelDiffCount} pixels does not match. See ${config.snapshotPath}`,
      config.ignoreSnapshotError
    );
  }
  // Happy-case.
  else {
    return null;
  }
}

function throwError(msg: string, ignoreError: boolean): null {
  if (ignoreError) {
    console.log(msg);
    return null;
  } else {
    throw new Error(msg);
  }
}
