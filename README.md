# StratAPI

Usage-based API billing platform. Owners register APIs and distribute access keys to consumers, with real-time usage tracking and Razorpay-powered billing.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, TailwindCSS v4 |
| Auth | Firebase Authentication (client) + Firebase Admin (server) |
| Local DB | SQLite via Prisma (user identity) |
| Backend | Node.js / Express |
| Document DB | MongoDB (API keys, usage logs, billing) |
| Queue | BullMQ + Redis |
| Payments | Razorpay |

---

## Environment Variables

### `frontend/.env`

```env
DATABASE_URL=file:../../backend/db/custom.db
BACKEND_URL=https://your-backend-domain.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=stratapi-77837
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com

# Production only — paste the full Firebase service account JSON as a single line
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"stratapi-77837",...}
```

### `backend/.env`

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3001
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/stratapi
REDIS_URL=redis://...
ACCESS_TOKEN_SECRET=<min 32 chars, random>
REFRESH_TOKEN_SECRET=<min 32 chars, random>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX_REQUESTS=100
GATEWAY_TIMEOUT_MS=15000
REQUEST_BODY_LIMIT=1mb
FREE_TIER_REQUESTS=1000
PRICE_PER_100_REQUESTS_INR=0.5
BILLING_JOB_INTERVAL_MS=3600000
API_KEY_PREFIX=sa_live
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_CURRENCY=INR
LOG_LEVEL=info
```

---

## Local Development

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Push SQLite schema
cd frontend && npm run db:push

# Start both servers (in separate terminals)
cd backend  && npm run dev   # :3001
cd frontend && npm run dev   # :3000
```

---

## Production Deployment

### Frontend — Vercel (recommended)

1. Push repo to GitHub
2. Import into Vercel → set **Root Directory** to `frontend`
3. Add all `frontend/.env` variables in Vercel → Settings → Environment Variables
4. Deploy

> SQLite (`DATABASE_URL`) on Vercel: use a file path under `/tmp` or switch to PostgreSQL + update the Prisma schema.

### Backend — Railway / Render / VPS

```bash
cd backend
npm start
```

Set all `backend/.env` variables as environment variables on the host.

---

## Firebase Service Account (Production)

1. Firebase Console → Project Settings → Service Accounts → **Generate new private key**
2. Download the JSON file
3. Minify to a single line and set as `FIREBASE_SERVICE_ACCOUNT_JSON` env var on Vercel
