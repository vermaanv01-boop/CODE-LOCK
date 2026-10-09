# CODE//LOCK

> **THINK. CODE. UNLOCK. DEBUG.**  
> Offline-First Full-Stack Team Coding, Debugging & Logic Contest Platform for Closed LAN Environments.

---

## Stack

* **Next.js** (App Router, Server & Client Components)
* **TypeScript** (Strict type definitions shared across client and server)
* **Tailwind CSS** (Token-driven CSS variables for Industrial Dark & Light modes)
* **Express** (Authoritative REST API, server clock authority, route guards)
* **MongoDB** (Database persistence via Mongoose)
* **Mongoose** (Data models for teams, contest state, questions, submissions, round completions)
* **Monaco Editor** (Embedded scratchpad with dynamic lazy-loading and fallback support)

---

## Local Setup

### 1. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:3000` (and `http://0.0.0.0:3000` for LAN access).

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
The Express backend starts on `http://localhost:5000` (and `http://0.0.0.0:5000` for LAN access).

### 3. MongoDB Configuration
Create a `.env` file inside the `backend` directory:
```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```
> **IMPORTANT SECURITY**:  
> The real MongoDB connection string must be placed in `backend/.env` and **MUST NOT** be committed to version control. Both `.env` and `.env.local` are excluded via `.gitignore`. If MongoDB is unreachable or running offline, the backend automatically transitions to embedded resilient fallback mode so event continuity is never interrupted.

---

## Admin Login

Organizers manage the contest via the **Central Command Control Room** at:
`http://localhost:3000/admin`

### Configuration & Identifiers
* **Configured Admin Username:** `admin`
* **Configured Login Secret Placeholder:**
  ```env
  ADMIN_USERNAME=admin
  ADMIN_PASSWORD=...
  ```
* **Where Configured:** Organizers configure administrator credentials in the backend data store seeding logic (`backend/src/services/store.ts` or via environment variables). Default development initialization seeds the `admin` operator account.

---

## Offline Event Mode (Closed LAN Setup)

To execute a competition in a closed room, auditorium, or lab without external internet:

1. **Run MongoDB locally** (or utilize the automatic embedded offline storage mode).
2. **Start Express backend** (`cd backend && npm run dev`).
3. **Start Next.js frontend** (`cd frontend && npm run dev`).
4. **Connect organizer machine and participant laptops to the same private LAN/Wi-Fi switch.**
5. **Participants access the organizer's local IP** in their browsers:
   ```
   http://<ORGANIZER-LAN-IP>:3000
   ```
6. **Internet is not required.** All fonts, dependencies, timers, and submission validation run entirely locally over the private network.

---

## Security Architecture

* **Server Authoritative:** Client timers, ranks, and stage progression are never trusted. The Express server independently tracks elapsed milliseconds from `contestStartTime`.
* **Zero Secret Exposure:** Expected answer codes, secret keys, admin credentials, and database URIs are never transmitted to client browsers or exposed in public routes.
* **Progressive Route Guards:** Teams cannot access Round 2 without officially completing and unlocking Round 1 on the server.
