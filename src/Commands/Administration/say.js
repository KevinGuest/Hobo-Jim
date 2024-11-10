const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: {
    name: 'say',
    description: 'Make the bot say a specified message.',
    options: [
      {
        name: 'message',
        description: 'The message you want the bot to say',
        type: 3, // 3 is the type for STRING
        required: true,
      },
    ],
  },

  async execute(interaction) {
    // Check if the user has Administrator permissions
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    // Get the message content from the interaction options
    const message = interaction.options.getString('message');

    // Send the message to the channel
    await interaction.channel.send(message);

    // Log the say command in the specified log channel
    const logChannelId = '1286176037398384702'; // Replace with your log channel ID
    const logChannel = interaction.guild.channels.cache.get(logChannelId);

    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('Say Command Used')
        .setColor('#3498DB')
        .addFields(
          { name: 'Issued By', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Message', value: message, inline: false },
          { name: 'Channel', value: `${interaction.channel}`, inline: true },
          { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    }

    // Confirm the action to the user privately
    await interaction.reply({
      content: 'Message sent successfully!',
      ephemeral: true,
    });
  },
};
