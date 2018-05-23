var auth = require('./auth.json');

const Discord = require("discord.js");
const client = new Discord.Client();

const mongoUtil = require('./mongoUtil.js');
const mc = new mongoUtil(auth.dbClient, "pubg");


function runBot() {
	client.login(auth.token);

	client.on("ready", () => {
	  console.log("ready");
	});

	client.on("message", (message) => {
		function msg (x) {
			message.channel.send(x);
		}

		if (message.author.bot) {
			return;
		}

		//must be used in a named channel inside auth[channels]
		if(!auth['channels'].includes(message.channel.name)) {
			return;
		}

		const args = message.content.split(/ +/);
		const command = args.shift().toLowerCase();
		const commandUser = args.shift();
		const amount = args.shift(); 

		const authorID = message.author.id;
		let playerID = "";

		if (!auth['commands'].includes(command)) {
			printHelp(msg, command);
			return;
		}

		//if we have another argument and its not a bot
		if (commandUser) {
			playerID = auth.userIDs[commandUser];

			if (!playerID) {
				message.channel.send("\"" + commandUser + "\" user not found.")
				return;
			}
		} else if (!commandUser) { //if no user is entered, try and get from the sender of the message
			playerID = auth.userIDs[authorID];
			if (!playerID) {
				message.channel.send("Current user not found.")
				return;
			}
		}
	
		try {
			if (command == "stats" || command == "s") {
				getStats(msg, playerID);
			} else if (command == "update" || command == "u") {
				updateMatches(msg, playerID);
			} else if (command == "matches" || command == "m") {
				getLastXMatches(msg, playerID, amount)
			}
		}
		catch (err) {
			throw err;
		}
	});

}

runBot();

async function getStats(myFN, pID) {
	try {
		const clie = await mc.getDatabaseClient();

		const matchStats = await mc.getMatchStats(clie, pID);
		if (matchStats) {
			let maxKills = await mc.getMaxKillsByPlayerID(clie, pID);
			let maxDamage = await mc.getMaxDamageByPlayerID(clie, pID);
			let longestKill = await mc.getLongestKillByPlayerID(clie, pID);

			let resMsg = "```\n" + matchStats[0]['playerName'] + "\n";
			resMsg += "-----------------------------------------------\n";
			resMsg += "Mode: Overall\n";
			
			resMsg += prettyPrint("KDA: " + matchStats[0]['totalkda'])
			resMsg += "Average Damage Dealt: " + matchStats[0]['totalAverageDamageDealt'] + "\n"
			resMsg += prettyPrint("Win %: " + matchStats[0]['totalWinPercentage'])
			resMsg += "Total Games: " + matchStats[0]['totalGames'] + "\n\n"
			resMsg += prettyPrint("Most Kills: " + maxKills[0]['kills'])
			resMsg += "Highest Damage Dealt: " + maxDamage[0]['damageDealt'] + "\n"
			resMsg += prettyPrint("Longest Kill: " + longestKill[0]['longestKill'] + "\n")

			resMsg += "-----------------------------------------------\n";
			resMsg += "Mode: Solo\n";
			if (matchStats[0]['soloGames']) {
				resMsg += prettyPrint("KDA: " + matchStats[0]['solokda'])
				resMsg += "Average Damage Dealt: " + matchStats[0]['soloAverageDamageDealt'] + "\n"
				resMsg += prettyPrint("Win %: " + matchStats[0]['soloWinPercentage'])
				resMsg += "Total Games: " + matchStats[0]['soloGames'] + "\n"
			} else {
				resMsg += "No games found.\n"
			}

			resMsg += "-----------------------------------------------\n";
			resMsg += "Mode: Duos\n";
			if (matchStats[0]['duoGames']) {
				resMsg += prettyPrint("KDA: " + matchStats[0]['duokda'])
				resMsg += "Average Damage Dealt: " + matchStats[0]['duoAverageDamageDealt'] + "\n"
				resMsg += prettyPrint("Win %: " + matchStats[0]['duoWinPercentage'])
				resMsg += "Total Games: " + matchStats[0]['duoGames'] + "\n"
			} else {
				resMsg += "No games found.\n"
			}

			resMsg += "-----------------------------------------------\n";
			resMsg += "Mode: Squads\n";
			if(matchStats[0]['squadGames']) {
				resMsg += prettyPrint("KDA: " + matchStats[0]['squadkda'])
				resMsg += "Average Damage Dealt: " + matchStats[0]['squadAverageDamageDealt'] + "\n"
				resMsg += prettyPrint("Win %: " + matchStats[0]['squadWinPercentage'])
				resMsg += "Total Games: " + matchStats[0]['squadGames'] + "\n"
			} else {
				resMsg += "No games found.\n"
			}
			resMsg += "-----------------------------------------------\n";
			resMsg += "```";
			myFN(resMsg);
		} else {
			myFN("User not found.");
		}

		return matchStats;

	} catch (err) {
		throw err;
	}
}

