const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: {
    name: 'purge',
    description: 'Delete messages based on specific filters and criteria.',
    options: [
      {
        name: 'count',
        description: 'Number of messages to delete (1-100)',
        type: 4, // Integer type
        required: true,
      },
      {
        name: 'user',
        description: 'Delete messages from a specific user',
        type: 6, // User type
        required: false,
      },
      {
        name: 'match',
        description: 'Delete messages that contain this text',
        type: 3, // String type
        required: false,
      },
      {
        name: 'not',
        description: 'Delete messages that do not contain this text',
        type: 3, // String type
        required: false,
      },
      {
        name: 'startswith',
        description: 'Delete messages that start with this text',
        type: 3,
        required: false,
      },
      {
        name: 'endswith',
        description: 'Delete messages that end with this text',
        type: 3,
        required: false,
      },
      {
        name: 'links',
        description: 'Delete messages containing links',
        type: 5, // Boolean type
        required: false,
      },
      {
        name: 'invites',
        description: 'Delete messages containing invites',
        type: 5,
        required: false,
      },
      {
        name: 'images',
        description: 'Delete messages containing images',
        type: 5,
        required: false,
      },
      {
        name: 'mentions',
        description: 'Delete messages containing mentions',
        type: 5,
        required: false,
      },
      {
        name: 'embeds',
        description: 'Delete messages containing embeds',
        type: 5,
        required: false,
      },
      {
        name: 'bots',
        description: 'Delete messages from bots',
        type: 5,
        required: false,
      },
      {
        name: 'humans',
        description: 'Delete messages from human users',
        type: 5,
        required: false,
      },
      {
        name: 'after',
        description: 'Delete messages after a specific message ID',
        type: 3,
        required: false,
      },
    ],
  },

  async execute(interaction) {
    const amount = interaction.options.getInteger('count');
    const user = interaction.options.getUser('user');
    const matchText = interaction.options.getString('match');
    const notText = interaction.options.getString('not');
    const startsWith = interaction.options.getString('startswith');
    const endsWith = interaction.options.getString('endswith');
    const links = interaction.options.getBoolean('links');
    const invites = interaction.options.getBoolean('invites');
    const images = interaction.options.getBoolean('images');
    const mentions = interaction.options.getBoolean('mentions');
    const embeds = interaction.options.getBoolean('embeds');
    const bots = interaction.options.getBoolean('bots');
    const humans = interaction.options.getBoolean('humans');
    const after = interaction.options.getString('after');

    // Check if user has administrator permissions
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: 'You do not have permission to use this command!',
        ephemeral: true,
      });
    }

    // Validate the count
    if (!amount || amount < 1 || amount > 100) {
      return interaction.reply({
        content: 'Please provide a count between 1 and 100.',
        ephemeral: true,
      });
    }

    // Fetch messages and apply filters
    let messages = await interaction.channel.messages.fetch({ limit: 100 });
    messages = Array.from(messages.values()); // Convert the collection to an array

    if (after) {
      const afterMessage = await interaction.channel.messages.fetch(after).catch(() => null);
      if (afterMessage) {
        messages = messages.filter(msg => msg.createdTimestamp > afterMessage.createdTimestamp);
      } else {
        return interaction.reply({
          content: 'Invalid message ID for "after" filter.',
          ephemeral: true,
        });
      }
    }

    // Apply all provided filters
    if (user) messages = messages.filter(msg => msg.author.id === user.id);
    if (matchText) messages = messages.filter(msg => msg.content.includes(matchText));
    if (notText) messages = messages.filter(msg => !msg.content.includes(notText));
    if (startsWith) messages = messages.filter(msg => msg.content.startsWith(startsWith));
    if (endsWith) messages = messages.filter(msg => msg.content.endsWith(endsWith));
    if (links) messages = messages.filter(msg => /https?:\/\/\S+/.test(msg.content));
    if (invites) messages = messages.filter(msg => /(discord\.gg|discordapp\.com\/invite)\/\S+/.test(msg.content));
    if (images) messages = messages.filter(msg => msg.attachments.some(att => att.contentType && att.contentType.startsWith('image')));
    if (mentions) messages = messages.filter(msg => msg.mentions.users.size > 0 || msg.mentions.roles.size > 0);
    if (embeds) messages = messages.filter(msg => msg.embeds.length > 0);
    if (bots) messages = messages.filter(msg => msg.author.bot);
    if (humans) messages = messages.filter(msg => !msg.author.bot);

    // Limit to the specified count and delete
    const messagesToDelete = messages.slice(0, amount);

    try {
      const deletedMessages = await interaction.channel.bulkDelete(messagesToDelete, true);

      // Confirmation message
      await interaction.reply({
        content: `✅ Successfully deleted ${deletedMessages.size} message(s).`,
        ephemeral: true,
      });

      // Logging the purge action
      const logChannelId = '1286176037398384702'; // Replace with your actual log channel ID
      const logChannel = interaction.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('Messages Purged')
          .setColor('#FF5733')
          .addFields(
            { name: 'Channel', value: `<#${interaction.channel.id}>`, inline: true },
            { name: 'Messages Deleted', value: `${deletedMessages.size}`, inline: true },
            { name: 'Purged by', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Filters Applied', value: `Count: ${amount}, User: ${user ? user.tag : 'None'}, Match: ${matchText || 'None'}, Not: ${notText || 'None'}`, inline: false }
          )
          .setTimestamp();

        logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(`Error purging messages: ${error}`);
      interaction.reply({
        content: 'There was an error trying to delete messages. Check bot permissions and try again.',
        ephemeral: true,
      });
    }
  },
};
