# Valorant Asset API Wrapper

A library to interact with valorant-api.com

## Installation

```
npm i valorant-api-js
```

## Usage

Example:

```javascript
const Client = require("valorant-api-js");

(async () => {
  const config = {language: "en-US"};

  const client = new Client(config); // Create a Client
  const allAgents = await client.getAgents(); // request all agents data
  // getPlayableAgents() would exclude the duplicate Sova

  console.log(allAgents); // see all agents data in console log
})();
```

# Documentation

## Client

```javascript
const Client = require("valorant-api-js");
const client = new Client(config); // config is optional
```

### Properties

- [x] Languages
  - ar-AE
  - de-DE
  - en-GB
  - en-US
  - es-ES
  - es-MX
  - fr-FR
  - id-ID
  - it-IT
  - ja-JP
  - ko-KR
  - pl-PL
  - pt-BR
  - ru-RU
  - th-TH
  - tr-TR
  - vi-VN
  - zh-CN
  - zh-TW

### Methods

- [x] request(endpoint)
- [x] [getAgents(uuid)](https://dash.valorant-api.com/endpoints/agents)
  - getPlayableAgents()
- [x] [getBuddies(uuid)](https://dash.valorant-api.com/endpoints/buddies)
  - getBuddyLevels(uuid)
- [x] [getBundles(uuid)](https://dash.valorant-api.com/endpoints/bundles)
- [x] [getCompetitiveTiers(uuid)](https://dash.valorant-api.com/endpoints/competitivetiers)
- [x] [getContentTiers(uuid)](https://dash.valorant-api.com/endpoints/contenttiers)
- [x] [getContracts(uuid)](https://dash.valorant-api.com/endpoints/contracts)
- [x] [getCurrencies(uuid)](https://dash.valorant-api.com/endpoints/currencies)
- [x] [getEvents(uuid)](https://dash.valorant-api.com/endpoints/events)
- [x] [getGamemodes(uuid)](https://dash.valorant-api.com/endpoints/gamemodes)
  - getGamemodeEquippables(uuid)
- [x] [getGear(uuid)](https://dash.valorant-api.com/endpoints/gear)
- [x] [getMaps(uuid)](https://dash.valorant-api.com/endpoints/maps)
- [x] [getPlayerCards(uuid)](https://dash.valorant-api.com/endpoints/playercards)
- [x] [getPlayerTitles(uuid)](https://dash.valorant-api.com/endpoints/playertitles)
- [x] [getSeasons(uuid)](https://dash.valorant-api.com/endpoints/seasons)
  - getCompetitiveSeasons(uuid)
- [x] [getSprays(uuid)](https://dash.valorant-api.com/endpoints/sprays)
  - getSprayLevels(uuid)
- [x] [getThemes(uuid)](https://dash.valorant-api.com/endpoints/themes)
- [x] [getWeapons(uuid)](https://dash.valorant-api.com/endpoints/weapons)
  - getSkins(uuid)
  - getSkinLevels(uuid)
  - getSkinChromas(uuid)
- [x] [getVersion()](https://dash.valorant-api.com/endpoints/version)

### Undocumented

- [x] getMissions(uuid)
- [x] getObjectives(uuid)

# License

MIT License