async function getLastXMatches(myFN, pID, amount) {
	try {
		const clie = await mc.getDatabaseClient();

		const player = await mc.getPlayerByID(clie, pID);
		const playerName = player[0]['playerName'];

		if (!amount) {
			amount = 5;
		}

		const matches = await mc.getRecentMatches(clie, pID, parseInt(amount));

		let resMsg = "```\n" + playerName + "\n";

		for (var match in matches) {
			resMsg += "---------------------------------\n";
			resMsg += prettyPrint("Mode: " + matches[match]['gameMode']);
			resMsg += "Place: " + matches[match]['winPlace'] + "\n";
			resMsg += prettyPrint("Kills: " + matches[match]['kills']);
			resMsg += "Damage: " + matches[match]['damageDealt'] + "\n";
		}
		resMsg += "---------------------------------\n";
		resMsg += "```"

		myFN(resMsg);
		return matches;

	} catch (err) {
		throw err;
	}
}

async function updateMatches(myFN, pID) {
	const api = require('../pubg-api/api.js')
	const pubg = new api(auth.apiKey);
	let updatedMatches = 0;

	try {
		const clie = await mc.getDatabaseClient();
		const playerCall = await pubg.makeCall('pc-na', pID, '', 'players');
		if (playerCall['statusCode']) {
			throw "Account not found";
			myFN("Username not found.")
		}

		const playerMatches = pubg.getMatchIDsByPlayer(playerCall);
		
		if (playerMatches['matches'].length > 0) {
			myFN("Your match data is being fetched...");
		}

		while(playerMatches['matches'].length > 0) {
			const myMatchID = playerMatches['matches'][0];
			const myPlayerID = playerMatches['playerID']
			const myMatchesID = myPlayerID + " " + myMatchID

			const myMatch = await mc.matchExists(clie, myMatchesID)
			
			if (myMatch.length > 0) {
				console.log("Match " + myMatchID + " already exists for the current player.")
				playerMatches['matches'].shift();
			} else {
				console.log("Match " + myMatchID + " does not yet exist for the current player.")

				const matchCall = await pubg.makeCall('pc-na', '', myMatchID, 'matches');
				const statusCode = matchCall['statusCode']
				if (statusCode) {
					//401 - api key missing
					//404 - resource not found
					//415 - unspecified media type
					//429 - too many requests
					if (statusCode == '429') {
						console.log('429 error - too many requests')
						const timeOut = playerCall['options']['response']['headers']['x-ratelimit-reset'];
						console.log("nanoseconds until we can call again:" + timeOut);
						// setTimeout(timeOut)
					} else {
						console.log("Unspecified error for match " + myMatchID + " for the current player.")
					}
				} else {
					updatedMatches++;
					console.log("The match call worked. Processing...")
					const playerStats = pubg.getPlayerStatsByMatch(myPlayerID, matchCall);

					const insertRes = await mc.insertMatch(clie, playerStats);
					
					console.log("Match " + myMatchID + " successfully saved for the current player.\n")

					playerMatches['matches'].shift();
				}
			}
		}

		if (updatedMatches == 0) {
			myFN("All matches up to date.")
		} else if (updatedMatches == 1) {
			myFN(updatedMatches + " match updated.");
		} else {
			myFN(updatedMatches + " matches updated.");
		}
		const myCalc = await mc.calculatePlayer(clie, pID);

		clie.close();
	} catch(err) {
		throw err;
	}
}

function printHelp(myFN, command) {
	let printMsg = "";
	if (command) {
		printMsg += "Invalid command \"" + command + "\".\n"
	}
	printMsg += "The current available commands are stats, update and matches.\nEach command should be followed by a valid username. E.G. stats mthatcher"
	myFN(printMsg);
}

function prettyPrint(str) {
	for (var i = str.length; i < 18; i++) {
		str += " ";
	}

	return str;
}