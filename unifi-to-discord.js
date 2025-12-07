// UniFi Protect to Discord Alert Processor for n8n
//
// SETUP INSTRUCTIONS:
// 1. Update DISCORD_WEBHOOK_URL with your Discord webhook URL
// 2. Update DEVICE_MAPPING with your camera MAC addresses and names
//    - Find MAC addresses in UniFi Protect under each device's settings
// 3. Update TIMEZONE if needed (default: America/New_York)
// 4. Customize ALERT_CONFIGS to add/modify alert levels, emojis, and colors

// ============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================================

// Discord webhook URL - Create one in Discord: Server Settings > Integrations > Webhooks
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN';

// Device MAC address to camera name mapping
// Format: 'MAC_ADDRESS': { name: 'Display Name', zone: 'zone_name' }
// The MAC address should match what UniFi Protect sends (uppercase, no colons)
const DEVICE_MAPPING = {
  'XXXXXXXXXXXX': { name: 'Front Door Camera', zone: 'front' },
  'XXXXXXXXXXXX': { name: 'Backyard Camera', zone: 'backyard' },
  // Add more cameras as needed...
};

// Timezone for timestamp display (IANA timezone format)
const TIMEZONE = 'America/New_York';

// Alert level emoji and color mapping
// Prefix your UniFi alarm names with these levels (e.g., "SECURITY: Motion Detected")
// Colors are Discord embed colors in decimal format (use https://www.spycolor.com to convert hex)
// Add custom levels as needed - they will be matched case-insensitively
const ALERT_CONFIGS = {
  'SECURITY': { emoji: '🚨', color: 16711680 },  // Red
  'WARNING': { emoji: '⚠️', color: 16753920 },   // Orange
  'ALERT': { emoji: '🔔', color: 16776960 },     // Yellow
  'INFO': { emoji: 'ℹ️', color: 3447003 },        // Blue
  'DEFAULT': { emoji: '📹', color: 9936031 }     // Gray (used when no level prefix matches)
};

// ============================================================================
// DO NOT MODIFY BELOW THIS LINE (unless you know what you're doing)
// ============================================================================

function parseAlertName(alarmName) {
  // Dynamically build regex from ALERT_CONFIGS keys (excluding DEFAULT)
  const levels = Object.keys(ALERT_CONFIGS).filter(k => k !== 'DEFAULT').join('|');
  const regex = new RegExp(`^(${levels}):\\s*(.+)$`, 'i');
  const match = alarmName.match(regex);

  if (match) {
    const level = match[1].toUpperCase();
    const restOfName = match[2].trim();
    return { level, fullName: `${level}: ${restOfName}` };
  }

  return { level: 'DEFAULT', fullName: alarmName };
}

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

// Main processing
const data = items[0].json.body;
const results = [];

if (data.alarm) {
  const alarm = data.alarm;
  const rawAlarmName = alarm.name || 'Security Alert';
  const triggers = alarm.triggers || [];
  const timestamp = data.timestamp || Date.now();

  const { level, fullName } = parseAlertName(rawAlarmName);
  const alertConfig = ALERT_CONFIGS[level] || ALERT_CONFIGS.DEFAULT;

  const readableTimestamp = convertTimestamp(timestamp);

  for (const trigger of triggers) {
    const triggerKey = trigger.key || 'Unknown';
    const deviceMac = trigger.device || 'Unknown';
    const eventId = trigger.eventId || null;
    const eventLocalLink = alarm.eventLocalLink || null;

    let deviceInfo;
    if (deviceMac === 'FAKE_MAC') {
      deviceInfo = { name: 'Test Camera', zone: 'test' };
    } else {
      // Direct lookup - no normalization needed
      deviceInfo = DEVICE_MAPPING[deviceMac] ||
                   { name: `Unknown Device (${deviceMac})`, zone: 'unknown' };
    }

    const title = `${alertConfig.emoji} ${fullName}`;

    const fields = [
      {
        name: "📍 Location",
        value: deviceInfo.name,
        inline: true
      },
      {
        name: "🎯 Detection Type",
        value: triggerKey.charAt(0).toUpperCase() + triggerKey.slice(1),
        inline: true
      },
      {
        name: "⚠️ Alert Level",
        value: level,
        inline: true
      },
      {
        name: "🕐 Time",
        value: readableTimestamp,
        inline: false
      }
    ];

    if (eventLocalLink && eventId && eventId !== 'testEventId') {
      fields.push({
        name: "🎥 View Footage",
        value: `[Click here to view event](${eventLocalLink})`,
        inline: false
      });
    }

    const embed = {
      title: title,
      description: `Detected: ${triggerKey} at ${deviceInfo.name}`,
      color: alertConfig.color,
      fields: fields,
      footer: {
        text: "UniFi Protect",
        icon_url: "https://pbs.twimg.com/profile_images/1610157462321254402/tMCv8T-y_400x400.png"
      },
      timestamp: new Date(timestamp).toISOString()
    };

    const discordEmbed = {
      embeds: [embed]
    };

    // Handle thumbnail from UniFi Protect (enable "Use Thumbnails" in webhook settings)
    let thumbnailData = null;
    if (alarm.thumbnail) {
      let imageData = alarm.thumbnail;

      // Handle data URI format (data:image/jpeg;base64,...)
      if (imageData.startsWith('data:image')) {
        imageData = imageData.split(',')[1];
      }

      // Add image reference to embed
      embed.image = {
        url: "attachment://thumbnail.jpg"
      };

      // Store base64 data for the HTTP Request node to send as multipart
      thumbnailData = imageData;
    }

    results.push({
      json: {
        webhookUrl: DISCORD_WEBHOOK_URL,
        discordEmbed: discordEmbed,
        thumbnailData: thumbnailData,
        hasThumbnail: !!thumbnailData,
        alertType: level,
        alarmName: fullName,
        trigger: triggerKey,
        device: deviceInfo.name,
        zone: deviceInfo.zone,
        eventId: eventId,
        eventLink: eventLocalLink,
        timestamp: readableTimestamp
      }
    });
  }
} else {
  results.push({
    json: {
      error: "No alarm data found",
      originalData: data
    }
  });
}

return results;
