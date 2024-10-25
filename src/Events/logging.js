const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, 
  ],
});

const LOG_CHANNEL_ID = '1286176037398384702'; // Replace with your log channel ID

client.once('ready', () => {
  console.log(`Logging has started!`);
});

// Event for logging deleted messages
client.on('messageDelete', async (message) => {
    if (message.partial) {
      try {
        await message.fetch(); // Fetch full message for partial messages
      } catch (error) {
        console.error('Could not fetch deleted message:', error);
        return;
      }
    }
  
    if (message.author.bot) return;
  
    const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;
  
    const embed = new EmbedBuilder()
      .setTitle('Message Deleted')
      .setColor('#E74C3C') // Red color for deleted messages
      .addFields(
        { name: 'Author', value: `<@${message.author.id}>`, inline: true }, // Makes the author mentionable
        { name: 'Channel', value: message.channel.toString(), inline: true }
      )
      .setDescription(message.content || '*(Message had no content)*')
      .setFooter({ text: `Message ID: ${message.id}` })
      .setTimestamp()
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true })); // Adds profile picture
  
    logChannel.send({ embeds: [embed] });
  });  

// Event for logging edited messages
client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (oldMessage.partial || newMessage.partial) {
      try {
        await oldMessage.fetch();
        await newMessage.fetch();
      } catch (error) {
        console.error('Could not fetch partial messages:', error);
        return;
      }
    }
  
    if (oldMessage.author.bot) return;
  
    const logChannel = newMessage.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;
  
    const embed = new EmbedBuilder()
      .setTitle('Message Edited')
      .setColor('#F1C40F') // Yellow color for edited messages
      .addFields(
        { name: 'Author', value: `<@${oldMessage.author.id}>`, inline: true }, // Makes the author mentionable
        { name: 'Channel', value: oldMessage.channel.toString(), inline: true }
      )
      .setDescription(`**Before:**\n${oldMessage.content || '*(No Content)*'}\n**After:**\n${newMessage.content || '*(No Content)*'}`)
      .setFooter({ text: `Message ID: ${oldMessage.id}` })
      .setTimestamp()
      .setThumbnail(oldMessage.author.displayAvatarURL({ dynamic: true })); // Add user's profile picture
  
    logChannel.send({ embeds: [embed] });
  });
  

// Event for logging nickname or username changes
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const logChannel = newMember.guild.channels.cache.get(LOG_CHANNEL_ID);
  if (!logChannel) return;

  if (oldMember.nickname !== newMember.nickname) {
    const embed = new EmbedBuilder()
      .setTitle('Nickname Changed')
      .setColor('#3498DB') // Blue color for name changes
      .addFields(
        { name: 'User', value: newMember.user.tag, inline: true },
        { name: 'Old Nickname', value: oldMember.nickname || 'None', inline: true },
        { name: 'New Nickname', value: newMember.nickname || 'None', inline: true }
      )
      .setTimestamp()
      .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true })); // User PFP

    logChannel.send({ embeds: [embed] });
  }

  if (oldMember.user.username !== newMember.user.username) {
    const embed = new EmbedBuilder()
      .setTitle('Username Changed')
      .setColor('#3498DB') // Blue color for name changes
      .addFields(
        { name: 'Old Username', value: oldMember.user.username, inline: true },
        { name: 'New Username', value: newMember.user.username, inline: true }
      )
      .setTimestamp()
      .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true })); // User PFP

    logChannel.send({ embeds: [embed] });
  }
});

client.on('guildBanAdd', async (ban) => {
    try {
      const logChannel = ban.guild.channels.cache.get(LOG_CHANNEL_ID);
  
      if (!logChannel) {
        console.error(`Log channel with ID ${LOG_CHANNEL_ID} not found.`);
        return;
      }
  
      console.log(`Ban event detected for user: ${ban.user.tag}. Fetching audit logs...`);
  
      // Fetch audit logs to find out who banned the user
      const fetchedLogs = await ban.guild.fetchAuditLogs({
        limit: 1,
        type: 22, // 22 is the integer code for MEMBER_BAN_ADD
      });
  
      const banLog = fetchedLogs.entries.first();
  
      if (!banLog) {
        console.log('No ban log found. This might be a manual ban or missing logs.');
        return;
      }
  
      const { executor, target, reason, createdTimestamp } = banLog;
  
      // Check if the ban in the audit log matches the user that was banned
      if (target.id !== ban.user.id) {
        console.log(`Ban log for ${ban.user.tag} did not match the user in audit logs.`);
        return;
      }
  
      console.log(`Ban log found. Banned by: ${executor.tag}, Reason: ${reason || 'No reason provided'}`);
  
      // Create the embed for the ban event
      const embed = new EmbedBuilder()
        .setTitle('User Banned')
        .setColor('#E74C3C') // Red color for bans
        .addFields(
          { name: 'User', value: `<@${ban.user.id}>`, inline: true }, // Make the banned user mentionable
          { name: 'Banned by', value: `<@${executor.id}>`, inline: true }, // Make the executor mentionable
          { name: 'Reason', value: reason || 'No reason provided', inline: true },
          { name: 'Time of Ban', value: `<t:${Math.floor(createdTimestamp / 1000)}:F>`, inline: true } // Timestamp for when the ban occurred
        )
        .setTimestamp() // This will show the current time of logging
        .setThumbnail(ban.user.displayAvatarURL({ dynamic: true })); // User's profile picture
  
      // Send the log to the channel
      logChannel.send({ embeds: [embed] });
      console.log('Ban log sent to the channel.');
  
    } catch (error) {
      console.error('Error logging the ban event:', error);
    }
  });  
  
