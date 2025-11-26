# PNL Share Card Bot

Discord bot that generates custom profit-and-loss share cards based on Kalshi market data. Members can personalize their card backgrounds and color schemes, then create an image that shows cost, sells, profit, and percentage return for any Kalshi market.

## Prerequisites

- Node.js 18+ (Node 20+ recommended)
- npm 9+
- Windows users running `canvas` need the [Windows Build Tools](https://github.com/nodejs/node-gyp#on-windows) (Visual Studio Build Tools + Desktop development with C++).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

   If `canvas` fails to install, follow the node-gyp instructions linked above, then rerun `npm install`.

2. Create `.env` in the repo root (see `.env.example`) with:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   CLIENT_ID=your_bot_application_id
   KALSHI_BASE_URL=https://api.elections.kalshi.com/trade-api/v2
   ```

3. Start the bot:
   ```bash
   npm start
   ```

   The first launch registers slash commands for every guild the bot is in. Allow a few minutes for commands to propagate globally.

## Slash Commands

- `/setbackground url:<image url|none>` – set or clear a background image.
- `/setcolors [background] [text] [accent]` – customize colors (hex codes).
- `/viewsettings` – view your saved preferences.
- `/createcard market:<ticker> cost:<number> sells:<number>` – fetch Kalshi market title, compute PNL, and post a rendered card image.

User preferences are stored per Discord user ID in `data/userSettings.json`.


