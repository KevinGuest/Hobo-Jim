const { Client, GatewayIntentBits, TextChannel, EmbedBuilder, PermissionsBitField } = require('discord.js');
const WebSocket = require('ws');
const crypto = require('crypto');

// Hardcoded server ID
const SERVER_ID = '1317256023274426489';

// Hardcoded channel IDs for different keyword groups (server-specific)
const CHANNEL_IDS = {
    credits: '1317752676506931231', // All Money (Credit) Tracking
};

// Processed event IDs to prevent duplicates
const processedEventIds = new Set();

// Keywords mapping to channels and embed colors
const keywordMapping = [
    { keywords: ['purchased'], emoji: '🛍️', color: '#43BA55', channel: CHANNEL_IDS.credits },
    { keywords: ['gave'], emoji: '💸', color: '#E33232', channel: CHANNEL_IDS.credits },
    { keywords: ['tip'], emoji: '🤑', color: '#FEE75C', channel: CHANNEL_IDS.credits },
    { keywords: ['paid'], emoji: '💰', color: '#5865F2', channel: CHANNEL_IDS.credits },
    { keywords: ['received'], emoji: '📩', color: '#FEE75C', channel: CHANNEL_IDS.credits },
    { keywords: ['given'], emoji: '📩', color: '#FEE75C', channel: CHANNEL_IDS.credits },
];

// Generate a unique hash for each message to prevent duplicates
function generateHash(message) {
    return crypto.createHash('sha256').update(message.trim().toLowerCase()).digest('hex');
}

// Clean and parse messages, determine the appropriate channel and styling
function parseMessage(message) {
    const cleanMessage = message
        .replace(/<[^>]*>/g, '') // Strip HTML tags
        .replace(/\s+/g, ' ')   // Replace multiple spaces with single space
        .trim();

    for (const { keywords, emoji, color, channel } of keywordMapping) {
        if (keywords.some(keyword => cleanMessage.toLowerCase().includes(keyword))) {
            return { message: `${emoji} ${cleanMessage}`, color, channel };
        }
    }

    return null; // If no keyword matches
}

// Process an event, check for duplicates, and send the message to the correct channel
async function processEvent(eventId, message, client) {
    if (processedEventIds.has(eventId)) return; // Skip duplicates
    processedEventIds.add(eventId);

    const parsed = parseMessage(message);
    if (!parsed) return;

    const { message: formattedMessage, color, channel: channelId } = parsed;

    try {
        const guild = await client.guilds.fetch(SERVER_ID);
        const channel = await guild.channels.fetch(channelId);
        if (!channel || !(channel instanceof TextChannel)) {
            console.warn(`[UserLogs] Invalid or missing channel: ${channelId}`);
            return;
        }

        // Check bot permissions
        const permissions = channel.permissionsFor(client.user);
        if (!permissions.has(PermissionsBitField.Flags.SendMessages)) {
            console.warn(`[UserLogs] Missing 'Send Messages' permission for channel ${channelId}`);
            return;
        }
        if (!permissions.has(PermissionsBitField.Flags.EmbedLinks)) {
            console.warn(`[UserLogs] Missing 'Embed Links' permission for channel ${channelId}`);
            return;
        }

        // Send embed message
        const embed = new EmbedBuilder()
            .setColor(color)
            .setDescription(formattedMessage);

        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[UserLogs] Failed to send message to channel ${channelId}:`, error.message);
    }
}

// Initialize the WebSocket connection
function initWebSocket(client) {
    const websocket = new WebSocket('wss://ws.bobba.ca:8443/Logs');

    websocket.onopen = () => {
        console.warn('[UserLogs] WebSocket connected.');
        websocket.send(JSON.stringify({ EventName: 'userlogs', Bypass: false, ExtraData: null, JSON: true }));
    };

    websocket.onmessage = async (event) => {
        try {
            const data = JSON.parse(event.data);
            if (Array.isArray(data)) {
                for (const { logAction: message } of data) {
                    const eventId = generateHash(message);
                    await processEvent(eventId, message, client);
                }
            } else {
                console.warn('[UserLogs] Received invalid data format.');
            }
        } catch (error) {
            console.error('[UserLogs] Error processing WebSocket message:', error.message);
        }
    };

    websocket.onclose = () => {
        console.warn('[UserLogs] WebSocket disconnected. Reconnecting in 5 seconds...');
        setTimeout(() => initWebSocket(client), 5000);
    };

    websocket.onerror = (error) => {
        console.error('[UserLogs] WebSocket error:', error.message);
    };
}

// Discord bot client setup
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    console.warn('UserLogs has successfully started!');
    initWebSocket(client);
});

// Bot login
client.login('ODU5NzA5Mjk3ODk3NzY2OTEz.Gh6b1T.Peni-WAa50EMbUumH-Z0sZU2lISMU8HW5m8NWs');
