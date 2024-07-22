/**
 * valorant-api-js
 * Module to make API calls to valorant-api.com
 * API made by @Officer#9999
 *
 * @author Vanxh & Xyrrm
 */

// modules
const axios = require("axios");
const base_url = `https://valorant-api.com/v1/`;

// main class
class Client {
  constructor(config = {}) {
    this.language = config.language || "en-US";
  }

  async request(endpoint) {
    var config = {
      method: `get`,
      url: `${base_url}${endpoint}?language=${this.language}`,
    };
    try {
      return (await axios(config)).data;
    } catch (e) {
      return e;
    }
  }

  async getAgents(uuid) {
    return uuid ? await this.request(`agents/${uuid}`) : await this.request(`agents`);
  }

  async getPlayableAgents() {
    return await this.request(`agents?isPlayableCharacter=true`);
  }

  async getBuddies(uuid) {
    return uuid ? await this.request(`buddies/${uuid}`) : await this.request(`buddies`);
  }

  async getBuddyLevels(uuid) {
    return uuid ? await this.request(`buddies/levels/${uuid}`) : await this.request(`buddies/levels`);
  }

  async getBundles(uuid) {
    return uuid ? await this.request(`bundles/${uuid}`) : await this.request(`bundles`);
  }

  async getCompetitiveTiers(uuid) {
    return uuid ? await this.request(`competitivetiers/${uuid}`) : await this.request(`competitivetiers`);
  }

  async getContentTiers(uuid) {
    return uuid ? await this.request(`contenttiers/${uuid}`) : await this.request(`contenttiers`);
  }

  async getContracts(uuid) {
    return uuid ? await this.request(`contracts/${uuid}`) : await this.request(`contracts`);
  }

  async getCurrencies(uuid) {
    return uuid ? await this.request(`currencies/${uuid}`) : await this.request(`currencies`);
  }

  async getEvents(uuid) {
    return uuid ? await this.request(`events/${uuid}`) : await this.request(`events`);
  }

  async getGamemodes(uuid) {
    return uuid ? await this.request(`gamemodes/${uuid}`) : await this.request(`gamemodes`);
  }

  async getGamemodeEquippables(uuid) {
    return uuid ? await this.request(`gamemodes/equippables/${uuid}`) : await this.request(`gamemodes/equippables`);
  }

  async getGear(uuid) {
    return uuid ? await this.request(`gear/${uuid}`) : await this.request(`gear`);
  }

  async getMaps(uuid) {
    return uuid ? await this.request(`maps/${uuid}`) : await this.request(`maps`);
  }

  async getPlayerCards(uuid) {
    return uuid ? await this.request(`playercards/${uuid}`) : await this.request(`playercards`);
  }

  async getPlayerTitles(uuid) {
    return uuid ? await this.request(`playertitles/${uuid}`) : await this.request(`playertitles`);
  }

  async getSeasons(uuid) {
    return uuid ? await this.request(`seasons/${uuid}`) : await this.request(`seasons`);
  }

  async getCompetitiveSeasons(uuid) {
    return uuid ? await this.request(`seasons/competitive/${uuid}`) : await this.request(`seasons/competitive`);
  }

  async getSprays(uuid) {
    return uuid ? await this.request(`sprays/${uuid}`) : await this.request(`sprays`);
  }

  async getSprayLevels(uuid) {
    return uuid ? await this.request(`sprays/levels/${uuid}`) : await this.request(`sprays/levels`);
  }

  async getThemes(uuid) {
    return uuid ? await this.request(`themes/${uuid}`) : await this.request(`themes`);
  }

  async getWeapons(uuid) {
    return uuid ? await this.request(`weapons/${uuid}`) : await this.request(`weapons`);
  }

  async getSkins(uuid) {
    return uuid ? await this.request(`weapons/skins/${uuid}`) : await this.request(`weapons/skins`);
  }

  async getSkinLevels(uuid) {
    return uuid ? await this.request(`weapons/skinlevels/${uuid}`) : await this.request(`weapons/skinlevels`);
  }

  async getSkinChromas(uuid) {
    return uuid ? await this.request(`weapons/skinchromas/${uuid}`) : await this.request(`weapons/skinchromas`);
  }

  async getVersion() {
    return await this.request(`version`);
  }

  //Undocumented
  async getMissions(uuid) {
    return uuid ? await this.request(`missions/${uuid}`) : await this.request(`missions`);
  }

  async getObjectives(uuid) {
    return uuid ? await this.request(`objectives/${uuid}`) : await this.request(`objectives`);
  }
}
module.exports = Client;
