// Copy this file to config.js and fill in your actual values
// config.js is gitignored and will not be committed

module.exports = {
  // Discord webhook URL for sending notifications
  discordWebhookUrl: 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN',

  // Device MAC address to camera name mapping
  // Format: 'MAC_ADDRESS': { name: 'Camera Name', zone: 'zone_name' }
  deviceMapping: {
    'EXAMPLE_MAC_1': { name: 'Front Door Camera', zone: 'front' },
    'EXAMPLE_MAC_2': { name: 'Backyard Camera', zone: 'backyard' }
  },

  // Timezone for timestamp display
  timezone: 'America/New_York'
};
