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

    if (!messageId || !count || count <= 0) {
      return interaction.reply({
        content:
          "You must provide a valid message ID and a positive number of winners.",
        ephemeral: true,
      });
    }

    try {
      // Defer the interaction
      await interaction.deferReply({ ephemeral: true });

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

      if (allReactedUsers.length < count) {
        return interaction.editReply({
          content: `Not enough unique users reacted to pick ${count} winners. Total unique users: ${allReactedUsers.length}`,
        });
      }

      // Randomly pick the specified number of unique winners
      const shuffledUsers = allReactedUsers.sort(() => 0.5 - Math.random());
      const winners = shuffledUsers.slice(0, count).map(async (userId) => {
        const user = await interaction.client.users.fetch(userId);
        return `${user.tag} (${user.id})`;
      });

      const winnersList = await Promise.all(winners);

      const embed = new EmbedBuilder()
        .setTitle("🎉 Winners Selected!")
        .setDescription(
          `Here are the ${count} randomly selected winners:\n\n${winnersList.join(
            "\n"
          )}`
        )
        .setColor("#D9CC43");

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.editReply({
        content:
          "An error occurred while trying to pick winners. Please try again later.",
      });
    }
  },
};
