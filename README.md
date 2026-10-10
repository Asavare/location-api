# India Location API 🇮🇳

A RESTful API for accessing Indian administrative location data, including states, districts, sub-districts, and villages.

Built with **Node.js, Express, Prisma ORM, and PostgreSQL**, this project provides searchable, structured location data through authenticated API endpoints.

**Live API:** https://location-api-az0d.onrender.com  
**Interactive API Documentation:** https://location-api-az0d.onrender.com/api-docs/  
**GitHub Repository:** https://github.com/Asavare/location-api

---

## ✨ Features

- **Extensive location dataset:** Over 645,000 village records in the production database.
- **Hierarchical location data:** Access states, districts, sub-districts, and villages.
- **Village search:** Search village names and retrieve their administrative hierarchy.
- **Filtering and pagination:** Filter location records and retrieve results in manageable pages.
- **API-key authentication:** Protect API endpoints using the `x-api-key` request header.
- **Interactive documentation:** Explore and test endpoints using Swagger UI.
- **Input validation:** Validate search queries and registration data.
- **Security and performance:** Includes rate limiting, HTTP security headers, compression, and centralized error handling.
- **Cloud deployment:** Hosted on Render with a PostgreSQL database.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| PostgreSQL | Relational database |
| Prisma ORM | Database access and queries |
| Swagger / OpenAPI | Interactive API documentation |
| Zod | Input validation |
| Helmet | HTTP security headers |
| express-rate-limit | Request rate limiting |
| Render | API hosting and deployment |

## 🗺️ Data Model

The API represents administrative locations using the following hierarchy:

```text
State
 └── District
      └── Sub-district
           └── Village
```

Village responses can include the village code, name, pincode where available, and associated sub-district, district, and state.

The dataset is based on the Census of India 2011 Location Code Directory. Pincodes are not provided by that source and may therefore be `null`.

## 🚀 Getting Started

### Prerequisites

Install the following:

- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Asavare/location-api.git
cd location-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/locationdb?schema=public"
NODE_ENV=development
PORT=3000
```

Replace `USERNAME`, `PASSWORD`, and the database name with your local PostgreSQL configuration.

**Never commit `.env` or database credentials to GitHub.**

### 4. Set up the database

Create the local PostgreSQL database and apply the project's existing Prisma migrations:

```bash
npx prisma migrate deploy
```

This applies existing migrations; it does not import the complete village dataset. Follow the project's data-import process separately if you want to populate a local database.

### 5. Start the development server

```bash
npm run dev
```

The API should be available at:

- API root: http://localhost:3000/
- Health check: http://localhost:3000/health
- Swagger documentation: http://localhost:3000/api-docs/

## 🔐 Authentication

Most data endpoints require an API key.

### Register for an API key

**Endpoint:** `POST /api/auth/register`

Request:

```bash
curl -X POST "https://location-api-az0d.onrender.com/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"developer@example.com","name":"Developer"}'
```

A successful registration returns an API key. Store it securely because it is displayed only once.

### Make an authenticated request

Include your key in the `x-api-key` header:

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  "https://location-api-az0d.onrender.com/api/states?page=1&limit=10"
```

Replace `YOUR_API_KEY` with your own valid key. Never publish real API keys in documentation, screenshots, or source control.

## 📚 API Endpoints

All data endpoints below require API-key authentication unless otherwise stated.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API information |
| GET | `/health` | Check API and database health |
| POST | `/api/auth/register` | Register and generate an API key |
| GET | `/api/states` | List states |
| GET | `/api/states/:id` | Get a state by ID |
| GET | `/api/states/:id/districts` | List districts in a state |
| GET | `/api/districts` | List and filter districts |
| GET | `/api/districts/:id` | Get a district by ID |
| GET | `/api/districts/:id/sub-districts` | List sub-districts in a district |
| GET | `/api/sub-districts` | List and filter sub-districts |
| GET | `/api/sub-districts/:id` | Get a sub-district by ID |
| GET | `/api/sub-districts/:id/villages` | List villages in a sub-district |
| GET | `/api/villages` | List and filter villages |
| GET | `/api/villages/:id` | Get a village by ID |
| GET | `/api/search?q=bore` | Search village names |

For complete parameter descriptions, response formats, and interactive testing, visit the [Swagger API documentation](https://location-api-az0d.onrender.com/api-docs/).

## 🔎 Example: Search Villages

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  "https://location-api-az0d.onrender.com/api/search?q=bore&limit=10"
```

The search endpoint accepts:

- `q`: Search query containing at least two characters.
- `limit`: Maximum number of results, from 1 to 50; defaults to 10.

Example response structure:

```json
{
  "data": [
    {
      "id": 438804,
      "village": "Amarkot (Bore)",
      "pincode": null,
      "subDistrict": "Baramkela",
      "district": "Raigarh",
      "state": "CHHATTISGARH",
      "label": "Amarkot (Bore), Baramkela, Raigarh, CHHATTISGARH"
    }
  ],
  "meta": {
    "count": 1,
    "query": "bore"
  }
}
```

This is an illustrative response structure; the actual results depend on the search query and database contents.

## 📄 Dataset and Limitations

- Location records originate from the Census of India 2011 Location Code Directory.
- The production database contains over 645,000 village records.
- Pincodes are nullable because they are not supplied by the source directory.
- Administrative names and boundaries reflect the source dataset and may not represent current administrative changes.
- The local database may not contain the production dataset unless it has been separately imported.

## 🔒 Security

- API keys are generated during registration and stored as hashes.
- Protected endpoints require the `x-api-key` header.
- Rate limiting is applied to API requests.
- Environment variables are used for database configuration.
- API keys and database credentials must remain private.

## ☁️ Deployment

The application is deployed on Render and connected to PostgreSQL.

- **Production API:** https://location-api-az0d.onrender.com
- **Swagger UI:** https://location-api-az0d.onrender.com/api-docs/

Free-tier hosting may introduce a delay on the first request after inactivity.

## 👩‍💻 Author

**Asavare Trivedi**

GitHub: [@Asavare](https://github.com/Asavare)

---

If you find this project useful, feel free to explore the API documentation and repository.
