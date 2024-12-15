const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Configuration file path
const configPath = path.join(__dirname, '../Data');
const loggingConfigFile = path.join(configPath, 'loggingConfig.json');

// Ensure configuration directory exists
function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

// Load logging configuration
function loadLoggingConfig() {
    ensureDirectoryExists(configPath);
    if (fs.existsSync(loggingConfigFile)) {
        try {
            return JSON.parse(fs.readFileSync(loggingConfigFile, 'utf8'));
        } catch (error) {
            console.error('[Logging] Error reading configuration file:', error);
            return {};
        }
    }
    return {};
}

// Fetch the log channel dynamically for each guild
function getLogChannel(guild) {
    const config = loadLoggingConfig();
    const logChannelId = config[guild.id];
    return logChannelId ? guild.channels.cache.get(logChannelId) : null;
}

// Discord client setup
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

client.once('ready', () => {
    console.log('Logging has successfully started!');
});

// Event for logging deleted messages
client.on('messageDelete', async (message) => {
    if (message.partial) {
        try {
            await message.fetch();
        } catch (error) {
            console.error('Could not fetch deleted message:', error);
            return;
        }
    }

    if (message.author.bot) return;

    const logChannel = getLogChannel(message.guild);
    if (!logChannel) return;

    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const fetchedLogs = await message.guild.fetchAuditLogs({ limit: 1, type: 72 });
        const deleteLog = fetchedLogs.entries.first();

        const embed = new EmbedBuilder()
            .setTitle('Message Deleted')
            .setColor('#E74C3C')
            .addFields(
                { name: 'Author', value: `<@${message.author.id}>`, inline: true },
                { name: 'Channel', value: message.channel.toString(), inline: true }
            )
            .setDescription(message.content || '*(No Content)*')
            .setFooter({ text: `Message ID: ${message.id}` })
            .setTimestamp()
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

        if (deleteLog?.target.id === message.author.id) {
            embed.addFields({ name: 'Deleted By', value: `<@${deleteLog.executor.id}>`, inline: true });
        }

        logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error logging message deletion:', error);
    }
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

    const logChannel = getLogChannel(newMessage.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle('Message Edited')
        .setColor('#F1C40F')
        .addFields(
            { name: 'Author', value: `<@${oldMessage.author.id}>`, inline: true },
            { name: 'Channel', value: oldMessage.channel.toString(), inline: true }
        )
        .setDescription(`**Before:**\n${oldMessage.content || '*(No Content)*'}\n**After:**\n${newMessage.content || '*(No Content)*'}`)
        .setFooter({ text: `Message ID: ${oldMessage.id}` })
        .setTimestamp()
        .setThumbnail(oldMessage.author.displayAvatarURL({ dynamic: true }));

    logChannel.send({ embeds: [embed] });
});

// Event for logging member updates
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const logChannel = getLogChannel(newMember.guild);
    if (!logChannel) return;

    if (oldMember.nickname !== newMember.nickname) {
        try {
            const fetchedLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: 24 });
            const nicknameLog = fetchedLogs.entries.first();

            const embed = new EmbedBuilder()
                .setTitle('Nickname Changed')
                .setColor('#3498DB')
                .addFields(
                    { name: 'User', value: newMember.user.tag, inline: true },
                    { name: 'Old Nickname', value: oldMember.nickname || 'None', inline: true },
                    { name: 'New Nickname', value: newMember.nickname || 'None', inline: true },
                    { name: 'Changed By', value: nicknameLog?.executor?.tag || 'Unknown', inline: true }
                )
                .setTimestamp()
                .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }));

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error logging nickname change:', error);
        }
    }
});

// Event for logging user bans
client.on('guildBanAdd', async (ban) => {
    const logChannel = getLogChannel(ban.guild);
    if (!logChannel) return;

    try {
        const fetchedLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: 22 }); // MEMBER_BAN_ADD
        const banLog = fetchedLogs.entries.first();

        const embed = new EmbedBuilder()
            .setTitle('User Banned')
            .setColor('#E74C3C')
            .addFields(
                { name: 'User', value: `<@${ban.user.id}>`, inline: true },
                { name: 'Banned By', value: banLog?.executor ? `<@${banLog.executor.id}>` : 'Unknown', inline: true },
                { name: 'Reason', value: banLog?.reason || 'No reason provided', inline: true }
            )
            .setTimestamp()
            .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }));

        logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error logging user ban:', error);
    }
});

