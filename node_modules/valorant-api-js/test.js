const Client = require("./src/valorant-api.js");

(async () => {
  const config = {
    language: "en-US",
  };

  const client = new Client(config); // Create a Client

  const allAgents = await client.getAgents(); // request all agents data
  const playableAgents = await client.getAgents(true);

  console.log(playableAgents); // see all agents data in console log
})();
