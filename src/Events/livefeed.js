const { Client, GatewayIntentBits, TextChannel, EmbedBuilder } = require('discord.js');
const WebSocket = require('ws');

// Function to strip HTML tags and detect color from span class
function parseMessageForColor(html) {
    const spanRegex = /<span.*?class="(.*?)".*?>(.*?)<\/span>/i;
    let color = '#5DCBF0'; // Default color
    let message = html;

    // Find the <span> tag and extract color if present
    const match = spanRegex.exec(html);
    if (match) {
        const classes = match[1]; // Extract the class from the span tag

        // Check class and set color based on it
        if (classes.includes('green')) {
            color = '#00FF00'; // Green
        } else if (classes.includes('red')) {
            color = '#FF0000'; // Red
        } else if (classes.includes('yellow')) {
            color = '#FFFF00'; // Yellow
        }
        // You can add more class-to-color mappings here

        // Remove the span tag but keep the inner text
        message = html.replace(spanRegex, '$2');
    }

    // Strip any remaining HTML tags
    message = message.replace(/<\/?[^>]+(>|$)/g, '');

    // Return the cleaned message (stripped of HTML) and the selected color
    return { message: message.trim(), color };
}

// Initialize the Discord client with necessary intents
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Event when the bot is ready
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

                    // Smoke the message to determine color and clean it up
                    const { message: cleanMessage, color } = parseMessageForColor(message);

                    // Create the embed with the cleaned message and the color referenced in the SendLiveFeedEvent
                    const embed = new EmbedBuilder()
                        .setColor(color) // Sets the color based on the span class in the event sent
                        .setDescription(cleanMessage); // Show the cleaned message

                    // Send the embed to the #livefeed Discord channel
                    await channel.send({ embeds: [embed] });
                }
            } catch (error) {
                console.error("[WEBSOCKET] Error processing live feed message:", error);
            }
        };

        websocket.onclose = () => {
            console.log('[WEBSOCKET] Disconnected from WebSocket... Attempting to reconnect in 5 seconds...');
            setTimeout(initSocket, 5000);
        };

        websocket.onerror = (error) => {
            console.error("[WEBSOCKET] Error occurred:", error);
        };
    }

    initSocket();
});

// Replace with your bot's token
client.login('NTg4NTQxNTI5NTIyNzAwMzAx.GXG-Pw.3Pua78SsdbYRgyRPsLKiZRb3jhPryGHQv4cAhQ');