// Event for logging user unbans
client.on('guildBanRemove', async (ban) => {
    const logChannel = getLogChannel(ban.guild);
    if (!logChannel) return;

    try {
        const fetchedLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: 23 }); // MEMBER_BAN_REMOVE
        const unbanLog = fetchedLogs.entries.first();

        const embed = new EmbedBuilder()
            .setTitle('Ban Removed')
            .setColor('#43BA55')
            .addFields(
                { name: 'User', value: `<@${ban.user.id}>`, inline: true },
                { name: 'Unbanned By', value: unbanLog?.executor ? `<@${unbanLog.executor.id}>` : 'Unknown', inline: true }
            )
            .setTimestamp()
            .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }));

        logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error logging ban removal:', error);
    }
});

// Event for logging kicks
client.on('guildMemberRemove', async (member) => {
    const logChannel = getLogChannel(member.guild);
    if (!logChannel) return;

    try {
        const fetchedLogs = await member.guild.fetchAuditLogs({ limit: 1, type: 20 }); // MEMBER_KICK
        const kickLog = fetchedLogs.entries.first();
        const timeDifference = Date.now() - (kickLog?.createdTimestamp || 0);

        if (kickLog?.target.id === member.id && timeDifference < 5000) {
            const embed = new EmbedBuilder()
                .setTitle('User Kicked')
                .setColor('#E74C3C')
                .addFields(
                    { name: 'User', value: `<@${member.id}>`, inline: true },
                    { name: 'Kicked By', value: kickLog.executor ? `<@${kickLog.executor.id}>` : 'Unknown', inline: true },
                    { name: 'Reason', value: kickLog.reason || 'No reason provided', inline: true }
                )
                .setTimestamp()
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

            logChannel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Error logging user kick:', error);
    }
});

// Event for logging roles added / removed
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const logChannel = getLogChannel(newMember.guild);
    if (!logChannel) return;

    try {
        const fetchedLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: 25 }); // MEMBER_ROLE_UPDATE
        const roleLog = fetchedLogs.entries.first();

        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

        if (addedRoles.size > 0) {
            const embed = new EmbedBuilder()
                .setTitle('Roles Added')
                .setColor('#43BA55')
                .addFields(
                    { name: 'User', value: `<@${newMember.id}>`, inline: true },
                    { name: 'Added By', value: roleLog?.executor ? `<@${roleLog.executor.id}>` : 'Unknown', inline: true },
                    { name: 'Roles', value: addedRoles.map(role => role.name).join(', '), inline: false }
                )
                .setTimestamp()
                .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }));

            logChannel.send({ embeds: [embed] });
        }

        if (removedRoles.size > 0) {
            const embed = new EmbedBuilder()
                .setTitle('Roles Removed')
                .setColor('#E74C3C')
                .addFields(
                    { name: 'User', value: `<@${newMember.id}>`, inline: true },
                    { name: 'Removed By', value: roleLog?.executor ? `<@${roleLog.executor.id}>` : 'Unknown', inline: true },
                    { name: 'Roles', value: removedRoles.map(role => role.name).join(', '), inline: false }
                )
                .setTimestamp()
                .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }));

            logChannel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Error logging role changes:', error);
    }
});

// Event for logging timeout
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const logChannel = getLogChannel(newMember.guild);
    if (!logChannel) return;

    const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
    const newTimeout = newMember.communicationDisabledUntilTimestamp;

    if (!oldTimeout && newTimeout) {
        const embed = new EmbedBuilder()
            .setTitle('User Timed Out')
            .setColor('#E74C3C')
            .addFields(
                { name: 'User', value: `<@${newMember.id}>`, inline: true },
                { name: 'Timeout Until', value: `<t:${Math.floor(newTimeout / 1000)}:F>`, inline: true }
            )
            .setTimestamp()
            .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }));

        logChannel.send({ embeds: [embed] });
    }
});

// Event for logging member left
client.on('guildMemberRemove', async (member) => {
    const logChannel = getLogChannel(member.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle('User Left')
        .setColor('#E67E22')
        .addFields(
            { name: 'User', value: `<@${member.id}>`, inline: true },
            { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true }
        )
        .setTimestamp()
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

    logChannel.send({ embeds: [embed] });
});

// Event for logging member join
client.on('guildMemberAdd', async (member) => {
    const logChannel = getLogChannel(member.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle('New Member Joined')
        .setColor('#43BA55')
        .addFields(
            { name: 'User', value: `<@${member.id}>`, inline: true },
            { name: 'Joined Discord', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: true }
        )
        .setTimestamp()
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

    logChannel.send({ embeds: [embed] });
});

client.login('ODU5NzA5Mjk3ODk3NzY2OTEz.Gh6b1T.Peni-WAa50EMbUumH-Z0sZU2lISMU8HW5m8NWs');
