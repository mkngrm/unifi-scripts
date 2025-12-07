// UniFi Network to Discord Alert Processor for n8n (unifi-network-to-discord.js)
//
// SETUP INSTRUCTIONS:
// 1. Update DISCORD_WEBHOOK_URL with your Discord webhook URL
// 2. Update TIMEZONE if needed (default: America/New_York)
// 3. Customize CATEGORY_CONFIGS to add/modify alert categories, emojis, and colors
// 4. Customize SEVERITY_LABELS if you want different severity names

// ============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================================

// Discord webhook URL - Create one in Discord: Server Settings > Integrations > Webhooks
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN';

// Timezone for timestamp display (IANA timezone format)
const TIMEZONE = 'America/New_York';

// Category/SubCategory emoji and color mapping
// Colors are Discord embed colors in decimal format (use https://www.spycolor.com to convert hex)
const CATEGORY_CONFIGS = {
  'VPN': { emoji: '🔐', color: 5763719 },         // Green
  'Firewall': { emoji: '🛡️', color: 15548997 },   // Red
  'WiFi': { emoji: '📶', color: 3447003 },        // Blue
  'System': { emoji: '⚙️', color: 9936031 },      // Gray
  'Switching': { emoji: '🔌', color: 15105570 },  // Orange
  'Routing': { emoji: '🌐', color: 10181046 },    // Purple
  'Threat': { emoji: '⚠️', color: 15548997 },     // Red
  'DEFAULT': { emoji: '📡', color: 5793266 }      // Teal
};

// Severity level labels and colors (UniFi uses 1-5, lower = more severe)
// Customize labels as needed
const SEVERITY_CONFIGS = {
  1: { label: 'Info', emoji: 'ℹ️', color: 3447003 },       // Blue
  2: { label: 'Notice', emoji: '📋', color: 5793266 },    // Teal
  3: { label: 'Warning', emoji: '⚠️', color: 16776960 },  // Yellow
  4: { label: 'Error', emoji: '❌', color: 15105570 },    // Orange
  5: { label: 'Critical', emoji: '🚨', color: 15548997 }  // Red
};

// ============================================================================
// DO NOT MODIFY BELOW THIS LINE (unless you know what you're doing)
// ============================================================================

function convertTimestamp(timestamp) {
  if (timestamp) {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (error) {
      return "Invalid timestamp";
    }
  }
  return "No timestamp available";
}

function getCategoryConfig(category, subCategory) {
  // Try subcategory first, then category, then default
  if (subCategory && CATEGORY_CONFIGS[subCategory]) {
    return CATEGORY_CONFIGS[subCategory];
  }
  if (category && CATEGORY_CONFIGS[category]) {
    return CATEGORY_CONFIGS[category];
  }
  return CATEGORY_CONFIGS.DEFAULT;
}

// Main processing
const data = items[0].json.body;
const results = [];

if (data && data.app === 'network') {
  const params = data.parameters || {};
  const severity = data.severity || 1;
  const severityConfig = SEVERITY_CONFIGS[severity] || SEVERITY_CONFIGS[1];

  const category = params.UNIFIcategory || 'System';
  const subCategory = params.UNIFIsubCategory || '';
  const categoryConfig = getCategoryConfig(category, subCategory);

  const eventName = data.name || 'Network Event';
  const message = data.message || '';
  const site = params.UNIFIsite || 'Default';
  const host = params.UNIFIhost || '';
  const timestamp = params.UNIFIutcTime || new Date().toISOString();

  const readableTimestamp = convertTimestamp(timestamp);

  // Build title with category emoji
  const title = `${categoryConfig.emoji} ${eventName}`;

  // Build fields
  const fields = [
    {
      name: "📍 Site",
      value: site,
      inline: true
    },
    {
      name: "📁 Category",
      value: subCategory ? `${category} / ${subCategory}` : category,
      inline: true
    },
    {
      name: `${severityConfig.emoji} Severity`,
      value: severityConfig.label,
      inline: true
    }
  ];

  // Add message if present
  if (message) {
    fields.push({
      name: "💬 Details",
      value: message,
      inline: false
    });
  }

  // Add relevant parameters based on subcategory
  if (subCategory === 'VPN') {
    if (params.suser) {
      fields.push({
        name: "👤 Client",
        value: params.suser,
        inline: true
      });
    }
    if (params.UNIFIvpnName) {
      fields.push({
        name: "🔐 VPN",
        value: params.UNIFIvpnName,
        inline: true
      });
    }
    if (params.src) {
      fields.push({
        name: "🌐 Source IP",
        value: params.src,
        inline: true
      });
    }
    if (params.UNIFIclientIp) {
      fields.push({
        name: "📍 Assigned IP",
        value: params.UNIFIclientIp,
        inline: true
      });
    }
  }

  // Add WAN info if present
  if (params.UNIFIwanId) {
    fields.push({
      name: "🔗 WAN",
      value: params.UNIFIwanId,
      inline: true
    });
  }

  // Add timestamp
  fields.push({
    name: "🕐 Time",
    value: readableTimestamp,
    inline: false
  });

  const discordEmbed = {
    embeds: [
      {
        title: title,
        description: data.customContent || null,
        color: categoryConfig.color,
        fields: fields,
        footer: {
          text: `UniFi Network ${data.version || ''}`.trim(),
          icon_url: "https://pbs.twimg.com/profile_images/1610157462321254402/tMCv8T-y_400x400.png"
        },
        timestamp: new Date(timestamp).toISOString()
      }
    ]
  };

  results.push({
    json: {
      webhookUrl: DISCORD_WEBHOOK_URL,
      discordEmbed: discordEmbed,
      // Metadata for filtering/routing
      category: category,
      subCategory: subCategory,
      severity: severity,
      severityLabel: severityConfig.label,
      eventName: eventName,
      site: site,
      alarmId: data.alarm_id,
      timestamp: readableTimestamp
    }
  });
} else {
  results.push({
    json: {
      error: "No network alert data found or wrong app type",
      originalData: data
    }
  });
}

return results;
