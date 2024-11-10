const { Client, GatewayIntentBits, TextChannel, EmbedBuilder } = require('discord.js');
const WebSocket = require('ws');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// File to store processed event hashes, Load and Save...
const processedEventFile = path.join(__dirname, '../Data/livefeedEvents.json');
let processedEventIds = new Set();
let messageQueue = [];  // Queue to hold messages

// Load processed event IDs from file
function loadProcessedEventIds() {
    if (fs.existsSync(processedEventFile)) {
        const data = fs.readFileSync(processedEventFile, 'utf8');
        try {
            const loadedIds = JSON.parse(data);
            processedEventIds = new Set(loadedIds);
            console.log(`Live Feed - Loaded ${loadedIds.length} processed event IDs from file.`);
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

// Function to strip HTML tags and detect emoji/color based on key phrases in the message
function parseMessageForColor(html) {
    let color = '#5DCBF0'; // Default color
    let message = html;

    // Strip any remaining HTML tags
    message = message.replace(/<\/?[^>]+(>|$)/g, '');

    // Add emoji and set color based on key phrases (individual checks for each)
    if (message.toLowerCase().includes('murdered')) {
        message = '🔪 ' + message; // Knife emoji
        color = '#E33232'; // Red for violent actions
    } else if (message.toLowerCase().includes('suicide')) {
        message = '☠️ ' + message; // Skull emoji
        color = '#E33232'; // Red for violent actions
    } else if (message.toLowerCase().includes('guilty')) {
        message = '⚖️ ' + message; // Scales emoji (Justice)
        color = '#E33232'; // Red for guilty actions
    } else if (message.toLowerCase().includes('arrested')) {
        message = '🚔 ' + message; // Police car emoji
        color = '#5EB6D1'; // Blue for police-related actions
    } else if (message.toLowerCase().includes('escorted')) {
        message = '🪝 ' + message; // Hook emoji
        color = '#5EB6D1'; // Blue for police-related actions
    } else if (message.toLowerCase().includes('released')) {
        message = '🕊️ ' + message; // Dove emoji
        color = '#5EB6D1'; // Blue for police-related actions
    } else if (message.toLowerCase().includes('evaded')) {
        message = '🏃‍♂️ ' + message; // Running emoji
        color = '#5EB6D1'; // Blue for police-related actions
    } else if (message.toLowerCase().includes('ticketed')) {
        message = '🎫 ' + message; // Ticket emoji
        color = '#5EB6D1'; // Blue for police-related actions
    } else if (message.toLowerCase().includes('pardoned')) {
        message = '🎉 ' + message; // Party emoji
        color = '#5EB6D1'; // Blue for police-related actions
    } else if (message.toLowerCase().includes('robbed')) {
        message = '🦹‍♂️ ' + message; // Robber emoji
        color = '#5EB6D1'; // Blue for police-related actions
    } else if (message.toLowerCase().includes('blacklisted')) {
        message = '⛔ ' + message; // No entry emoji
        color = '#000000'; // Black for negative actions
    } else if (message.toLowerCase().includes('divorced')) {
        message = '💔 ' + message; // Broken heart emoji
        color = '#000000'; // Black for negative actions
    } else if (message.toLowerCase().includes('married')) {
        message = '💍 ' + message; // Rings emoji
        color = '#D3D3D3'; // Softer white for marriage
    } else if (message.toLowerCase().includes('innocent')) {
        message = '🕊️ ' + message; // Dove emoji
        color = '#D3D3D3'; // Softer white for innocent actions
    } else if (message.toLowerCase().includes('hired')) {
        message = '📝 ' + message; // Document emoji
        color = '#43BA55'; // Green for work-related actions
    } else if (message.toLowerCase().includes('fired')) {
        message = '💼 ' + message; // Briefcase emoji for fired
        color = '#E33232'; // Red for this work-related action
    } else if (message.toLowerCase().includes('quit')) {
        message = '🚪 ' + message; // Door emoji
        color = '#E33232'; // Red for this work-related action
    } else if (message.toLowerCase().includes('promoted')) {
        message = '🎉 ' + message; // Party popper emoji for promotion
        color = '#43BA55'; // Green for work-related actions
    } else if (message.toLowerCase().includes('demoted')) {
        message = '😓 ' + message; // Grimacing face emoji for demotion
        color = '#43BA55'; // Green for demotion-related actions
    } else if (message.toLowerCase().includes('won')) {
        message = '🏆 ' + message; // Trophy emoji for winning
        color = '#D9CC43'; // Gold for winning actions
    } else if (message.toLowerCase().includes('beat')) {
        message = '🏆 ' + message; // Trophy emoji for beating someone
        color = '#D9CC43'; // Gold for winning actions
    } else if (message.toLowerCase().includes('blew up') || message.toLowerCase().includes('blown up')) {
        message = '💣 ' + message; // Bomb emoji for explosions
        color = '#E33232'; // Red for violent actions
    } else if (message.toLowerCase().includes('home')) {
        message = '🏠 ' + message; // House emoji
        color = '#43BA55'; // Green for work-related actions
    } else if (message.toLowerCase().includes('placed a bounty')) {
        message = '🎯 ' + message; // Target emoji
        color = '#E33232'; // Red for violent actions
    } else if (message.toLowerCase().includes('removed their bounty')) {
        message = '🗑️ ' + message; // Trashcan emoji
        color = '#43BA55'; // Green for removal-related actions
    } else if (message.toLowerCase().includes('claimed')) {
        message = '💰 ' + message; // Moneybag emoji
        color = '#E33232'; // Red for violent actions
    }
      else if (message.toLowerCase().includes('waste')) {
        message = '♻️ ' + message; // Adds recycling emoji
        color = '#43BA55'; // Sets color to green for waste/removal-related messages
    }
      else if (message.toLowerCase().includes('factory')) {
        message = '🏭 ' + message; // Adds factory emoji
        color = '#5EB6D1'; // Blue for factory-related actions
    }
      else if (message.toLowerCase().includes('knocked out')) {
        message = '🥊 ' + message; // Adds boxing glove emoji
        color = '#E33232'; // Red for violent actions
    }
      else if (message.toLowerCase().includes('eliminated')) {
        message = '⚔️ ' + message; // Adds crossed swords emoji
        color = '#E33232'; // Red for violent actions
    }

    // Return the clean message (stripped of HTML) and the selected color based on livefeed action...
    return { message: message.trim(), color };
}

// Process the message queue at a rate of 9 messages per second
setInterval(async () => {
    if (messageQueue.length > 0) {
        const messagesToSend = messageQueue.splice(0, 9);
        for (const { channel, embed } of messagesToSend) {
            await channel.send({ embeds: [embed] });
        }
    }
}, 1000);  // 1000 ms interval to process the queue

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
    console.log(`Live Feed has started!`);
    loadProcessedEventIds();
    
    const channelId = '1297385881295917088';
    const channel = client.channels.cache.get(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
        console.error("Invalid channel ID or the channel is not a text channel.");
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
                JSON: true
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

                    processedEventIds.add(eventId);
                    const { message: cleanMessage, color } = parseMessageForColor(message);
                    const embed = new EmbedBuilder().setColor(color).setDescription(cleanMessage);
                    messageQueue.push({ channel, embed });  // Queue the message instead of sending immediately
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

// Replace with your bot's token
client.login('NTg4NTQxNTI5NTIyNzAwMzAx.GXG-Pw.3Pua78SsdbYRgyRPsLKiZRb3jhPryGHQv4cAhQ');
