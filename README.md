# Patient Outcome Tracker

Multi-tenant SaaS for clinics to track patient treatment outcomes. One database per clinic for full data isolation.

---

## 1. How to install dependencies

From the project root:

```bash
npm run install:all
```

Or install each part separately:

```bash
cd auth-service && npm install
cd ../outcome-service && npm install
cd ../api-gateway && npm install
cd ../frontend && npm install
```

---

## 2. Environment variables (.env)

`.env` files are not in the repo (they are gitignored). You must create one `.env` file in each of the three backend service folders. Use the **same** `JWT_SECRET` value in both **auth-service** and **outcome-service** so JWTs can be verified across services.

---

### api-gateway

1. Create a file named `.env` inside the `api-gateway` folder (path: `api-gateway/.env`).
2. Add these lines (adjust URLs if your auth/outcome services run on different ports):

| Variable | Description | Example |
| -------- | ----------- | ------- |
| `PORT` | Port this gateway listens on | `4000` |
| `AUTH_SERVICE_URL` | Base URL of the auth service | `http://localhost:4001` |
| `OUTCOME_SERVICE_URL` | Base URL of the outcome service | `http://localhost:4002` |

**Copy-paste for `api-gateway/.env`:**

```
PORT=4000
AUTH_SERVICE_URL=http://localhost:4001
OUTCOME_SERVICE_URL=http://localhost:4002
```

---

### auth-service

1. Create a file named `.env` inside the `auth-service` folder (path: `auth-service/.env`).
2. Add these lines (change `JWT_SECRET` in production; keep it the same as in outcome-service):

| Variable | Description | Example |
| -------- | ----------- | ------- |
| `PORT` | Port this service listens on | `4001` |
| `MONGODB_REGISTRY_URI` | Full URI of the registry database | `mongodb://localhost:27017/patient_tracker_registry` |
| `MONGODB_BASE_URI` | MongoDB server URI (no database name) | `mongodb://localhost:27017` |
| `JWT_SECRET` | Secret used to sign JWTs; must match outcome-service | `your-secret-key-change-in-production` |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `24h`, `7d`) | `24h` |

**Copy-paste for `auth-service/.env`:**

```
PORT=4001
MONGODB_REGISTRY_URI=mongodb://localhost:27017/patient_tracker_registry
MONGODB_BASE_URI=mongodb://localhost:27017
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
```

---

### outcome-service

1. Create a file named `.env` inside the `outcome-service` folder (path: `outcome-service/.env`).
2. Add these lines. **Use the same `JWT_SECRET` as in auth-service.**

| Variable | Description | Example |
| -------- | ----------- | ------- |
| `PORT` | Port this service listens on | `4002` |
| `MONGODB_REGISTRY_URI` | Full URI of the registry database | `mongodb://localhost:27017/patient_tracker_registry` |
| `MONGODB_BASE_URI` | MongoDB server URI (no database name) | `mongodb://localhost:27017` |
| `JWT_SECRET` | Secret used to verify JWTs; must match auth-service | `your-secret-key-change-in-production` |

**Copy-paste for `outcome-service/.env`:**

```
PORT=4002
MONGODB_REGISTRY_URI=mongodb://localhost:27017/patient_tracker_registry
MONGODB_BASE_URI=mongodb://localhost:27017
JWT_SECRET=your-secret-key-change-in-production
```

---

### MongoDB

Have MongoDB running (e.g. on `localhost:27017`) before starting the app. The app uses one **registry** database (`patient_tracker_registry`) and one **database per clinic** (e.g. `patient_tracker_clinic_sunrise`). Those are created when you run the seed (step 3). The services connect to MongoDB automatically when they start—no separate connect command is needed.

---

## 3. How to run the seed script

From the project root:

```bash
npm run seed
```

This seeds the registry and each clinic’s database with demo clinics, users, and outcomes.

---

## 4. How to start the backend and frontend

Start each service in its own terminal (order can vary; gateway, auth, and outcome can all run in parallel).

**Backend:**

```bash
# Terminal 1 — API Gateway (port 4000)
npm run start:gateway

# Terminal 2 — Auth Service (port 4001)
npm run start:auth

# Terminal 3 — Outcome Service (port 4002)
npm run start:outcome
```

**Frontend:**

```bash
# Terminal 4 — React app (port 5173)
cd frontend && npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 5. Test credentials (2 clinics)

**Sunrise Medical Center**

| Username      | Password      | Role   |
| ------------- | ------------- | ------ |
| `dr.smith`    | `password123` | Doctor |
| `nurse.jones` | `password123` | Nurse  |

**Bayview Family Clinic**

| Username    | Password      | Role  |
| ----------- | ------------- | ----- |
| `dr.chen`   | `password123` | Doctor |
| `admin.lee` | `password123` | Admin |

---

## 6. Multi-tenant architecture (brief)

- **One registry DB** (`patient_tracker_registry`): stores clinic list (with a `dbName` per clinic) and a **user registry** (username → clinicId) so login knows which clinic DB to use. No passwords in the registry.
- **One DB per clinic**: each clinic has its own MongoDB database. That DB holds only that clinic’s **users** (and hashed passwords) and **outcomes**.
- **Login**: username is looked up in the registry → we get clinicId and that clinic’s `dbName` → we open that clinic’s DB and verify the password there. The JWT includes `clinicId`.
- **Outcomes**: every request uses the JWT’s `clinicId` to open that clinic’s DB; all reads/writes are in that DB only. No clinic ever sees another clinic’s data.

So: **registry = routing + metadata; per-clinic DBs = that clinic’s users and outcomes only.**
