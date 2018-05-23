class mongoUtil {
	constructor(url, dbName) {
		this.url = url;
		this.dbName = dbName;
	}

	async getDatabaseClient () {
		this.MongoClient = require('mongodb').MongoClient;

		return this.MongoClient.connect(this.url)
			.then(function (client) {
				return client;
			})
			.catch(function (err) {
				return err;
			})
	}

	insertMatch(client, matchJSON) {
		const db = client.db(this.dbName);
		
		return db.collection('matches').insert(matchJSON);
	}

	async matchExists(client, matchID) {
		const db = client.db(this.dbName);

		return db.collection('matches')
			.find({_id : matchID})
			.toArray();
	}

	async getMaxKillsByPlayerID(client, pID) {
		const db = client.db(this.dbName);

		return db.collection('matches')
			.find({playerID : pID, gameMode : {$ne : "warmodefpp"}})
			.sort({"kills":-1}).limit(1)
			.toArray();
	}

	async getLongestKillByPlayerID(client, pID) {
		const db = client.db(this.dbName);

		return db.collection('matches')
			.find({playerID : pID, gameMode : {$ne : "warmodefpp"}})
			.sort({"longestKill":-1}).limit(1)
			.toArray();
	}

	async getMaxDamageByPlayerID(client, pID) {
		const db = client.db(this.dbName);

		return db.collection('matches')
			.find({playerID : pID, gameMode : {$ne : "warmodefpp"}})
			.sort({"damageDealt":-1}).limit(1)
			.toArray();
	}

	async getMatchStats(client, pID) {
		const db = client.db(this.dbName);

		return db.collection('players')
			.find({"_id" : pID})
			.toArray();
	}

	async getRecentMatches(client, pID, amount) {
		const db = client.db(this.dbName);

		return db.collection('matches')
			.find({"playerID" : pID})
			.sort({"createdAt":-1})
			.limit(amount)
			.toArray();
	}

	async getPlayerByID(client, pID) {
		const db = client.db(this.dbName);

		return db.collection('players')
			.find({"_id" : pID}, {playerName : 1})
			.toArray();
	}

	async calculatePlayer(client, pID) {
		const db = client.db(this.dbName);

		let totalKills = 0;
		let totalDamage = 0;
		let totalWins = 0;
		let totalGames = 0;

		let soloKills = 0;
		let soloDamage = 0;
		let soloWins = 0;
		let soloGames = 0;

		let duoKills = 0;
		let duoDamage = 0;
		let duoWins = 0;
		let duoGames = 0;		

		let squadKills = 0;
		let squadDamage = 0;
		let squadWins = 0;
		let squadGames = 0;		

		let totalkda = 0;
		let totalAvgDmg = 0;
		let totalWinPct = 0;

		let solokda = 0;
		let soloAvgDmg = 0;
		let soloWinPct = 0;

		let duokda = 0;
		let duoAvgDmg = 0;
		let duoWinPct = 0;

		let squadkda = 0;
		let squadAvgDmg = 0;
		let squadWinPct = 0;

		let myRes = await db.collection('matches')
			.find({"playerID" : pID})
			.toArray();

		for (var match in myRes) {
			if(myRes[match]['gameMode'] == "solo-fpp") {
				soloKills += myRes[match]['kills'];
				soloDamage += myRes[match]['damageDealt'];
				if (myRes[match]['winPlace'] == 1) {
					soloWins++;
				}
				soloGames++;				
			} else if(myRes[match]['gameMode'] == "duo-fpp") {
				duoKills += myRes[match]['kills'];
				duoDamage += myRes[match]['damageDealt'];
				if (myRes[match]['winPlace'] == 1) {
					duoWins++;
				}
				duoGames++;				
			} else if(myRes[match]['gameMode'] == "squad-fpp") {
				squadKills += myRes[match]['kills'];
				squadDamage += myRes[match]['damageDealt'];
				if (myRes[match]['winPlace'] == 1) {
					squadWins++;
				}
				squadGames++;				
			} else if(myRes[match]['gameMode'] == "warmodefpp") {
				//tbd
			}

			if(myRes[match]['gameMode'] != "warmodefpp") {
				totalKills += myRes[match]['kills'];
				totalDamage += myRes[match]['damageDealt'];
				if (myRes[match]['winPlace'] == 1) {
					totalWins++;
				}
				totalGames++;
			}


		}

		totalkda = Math.round(totalKills/(totalGames - totalWins) * 100) / 100;
		totalAvgDmg = Math.round(totalDamage / totalGames * 100) / 100;
		totalWinPct = Math.round(totalWins/totalGames * 10000) / 100;

		solokda = Math.round(soloKills/(soloGames - soloWins) * 100) / 100;
		soloAvgDmg = Math.round(soloDamage / soloGames * 100) / 100;
		soloWinPct = Math.round(soloWins/soloGames * 10000) / 100;

		duokda = Math.round(duoKills/(duoGames - duoWins) * 100) / 100;
		duoAvgDmg = Math.round(duoDamage / duoGames * 100) / 100;
		duoWinPct = Math.round(duoWins/duoGames * 10000) / 100;

		squadkda = Math.round(squadKills/(squadGames - squadWins) * 100) / 100;
		squadAvgDmg = Math.round(squadDamage / squadGames * 100) / 100;
		squadWinPct = Math.round(squadWins/squadGames * 10000) / 100;
		
		db.collection('players').update(
		   { _id: pID },
		   { $set :
		   		{
			      totalkda: totalkda,
			      totalAverageDamageDealt: totalAvgDmg,
			      totalWinPercentage: totalWinPct,
			      totalKills: totalKills,
			      totalGames: totalGames,
			      totalWins: totalWins,

			      solokda: solokda,
			      soloAverageDamageDealt: soloAvgDmg,
			      soloWinPercentage: soloWinPct,
			      soloKills: soloKills,
			      soloGames: soloGames,
			      soloWins: soloWins,

			      duokda: duokda,
			      duoAverageDamageDealt: duoAvgDmg,
			      duoWinPercentage: duoWinPct,
			      duoKills: duoKills,
			      duoGames: duoGames,
			      duoWins: duoWins,

			      squadkda: squadkda,
			      squadAverageDamageDealt: squadAvgDmg,
			      squadWinPercentage: squadWinPct,
			      squadKills: squadKills,
			      squadGames: squadGames,
			      squadWins: squadWins
		   		}
		   }
		)
	}
}

module.exports = mongoUtil;