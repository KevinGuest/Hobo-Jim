const { Client, GatewayIntentBits, TextChannel, EmbedBuilder } = require('discord.js');
const WebSocket = require('ws');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Configuration paths
const configPath = path.join(__dirname, '../Data/livefeedConfig.json');
const processedEventFile = path.join(__dirname, '../Data/livefeedEvents.json');

// Globals
let processedEventIds = new Set();
let messageQueue = [];
const processingLock = new Set();
let liveFeedConfig = {};

// Load configuration
function loadLiveFeedConfig() {
    try {
        return fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
    } catch (error) {
        console.error('[LiveFeed] Error loading config:', error);
        return {};
    }
}

// Save the live feed configuration
function saveLiveFeedConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('[LiveFeed] Error saving config:', error);
    }
}

// Load processed event IDs
function loadProcessedEventIds() {
    try {
        if (fs.existsSync(processedEventFile)) {
            const data = JSON.parse(fs.readFileSync(processedEventFile, 'utf8'));
            processedEventIds = new Set(data);
            console.log(`[LiveFeed] Loaded ${data.length} processed event IDs.`);
        }
    } catch (error) {
        console.error('[LiveFeed] Error loading processed IDs:', error);
    }
}

// Save processed event IDs
let saveTimeout = null;
function saveProcessedEventIds() {
    if (saveTimeout) return;
    saveTimeout = setTimeout(() => {
        fs.writeFileSync(processedEventFile, JSON.stringify(Array.from(processedEventIds)));
        saveTimeout = null;
    }, 5000);
}

// Generate a unique hash for the message
function generateHash(message) {
    return crypto.createHash('sha256').update(message).digest('hex');
}

// Parse messages for color
function parseMessageForColor(message) {
    // Keyword-to-color mapping
    const colorMapping = [
        { keywords: ['murdered'], emoji: '🔪', color: '#E33232' },
        { keywords: ['suicide'], emoji: '☠️', color: '#E33232' },
        { keywords: ['guilty'], emoji: '⚖️', color: '#E33232' },
        { keywords: ['arrested'], emoji: '🚔', color: '#5EB6D1' },
        { keywords: ['escorted'], emoji: '🪝', color: '#5EB6D1' },
        { keywords: ['released'], emoji: '🕊️', color: '#5EB6D1' },
        { keywords: ['evaded'], emoji: '🏃‍♂️', color: '#5EB6D1' },
        { keywords: ['ticketed'], emoji: '🎫', color: '#5EB6D1' },
        { keywords: ['pardoned'], emoji: '🎉', color: '#5EB6D1' },
        { keywords: ['robbed'], emoji: '🦹‍♂️', color: '#5EB6D1' },
        { keywords: ['blacklisted'], emoji: '⛔', color: '#000000' },
        { keywords: ['divorced'], emoji: '💔', color: '#000000' },
        { keywords: ['married'], emoji: '💍', color: '#D3D3D3' },
        { keywords: ['innocent'], emoji: '🕊️', color: '#D3D3D3' },
        { keywords: ['hired'], emoji: '📝', color: '#43BA55' },
        { keywords: ['fired'], emoji: '💼', color: '#E33232' },
        { keywords: ['quit'], emoji: '🚪', color: '#E33232' },
        { keywords: ['promoted'], emoji: '🎉', color: '#43BA55' },
        { keywords: ['demoted'], emoji: '😓', color: '#43BA55' },
        { keywords: ['won'], emoji: '🏆', color: '#D9CC43' },
        { keywords: ['beat'], emoji: '🏆', color: '#D9CC43' },
        { keywords: ['blew up', 'blown up'], emoji: '💣', color: '#E33232' },
        { keywords: ['home'], emoji: '🏠', color: '#43BA55' },
        { keywords: ['placed a bounty'], emoji: '🎯', color: '#E33232' },
        { keywords: ['removed their bounty'], emoji: '🗑️', color: '#43BA55' },
        { keywords: ['claimed'], emoji: '💰', color: '#E33232' },
        { keywords: ['sanitation'], emoji: '♻️', color: '#43BA55' },
        { keywords: ['Forge Industries'], emoji: '🏭', color: '#5EB6D1' },
        { keywords: ['knocked'], emoji: '🥊', color: '#E33232' },
        { keywords: ['eliminated'], emoji: '⚔️', color: '#E33232' },
        { keywords: ['radioactivity'], emoji: '☢️', color: '#E33232' },
        { keywords: ['meltdown'], emoji: '🛑', color: '#43BA55' },
        { keywords: ['hospital'], emoji: '🚑', color: '#43BA55' },
    ];

    let cleanMessage = message.replace(/<\/?[^>]+(>|$)/g, ''); // Strip HTML tags
    let color = '#5DCBF0';

    for (const { keywords, emoji, color: mapColor } of colorMapping) {
        if (keywords.some(keyword => cleanMessage.toLowerCase().includes(keyword))) {
            color = mapColor;
            cleanMessage = `${emoji} ${cleanMessage}`;
            break;
        }
    }

    return { message: cleanMessage.trim(), color };
}

