const { Client, GatewayIntentBits, TextChannel, EmbedBuilder } = require('discord.js');
const WebSocket = require('ws');
const crypto = require('crypto'); // Import the crypto module to generate a hash

    // Track processed event hashes to prevent duplicates
    let processedEventIds = new Set();

    // Function to generate a unique hash based on the message content
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
    } else if (message.toLowerCase().includes('escort')) {
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
        color = '#43BA55'; // Red for removal related actions
    } else if (message.toLowerCase().includes('claimed')) {
        message = '💰 ' + message; // Moneybag emoji
        color = '#E33232'; // Red for violent actions
        
    }

    // Return the clean message (stripped of HTML) and the selected color based on livefeed action...
    return { message: message.trim(), color };
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Replace with your actual channel ID
    const channelId = '1297385881295917088';
    const channel = client.channels.cache.get(channelId);

    if (!channel || !(channel instanceof TextChannel)) {
        console.error("Invalid channel ID or the channel is not a text channel.");
        return;
    }

    let websocket;
const processedEventIds = new Set(); // To keep track of processed events

function initSocket() {
    // Establish WebSocket connection
    websocket = new WebSocket('wss://ws.bobba.ca:8443/LiveFeed');

    websocket.onopen = () => {
        const msg = {
            EventName: "livefeed", 
            Bypass: false, 
            ExtraData: null, 
            JSON: true
        };
        websocket.send(JSON.stringify(msg));
        console.log("[WEBSOCKET] Successfully established WebSocket connection...");
    };

    websocket.onmessage = async (event) => {
        try {
            const data = JSON.parse(event.data);
            if (!data || data.length === 0) {
                return;
            }

            for (const value of data) {
                const { liveAction: message } = value; // Only show liveAction message

                // Generate a unique hash based on the message content - this prevents the ws from sending it continuously...
                const eventId = generateHash(message);

                // Prevent reprocessing the same event...
                if (processedEventIds.has(eventId)) {
                    console.log(`[WEBSOCKET] Skipping already processed event with hash: ${eventId}`);
                    continue;
                }

                // Processed
                processedEventIds.add(eventId);

                // Parse the message to set color and clean it up
                const { message: cleanMessage, color } = parseMessageForColor(message);

                // Create the embed with the cleaned message and the set color
                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setDescription(cleanMessage);

                // Send the embed to the specified Discord channel
                await channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error("[WEBSOCKET] Error processing live feed message:", error);
        }
    };

    websocket.onclose = () => {
        console.error('[WEBSOCKET] Disconnected from WebSocket... Attempting to reconnect in 5 seconds...');
        setTimeout(initSocket, 5000); // Reconnect after 5 seconds
    };

    websocket.onerror = (error) => {
        console.error("[WEBSOCKET] WebSocket error occurred:", error.message);
    };
}

// Initialize the WebSocket connection
initSocket();
});
// Replace with your bot's token
client.login('NTg4NTQxNTI5NTIyNzAwMzAx.GXG-Pw.3Pua78SsdbYRgyRPsLKiZRb3jhPryGHQv4cAhQ');
