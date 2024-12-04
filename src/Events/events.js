const { Client, GatewayIntentBits, ChannelType, EmbedBuilder } = require('discord.js');
const WebSocket = require('ws');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// File to store processed event hashes
const processedEventFile = path.join(__dirname, '../Data/alertEvents.json');
let processedEventIds = new Set();
let messageQueue = [];

// Load processed event IDs from file
function loadProcessedEventIds() {
if (fs.existsSync(processedEventFile)) {
    const data = fs.readFileSync(processedEventFile, 'utf8');
    try {
        const loadedIds = JSON.parse(data);
        processedEventIds = new Set(loadedIds);
        console.log(`Event Alerts - Loaded ${loadedIds.length} previously processed event IDs.`);
    } catch (err) {
        console.error('[ERROR] Failed to load processed event IDs. Invalid JSON. Resetting file.');
        processedEventIds = new Set();
        saveProcessedEventIds();
    }
}
}

// Save processed event IDs to file
function saveProcessedEventIds() {
fs.writeFileSync(processedEventFile, JSON.stringify(Array.from(processedEventIds)));
}

// Function to generate a unique hash for the message
function generateHash(message) {
return crypto.createHash('sha1').update(message).digest('hex');
}

function parseMessageForColor(html) {
let message = html.trim();

// Strip any remaining HTML tags
message = message.replace(/<\/?[^>]+(>|$)/g, '');

// Define valid live feed message types
const validMessages = [
    { keyword: 'a game of brawl has just started', emoji: '🥊', color: '#E33232' }, // Brawl
    { keyword: 'a game of team brawl has just started', emoji: '🤼', color: '#E33232' }, // Team Brawl
    { keyword: 'a game of scavenger hunt has just started', emoji: '🔍', color: '#43BA55' }, // Scavenger Hunt
    { keyword: 'a game of color wars has just started', emoji: '🚩', color: '#D9CC43' }, // Color Wars
    { keyword: 'a game of landmines has just started', emoji: '💣', color: '#000000' }, // Landmines
];

// Check if the message matches any valid message type
for (const { keyword, emoji, color } of validMessages) {
    if (message.toLowerCase().includes(keyword)) {
        return { message: `${emoji} ${message}`, color };
    }
}

// Ignore messages that do not match any valid type
return null;
}

// Process the message queue at a rate of 9 messages per second
setInterval(async () => {
if (messageQueue.length > 0) {
    const messagesToSend = messageQueue.splice(0, 9);
    for (const { channel, embed } of messagesToSend) {
        await channel.send({ embeds: [embed] });
    }
}
}, 1000);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
console.log(`Event Alert Feed has started!`);
loadProcessedEventIds();

const channelId = '1286159477862830080'; // Announcement channel ID
const channel = client.channels.cache.get(channelId);

if (!channel || (channel.type !== ChannelType.GuildAnnouncement && channel.type !== ChannelType.GuildText)) {
    console.error("Invalid channel ID or the channel is not an announcement or text channel.");
    return;
}

let websocket;

function initSocket() {
    websocket = new WebSocket('wss://ws.bobba.ca:8443/LiveFeed');

    websocket.onopen = () => {
        const msg = {
            EventName: "livefeed",
            Bypass: false,
            ExtraData: null,
            JSON: true,
        };
        websocket.send(JSON.stringify(msg));
    };

    websocket.onmessage = async (event) => {
        try {
            const data = JSON.parse(event.data);
            if (!data || data.length === 0) return;

            for (const value of data) {
                const { liveAction: message } = value;
                const eventId = generateHash(message);
                if (processedEventIds.has(eventId)) continue;

                const parsedMessage = parseMessageForColor(message);
                if (!parsedMessage) continue; // Skip ignored messages

                processedEventIds.add(eventId);
                const { message: cleanMessage, color } = parsedMessage;

                // Create embed
                const embed = new EmbedBuilder()
                .setColor(color)
                .setDescription(`${cleanMessage}`)
                .setTimestamp();

                // Send message with ping outside the embed
                const sentMessage = await channel.send({
                content: '<@&1305780594860363852>',
                embeds: [embed],
                });

                // Crosspost if it's an announcement channel
                if (channel.type === ChannelType.GuildAnnouncement) {
                    try {
                        await sentMessage.crosspost();
                    } catch (error) {
                        console.error("Failed to crosspost the message:", error);
                    }
                }

                saveProcessedEventIds();
            }
        } catch (error) {
            console.error("[WEBSOCKET] Error processing live feed message:", error);
        }
    };

    websocket.onclose = () => setTimeout(initSocket, 5000);
    websocket.onerror = (error) => console.error("[WEBSOCKET] WebSocket error occurred:", error.message);
}

initSocket();
});

client.login('NTg4NTQxNTI5NTIyNzAwMzAx.GXG-Pw.3Pua78SsdbYRgyRPsLKiZRb3jhPryGHQv4cAhQ');
