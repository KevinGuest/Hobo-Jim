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
    let color = '#5DCBF0';
    let message = html;

    // Strip any remaining HTML tags
    message = message.replace(/<\/?[^>]+(>|$)/g, '');

     // List of keywords to ignore
     const ignoreKeywords = [
        'a game of brawl',
        'a game of team brawl',
        'a game of scavenger',
        'a game of landmines',
    ];

    for (const keyword of ignoreKeywords) {
        if (message.toLowerCase().includes(keyword)) {
            return null;
        }
    }

    // Add emoji and set color based on key phrases (individual checks for each)
    if (message.toLowerCase().includes('murdered')) {
        message = '🔪 ' + message;
        color = '#E33232';
    } else if (message.toLowerCase().includes('suicide')) {
        message = '☠️ ' + message;
        color = '#E33232';
    } else if (message.toLowerCase().includes('guilty')) {
        message = '⚖️ ' + message;
        color = '#E33232';
    } else if (message.toLowerCase().includes('arrested')) {
        message = '🚔 ' + message;
        color = '#5EB6D1';
    } else if (message.toLowerCase().includes('escorted')) {
        message = '🪝 ' + message;
        color = '#5EB6D1';
    } else if (message.toLowerCase().includes('released')) {
        message = '🕊️ ' + message;
        color = '#5EB6D1'; 
    } else if (message.toLowerCase().includes('evaded')) {
        message = '🏃‍♂️ ' + message;
        color = '#5EB6D1'; 
    } else if (message.toLowerCase().includes('ticketed')) {
        message = '🎫 ' + message;
        color = '#5EB6D1'; 
    } else if (message.toLowerCase().includes('pardoned')) {
        message = '🎉 ' + message;
        color = '#5EB6D1'; 
    } else if (message.toLowerCase().includes('robbed')) {
        message = '🦹‍♂️ ' + message;
        color = '#5EB6D1'; 
    } else if (message.toLowerCase().includes('blacklisted')) {
        message = '⛔ ' + message;
        color = '#000000'; 
    } else if (message.toLowerCase().includes('divorced')) {
        message = '💔 ' + message;
        color = '#000000'; 
    } else if (message.toLowerCase().includes('married')) {
        message = '💍 ' + message;
        color = '#D3D3D3';
    } else if (message.toLowerCase().includes('innocent')) {
        message = '🕊️ ' + message;
        color = '#D3D3D3'; 
    } else if (message.toLowerCase().includes('hired')) {
        message = '📝 ' + message;
        color = '#43BA55'; 
    } else if (message.toLowerCase().includes('fired')) {
        message = '💼 ' + message;
        color = '#E33232';
    } else if (message.toLowerCase().includes('quit')) {
        message = '🚪 ' + message;
        color = '#E33232'; 
    } else if (message.toLowerCase().includes('promoted')) {
        message = '🎉 ' + message;
        color = '#43BA55'; 
    } else if (message.toLowerCase().includes('demoted')) {
        message = '😓 ' + message;
        color = '#43BA55';
    } else if (message.toLowerCase().includes('won')) {
        message = '🏆 ' + message;
        color = '#D9CC43';
    } else if (message.toLowerCase().includes('beat')) {
        message = '🏆 ' + message;
        color = '#D9CC43';
    } else if (message.toLowerCase().includes('blew up') || message.toLowerCase().includes('blown up')) {
        message = '💣 ' + message;
        color = '#E33232';
    } else if (message.toLowerCase().includes('home')) {
        message = '🏠 ' + message;
        color = '#43BA55'; 
    } else if (message.toLowerCase().includes('placed a bounty')) {
        message = '🎯 ' + message;
        color = '#E33232';
    } else if (message.toLowerCase().includes('removed their bounty')) {
        message = '🗑️ ' + message;
        color = '#43BA55';
    } else if (message.toLowerCase().includes('claimed')) {
        message = '💰 ' + message;
        color = '#E33232';
    }
      else if (message.toLowerCase().includes('waste')) {
        message = '♻️ ' + message;
        color = '#43BA55';
    }
      else if (message.toLowerCase().includes('factory')) {
        message = '🏭 ' + message;
        color = '#5EB6D1';
    }
      else if (message.toLowerCase().includes('knocked')) {
        message = '🥊 ' + message;
        color = '#E33232';
    }
      else if (message.toLowerCase().includes('eliminated')) {
        message = '⚔️ ' + message;
        color = '#E33232';
    }
    else if (message.toLowerCase().includes('radioactivity')) {
        message = '☢️ ' + message;
        color = '#E33232';
    }
    else if (message.toLowerCase().includes('meltdown')) {
        message = '🛑 ' + message;
        color = '#43BA55';
    }
    else if (message.toLowerCase().includes('hospital')) {
        message = '🚑 ' + message;
        color = '#43BA55';
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

client.login('NTg4NTQxNTI5NTIyNzAwMzAx.GXG-Pw.3Pua78SsdbYRgyRPsLKiZRb3jhPryGHQv4cAhQ');
