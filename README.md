# UniFi Scripts

Scripts for integrating UniFi Protect with external services.

## unifi-to-discord.js

An n8n Code node script that processes UniFi Protect alarm events and sends formatted notifications to Discord.

### Setup

1. Copy the contents of `unifi-to-discord.js` into an n8n Code node
2. Update the configuration section at the top of the script:
   - `DISCORD_WEBHOOK_URL`: Your Discord webhook URL (create one in Discord: Server Settings > Integrations > Webhooks)
   - `DEVICE_MAPPING`: Your camera MAC addresses mapped to friendly names
   - `TIMEZONE`: Your timezone in IANA format (default: America/New_York)
   - `ALERT_CONFIGS`: Customize alert levels, emojis, and colors

### Finding Camera MAC Addresses

MAC addresses can be found in UniFi Protect under each device's settings. The format should be uppercase with no colons (e.g., `F4E2C679B337`).

### Alert Levels

The script supports different alert levels that change the Discord embed appearance:
- `SECURITY:` - Red embed with alert emoji
- `WARNING:` - Orange embed with warning emoji
- `ALERT:` - Yellow embed with bell emoji
- `INFO:` - Blue embed with info emoji

Prefix your alarm names in UniFi Protect with these levels (e.g., "SECURITY: Motion Detected"). You can add custom levels by editing `ALERT_CONFIGS`.

### Thumbnail Support

The script supports displaying camera thumbnails in Discord notifications.

**To enable thumbnails in UniFi Protect:**
1. Go to your webhook settings in UniFi Protect
2. Check the "Use Thumbnails" option
3. Make sure the webhook method is set to POST

**n8n workflow setup for thumbnails:**

The script outputs `hasThumbnail` and `thumbnailData` fields. To send images to Discord, you'll need to use an HTTP Request node with multipart form data:

1. After the Code node, add an **IF** node to check `{{ $json.hasThumbnail }}`
2. For the **true** branch (with thumbnail), use an HTTP Request node:
   - Method: POST
   - URL: `{{ $json.webhookUrl }}`
   - Body Content Type: Multipart Form Data
   - Body Parameters:
     - `payload_json` (string): `{{ JSON.stringify($json.discordEmbed) }}`
     - `files[0]` (file): Set filename to `thumbnail.jpg` and use expression `{{ Buffer.from($json.thumbnailData, 'base64') }}`
3. For the **false** branch (no thumbnail), use a simple HTTP Request node:
   - Method: POST
   - URL: `{{ $json.webhookUrl }}`
   - Body Content Type: JSON
   - Body: `{{ $json.discordEmbed }}`
