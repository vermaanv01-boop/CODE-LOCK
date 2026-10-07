# CODE//LOCK (C//L 2026)

> **THINK. CODE. UNLOCK. DEBUG.**  
> Offline-First Full-Stack Team Coding, Debugging & Logic Contest Platform

---

## 🚀 Quick Start (One-Click Launchers)

For Windows machines, you can launch the complete system (both Express backend and Next.js frontend) with a single click:

### Option A: PowerShell
Right-click and run with PowerShell or in terminal:
```powershell
.\start-codelock.ps1
```

### Option B: Batch File
Double-click `start-codelock.bat` or run in Command Prompt:
```cmd
start-codelock.bat
```

---

## 🛠️ Manual Start (Command Line)

If you prefer starting services manually or on separate terminals:

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (comes with Node.js)
- *(Optional)* **MongoDB** (If MongoDB is running locally on port 27017, Mongoose connects automatically. If MongoDB is not installed or offline, the platform automatically runs in resilient embedded database mode with zero configuration!)

### 2. Start the Backend (Express API)
In a terminal, run:
```bash
cd backend
npm run dev
```
- **Backend URL**: `http://localhost:5000`
- **Network LAN URL**: `http://0.0.0.0:5000`
- **Health Check**: `http://localhost:5000/api/health`

### 3. Start the Frontend (Next.js App)
In a separate terminal, run:
```bash
cd frontend
npm run dev
```
*(Or for production mode: `npm run build && npm run start`)*
- **Frontend URL**: `http://localhost:3000`
- **Network LAN URL**: `http://0.0.0.0:3000`

---

## 🔑 Key Access Points & Credentials

| Role / Feature | Route | Credentials / Details |
|---|---|---|
| **Contest Homepage** | `http://localhost:3000/` | Public landing, guidelines, team station login |
| **Team Registration** | `http://localhost:3000/register` | Official paper-style squad registration |
| **Team Contest Station** | `http://localhost:3000/contest` | Route-guarded challenge hub |
| **Live Scoreboard** | `http://localhost:3000/leaderboard` | Real-time server-ordered scoreboard |
| **Organizer Control Room** | `http://localhost:3000/admin` | Contest status, team stats, `[ START CONTEST ]` |
| **Admin Login** | `http://localhost:3000/admin/login` | **Username:** `admin`<br>**Password:** `admin123` |
| **Teams Roster** | `http://localhost:3000/admin/teams` | Directory of enrolled squads and member roles |
| **Admin Scoreboard** | `http://localhost:3000/admin/leaderboard` | Live supervisory rankings & split times |

---

## 🌐 Local Event LAN Setup (Wi-Fi / Ethernet)

To run the competition on a closed local network without internet:

1. Connect the organizer's machine and participant laptops to the same Wi-Fi router or network switch.
2. Find the organizer laptop's local IPv4 address (e.g., in PowerShell: `ipconfig`). Example: `192.168.1.45`.
3. Participants open their web browsers and navigate to:
   ```
   http://192.168.1.45:3000
   ```
4. The frontend automatically routes API calls to the organizer machine's Express server on port 5000.
5. All timers, assets, fonts, and validation logic run 100% locally with zero cloud or WAN dependencies.

---

## 📋 Competition Workflow for Organizers

1. **Register Teams**: Direct participants to `/register` before the contest begins. Assign each team a unique identifier (e.g., `T-001`, `T-027`).
2. **Start Contest**: Log into `/admin` and click **`[ START CONTEST ]`**.
   - Registration immediately **locks** against new entries.
   - The global official server timer activates.
   - Round 01 unlocks across all participant workstations simultaneously.
3. **Monitor Live Progress**: Keep `/admin/leaderboard` open to track live splits and rank updates.

---

## 🔐 Official Gate Solution Reference (Organizer Confidential)

- **Round 01 (Coding Lock — 12 Digits)**:  
  `421873298456` *(Q1=42, Q2=18, Q3=73, Q4=29, Q5=84, Q6=56)*
- **Round 02 (Debugging Lock — 6 Digits)**:  
  `419832` *(Task 1=419, Task 2=832)*
- **Round 03 (The Final Lock — Master Cipher)**:  
  `390742` *(Thinker=3, Coder=9, Debugger=07, Salt=42)*

---

For in-depth operational architecture, see [ORGANIZER_GUIDE.md](file:///c:/Users/Lenovo/OneDrive/Desktop/CODE@@LOCK/ORGANIZER_GUIDE.md).
