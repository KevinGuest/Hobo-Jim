const { EmbedBuilder } = require("discord.js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const EMBED_COLOR = "#1DC249";

module.exports = {
  data: {
    name: "stats",
    description: "Displays user stats information on a specific user.",
    options: [
      {
        type: 3, // STRING type
        name: "username",
        description: "The username for the bot to show.",
        required: true,
      },
    ],
    dm_permission: false,
  },
  async execute(interaction) {
    const username = interaction.options.getString("username");

    await interaction.reply(`Fetching information on ${username}...`);

    try {
      const res = await fetch(`https://bobba.ca/api/public/users/${username}`);
      if (!res.ok) {
        if (res.status === 404) {
          return interaction.editReply(
            `:no_entry: The user '${username}' was not found.`
          );
        }
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const userData = await res.json();
      const roleplay = userData.roleplay || {};

      // Construct the embed
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setAuthor({
          name: userData.name,
          iconURL: `https://imager.bobba.ca/?figure=${userData.figureString}&gesture=sml&direction=4&head_direction=3&headonly=1&size=l`,
        })
        .setDescription(`Bobba Pages Information:`)
        .addFields(
          {
            name: "Username",
            value: `[${userData.name}](https://bobba.ca/character/${userData.name})`,
            inline: true,
          },
          { name: "Created At", value: userData.memberSince, inline: true },
          { name: "Last Seen", value: userData.lastSeen, inline: true },

          { name: "Job", value: roleplay.job || "No Job", inline: true },
          { name: "Gang", value: roleplay.gang || "No Gang", inline: true },
          {
            name: "Married To",
            value: roleplay.married?.spouse || "Not Married",
            inline: true,
          },

          {
            name: "Punches Thrown",
            value: (roleplay.punchesThrown || 0).toLocaleString(),
            inline: true,
          },
          {
            name: "Punches Received",
            value: (roleplay.punchesReceived || 0).toLocaleString(),
            inline: true,
          },
          {
            name: "Melee Hits",
            value: (roleplay.meleeHits || 0).toLocaleString(),
            inline: true,
          },

          {
            name: "Bombs Thrown",
            value: (roleplay.bombsThrown || 0).toLocaleString(),
            inline: true,
          },
          {
            name: "Damage Dealt",
            value: (roleplay.damageDealt || 0).toLocaleString(),
            inline: true,
          },
          {
            name: "Damage Received",
            value: (roleplay.damageReceived || 0).toLocaleString(),
            inline: true,
          },

          {
            name: "Kills",
            value: (roleplay.kills || 0).toLocaleString(),
            inline: true,
          },
          {
            name: "Deaths",
            value: (roleplay.deaths || 0).toLocaleString(),
            inline: true,
          },
          {
            name: "Times Arrested",
            value: (roleplay.arrested || 0).toLocaleString(),
            inline: true,
          }
        );

      await interaction.editReply({ content: "", embeds: [embed] });
    } catch (e) {
      console.error("Error fetching stats:", e);
      await interaction.editReply(
        `A server error occurred while fetching stats for '${username}'. Please try again later.`
      );
    }
  },
};
