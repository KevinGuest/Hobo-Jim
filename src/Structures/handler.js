const { REST, Routes } = require("discord.js");

module.exports = {
  async execute(client) {
    const { TOKEN, BOT_ID } = client.config;
    const rest = new REST({ version: "10" }).setToken(TOKEN);

    const command = client.commands.get("add");
    

    if (!command || !command.data) {
      console.error("Command not found or improperly structured!");
      return;
    }

    try {
      console.log("Registering global command...");
      await rest.put(Routes.applicationCommands(BOT_ID), {
        body: [command.data],
      });
      console.log("Global command registered successfully!");
    } catch (error) {
      console.error("Error registering global command:", error);
    }
  },
};
