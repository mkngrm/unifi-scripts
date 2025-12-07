// UniFi Protect to Discord Alert Processor
// Configuration is loaded from config.js (copy config.example.js to get started)

const config = require('./config');

// Device ID to device name mapping (loaded from config)
const DEVICE_MAPPING = config.deviceMapping;

// Discord webhook URL (loaded from config)
const DISCORD_WEBHOOK_URL = config.discordWebhookUrl;

// Timezone for timestamps (loaded from config)
const TIMEZONE = config.timezone || 'America/New_York';

// Alert level emoji and color mapping for video monitoring
const ALERT_CONFIGS = {
  'SECURITY': { emoji: '🚨', color: 16711680 },
  'WARNING': { emoji: '⚠️', color: 16753920 },
  'ALERT': { emoji: '🔔', color: 16776960 },
  'INFO': { emoji: 'ℹ️', color: 3447003 },
  'DEFAULT': { emoji: '📹', color: 9936031 }
};

function parseAlertName(alarmName) {
  const match = alarmName.match(/^(SECURITY|WARNING|ALERT|INFO):\s*(.+)$/i);

  if (match) {
    const level = match[1].toUpperCase();
    const restOfName = match[2].trim();
    return { level, fullName: `${level}: ${restOfName}` };
  }

  return { level: 'INFO', fullName: alarmName };
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

    const discordEmbed = {
      embeds: [
        {
          title: title,
          description: `Detected: ${triggerKey} at ${deviceInfo.name}`,
          color: alertConfig.color,
          fields: fields,
          footer: {
            text: "UniFi Protect",
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
