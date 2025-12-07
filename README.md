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

### Finding Camera MAC Addresses

MAC addresses can be found in UniFi Protect under each device's settings. The format should be uppercase with no colons (e.g., `F4E2C679B337`).

### Alert Levels

The script supports different alert levels that change the Discord embed appearance:
- `SECURITY:` - Red embed with alert emoji
- `WARNING:` - Orange embed with warning emoji
- `ALERT:` - Yellow embed with bell emoji
- `INFO:` - Blue embed with info emoji

Prefix your alarm names in UniFi Protect with these levels (e.g., "SECURITY: Motion Detected").
