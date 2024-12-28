const {
  Client,
  GatewayIntentBits,
  TextChannel,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const WebSocket = require("ws");
const crypto = require("crypto");

// Hardcoded server ID
const SERVER_ID = "1317256023274426489";

// Hardcoded channel IDs for different keyword groups (server-specific)
const CHANNEL_IDS = {
  banking: "1322461480926580736", // All Banking Logging
  bans: "1317752435103760394", // All Ban Logging
  casino: "1319952954589057055", // All Casino Money ($) Tracking
  corporations: "1322461215636717619", // All Corporation Tracking (Hire/Fire/Promote/Demote)
  corporations2: "1322461296905551942", // All Money (Pay) Tracking
  event: "1322466331680968724", // All Event Point Logging
  events: "1317977195741708369", // All Events Logging
  inventory: "1320610363615481907", // All Shop Claims (VIP, Skins, Tokens etc)
  mutes: "1317752450102591559", // All Mute Logging
  names: "1320613013832732743", // All Mute Logging
  staff: "1320600767765413960", // All Staff Commands
  session: "1317752835366060072", // All Sessions (login, disconnect)
  shop: "1320609631214505994", // All Shop Claims (VIP, Skins, Tokens etc)
  transactions: "1317752676506931231", // All Money ($) Tracking
};

// Processed event IDs to prevent duplicates
const processedEventIds = new Set();

// Keywords mapping to channels and embed colors
const keywordMapping = [
  // Start of Bank Logging
  {
    keywords: ["deposited"],
    emoji: "📥",
    color: "#43BA55",
    channel: CHANNEL_IDS.banking,
  },
  {
    keywords: ["withdrew"],
    emoji: "📤",
    color: "#E33232",
    channel: CHANNEL_IDS.banking,
  },
  // End of Bank Logging
  // Start of Ban Logging
  {
    keywords: ["unbanned"],
    emoji: "🌟",
    color: "#43BA55",
    channel: CHANNEL_IDS.bans,
  },
  {
    keywords: ["banned"],
    emoji: "⚠️",
    color: "#E33232",
    channel: CHANNEL_IDS.bans,
  },
  {
    keywords: ["ip banned"],
    emoji: "⚠️",
    color: "#E33232",
    channel: CHANNEL_IDS.bans,
  },
  // End of Ban Logging
  // Start of Casino Logging
  {
    keywords: ["has won a bet of"],
    emoji: "🤑",
    color: "#FEE75C",
    channel: CHANNEL_IDS.casino,
  },
  {
    keywords: ["slots"],
    emoji: "🎰",
    color: "#E33232",
    channel: CHANNEL_IDS.casino,
  },
  // End of Casino Logging
  // Corporation Logging
  {
    keywords: ["hired"],
    emoji: "📝",
    color: "#43BA55",
    channel: CHANNEL_IDS.corporations,
  },
  {
    keywords: ["fired"],
    emoji: "💼",
    color: "#E33232",
    channel: CHANNEL_IDS.corporations,
  },
  {
    keywords: ["quit"],
    emoji: "🚪",
    color: "#E33232",
    channel: CHANNEL_IDS.corporations,
  },
  {
    keywords: ["promoted"],
    emoji: "🎉",
    color: "#43BA55",
    channel: CHANNEL_IDS.corporations,
  },
  {
    keywords: ["demoted"],
    emoji: "😓",
    color: "#43BA55",
    channel: CHANNEL_IDS.corporations,
  },
  {
    keywords: ["home"],
    emoji: "🏠",
    color: "#43BA55",
    channel: CHANNEL_IDS.corporations,
  },
  // End of Corporation Logging
  // Corporation Pay Logging
  {
    keywords: ["tip"],
    emoji: "🤑",
    color: "#FEE75C",
    channel: CHANNEL_IDS.corporations2,
  },
  {
    keywords: ["paycheck"],
    emoji: "💰",
    color: "#5865F2",
    channel: CHANNEL_IDS.corporations2,
  },
  // End of Corporation Pay Logging
  // Start of Event Point Logging
  {
    keywords: ["Event Points"],
    emoji: "🎊",
    color: "#43BA55",
    channel: CHANNEL_IDS.event,
  },
  // End of Event Point Logging
  // Start of Events Logging
  {
    keywords: ["a game of brawl has just started"],
    emoji: "🥊",
    color: "#E33232",
    channel: CHANNEL_IDS.events,
  },
  {
    keywords: ["a game of team brawl has just started"],
    emoji: "🤼",
    color: "#E33232",
    channel: CHANNEL_IDS.events,
  },
  {
    keywords: ["a game of scavenger hunt has just started"],
    emoji: "🔍",
    color: "#43BA55",
    channel: CHANNEL_IDS.events,
  },
  {
    keywords: ["a game of color wars has just started"],
    emoji: "🚩",
    color: "#D9CC43",
    channel: CHANNEL_IDS.events,
  },
  {
    keywords: ["a game of landmines has just started"],
    emoji: "💣",
    color: "#000000",
    channel: CHANNEL_IDS.events,
  },
  // End of Events Logging
  // Start of Inventory Logging
  {
    keywords: ["deleted"],
    emoji: "🗑️",
    color: "#E33232",
    channel: CHANNEL_IDS.inventory,
  },
  // End of Inventory Logging
  // Start of Mute Logging
  {
    keywords: ["muted"],
    emoji: "⚠️",
    color: "#E33232",
    channel: CHANNEL_IDS.mutes,
  },
  {
    keywords: ["unmuted"],
    emoji: "🌟",
    color: "#43BA55",
    channel: CHANNEL_IDS.mutes,
  },
  // End of Mute Logging
  // Start of Session Logging
  {
    keywords: ["logged on"],
    emoji: "🟢",
    color: "#43BA55",
    channel: CHANNEL_IDS.session,
  },
  {
    keywords: ["disconnected"],
    emoji: "🔴",
    color: "#E33232",
    channel: CHANNEL_IDS.session,
  },
  // End of Session Logging
  // Start of Name Logging
  {
    keywords: ["username to"],
    emoji: "✏️",
    color: "#43BA55",
    channel: CHANNEL_IDS.names,
  },
  // End of Name Logging
  // Start of Shop Logging
  {
    keywords: ["claimed"],
    emoji: "🤲",
    color: "#E33232",
    channel: CHANNEL_IDS.shop,
  },
  {
    keywords: ["vip"],
    emoji: "💎",
    color: "#43BA55",
    channel: CHANNEL_IDS.shop,
  },
  // End of Shop
  // Start of Staff Logging
  {
    keywords: ["alert"],
    emoji: "🚨",
    color: "#E33232",
    channel: CHANNEL_IDS.staff,
  },
  {
    keywords: ["alerted"],
    emoji: "🔔",
    color: "#E33232",
    channel: CHANNEL_IDS.staff,
  },
  {
    keywords: ["badge"],
    emoji: "🌆",
    color: "#E33232",
    channel: CHANNEL_IDS.staff,
  },
  {
    keywords: ["granted"],
    emoji: "🌟",
    color: "#43BA55",
    channel: CHANNEL_IDS.staff,
  },
  {
    keywords: ["removed"],
    emoji: "⚠️",
    color: "#E33232",
    channel: CHANNEL_IDS.staff,
  },
  {
    keywords: ["revoked"],
    emoji: "⚠️",
    color: "#E33232",
    channel: CHANNEL_IDS.staff,
  },
  {
    keywords: ["froze"],
    emoji: "❄️",
    color: "#E33232",
    channel: CHANNEL_IDS.staff,
  },
  {
    keywords: ["unfroze"],
    emoji: "💧",
    color: "#43BA55",
    channel: CHANNEL_IDS.staff,
  },
  {
    keywords: ["freeze"],
    emoji: "❄️",
    color: "#E33232",
    channel: CHANNEL_IDS.staff,
  },
  {
    keywords: ["unfreeze"],
    emoji: "💧",
    color: "#43BA55",
    channel: CHANNEL_IDS.staff,
  },
  {
    keywords: ["sent"],
    emoji: "🚀",
    color: "#43BA55",
    channel: CHANNEL_IDS.staff,
  },
  {
    keywords: ["summoned"],
    emoji: "🧙‍♂️",
    color: "#43BA55",
    channel: CHANNEL_IDS.staff,
  },
  {
    keywords: ["unloaded"],
    emoji: "⏏️",
    color: "#E33232",
    channel: CHANNEL_IDS.staff,
  },
  {
    keywords: ["warped"],
    emoji: "🌀",
    color: "#43BA55",
    channel: CHANNEL_IDS.staff,
  },
  {
    keywords: ["account checked"],
    emoji: "📝",
    color: "#E33232",
    channel: CHANNEL_IDS.staff,
  },
  {
    keywords: ["namechecked"],
    emoji: "🖋️",
    color: "#E33232",
    channel: CHANNEL_IDS.staff,
  },
  {
    keywords: ["userinfo"],
    emoji: "📋",
    color: "#E33232",
    channel: CHANNEL_IDS.staff,
  },
  // End of Staff Logging
  // Start of Transaction Logging
  {
    keywords: ["purchased"],
    emoji: "🛍️",
    color: "#43BA55",
    channel: CHANNEL_IDS.transactions,
  },
  {
    keywords: ["gave"],
    emoji: "💸",
    color: "#E33232",
    channel: CHANNEL_IDS.transactions,
  },
  {
    keywords: ["received"],
    emoji: "📩",
    color: "#FEE75C",
    channel: CHANNEL_IDS.transactions,
  },
  {
    keywords: ["receiving"],
    emoji: "📩",
    color: "#FEE75C",
    channel: CHANNEL_IDS.transactions,
  },
  {
    keywords: ["given"],
    emoji: "📩",
    color: "#FEE75C",
    channel: CHANNEL_IDS.transactions,
  },
  {
    keywords: ["offered"],
    emoji: "🤝",
    color: "#5EB6D1",
    channel: CHANNEL_IDS.transactions,
  },
  {
    keywords: ["ticket"],
    emoji: "🎫",
    color: "#E33232",
    channel: CHANNEL_IDS.transactions,
  },
  // End of Transaction Logging
];

// Generate a unique hash for each message to prevent duplicates
function generateHash(message) {
  return crypto
    .createHash("sha256")
    .update(message.trim().toLowerCase())
    .digest("hex");
}

// Clean and parse messages, determine the appropriate channel and styling
function parseMessage(message) {
  const cleanMessage = message
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();

  for (const { keywords, emoji, color, channel } of keywordMapping) {
    if (
      keywords.some((keyword) => cleanMessage.toLowerCase().includes(keyword))
    ) {
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
      console.warn(
        `[UserLogs] Missing 'Send Messages' permission for channel ${channelId}`
      );
      return;
    }
    if (!permissions.has(PermissionsBitField.Flags.EmbedLinks)) {
      console.warn(
        `[UserLogs] Missing 'Embed Links' permission for channel ${channelId}`
      );
      return;
    }

    // Send embed message
    const embed = new EmbedBuilder()
      .setColor(color)
      .setDescription(formattedMessage);

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error(
      `[UserLogs] Failed to send message to channel ${channelId}:`,
      error.message
    );
  }
}

// Initialize the WebSocket connection
function initWebSocket(client) {
  const websocket = new WebSocket("wss://ws.bobba.ca:8443/Logs");

  websocket.onopen = () => {
    console.warn("[UserLogs] WebSocket connected.");
    websocket.send(
      JSON.stringify({
        EventName: "userlogs",
        Bypass: false,
        ExtraData: null,
        JSON: true,
      })
    );
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
        console.warn("[UserLogs] Received invalid data format.");
      }
    } catch (error) {
      console.error(
        "[UserLogs] Error processing WebSocket message:",
        error.message
      );
    }
  };

  websocket.onclose = () => {
    console.warn(
      "[UserLogs] WebSocket disconnected. Reconnecting in 5 seconds..."
    );
    setTimeout(() => initWebSocket(client), 5000);
  };

  websocket.onerror = (error) => {
    console.error("[UserLogs] WebSocket error:", error.message);
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

client.once("ready", async () => {
  console.warn("UserLogs has successfully started!");

  // Send a restart notification to all listed channels
  for (const [key, channelId] of Object.entries(CHANNEL_IDS)) {
    try {
      const guild = await client.guilds.fetch(SERVER_ID);
      const channel = await guild.channels.fetch(channelId);
      if (!channel || !(channel instanceof TextChannel)) {
        console.warn(`[UserLogs] Invalid or missing channel: ${channelId}`);
        continue;
      }

      // Check bot permissions
      const permissions = channel.permissionsFor(client.user);
      if (!permissions.has(PermissionsBitField.Flags.SendMessages)) {
        console.warn(
          `[UserLogs] Missing 'Send Messages' permission for channel ${channelId}`
        );
        continue;
      }
      if (!permissions.has(PermissionsBitField.Flags.EmbedLinks)) {
        console.warn(
          `[UserLogs] Missing 'Embed Links' permission for channel ${channelId}`
        );
        continue;
      }

      // Send restart message
      const embed = new EmbedBuilder()
        .setColor("#FFA500") // Orange color for restart notification
        .setDescription(
          `🔄 Logging has been restarted and is now operational.`
        );

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(
        `[UserLogs] Failed to send restart message to channel ${channelId}:`,
        error.message
      );
    }
  }

  // Initialize WebSocket
  initWebSocket(client);
});

// Bot login
client.login(
  "ODU5NzA5Mjk3ODk3NzY2OTEz.Gh6b1T.Peni-WAa50EMbUumH-Z0sZU2lISMU8HW5m8NWs"
);
