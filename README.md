# UniFi Scripts

Scripts for integrating UniFi Protect with external services.

## unifi-to-discord.js

Processes UniFi Protect alarm events and formats them as Discord webhook embeds.

### Setup

1. Copy `config.example.js` to `config.js`
2. Edit `config.js` with your settings:
   - `discordWebhookUrl`: Your Discord webhook URL
   - `deviceMapping`: MAC address to camera name mapping
   - `timezone`: Your timezone (default: America/New_York)

### Configuration

The `config.js` file is gitignored to keep your sensitive data private. See `config.example.js` for the expected format.
