const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  data: {
    name: "pick",
    description:
      "Picks random winners from the reactions on a specified message.",
    options: [
      {
        name: "messageid",
        type: 3, // String type
        description: "The ID of the message to pick winners from.",
        required: true,
      },
      {
        name: "count",
        type: 4, // Integer type
        description: "The number of winners to pick.",
        required: true,
      },
    ],
  },

  async execute(interaction) {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    const messageId = interaction.options.getString("messageid");
    const count = interaction.options.getInteger("count");
    const excludedRoles = [
      "1178230546216779787",
      "1317763715642429514",
      "1315171049532555277",
      "1217524878941487177",
      "1313334164967395412",
      "1308685225152352328",
    ];
    const ticketChannelId = "1315172183890333818";

    if (!messageId || !count || count <= 0) {
      return interaction.reply({
        content:
          "You must provide a valid message ID and a positive number of winners.",
        ephemeral: true,
      });
    }

    try {
      // Defer the interaction
      await interaction.deferReply();

      const channel = interaction.channel;

      // Fetch the message by ID
      const message = await channel.messages.fetch(messageId).catch(() => null);
      if (!message) {
        return interaction.editReply({
          content:
            "Message not found. Ensure the message ID is correct and belongs to this channel.",
        });
      }

      // Check for reactions on the message
      const reactions = message.reactions.cache;
      if (!reactions.size) {
        return interaction.editReply({
          content: "No reactions found on the specified message.",
        });
      }

      // Collect all users who reacted
      let allReactedUsers = [];
      for (const reaction of reactions.values()) {
        const users = await reaction.users.fetch();
        allReactedUsers.push(...users.keys());
      }

      // Remove duplicates (if users reacted with multiple emojis)
      allReactedUsers = [...new Set(allReactedUsers)];

      // Filter out users with excluded roles
      const guild = interaction.guild;
      const validUsers = [];

      for (const userId of allReactedUsers) {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) continue;

        const hasExcludedRole = excludedRoles.some((roleId) =>
          member.roles.cache.has(roleId)
        );
        if (!hasExcludedRole) {
          validUsers.push(userId);
        }
      }

      if (validUsers.length < count) {
        return interaction.editReply({
          content: `Not enough valid users reacted to pick ${count} winners. Total valid users: ${validUsers.length}`,
        });
      }

      // Randomly pick the specified number of unique winners
      const shuffledUsers = validUsers.sort(() => 0.5 - Math.random());
      const winners = shuffledUsers.slice(0, count).map(async (userId) => {
        const user = await interaction.client.users.fetch(userId);
        return `<@${user.id}>`;
      });

      const winnersList = await Promise.all(winners);

      const embed = new EmbedBuilder()
        .setTitle("🎉 Winners Selected!")
        .setDescription(
          `Congratulations to the following winners:\n\n${winnersList.join(
            "\n"
          )}\n\n**Instructions:**\nPlease create a ticket in <#${ticketChannelId}> referencing this message and include your in-game username.`
        )
        .setColor("#D9CC43");

      return interaction.editReply({
        content: null,
        embeds: [embed],
      });
    } catch (error) {
      console.error(error);
      return interaction.editReply({
        content:
          "An error occurred while trying to pick winners. Please try again later.",
      });
    }
  },
};
