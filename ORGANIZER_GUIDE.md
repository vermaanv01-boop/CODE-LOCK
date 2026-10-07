# CODE//LOCK 2026 — ORGANIZER & SYSTEM MANUAL

> **THINK. CODE. UNLOCK. DEBUG.**  
> Offline-First Full-Stack Team Coding, Debugging & Logic Contest Platform

---

## 1. Local Event LAN Mode Architecture

CODE//LOCK is engineered specifically for college and technical competitions where:
- The entire contest runs on an **Organizer Machine** hosting Next.js + Express + MongoDB.
- Participants connect through private local Wi-Fi or Ethernet switches (e.g. `http://192.168.1.100:3000`).
- **No Internet/WAN is required**. All styles, fonts, assets, route guards, and timers function 100% locally.
- If a native MongoDB daemon (`mongodb://127.0.0.1:27017/codelock`) is running, Mongoose connects directly. If MongoDB is offline, the embedded JSON/memory persistence layer automatically activates with zero downtime.

---

## 2. Default Organizer Credentials

- **Admin Login Route**: `/admin/login`
- **Default Username**: `admin`
- **Default Password**: `admin123`
- *Stored securely using bcrypt server-side hashes and JWT bearer authentication.*

---

## 3. Contest Workflow & Gates

### Step 1: Pre-Contest Squad Registration
- Route: `/register`
- Designed as an official technical competition paper sheet.
- Organizer assigns unique **TEAM NUMBER** (e.g. `T-001`, `T-027`).
- Captures team name, leader, and 4 specialized roles:
  1. **THINKER**: Reads the problem and develops algorithmic logic.
  2. **CODER**: Implements the logic in code based on Thinker's explanation.
  3. **DEBUGGER**: Fixes intentionally broken programs.
  4. **SUPPORTER**: Handles code entry, ordering, and website interactions.
- Teams can also log in to their station via `/contest`.

### Step 2: Organizer Dispatches Contest
- Route: `/admin`
- Primary Action: **`[ START CONTEST ]`**
- Server records `contestStartTime`.
- Contest status switches to `ACTIVE`.
- Registration immediately **LOCKS** (no new teams can register).
- The official server clock begins ticking for all participants in lockstep.

### Step 3: Gate 01 — Coding Lock
- Route: `/round/1`
- 6 Algorithmic Problems:
  - Q1: Bitwise Parity Compression (Answer: `42`)
  - Q2: Graph Latency Bottleneck (Answer: `18`)
  - Q3: Prefix Sum Inversion Count (Answer: `73`)
  - Q4: Binary Matrix Island Perimeter (Answer: `29`)
  - Q5: Matrix Chain Multiplication Cost (Answer: `84`)
  - Q6: Stack-Based Syntax Parser Checksum (Answer: `56`)
- **Combined 12-Digit Unlock Code**: `421873298456`
- **Optional Editor**: Monaco Editor or raw textarea scratchpad is provided with clear notice that participants can use VS Code, Code::Blocks, Dev-C++, or any offline compiler.
- Upon correct 12-digit code submission, transitions to `/round/1/dashboard` displaying completion time, official `C//L 2026 VERIFIED ✓` stamp, and live standings.

### Step 4: Gate 02 — Debugging Lock
- Route: `/round/2`
- 2 Intentionally Broken Source Code Problems:
  - Task 1: Off-by-one buffer parser & pointer slip (Answer: `419`)
  - Task 2: Integer overflow & boundary comparator bug (Answer: `832`)
- **Combined 6-Digit Unlock Code**: `419832`
- Route guards prevent teams from skipping to Round 2 without clearing Round 1.
- Upon submission, transitions to `/round/2/dashboard` with split times and rank.

### Step 5: Gate 03 — The Final Lock
- Route: `/round/3`
- Multi-role cryptographic logic extraction:
  - Thinker: Modulo cipher shift (`3`)
  - Coder: Permutation transform (`9`)
  - Debugger: Parity checksum repair (`07`)
  - Supporter: Synthesis with salt 42 -> `390742`
- **Master Unlock Code**: `390742`
- Upon submission, transitions to `/round/3/dashboard` displaying final completion dossier, split breakdown, and final rank.

### Step 6: Live Scoreboard
- Route: `/leaderboard` (public) & `/admin/leaderboard` (organizer)
- Dense technical scoreboard ordered strictly by:
  1. Completed round progression
  2. Earliest official server-recorded elapsed time
- Never uses client timestamps.

---

## 4. Quick Start Commands

```powershell
# Run the complete system:
.\start-codelock.ps1

# Or run services individually:
npm run start:backend   # Express REST API on http://0.0.0.0:5000
npm run start:frontend  # Next.js App Router on http://0.0.0.0:3000
```
