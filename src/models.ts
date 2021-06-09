import { PixelmatchOptions } from "pixelmatch";

export interface SnapshotComparisonArgs {
	name: string;
	updateSnapshots?: boolean;
	pixelmatch?: PixelmatchOptions;
}