const { Client, GatewayIntentBits, ChannelType, EmbedBuilder } = require('discord.js');
const WebSocket = require('ws');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// File to store processed event timestamps
const processedEventFile = path.join(__dirname, '../Data/eventTimestamps.json');
let processedEventTimestamps = new Map(); // Tracks event text and their timestamps
const EVENT_TIME_THRESHOLD = 10 * 60 * 1000; // 10 minutes in milliseconds

// Save processed event timestamps to file
function saveProcessedEventTimestamps() {
    try {
        const data = Array.from(processedEventTimestamps.entries()); // Convert Map to array
        fs.writeFileSync(processedEventFile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('[SAVE ERROR] Failed to save event timestamps:', error);
    }
}

// Load processed event timestamps from file
function loadProcessedEventTimestamps() {
    if (fs.existsSync(processedEventFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(processedEventFile, 'utf8'));
            processedEventTimestamps = new Map(data); // Convert array back to Map

            // Remove expired entries
            const now = Date.now();
            for (const [key, timestamp] of processedEventTimestamps) {
                if (now - timestamp > EVENT_TIME_THRESHOLD) {
                    processedEventTimestamps.delete(key);
                }
            }

            console.log(`[Events] Loaded ${processedEventTimestamps.size} valid processed event timestamps.`);
        } catch (error) {
            console.error('[ERROR] Failed to load event timestamps. Resetting file.');
            processedEventTimestamps = new Map();
            saveProcessedEventTimestamps();
        }
    }
}

// Generate a unique hash for the message
function generateHash(message) {
    const normalizedMessage = message
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim()
        .toLowerCase(); // Normalize case
    return crypto.createHash('sha256').update(normalizedMessage).digest('hex');
}

function parseMessageForColor(message) {
    // Keyword-to-color mapping
    const colorMapping = [
        { keywords: ['a game of brawl has just started'], emoji: '🥊', cleanText: 'Brawl has just started in [Event] Brawl (301)', color: '#E33232' },
        { keywords: ['a game of team brawl has just started'], emoji: '🤼', cleanText: 'Team Brawl has just started in [Event] Team Brawl (302)', color: '#E33232' },
        { keywords: ['a game of scavenger hunt has just started'], emoji: '🔍', cleanText: 'Scavenger Hunt has just started citywide', color: '#43BA55' },
        { keywords: ['a game of color wars has just started'], emoji: '🚩', cleanText: 'Color Wars has just started in [Event] Color Wars (303)', color: '#D9CC43' },
        { keywords: ['a game of landmines has just started'], emoji: '💣', cleanText: 'Landmines has just started in [Event] Land Mines (304)', color: '#000000' },
    ];

    const originalMessage = message; // Keep the original message for output

    // Strip all HTML tags including <span> and normalize spaces
    let cleanMessage = message.replace(/<\/?[^>]+(>|$)/g, '').replace(/\s+/g, ' ').trim();

    const normalizedMessage = cleanMessage.toLowerCase(); // Lowercase only for matching

    for (const { keywords, emoji, cleanText, color: mapColor } of colorMapping) {
        if (keywords.some(keyword => normalizedMessage.includes(keyword))) {
            // Extract additional information (e.g., prize details) and remove keyword
            const prizeText = cleanMessage.replace(
                new RegExp(keywords.find(keyword => normalizedMessage.includes(keyword)), 'i'),
                ''
            ).trim();

            // Combine clean text with additional details
            const finalMessage = `${cleanText}${prizeText ? ` ${prizeText}` : ''}`;
            return { message: `${emoji} ${finalMessage}`, color: mapColor };
        }
    }

    // Return null if no match is found
    return null;
}

async function processEvent(eventText, channel) {
    const now = Date.now();
    const lastProcessedTimestamp = processedEventTimestamps.get(eventText) || 0;

    // Skip the event if it was processed recently
    if (now - lastProcessedTimestamp < EVENT_TIME_THRESHOLD) {
        console.log(`[Events] Skipping event: "${eventText}" (already processed)`);
        return;
    }

    // Parse the message for details
    const parsedMessage = parseMessageForColor(eventText);
    if (!parsedMessage) {
       // console.log(`[Events] Skipping event: "${eventText}" (no valid message)`); // Log and skip invalid messages
        return;
    }

    const { message: cleanMessage, color } = parsedMessage;

    // Update the timestamp map
    processedEventTimestamps.set(eventText, now);
    saveProcessedEventTimestamps();

    const embed = new EmbedBuilder()
        .setColor(color)
        .setDescription(cleanMessage)
        .setTimestamp();

    await channel.send({
        content: '<@&1305780594860363852>',
        embeds: [embed],
    });

   // console.log(`[Events] Processed event: "${eventText}"`);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
    loadProcessedEventTimestamps();

    const channelId = '1315067997294956726'; // Announcement channel ID
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
        
                const channelId = '1315067997294956726'; // Announcement channel ID
                const channel = client.channels.cache.get(channelId);
        
                if (!channel || (channel.type !== ChannelType.GuildAnnouncement && channel.type !== ChannelType.GuildText)) {
                    console.error("Invalid channel ID or the channel is not an announcement or text channel.");
                    return;
                }
        
                for (const value of data) {
                    const { liveAction: message } = value; // Use event text
                    await processEvent(message, channel); // Pass the channel to processEvent
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

client.login('ODU5NzA5Mjk3ODk3NzY2OTEz.Gh6b1T.Peni-WAa50EMbUumH-Z0sZU2lISMU8HW5m8NWs');
