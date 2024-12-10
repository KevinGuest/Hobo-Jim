const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Utility function to ensure the directory exists
function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

const dataDirectory = path.join(__dirname, '../../Data');
const loggingConfigFilePath = path.join(dataDirectory, 'loggingConfig.json');

// Load the logging configuration
function loadLoggingConfig() {
    ensureDirectoryExists(dataDirectory);

    if (fs.existsSync(loggingConfigFilePath)) {
        try {
            return JSON.parse(fs.readFileSync(loggingConfigFilePath, 'utf8'));
        } catch (error) {
            console.error('[Logging] Error reading config file:', error);
            return {};
        }
    }

    return {};
}

// Save the logging configuration
function saveLoggingConfig(config) {
    ensureDirectoryExists(dataDirectory);
    fs.writeFileSync(loggingConfigFilePath, JSON.stringify(config, null, 2));
}

module.exports = {
    data: {
        name: 'setlogging',
        description: 'Set the logging channel for this server.',
        options: [
            {
                name: 'channel',
                description: 'The channel where logging messages should be sent.',
                type: 7, // 7 is the type for CHANNEL
                required: true,
            },
        ],
    },

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true,
            });
        }

        const channel = interaction.options.getChannel('channel');
        if (!channel.isTextBased()) {
            return interaction.reply({
                content: 'Please select a valid text-based channel.',
                ephemeral: true,
            });
        }

        const config = loadLoggingConfig();
        const currentChannelId = config[interaction.guild.id];

        if (currentChannelId === channel.id) {
            return interaction.reply({
                content: `The logging channel is already set to <#${channel.id}>.`,
                ephemeral: true,
            });
        }

        config[interaction.guild.id] = channel.id;
        saveLoggingConfig(config);

        const embed = new EmbedBuilder()
            .setTitle('Logging Channel Set')
            .setColor('#43BA55')
            .setDescription(`✅ Logging channel has been updated to <#${channel.id}>.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
