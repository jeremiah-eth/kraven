# KRAVEN — Telegram Alert Bot for Clanker/Bankr Deployments on Base

KRAVEN is a production-ready, 24/7 monitoring bot that watches all Clanker factory contracts on Base mainnet for new token deployments. When a deployment is made by someone on your watchlist, you get an instant Telegram alert.

> **Monitoring only** — no trading, no token deployment, no wallet required.

---

## Features

- 🔴 **Real-time on-chain monitoring** via WebSocket (viem) across all 6 Clanker factory contract versions
- 🤖 **Bankr support** — Bankr tokens flow through Clanker contracts and are automatically detected
- 📲 **Instant Telegram alerts** with token name, ticker, contract address (tap-to-copy), deployer, platform, and Clanker link
- 👀 **Watchlist management** via Telegram commands (`/add`, `/remove`, `/list`)
- 🔁 **Auto-reconnect** — if the WebSocket drops, KRAVEN reconnects automatically and notifies you
- 🗄️ **Supabase-backed** — all data persisted in PostgreSQL, nothing stored locally
- 🚂 **Railway-ready** — includes `Procfile`, `railway.toml`, and build scripts

---

## Environment Variables

Set these in your Railway dashboard under **Variables**. Never commit real values.

| Variable | Description |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Your bot token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHAT_ID` | Your personal chat ID (send `/start` to [@userinfobot](https://t.me/userinfobot)) |
| `BASE_WSS_RPC_URL` | Alchemy WebSocket URL: `wss://base-mainnet.g.alchemy.com/v2/YOUR_KEY` |
| `BASE_HTTPS_RPC_URL` | Alchemy HTTPS URL: `https://base-mainnet.g.alchemy.com/v2/YOUR_KEY` |
| `SUPABASE_URL` | Supabase Project URL: `https://your-ref.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase `anon` public key |

---

## Deploying to Railway

### Prerequisites
- [Railway account](https://railway.app)
- [Alchemy account](https://alchemy.com) — create a Base mainnet app and copy both WSS and HTTPS URLs
- [Supabase project](https://supabase.com) — copy **Project URL** and **`anon` public API key** from **Settings → API**
- Telegram bot created via [@BotFather](https://t.me/BotFather)

### Steps

1. **Set up Supabase Tables**
   - Go to your Supabase Dashboard → **SQL Editor**.
   - Paste and run the content of [`schema.sql`](schema.sql) to create the necessary tables.

2. **Push this repo to GitHub**
   ```bash
   git add .
   git commit -m "Configure KRAVEN bot"
   git push origin main
   ```

3. **Create a new Railway project**
   - Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
   - Select your `kraven` repository

4. **Set environment variables**
   - In Railway dashboard → your service → **Variables**
   - Add all 6 variables from the table above

5. **Deploy**
   - Railway will automatically run `npm install && npm run build` then `npm start`
   - Check the **Logs** tab to confirm KRAVEN is online

6. **Verify in Telegram**
   - You should receive: `✅ KRAVEN is online`
   - Send `/help` to your bot to confirm commands work

---

## Bot Commands

| Command | Description |
|---|---|
| `/add @username` | Add an X account to your watchlist |
| `/add https://x.com/username` | Also accepts full X profile URLs |
| `/remove @username` | Remove an account from your watchlist |
| `/list` | Show all watched accounts |
| `/status` | Bot uptime, WebSocket status, alert count |
| `/recent` | Last 5 alerts sent |
| `/help` | Show command reference |

---

## Alert Format

```
🚨 Alpha Alert

💊 Token: MyToken $MYTKN
📄 CA: 0x1234...abcd
🏭 Platform: via Bankr
🐦 Deployer: @username → https://x.com/username
🔗 View on Clanker: https://clanker.world/clanker/0x1234...abcd
⏰ Time: Tue, 18 Feb 2026 15:43:20 GMT
```

The contract address is formatted as monospace text in Telegram — tap to copy.

---

## Architecture

```
src/
├── index.ts              # Entry point — orchestrates startup
├── config.ts             # Env var validation
├── logger.ts             # Timestamped logger
├── db.ts                 # Supabase API client (HTTPS-based)
├── chain/
│   ├── contracts.ts      # Factory addresses + event ABI
│   └── listener.ts       # viem WebSocket listener + auto-reconnect
├── api/
│   └── clanker.ts        # Clanker API client with retry logic
└── telegram/
    ├── alerts.ts          # Bot init, alert formatter, message sender
    └── commands.ts        # /add /remove /list /status /recent /help
```

### Monitored Factory Contracts

| Version | Address |
|---|---|
| v4.0.0 | `0xE85A59c628F7d27878ACeB4bf3b35733630083a9` |
| v3.1.0 | `0x2A787b2362021cC3eEa3C24C4748a6cD5B687382` |
| v3.0.0 | `0x375C15db32D28cEcdcAB5C03Ab889bf15cbD2c5E` |
| v2.0.0 | `0x732560fa1d1A76350b1A500155BA978031B53833` |
| v1.0.0 | `0x9B84fcE5Dcd9a38d2D01d5D72373F6b6b067c3e1` |
| v0.0.0 | `0x250c9FB2b411B48273f69879007803790A6AeA47` |

---

## Database Schema

Since we use the Supabase HTTPS API, you must manually initialize your tables once in the Supabase SQL Editor.

```sql
CREATE TABLE IF NOT EXISTS watched_accounts (
  id        SERIAL PRIMARY KEY,
  x_handle  TEXT UNIQUE NOT NULL,
  added_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_history (
  id                 SERIAL PRIMARY KEY,
  token_name         TEXT,
  token_symbol       TEXT,
  contract_address   TEXT,
  deployer_x_handle  TEXT,
  platform           TEXT,
  clanker_url        TEXT,
  tx_hash            TEXT,
  alerted_at         TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Local Development

```bash
# Install dependencies
npm install

# Copy env example and fill in real values
cp .env.example .env

# Run in dev mode (ts-node, no build step)
npm run dev

# Build for production
npm run build

# Run compiled output
npm start
```

---

## Notes

- **Bankr vs Clanker**: Bankr is an interface on top of Clanker. All Bankr deployments flow through the same Clanker factory contracts. KRAVEN detects which platform was used by inspecting the `interface` field in the Clanker API response.
- **No X handle**: If a deployment has no X social context (e.g., direct contract deployment), KRAVEN silently skips it — no alert, no noise.
- **API retries**: KRAVEN retries the Clanker API up to 3 times with 2s delays to handle freshly-indexed tokens.
