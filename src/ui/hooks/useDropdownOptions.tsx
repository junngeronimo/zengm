import orderBy from "lodash-es/orderBy";
import {
	PHASE,
	TEAM_STATS_TABLES,
	POSITIONS,
	bySport,
	isSport,
} from "../../common";
import { useLocalShallow } from "../util";
import type { LocalStateUI } from "../../common/types";

export const getSortedTeams = ({
	teamInfoCache,
	hideDisabledTeams,
}: {
	teamInfoCache: LocalStateUI["teamInfoCache"];
	hideDisabledTeams: boolean;
}) => {
	const array = [
		...orderBy(
			teamInfoCache.filter(t => !t.disabled),
			["region", "name", "tid"],
		),
	];

	if (!hideDisabledTeams) {
		array.push(
			...orderBy(
				teamInfoCache.filter(t => t.disabled),
				["region", "name", "tid"],
			),
		);
	}

	const object: { [key: string]: string | undefined } = {};
	for (const t of array) {
		object[t.abbrev] = `${t.region} ${t.name}`;
		if (t.disabled) {
			object[t.abbrev] += " (inactive)";
		}
	}

	return object;
};

const dropdownValues: { [key: string]: string | undefined } = {
	special: "All-Star Game",
	"all|||teams": "All Teams",
	watch: "Watch List",
	career: "Career Totals",
	regularSeason: "Regular Season",
	playoffs: "Playoffs",
	"10": "Past 10 Seasons",
	"all|||seasons": "All Seasons",
	perGame: "Per Game",
	per36: "Per 36 Minutes",
	totals: "Totals",
	shotLocations: "Shot Locations and Feats",
	advanced: "Advanced",
	gameHighs: "Game Highs",
	passing: "Passing",
	rushing: "Rushing/Receiving",
	defense: "Defense",
	kicking: "Kicking",
	returns: "Returns",
	champion: "Won Championship",
	mvp: "Most Valuable Player",
	finals_mvp: isSport("hockey") ? "Playoffs MVP" : "Finals MVP",
	dpoy: "Defensive Player of the Year",
	dfoy: "Defensive Forward of the Year",
	goy: "Goalie of the Year",
	smoy: "Sixth Man of the Year",
	mip: "Most Improved Player",
	roy: "Rookie of the Year",
	first_team: "First Team All-League",
	second_team: "Second Team All-League",
	third_team: "Third Team All-League",
	all_league: "All-League",
	first_def: "First Team All-Defensive",
	second_def: "Second Team All-Defensive",
	third_def: "Third Team All-Defensive",
	all_def: "All-Defensive",
	all_star: "All-Star",
	all_star_mvp: "All-Star MVP",
	dunk: "Slam Dunk Contest Winner",
	ppg_leader: "League Scoring Leader",
	rpg_leader: "League Rebounding Leader",
	apg_leader: "League Assists Leader",
	spg_leader: "League Steals Leader",
	bpg_leader: "League Blocks Leader",
	pss_leader: "League Passing Leader",
	rush_leader: "League Rushing Leader",
	rcv_leader: "League Receiving Leader",
	scr_leader: "League Scrimmage Yards Leader",
	pts_leader: "League Points Leader",
	g_leader: "League Goals Leader",
	ast_leader: "League Assists Leader",
	oroy: "Offensive Rookie of the Year",
	droy: "Defensive Rookie of the Year",
	"all|||types": "All Types",
	draft: "Draft",
	freeAgent: "FA Signed",
	reSigned: "Re-signed",
	release: "Released",
	trade: "Trades",
	team: "Team",
	opponent: "Opponent",
	by_team: "By Team",
	by_conf: "By Conference",
	by_div: "By Division",
	"all|||news": "All Stories",
	normal: "Normal",
	big: "Only Big News",
	newest: "Newest First",
	oldest: "Oldest First",
	league: "League",
	conf: "Conference",
	div: "Division",
	your_teams: "Your Teams",
	flag: "Flagged Players",
	note: "Players With Notes",
	either: "Either",
	skater: "Skaters",
	goalie: "Goalies",
	"all|||playoffsAll": "All Games",
	current: "Current",
	overview: "Overview",
	gameLog: "Game Log",
};

if (isSport("hockey")) {
	Object.assign(dropdownValues, {
		F: "Forwards",
		D: "Defensemen",
		G: "Goalies",
	});
}

export const getDropdownValue = (
	key: number | string,
	sortedTeams: {
		[key: string]: string | undefined;
	},
) => {
	if (typeof key === "number") {
		return String(key);
	}

	if (sortedTeams[key]) {
		return sortedTeams[key];
	}

	if (dropdownValues[key]) {
		return dropdownValues[key];
	}

	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	if (TEAM_STATS_TABLES[key]) {
		return TEAM_STATS_TABLES[key].name;
	}

	if (POSITIONS.includes(key)) {
		return key;
	}
};