// Process individual events
async function processEvent(eventId, message) {
    if (processingLock.has(eventId)) return;
    processingLock.add(eventId);

    try {
        if (processedEventIds.has(eventId)) return;

        processedEventIds.add(eventId);
        saveProcessedEventIds();

        const { message: cleanMessage, color } = parseMessageForColor(message);
        if (!cleanMessage) return;

        for (const [guildId, channelId] of Object.entries(liveFeedConfig)) {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) continue;

            const channel = guild.channels.cache.get(channelId);
            if (!channel || !(channel instanceof TextChannel)) continue;

            const embed = new EmbedBuilder().setColor(color).setDescription(cleanMessage);

            if (!messageQueue.some(msg => msg.embed.description === cleanMessage && msg.channel.id === channel.id)) {
                messageQueue.push({ channel, embed });
            }
        }
    } catch (error) {
        console.error('[LiveFeed] Error processing event:', error);
    } finally {
        processingLock.delete(eventId);
    }
}

// Process messages in the queue
setInterval(async () => {
    if (messageQueue.length > 0) {
        const messagesToSend = messageQueue.splice(0, 5);
        for (const { channel, embed } of messagesToSend) {
            try {
                await channel.send({ embeds: [embed] });
            } catch (error) {
                console.error('[LiveFeed] Error sending message:', error);
            }
        }
    }
}, 1000);

// Discord client initialization
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', () => {
    console.log('LiveFeed has successfully started!');
    loadProcessedEventIds();
    liveFeedConfig = loadLiveFeedConfig(); // Load initial configuration

    let websocket;

    function initWebSocket() {
        websocket = new WebSocket('wss://ws.bobba.ca:8443/LiveFeed');

        websocket.onopen = () => {
            //console.log('[LiveFeed] WebSocket connected.');
            websocket.send(JSON.stringify({ EventName: 'livefeed', Bypass: false, ExtraData: null, JSON: true }));
        };

        websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (!data || !Array.isArray(data)) return;

                data.forEach(({ liveAction: message }) => {
                    const eventId = generateHash(message);
                    processEvent(eventId, message);
                });
            } catch (error) {
                console.error('[LiveFeed] Error processing WebSocket message:', error);
            }
        };

        websocket.onclose = () => {
            //console.warn('[LiveFeed] WebSocket disconnected. Reconnecting...');
            setTimeout(initWebSocket, 5000);
        };

        websocket.onerror = (error) => {
            console.error('[LiveFeed] WebSocket error:', error.message);
        };
    }

    initWebSocket();

    // Listen for live feed updates and reload config dynamically
    client.on('liveFeedUpdate', (guildId, channelId) => {
        console.log(`[LiveFeed] Updating live feed channel for guild ${guildId} to channel ${channelId}`);
        liveFeedConfig[guildId] = channelId;
        saveLiveFeedConfig(liveFeedConfig);
    });
});

client.login('NTg4NTQxNTI5NTIyNzAwMzAx.GXG-Pw.3Pua78SsdbYRgyRPsLKiZRb3jhPryGHQv4cAhQ');