client.on('guildMemberRemove', async (member) => {
    try {
      const auditLogs = await member.guild.fetchAuditLogs({
        limit: 1,
        type: 20, // 20 is the integer code for MEMBER_KICK!!!
      });
      const kickLog = auditLogs.entries.first();
  
      const logChannel = member.guild.channels.cache.get(LOG_CHANNEL_ID);
      if (!logChannel) return;
  
      // Check if the member was kicked by comparing timestamps
      if (kickLog) {
        const { executor, target, reason, createdTimestamp } = kickLog;
        const timeDifference = Date.now() - createdTimestamp;
  
        // If the target was the member and the kick happened within 5 seconds, it's a kick.
        if (target.id === member.id && timeDifference < 5000) {
          const embed = new EmbedBuilder()
            .setTitle('User Kicked')
            .setColor('#E74C3C') // Red color for kicks
            .addFields(
              { name: 'User', value: `<@${target.id}>`, inline: true },
              { name: 'Kicked by', value: `<@${executor.id}>`, inline: true },
              { name: 'Reason', value: reason || 'No reason provided', inline: true }
            )
            .setTimestamp()
            .setThumbnail(target.displayAvatarURL({ dynamic: true }));
  
          logChannel.send({ embeds: [embed] });
          return; 
        }
      }
  
      // If no kick was detected, assume the user left voluntarily
      const embed = new EmbedBuilder()
        .setTitle('User Left')
        .setColor('#E67E22') // Orange color for voluntary leaves
        .addFields(
          { name: 'User', value: `<@${member.id}>`, inline: true },
          { name: 'Joined Discord', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true }
        )
        .setTimestamp()
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));
  
      logChannel.send({ embeds: [embed] });
  
    } catch (error) {
      console.error('Error fetching audit logs or processing member leave:', error);
    }
  });
  
// Event for logging new members joining the server
client.on('guildMemberAdd', async (member) => {
    const logChannel = member.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;
  
    const embed = new EmbedBuilder()
      .setTitle('New Member Joined')
      .setColor('#43BA55') // Green color for new members
      .addFields(
        { name: 'User', value: `<@${member.id}>`, inline: true },
        { name: 'Joined Server At', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true },
        { name: 'Joined Discord At', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: true }
      )
      .setTimestamp()
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true })); 
  
    logChannel.send({ embeds: [embed] });
  });
  
  
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const logChannel = newMember.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;
  
    const fetchedLogs = await newMember.guild.fetchAuditLogs({
      limit: 1,
      type: 25, // 25 is the integer code for MEMBER_ROLE_UPDATE!!
    });
  
    const roleLog = fetchedLogs.entries.first();
    const { executor } = roleLog || {};
  
    // Check if roles were added
    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
  
    if (addedRoles.size > 0) {
      const embed = new EmbedBuilder()
        .setTitle('Roles Added')
        .setColor('#43BA55') // Green color for added roles
        .addFields(
          { name: 'User', value: `<@${newMember.id}>`, inline: true },
          { name: 'Added By', value: executor ? `<@${executor.id}>` : 'Unknown', inline: true },
          { name: 'Added Roles', value: addedRoles.map(role => role.name).join(', '), inline: true }
        )
        .setTimestamp()
        .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }));
  
      logChannel.send({ embeds: [embed] });
    }
  
    if (removedRoles.size > 0) {
      const embed = new EmbedBuilder()
        .setTitle('Roles Removed')
        .setColor('#E74C3C') // Red color for removed roles
        .addFields(
          { name: 'User', value: `<@${newMember.id}>`, inline: true },
          { name: 'Removed By', value: executor ? `<@${executor.id}>` : 'Unknown', inline: true },
          { name: 'Removed Roles', value: removedRoles.map(role => role.name).join(', '), inline: true }
        )
        .setTimestamp()
        .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }));
  
      logChannel.send({ embeds: [embed] });
    }
  });  
  
// Login the bot with your token
client.login('NTg4NTQxNTI5NTIyNzAwMzAx.GXG-Pw.3Pua78SsdbYRgyRPsLKiZRb3jhPryGHQv4cAhQ'); // Replace with your bot token
