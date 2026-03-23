# The Blueprints

Smart Urban Mobility Platform — Greater Montréal Area.

---

## Getting Started

**1. Clone and install dependencies**

```bash
git clone <repo-url>
cd The-Blueprints
npm install
```

**2. Set up environment variables**

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
AUTH_SECRET=<random-32-char-string>
```

- `MONGO_URI` — your MongoDB Atlas connection string. Use your own free-tier cluster or ask the Mridul for the shared one.
- `AUTH_SECRET` — signs the JWT tokens. Generate one with:
  ```bash
  openssl rand -base64 32
  ```

**3. Run the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # Auth.js handler
│   │   ├── register/             # POST — create a new user
│   │   └── users/                # GET — list users (admin only)
│   ├── dashboard/                # Role-aware dashboard (protected)
│   ├── login/
│   ├── register/
│   └── unauthorized/             # Shown on role violation
├── components/
│   └── SessionProvider.tsx
├── lib/
│   ├── auth.config.ts            # Edge-safe auth config (used by proxy)
│   ├── auth.ts                   # Full auth config with DB access
│   └── mongodb.ts                # Cached Mongoose connection
├── models/
│   └── User.ts                   # User schema — name, email, password, role
├── proxy.ts                      # Route protection middleware
└── types/
    └── next-auth.d.ts            # TypeScript extensions for session and JWT
```

---

## Roles

| Role       | Dashboard              | Protected route |
| ---------- | ---------------------- | --------------- |
| `rider`    | Trip and vehicle cards | `/rider/*`      |
| `operator` | Fleet management cards | `/operator/*`   |
| `admin`    | Full user table        | `/admin/*`      |

Role is selected at registration, saved in MongoDB, and embedded in the JWT. No manual DB edits needed.

---

## API Reference

| Method | Route                     | Access     | Description                                             |
| ------ | ------------------------- | ---------- | ------------------------------------------------------- |
| `POST` | `/api/register`           | Public     | Create a new user                                       |
| `GET`  | `/api/users`              | Admin only | List users — filter with `?role=rider\|operator\|admin` |
| `*`    | `/api/auth/[...nextauth]` | —          | Auth.js internal routes                                 |

---

## Scripts

```bash
npm run dev      # Development server (Turbopack)
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

---

## Notes

- **Never commit `.env.local`** — it is gitignored. Every developer has their own copy.
- `proxy.ts` is the route protection middleware (renamed from `middleware.ts` due to a Next.js 16 deprecation).
- Auth uses stateless JWT sessions — no separate session database needed.
- The Mongoose model calls `deleteModel` on every load — this is intentional to handle hot-reload schema caching in dev.
