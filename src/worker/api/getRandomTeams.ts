import orderBy from "lodash-es/orderBy";
import getTeamInfos from "../../common/getTeamInfos";
import teamInfos from "../../common/teamInfos";
import type { Div } from "../../common/types";
import { random } from "../util";

type Clusters = {
	center: [number, number];
	pointIndexes: number[];
}[];

const stringifyClusters = (clusters: Clusters) => {
	const clusters2 = clusters.map(cluster => [...cluster.pointIndexes].sort());

	return JSON.stringify(clusters2);
};

const NUM_TRIES = 100;
const ITERATION_LIMIT = 1000;

// This is normal k-means clustering, just with some very crudely imposed static cluster sizes. Still seems to work pretty well, assuing `points` is fairly small and `NUM_TRIES` is fairly large.
const kmeansFixedSize = (
	points: [number, number][],
	clusterSizes: number[],
) => {
	const minima = [0, 1].map(i => Math.min(...points.map(row => row[i])));
	const maxima = [0, 1].map(i => Math.max(...points.map(row => row[i])));

	const pointIndexes = points.map((point, i) => i);

	const resetClusters = () =>
		clusterSizes.map(() => ({
			center: [
				random.uniform(minima[0], maxima[0]),
				random.uniform(minima[1], maxima[1]),
			] as [number, number],
			pointIndexes: [] as number[],
		}));

	let bestClusters: Clusters | undefined;
	let bestScore = Infinity;

	for (let tryNum = 0; tryNum < NUM_TRIES; tryNum++) {
		let clusters = resetClusters();
		let prevClusters = "";

		let iteration = 0;
		while (true) {
			// Randomize order of points, to help find different solutions given the cluster size constraint
			random.shuffle(pointIndexes);

			// Assign each point to a cluster
			for (const pointIndex of pointIndexes) {
				const point = points[pointIndex];

				let minDistance = Infinity;
				let clusterIndex: number | undefined;
				for (let i = 0; i < clusters.length; i++) {
					if (clusters[i].pointIndexes.length >= clusterSizes[i]) {
						continue;
					}

					const center = clusters[i].center;
					const distance =
						(point[0] - center[0]) ** 2 + (point[1] - center[1]) ** 2;

					if (distance < minDistance) {
						minDistance = distance;
						clusterIndex = i;
					}
				}

				if (clusterIndex === undefined) {
					throw new Error("undefined clusterIndex");
				}

				clusters[clusterIndex].pointIndexes.push(pointIndex);
			}

			const clustersString = stringifyClusters(clusters);
			if (clustersString === prevClusters) {
				break;
			}

			iteration += 1;

			if (iteration > ITERATION_LIMIT) {
				// console.log("Did not converge");
				break;
			}

			// Update centers, see if we do better next time
			for (const { center, pointIndexes } of clusters) {
				center[0] = 0;
				center[1] = 0;
				for (const pointIndex of pointIndexes) {
					const point = points[pointIndex];
					center[0] += point[0];
					center[1] += point[1];
				}
				center[0] /= pointIndexes.length;
				center[1] /= pointIndexes.length;
			}

			clusters = resetClusters();
			prevClusters = clustersString;
		}

		// Calculate score, see if it is better than previous
		let score = 0;
		for (const { center, pointIndexes } of clusters) {
			for (const pointIndex of pointIndexes) {
				const point = points[pointIndex];
				score += (point[0] - center[0]) ** 2 + (point[1] - center[1]) ** 2;
			}
		}

		if (score < bestScore) {
			bestClusters = clusters;
			bestScore = score;
		}

		// console.log(tryNum, score, clusters);
	}

	if (!bestClusters) {
		throw new Error("undefind bestClusters");
	}
	// console.log(bestScore, bestClusters);

	// Sort each cluster north to south
	// return bestClusters.map(cluster => orderBy(cluster, pointIndex => points[pointIndex][0], "desc"));
	return bestClusters;
};

const getRandomTeams = (
	divs: Div[],
	numTeamsPerDiv: number[],
	weightByPopulation: boolean,
) => {
	let numTeamsTotal = 0;
	for (const num of numTeamsPerDiv) {
		numTeamsTotal += num;
	}

	let weightFunction: ((abbrev: string) => number) | undefined;
	if (weightByPopulation) {
		weightFunction = abbrev => teamInfos[abbrev].pop;
	}

	const abbrevsRemaining = new Set(Object.keys(teamInfos));
	if (abbrevsRemaining.size < numTeamsTotal) {
		return `There are only ${abbrevsRemaining.size} built-in teams, so your current set of ${numTeamsTotal} teams cannot be replaced by random built-in teams.`;
	}
	const abbrevs: string[] = [];
	for (let i = 0; i < numTeamsTotal; i++) {
		const abbrev = random.choice(Array.from(abbrevsRemaining), weightFunction);
		abbrevs.push(abbrev);
		abbrevsRemaining.delete(abbrev);
	}

	const teamInfoCluster = abbrevs.map(
		abbrev =>
			[teamInfos[abbrev].latitude, teamInfos[abbrev].longitude] as [
				number,
				number,
			],
	);

	const clusters = kmeansFixedSize(teamInfoCluster, numTeamsPerDiv);

	const teamInfosInput = [];

	for (let i = 0; i < divs.length; i++) {
		const div = divs[i];

		const clusterSorted = orderBy(clusters[i].pointIndexes, abbrevIndex => {
			const teamInfo = teamInfos[abbrevs[abbrevIndex]];
			return `${teamInfo.region} ${teamInfo.name}`;
		});

		for (const tid of clusterSorted) {
			teamInfosInput.push({
				tid,
				cid: div.cid,
				did: div.did,
				abbrev: abbrevs[tid],
			});
		}
	}

	// Clustering to assign divisions

	return getTeamInfos(teamInfosInput);
};

export default getRandomTeams;
