# pubg-bot
A discord bot that interacts with pubg api and stores/displays user stats
## Commands
### stats
- shows a comprehensive breakdown of player stats, live updated
- e.g. stats JMAC908

![alt text](https://github.com/driscoll21/pubg-bot/blob/master/pubg-bot/img/statsExample.png "Example of stats call")

### match
- shows stats from recent matches (default 5 if no match amount indicated)
- e.g. matches JMAC908 10

![alt text](https://github.com/driscoll21/pubg-bot/blob/master/pubg-bot/img/matchesExample.png "Example of match call")

### update
- calls the pubg api and saves any matches for the user that we don't already have saved
- e.g. update JMAC908
- TODO: automate this process, call update for all eligible users every x amount of minutes

![alt text](https://github.com/driscoll21/pubg-bot/blob/master/pubg-bot/img/updateExample.png "Example of update call")
## Usage
```javascript
const mongoUtil = require('./mongoUtil.js');
const mc = new mongoUtil(auth.dbClient, auth.dbName);
```
auth.json contains all your environment variables (pubg user ids, database url, api key) for easy editing.
## Functions
### getStats
- function that gets called when stats command is issued
- pulls the records for a player, then builds overall stat picture and prints to discord
### getLastXMatches
- function that gets called when matches command is issued
- pulls the recent matches for a player and prints to discord
### updateMatches
- function that gets called when update command is issued
- finds user id and checks to see if any unsaved matches exist. prints amount of matches updated to discord
## Notes
- match data only exists for 14 days. must call in that period of lose the opportunity to save match data
- must be used in a text channel named in auth.channels. (recommend turning off notification except for @mentions. Server settings -> Overview -> Default notification settings. Otherwise your users will be spammed with notifications)

