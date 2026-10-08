# 📍 Location API

API platform for Indian village / location data.
**Node • Express • Prisma • PostgreSQL**

Hierarchy: `State → District → Sub-district → Village`

## Quick start

```bash
git clone https://github.com/<your-username>/location-api.git
cd location-api
npm install

cp .env.example .env          # edit DATABASE_URL if needed
docker compose up -d          # starts local PostgreSQL (optional)

npx prisma migrate dev --name init
npm run seed                  # sample data
npm run dev                   # http://localhost:3000
```

## Authentication

Register to get an API key, then send it on every request in the `x-api-key` header.

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","name":"You"}'
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Get an API key |
| GET | `/api/states` | List states (`?search=`) |
| GET | `/api/states/:id/districts` | Districts in a state |
| GET | `/api/districts?stateId=` | List districts |
| GET | `/api/districts/:id/sub-districts` | Sub-districts in a district |
| GET | `/api/sub-districts/:id/villages` | Villages in a sub-district |
| GET | `/api/villages` | Filter: `stateId`, `districtId`, `subDistrictId`, `pincode`, `search` |
| GET | `/api/villages/:id` | Village with full hierarchy |
| GET | `/api/search?q=` | Autocomplete search (min 2 chars) |
| GET | `/health` | Health check |

All list endpoints support `?page=1&limit=25` (max 100).

```bash
curl -H "x-api-key: lk_xxx" "http://localhost:3000/api/search?q=mamb"
```

## Importing the full dataset

```bash
npm run import -- ./data/villages.csv
```

CSV headers: `state_code,state_name,district_code,district_name,subdistrict_code,subdistrict_name,village_code,village_name,pincode`
(see `data/sample-villages.csv`). Official village directory data is published by the Census of India / data.gov.in.

## Deployment (Render example)

1. Create a **PostgreSQL** instance on Render and copy its *External Database URL*.
2. Create a **Web Service** from this GitHub repo:
   - Build command: `npm install && npx prisma migrate deploy`
   - Start command: `npm start`
   - Env vars: `DATABASE_URL`, `NODE_ENV=production`
3. Open `https://<your-service>.onrender.com/health`.

## License

MIT