const useDropdownOptions = (
	field: string,
	customOptions?: NonNullable<LocalStateUI["dropdownCustomOptions"]>[string],
) => {
	const state = useLocalShallow(state2 => ({
		hideDisabledTeams: state2.hideDisabledTeams,
		phase: state2.phase,
		season: state2.season,
		startingSeason: state2.startingSeason,
		teamInfoCache: state2.teamInfoCache,
	}));

	const sortedTeams = getSortedTeams(state);

	let keys: (number | string)[];

	if (customOptions) {
		if (customOptions.length === 0) {
			return [];
		} else {
			return customOptions.map(({ key, value }) => ({
				key,
				val: value,
			}));
		}
	} else if (field === "teams") {
		keys = Object.keys(sortedTeams);
	} else if (field === "teamsAndSpecial") {
		keys = ["special", ...Object.keys(sortedTeams)];
	} else if (field === "teamsAndAll") {
		keys = ["all|||teams", ...Object.keys(sortedTeams)];
	} else if (field === "teamsAndAllWatch") {
		keys = ["all|||teams", "watch", ...Object.keys(sortedTeams)];
	} else if (field === "teamsAndYours") {
		keys = ["your_teams", ...Object.keys(sortedTeams)];
	} else if (
		field === "seasons" ||
		field === "seasonsAndCareer" ||
		field === "seasonsAndAll" ||
		field === "seasonsAndCurrent" ||
		field === "seasonsAndOldDrafts" ||
		field === "seasonsHistory"
	) {
		keys = [];

		for (let season = state.season; season >= state.startingSeason; season--) {
			keys.push(season);
		}

		if (field === "seasonsAndCareer") {
			keys.unshift("career");
		}

		if (field === "seasonsAndAll") {
			keys.unshift("all|||seasons");
		}

		if (field === "seasonsAndCurrent") {
			keys.unshift("current");
		}

		if (field === "seasonsAndOldDrafts") {
			const NUM_PAST_SEASONS = 20; // Keep synced with league/create.js

			for (
				let season = state.startingSeason - 1;
				season >= state.startingSeason - NUM_PAST_SEASONS;
				season--
			) {
				keys.push(season);
			}

			// Remove current season, if draft hasn't happened yet
			if (state.phase < PHASE.DRAFT) {
				keys.shift();
			}
		}

		if (field === "seasonsHistory") {
			// Remove current season until playoffs end
			if (state.phase <= PHASE.PLAYOFFS) {
				keys.shift();
			}
		}
	} else if (field === "seasonsUpcoming") {
		keys = []; // For upcomingFreeAgents, bump up 1 if we're past the season

		const offset = state.phase <= PHASE.RESIGN_PLAYERS ? 0 : 1;

		for (let j = 4 + offset; j >= offset; j--) {
			keys.push(state.season + j);
		}
	} else if (field === "playoffs") {
		keys = ["regularSeason", "playoffs"];
	} else if (field === "playoffsAll") {
		keys = ["all|||playoffsAll", "regularSeason", "playoffs"];
	} else if (field === "shows") {
		keys = ["10", "all|||seasons"];
	} else if (field === "statTypes" || field === "statTypesAdv") {
		keys = bySport({
			basketball: [
				"perGame",
				"per36",
				"totals",
				...(field === "statTypesAdv"
					? ["shotLocations", "advanced", "gameHighs"]
					: []),
			],
			football: ["passing", "rushing", "defense", "kicking", "returns"],
			hockey: [
				"skater",
				"goalie",
				...(field === "statTypesAdv" ? ["advanced", "gameHighs"] : []),
			],
		});
	} else if (field === "awardType") {
		keys = bySport({
			basketball: [
				"champion",
				"mvp",
				"finals_mvp",
				"dpoy",
				"smoy",
				"mip",
				"roy",
				"first_team",
				"second_team",
				"third_team",
				"all_league",
				"first_def",
				"second_def",
				"third_def",
				"all_def",
				"all_star",
				"all_star_mvp",
				"dunk",
				"ppg_leader",
				"rpg_leader",
				"apg_leader",
				"spg_leader",
				"bpg_leader",
			],
			football: [
				"champion",
				"mvp",
				"finals_mvp",
				"dpoy",
				"oroy",
				"droy",
				"first_team",
				"second_team",
				"all_league",
				"pss_leader",
				"rush_leader",
				"rcv_leader",
				"scr_leader",
			],
			hockey: [
				"champion",
				"mvp",
				"finals_mvp",
				"dpoy",
				"dfoy",
				"roy",
				"goy",
				"first_team",
				"second_team",
				"all_league",
				"pts_leader",
				"g_leader",
				"ast_leader",
			],
		});
	} else if (field === "eventType") {
		keys = [
			"all|||types",
			"draft",
			"freeAgent",
			"reSigned",
			"release",
			"trade",
		];
	} else if (field === "teamOpponent") {
		keys = ["team", "opponent"];
	} else if (field === "teamOpponentAdvanced") {
		keys = Object.keys(TEAM_STATS_TABLES);
	} else if (field === "teamAdvanced") {
		keys = Object.keys(TEAM_STATS_TABLES).filter(
			key => !key.includes("pponent"),
		);
	} else if (field === "teamRecordType") {
		keys = ["by_team", "by_conf", "by_div"];
	} else if (field === "teamRecordsFilter") {
		keys = ["all|||teams", "your_teams"];
	} else if (field === "depth") {
		keys = isSport("hockey") ? ["F", "D", "G"] : POSITIONS;
	} else if (field === "newsLevels") {
		keys = ["big", "normal", "all|||news"];
	} else if (field === "newestOldestFirst") {
		keys = ["newest", "oldest"];
	} else if (field === "standingsType") {
		keys = ["league", "conf", "div"];
	} else if (field === "flagNote") {
		keys = ["flag", "note", "either"];
	} else if (field === "playerProfile") {
		keys = ["overview", "gameLog"];
	} else {
		throw new Error(`Unknown Dropdown field: ${field}`);
	}

	const newOptions: {
		key: number | string;
		val: string | undefined;
	}[] = keys.map(rawKey => {
		const key =
			typeof rawKey === "string" && rawKey.includes("|||")
				? rawKey.split("|||")[0]
				: rawKey;
		return {
			key,
			val: getDropdownValue(rawKey, sortedTeams),
		};
	});

	return newOptions;
};

export default useDropdownOptions;
