const { EmbedBuilder, PermissionsBitField } = require('discord.js'); // Import PermissionsBitField
const fs = require('fs');
const path = require('path');

// Utility function to ensure the directory exists
function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

// Define correct paths for the `Data` directory in `src`
const dataDirectory = path.join(__dirname, '../../Data'); // Adjust path to point to `src/Data`
const liveFeedConfigFilePath = path.join(dataDirectory, 'livefeedConfig.json');

// Load the live feed configuration
function loadLiveFeedConfig() {
    ensureDirectoryExists(dataDirectory);

    if (fs.existsSync(liveFeedConfigFilePath)) {
        try {
            return JSON.parse(fs.readFileSync(liveFeedConfigFilePath, 'utf8'));
        } catch (error) {
            console.error('[LiveFeed] Error reading config file:', error);
            return {};
        }
    }

    return {};
}

// Save the live feed configuration
function saveLiveFeedConfig(config) {
    ensureDirectoryExists(dataDirectory);
    fs.writeFileSync(liveFeedConfigFilePath, JSON.stringify(config, null, 2));
}

module.exports = {
    data: {
        name: 'setfeed',
        description: 'Set the live feed channel for this server.',
        options: [
            {
                name: 'channel',
                description: 'The channel where live feed messages should be sent.',
                type: 7, // 7 is the type for CHANNEL
                required: true,
            },
        ],
    },

    async execute(interaction, client) {
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

        const config = loadLiveFeedConfig();
        const currentChannelId = config[interaction.guild.id];

        if (currentChannelId === channel.id) {
            return interaction.reply({
                content: `The live feed channel is already set to <#${channel.id}>.`,
                ephemeral: true,
            });
        }

        // Save the new channel ID to the config
        config[interaction.guild.id] = channel.id;
        saveLiveFeedConfig(config);

        const embed = new EmbedBuilder()
            .setTitle('Live Feed Channel Set')
            .setColor('#43BA55') // Green for success
            .setDescription(`✅ Live feed channel has been updated to <#${channel.id}>.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

        // Notify the live feed process
        client.emit('liveFeedUpdate', interaction.guild.id, channel.id);
    },
};
