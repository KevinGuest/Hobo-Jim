const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'purge',
    description: 'Delete a specified number of messages from the channel.',
    options: [
      {
        name: 'amount',
        description: 'The number of messages to delete (1-100)',
        type: 4, // Integer type
        required: true,
      },
    ],
  },

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');

    // Check if the user has ADMINISTRATOR permission
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: 'You do not have permission to use this command!',
        ephemeral: true,
      });
    }

    if (amount < 1 || amount > 100) {
      return interaction.reply({
        content: 'Please provide a number between 1 and 100.',
        ephemeral: true,
      });
    }

    // Fetch messages and bulk delete
    try {
      const deletedMessages = await interaction.channel.bulkDelete(amount, true);

      // Confirm deletion to the command issuer
      await interaction.reply({
        content: `✅ Successfully deleted ${deletedMessages.size} message(s).`,
        ephemeral: true,
      });

      // Log the purge action
      const logChannelId = '1286176037398384702'; // Replace with your log channel ID
      const logChannel = interaction.guild.channels.cache.get(logChannelId);

      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('Messages Purged')
          .setColor('#FF5733') // Orange for purge actions
          .addFields(
            { name: 'Channel', value: `<#${interaction.channel.id}>`, inline: true },
            { name: 'Messages Deleted', value: `${deletedMessages.size}`, inline: true },
            { name: 'Purged by', value: `<@${interaction.user.id}>`, inline: true }
          )
          .setTimestamp();

        logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(`Error purging messages: ${error}`);
      interaction.reply({
        content: 'There was an error trying to delete messages in this channel. Please check bot permissions.',
        ephemeral: true,
      });
    }
  },
};
