const { Client, GatewayIntentBits, TextChannel, EmbedBuilder } = require('discord.js');
const WebSocket = require('ws');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Configuration paths
const configPath = path.join(__dirname, '../Data/userLogConfig.json');
const processedEventFile = path.join(__dirname, '../Data/userLogEvents.json');

// Globals
let processedEventIds = new Set();
let UserLogsConfig = {};

// Load configuration
function loadUserLogsConfig() {
    try {
        return fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
    } catch (error) {
        console.error('[UserLogs] Error loading config:', error);
        return {};
    }
}

// Save the configuration
function saveUserLogsConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('[UserLogs] Error saving config:', error);
    }
}

// Load processed event IDs
function loadProcessedEventIds() {
    if (fs.existsSync(processedEventFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(processedEventFile, 'utf8'));

            // Validate that the data is an array
            if (Array.isArray(data)) {
                processedEventIds = new Set(data);
                console.log(`[UserLogs] Loaded ${processedEventIds.size} processed event IDs.`);
            } else {
                throw new Error('Invalid data format in processedEventFile (expected an array).');
            }
        } catch (error) {
            console.error('[UserLogs] Error loading processed IDs:', error.message);

            // Reset to an empty array if data is invalid
            processedEventIds = new Set();
            saveProcessedEventIds(); // Save the corrected file
        }
    } else {
        // Initialize the file if it doesn't exist
        processedEventIds = new Set();
        saveProcessedEventIds();
    }
}

// Save processed event IDs
function saveProcessedEventIds() {
    try {
        fs.writeFileSync(processedEventFile, JSON.stringify(Array.from(processedEventIds), null, 2));
    } catch (error) {
        console.error('[UserLogs] Error saving processed IDs:', error.message);
    }
}

// Generate a unique hash for the message
function generateHash(message) {
    return crypto.createHash('sha256').update(message.trim().toLowerCase()).digest('hex');
}

// Parse messages for color
function parseMessageForColor(message) {
    const colorMapping = [
        { keywords: ['purchase'], emoji: '🛍️', color: '#E33232' },
        { keywords: ['gave'], emoji: '💸', color: '#E33232' },
        { keywords: ['received'], emoji: '🤑', color: '#E33232' },
        { keywords: ['tip'], emoji: '🪙', color: '#E33232' },
        { keywords: ['paid'], emoji: '💰', color: '#E33232' },
        { keywords: ['deposited'], emoji: '🏦', color: '#E33232' },
        { keywords: ['withdrew'], emoji: '🏦', color: '#E33232' },
        { keywords: ['robbed'], emoji: '🏴‍☠️', color: '#E33232' },
    ];

    let cleanMessage = message.replace(/<\/?[^>]+(>|$)/g, ''); // Strip HTML tags

    for (const { keywords, emoji, color } of colorMapping) {
        if (keywords.some(keyword => cleanMessage.toLowerCase().includes(keyword))) {
            cleanMessage = `${emoji} ${cleanMessage}`;
            return { message: cleanMessage.trim(), color };
        }
    }

    return null; // Return null if no match is found
}

// Process individual events
async function processEvent(eventId, message, client) {
    if (processedEventIds.has(eventId)) return; // Skip duplicate events
    processedEventIds.add(eventId);
    saveProcessedEventIds();

    const parsedMessage = parseMessageForColor(message);
    if (!parsedMessage) return; // Skip unmatched messages

    const { message: cleanMessage, color } = parsedMessage;

    for (const [guildId, channelId] of Object.entries(UserLogsConfig)) {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;

        const channel = guild.channels.cache.get(channelId);
        if (!channel || !(channel instanceof TextChannel)) continue;

        const embed = new EmbedBuilder()
            .setColor(color)
            .setDescription(cleanMessage)
            .setTimestamp();

        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('[UserLogs] Error sending message:', error.message);
        }
    }
}

// Discord client initialization
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', () => {
    console.log('UserLogs has successfully started!');
    loadProcessedEventIds();
    UserLogsConfig = loadUserLogsConfig();

    let websocket;

    function initWebSocket() {
        websocket = new WebSocket('wss://ws.bobba.ca:8443/Logs');

        websocket.onopen = () => {
            websocket.send(JSON.stringify({ EventName: 'UserLogs', Bypass: false, ExtraData: null, JSON: true }));
        };

        websocket.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                if (!data || !Array.isArray(data)) return;

                for (const { logAction: message } of data) {
                    const eventId = generateHash(message);
                    await processEvent(eventId, message, client);
                }
            } catch (error) {
                console.error('[UserLogs] Error processing WebSocket message:', error.message);
            }
        };

        websocket.onclose = () => setTimeout(initWebSocket, 5000);
        websocket.onerror = (error) => console.error('[UserLogs] WebSocket error:', error.message);
    }

    initWebSocket();

    client.on('UserLogsUpdate', (guildId, channelId) => {
        UserLogsConfig[guildId] = channelId;
        saveUserLogsConfig(UserLogsConfig);
        console.log(`[UserLogs] Updated logs channel for guild ${guildId} to ${channelId}`);
    });
});

client.login('ODU5NzA5Mjk3ODk3NzY2OTEz.Gh6b1T.Peni-WAa50EMbUumH-Z0sZU2lISMU8HW5m8NWs');
