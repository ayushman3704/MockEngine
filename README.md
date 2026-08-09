# MockEngine

MockEngine is a full-stack REST API mocking platform for frontend development and testing. Create a project, define an endpoint schema in the dashboard, then call a generated URL to receive realistic JSON data powered by [Faker.js](https://fakerjs.dev/).

It is useful when the real backend is incomplete, unavailable, or when the UI needs predictable loading and error-state testing.

## What it does

- Creates user accounts and maintains authenticated dashboard sessions with JWT cookies.
- Organizes mock endpoints into projects.
- Lets you define a response path, record count, fields, and field data types.
- Generates a fresh array of fake JSON objects for each successful request.
- Simulates response delays and configurable HTTP error responses.
- Provides a React-based page for running a generated mock URL and inspecting its status, timing, table view, and raw JSON.
- Deletes a project's associated endpoints when the project is deleted.

## Technology

| Area | Tools |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS, Axios, Lucide |
| Backend | Node.js, Express 5, Mongoose, MongoDB |
| Data generation | `@faker-js/faker` |
| Authentication | JWT, HTTP-only cookies, bcrypt |

## Repository layout

```text
MockEngine/
├── frontend/             # Vite + React dashboard
│   └── src/
│       ├── pages/        # Home, auth, dashboard, API builder, API demo
│       ├── context/      # Authentication state
│       └── api/          # Axios client and backend URL configuration
└── backen/               # Express API (directory name is intentional in this repo)
    ├── server.js         # Server and MongoDB startup
    └── src/
        ├── controllers/
        ├── models/
        ├── routes/
        └── middleware/
```

## Prerequisites

- Node.js 20+ (recommended for the current Vite release)
- npm
- A MongoDB database, either local or MongoDB Atlas

## Run locally

Clone the repository and install dependencies for both applications.

```bash
git clone https://github.com/ayushman3704/MockEngine.git
cd MockEngine

cd backen
npm install

cd ../frontend
npm install
```

### Configure the backend

Create `backen/.env`:

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/mockengine
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:5173
```

`FRONTEND_URL` accepts a comma-separated list of allowed browser origins. It is required when deploying the frontend to a different domain.

### Configure the frontend

The frontend defaults to `http://localhost:5001`. To use another backend URL, create `frontend/.env`:

```env
VITE_BACKEND_BASE_URL=http://localhost:5001
```

### Start the applications

In one terminal:

```bash
cd backen
npm run dev
```

In another terminal:

```bash
cd frontend
npm run dev
```

Open the Vite address shown in the terminal, normally `http://localhost:5173`.

## Using MockEngine

1. Register an account and sign in.
2. Create a project from the dashboard.
3. Open the project and add an endpoint, for example `/users`.
4. Define fields such as `id` (`uuid`), `name` (`fullName`), and `email` (`email`).
5. Copy the generated URL and call it from your application or an API client.

The generated endpoint follows this shape:

```text
{BACKEND_BASE_URL}/api/mock/{userId}/{projectId}{path}
```

For example:

```text
http://localhost:5001/api/mock/65f.../660.../users
```

A successful request returns an array. Because data is generated per request, values change on subsequent calls.

```json
[
  {
    "id": "30f6fe86-4e7e-4a6b-b8d5-fd0931e0cbda",
    "name": "Avery Wilson",
    "email": "avery.wilson@example.com"
  }
]
```

## Supported field types

| Type | Generated value |
| --- | --- |
| `uuid` | UUID string |
| `fullName` | Person's full name |
| `email` | Email address |
| `number` | Integer |
| `date` | Recent ISO 8601 timestamp |
| `string` | Word |
| `boolean` | Boolean value |

Each endpoint supports 1–1,000 response items and up to 50 fields.

## Mock behavior

- **Delay:** Set a delay in milliseconds to exercise loading states.
- **Forced errors:** Enable `forceError` and choose a status from 400–599 to test error handling.
- **Paths:** Must start with `/` and may contain letters, numbers, hyphens, underscores, and nested slashes.
- **Method setting:** The builder records a method selection in the interface; the mock route currently resolves requests by project and path, so consumers should use `GET` for predictable data retrieval.

## Backend API overview

All project and endpoint management routes require an authenticated session cookie.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create an account and start a session |
| `POST` | `/api/auth/login` | Start a session |
| `POST` | `/api/auth/logout` | End the current session |
| `GET` | `/api/auth/me` | Get the current user |
| `POST` | `/api/projects` | Create a project |
| `GET` | `/api/projects` | List the current user's projects |
| `DELETE` | `/api/projects/:projectId` | Delete a project and its endpoints |
| `POST` | `/api/projects/:projectId/endpoints` | Create an endpoint schema |
| `GET` | `/api/projects/:projectId/endpoints` | List project endpoints |
| `PUT` | `/api/projects/:endpointId` | Update an endpoint |
| `DELETE` | `/api/projects/:endpointId` | Delete an endpoint |
| `*` | `/api/mock/:userId/:projectId/*` | Return generated mock data |
| `GET` | `/health` | Health check |

## Deployment notes

Set the following variables in the backend deployment:

```env
MONGO_URI=<production MongoDB connection string>
JWT_SECRET=<long random secret>
FRONTEND_URL=https://your-frontend.example
```

Set this variable in the frontend deployment:

```env
VITE_BACKEND_BASE_URL=https://your-backend.example
```

When frontend and backend run on different origins, configure both URLs exactly and use HTTPS so secure authentication cookies can be sent by browsers.

## Scripts

| Directory | Command | Description |
| --- | --- | --- |
| `backen` | `npm run dev` | Start the Express API with Nodemon |
| `frontend` | `npm run dev` | Start the Vite development server |
| `frontend` | `npm run build` | Create a production frontend build |
| `frontend` | `npm run lint` | Run ESLint |
| `frontend` | `npm run preview` | Preview the production frontend build |

## License

No license file is currently included. Add a license before redistributing or accepting external contributions.
