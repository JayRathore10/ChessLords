# AGY.md — ChessLords Project Context & Architecture Guide

> **File:** `AGY.md`  
> **Repository:** ChessLords (`E:\chess-lords`)  
> **Last Updated:** August 2026  
> **Primary Purpose:** Comprehensive system documentation, architectural blueprint, bug tracker, security assessment, and developer rules for AI coding agents and engineers working on ChessLords.

---

## 1. Project Overview & Intent

### Project Goal
**ChessLords** is a full-stack, real-time multiplayer chess platform. The application is designed to allow registered and casual users to play real-time chess matches, join game rooms via WebSockets (Socket.io), track game history, compute Elo ratings, manage friendships, view leaderboards, and customize profiles.

### Core Features (Intended & In Progress)
- **User Authentication & Authorization:** JWT-based cookie authentication, user registration, login, logout, and role-based access control (`user` and `admin`).
- **Real-Time Multiplayer Chess:** Dynamic game room synchronization, turn validation, FEN board state synchronization, algebraic move history tracking, check/checkmate/draw detection using `chess.js` and `Socket.io`.
- **Interactive Web Chessboard:** Next.js frontend with drag-and-drop piece movement powered by `react-chessboard` and responsive styling.
- **Matchmaking & Game Creation:** Casual and rated game modes, custom time controls (e.g. rapid, blitz, bullet with increment), and direct player invitations.
- **Clock & Timer System:** Server-authoritative countdown clocks with increment handling for white and black players.
- **Friendship & Social System:** Sending, accepting, rejecting friend requests, and viewing online/offline player status.
- **User Profiles & Leaderboard:** Player win/loss/draw ratios, Elo rating progression, match history logs, and global rankings.

---

## 2. System Architecture & Communication Flow

### High-Level Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                                CLIENT (Next.js 16)                             |
|  - App Router (app/page.tsx, app/game/[gameId]/page.tsx, app/layout.tsx)      |
|  - React 19 + Tailwind CSS v4 + react-chessboard                              |
|  - Socket.io Client (lib/socket.ts)                                            |
+------------------------------------+------------------------------------------+
                                     |
               HTTP REST API Calls   |   WebSocket Events (Bi-directional)
               (JSON via fetch/CORS) |   (Socket.io protocol on ws://)
                                     v
+------------------------------------+------------------------------------------+
|                             SERVER (Node.js + Express)                        |
|                                                                               |
|  +---------------------------+             +-------------------------------+  |
|  |     HTTP REST Layer       |             |     Socket.io Event Layer     |  |
|  |  - Express Middleware     |             |  - Connection Manager         |  |
|  |  - Auth Middleware        |             |  - Game Room Rooms (game:id)  |  |
|  |  - Route Handlers         |             |  - Move Broadcaster           |  |
|  |  - Controllers            |             |  - Turn & State Validator     |  |
|  |  - Zod Validations        |             |                               |  |
|  +-------------+-------------+             +---------------+---------------+  |
|                |                                           |                  |
|                +--------------------+----------------------+                  |
|                                     |                                         |
|                                     v                                         |
|                        +---------------------------+                          |
|                        |   Business Logic Layer    |                          |
|                        |  - Chess Service          |                          |
|                        |    (chess.js Engine, FEN) |                          |
|                        +-------------+-------------+                          |
|                                      |                                        |
+--------------------------------------|----------------------------------------+
                                       v
                     +-----------------------------------+
                     |       Database (MongoDB Atlas)     |
                     |  - Users Collection               |
                     |  - Games Collection               |
                     |  - Friendships Collection         |
                     |  - RefreshTokens Collection       |
                     +-----------------------------------+
```

### Communication Pipelines

1. **Authentication Flow:**
   $$\text{Client} \xrightarrow{\text{POST /api/v1/auth/login}} \text{auth.routes} \xrightarrow{} \text{auth.controller} \xrightarrow{\text{Zod parse + bcrypt verify}} \text{userModel} \xrightarrow{\text{Set-Cookie HTTP-only JWT}} \text{Client}$$

2. **Real-time Gameplay Flow:**
   $$\text{Client} \xrightarrow{\text{socket.emit("joinGame", \{ gameId, userId \})}} \text{server.ts} \xrightarrow{\text{Fetch gameModel \& init chess.service}} \text{socket.join("game:gameId")} \xrightarrow{\text{emit("gameState")}} \text{Client}$$
   $$\text{Client} \xrightarrow{\text{socket.emit("makeMove", \{ gameId, from, to \})}} \text{server.ts} \xrightarrow{\text{chess.service.makeChessMove()}} \text{DB game.save()} \xrightarrow{\text{io.to("game:gameId").emit("moveMade")}} \text{All Players}$$

---

## 3. Directory Structure

```
chess-lords/
├── README.md                           # Root repository description
├── AGY.md                              # Main agent context and architecture documentation
├── client/                             # Next.js frontend application
│   ├── app/
│   │   ├── favicon.ico                 # App icon
│   │   ├── globals.css                 # Global CSS + Tailwind v4 theme setup
│   │   ├── layout.tsx                  # Root layout with Geist font & Navbar
│   │   ├── page.tsx                    # Landing / Home page (currently blank)
│   │   └── game/
│   │       └── [gameId]/
│   │           └── page.tsx            # Game arena page with Socket.io client
│   ├── components/
│   │   ├── ChessBoard.tsx              # Standalone react-chessboard component
│   │   └── NavBar.tsx                  # Top navigation bar
│   ├── lib/
│   │   └── socket.ts                   # Socket.io client instance
│   ├── public/                         # Public static assets (logo.png, svgs)
│   ├── package.json                    # Next.js 16, React 19, react-chessboard, chess.js
│   ├── tsconfig.json                   # Client TypeScript configuration
│   ├── next.config.ts                  # Next.js configuration
│   ├── postcss.config.mjs              # PostCSS plugins
│   ├── eslint.config.mjs               # ESLint configuration
│   ├── AGENTS.md                       # Next.js agent instruction block
│   ├── CLAUDE.md                       # Claude reference pointer
│   └── README.md                       # Default Next.js boilerplate readme
└── server/                             # Express + Socket.io + MongoDB backend
    ├── src/
    │   ├── configs/
    │   │   ├── db.config.ts            # Mongoose MongoDB connection logic
    │   │   └── env.config.ts           # Dotenv environment variables loader
    │   ├── controllers/
    │   │   ├── auth.controller.ts      # registerNewUser, loginUser, logoutUser, me
    │   │   ├── game.controller.ts      # createGame controller
    │   │   └── user.controller.ts      # User CRUD, stats, and profile controllers
    │   ├── middleware/
    │   │   └── auth.middleware.ts      # isUserLoggedIn, isAdminLoggedIn JWT middlewares
    │   ├── models/
    │   │   ├── friendship.model.ts     # Mongoose schema for friendships
    │   │   ├── game.model.ts           # Mongoose schema for chess games
    │   │   ├── refreshToken.model.ts   # Mongoose schema for refresh tokens
    │   │   └── user.model.ts           # Mongoose schema for user accounts
    │   ├── routes/
    │   │   ├── auth.routes.ts          # Express routes for /api/v1/auth
    │   │   ├── game.routes.ts          # Express routes for /api/v1/games (empty)
    │   │   └── user.routes.ts          # Express routes for /api/v1/users
    │   ├── services/
    │   │   └── chess.service.ts        # chess.js instance manager & move processor
    │   ├── types/
    │   │   └── authRequest.type.ts     # Express Request and JWT payload interfaces
    │   ├── validations/
    │   │   └── user.validation.ts      # Zod validation schemas for registration & login
    │   └── server.ts                   # HTTP server entrypoint, middleware, Socket.io handlers
    ├── tests/                          # Automated tests directory (currently empty)
    ├── package.json                    # Express 4, Mongoose 9, Socket.io 4, chess.js 1.4, Zod 4
    ├── tsconfig.json                   # Server TypeScript configuration
    └── eslint.config.js                # Server ESLint configuration
```

---

## 4. Implementation Status Matrix

| Component / Feature | Implementation Status | Verification Notes |
| :--- | :---: | :--- |
| **Server DB Connection** | 🔴 ❌ Broken / Not Invoked | `connectDB()` is defined in `server/src/configs/db.config.ts` but is **never called** in `server/src/server.ts`. |
| **User Registration API** | 🟡 Partially implemented | Zod schema validation & bcrypt hashing present; fails JWT verification due to missing `email` in payload. |
| **User Login API** | 🟡 Partially implemented | Authenticates password, sets cookie; JWT payload omits `email` causing middleware failure. |
| **User Logout API** | ✅ Fully implemented | Clears `token` cookie with matching options. |
| **User `/auth/me` Endpoint** | 🔴 ⚠️ Broken | Route lacks `isUserLoggedIn` middleware in `auth.routes.ts`, returning 401 Unauthorized unconditionally. |
| **User Profile `/users/me`** | 🔴 ⚠️ Broken | Shadowed by route `router.get("/:id")` in `user.routes.ts` (`:id` captures `"me"`). |
| **User Stats API** | ✅ Fully implemented | `GET /api/v1/users/:id/stats` returns rating and game stats. |
| **User Listing & Search** | ✅ Fully implemented | `GET /api/v1/users` and `GET /api/v1/users/username/:username` function correctly. |
| **Admin User Deletion** | 🟡 Partially implemented | Controller works, but `isAdminLoggedIn` middleware crashes if `req.cookies` is undefined. |
| **Cookie Parsing Middleware** | 🔴 ❌ Not implemented | `cookie-parser` is in `package.json` but **not mounted** via `app.use(cookieParser())` in `server.ts`. |
| **Express Error Handling** | ❌ Not implemented | No central global error handler middleware configured in Express. |
| **Game Creation REST API** | 🟡 Partially implemented | `createGame` controller exists in `game.controller.ts` but is **not mounted** in `game.routes.ts`. |
| **Socket Connection** | ⚠️ Implemented but needs improvement | Basic connection established, but lacks JWT/session authentication handshake. |
| **Socket `joinGame` Handler** | 🔴 ⚠️ Broken | Server expects `{ gameId, userId }` object; client emits raw `gameId` string. |
| **Socket `makeMove` Handler** | 🟡 Partially implemented | Validates turn and chess logic; does not support pawn promotion or clock countdowns. |
| **Chess Engine Service** | 🟡 Partially implemented | Wrapper around `chess.js` works in-memory; lacks rehydration fallback on server restarts and promotion handling. |
| **Game Persistence in DB** | 🟡 Partially implemented | Moves, FEN, turn, and result updated in MongoDB on moves; game start/abandonment lifecycle incomplete. |
| **Chess Clocks / Time Control**| ❌ Not implemented | Fields exist in `game.model.ts`, but no timers tick or deduct time on moves or timeouts. |
| **Friendship System** | ❌ Not implemented | `friendship.model.ts` exists, but has 0 controllers, 0 routes, and 0 frontend integration. |
| **Refresh Token System** | ❌ Not implemented | `refreshToken.model.ts` exists, but token refresh endpoint and rotation logic are absent. |
| **Frontend Board Integration**| 🔴 ⚠️ Incomplete / Disconnected | `ChessBoard.tsx` has interactive `react-chessboard`, but `app/game/[gameId]/page.tsx` renders a static box and button. |
| **Frontend Navigation & Pages**| 🟡 Partially implemented | `NavBar.tsx` links to `/`, `/game`, `/leaderboard`, `/profile`, `/login`. Only `/` and `/game/[gameId]` exist; `/` is blank. |
| **Automated Tests** | ❌ Not implemented | `server/tests` is empty; 0 unit/integration/e2e tests across both client and server. |

---

## 5. Detailed Bug & Technical Issue Analysis

### 1. Database Connection Never Initialized
- **File:** `server/src/server.ts`
- **Issue:** `server.ts` starts listening via `httpServer.listen(...)` without ever calling `connectDB()` from `server/src/configs/db.config.ts`.
- **Impact:** Any incoming request or socket event attempting Mongoose operations will hang, timeout, or crash due to disconnected MongoDB state.

### 2. Missing `cookie-parser` Middleware in Express
- **File:** `server/src/server.ts`
- **Issue:** `cookie-parser` is installed in `server/package.json` but is never imported or attached to Express (`app.use(cookieParser())`).
- **Impact:** `req.cookies` is `undefined`. `auth.middleware.ts` fails on `req.cookies?.token` (or throws on `req.cookies.token` in `isAdminLoggedIn`), breaking all authenticated routes.

### 3. JWT Payload / Middleware Email Lookup Mismatch
- **Files:** `server/src/controllers/auth.controller.ts` (lines 61–70, 139–148) & `server/src/middleware/auth.middleware.ts` (lines 18–22, 52–63)
- **Issue:** JWT is signed with payload `{ userId: user._id.toString(), role: user.role }`. In `auth.middleware.ts`, the code attempts to find the user using `userModel.findOne({ email: decodeData.email })`.
- **Impact:** `decodeData.email` is `undefined`, causing `userModel.findOne({ email: undefined })` to fail to retrieve the user. Authentication fails even with a valid JWT.

### 4. Missing Auth Middleware on `/api/v1/auth/me`
- **File:** `server/src/routes/auth.routes.ts` (line 10)
- **Issue:** `router.get("/me", me)` does not include `isUserLoggedIn`.
- **Impact:** In `auth.controller.ts`, `me()` expects `req.user` to be set by the middleware. Since it is absent, `req.user` is undefined and `/api/v1/auth/me` always returns `401 Unauthorized`.

### 5. Route Shadowing on `/api/v1/users/me`
- **File:** `server/src/routes/user.routes.ts` (lines 23, 27)
- **Issue:** `router.get("/:id", getUserById)` is registered before `router.get("/me", isUserLoggedIn, getMyProfile)`.
- **Impact:** Express route matching evaluates `/:id` first, interpreting `"me"` as an `:id`. `getUserById` executes with `id = "me"`, triggers `Types.ObjectId.isValid("me") === false`, and returns `400 Invalid user ID`.

### 6. Socket `joinGame` Signature Mismatch
- **Files:** `server/src/server.ts` (lines 45–55) vs `client/app/game/[gameId]/page.tsx` (line 56)
- **Issue:** Server handler expects `socket.on("joinGame", (data: { gameId: string; userId: string }) => ...)`. Frontend calls `socket.emit("joinGame", gameId)`.
- **Impact:** `data` on server is a string. `data.gameId` and `data.userId` evaluate to `undefined`. `gameModel.findById(undefined)` fails and emits `"gameError"`.

### 7. Disconnected Frontend Chessboard
- **Files:** `client/components/ChessBoard.tsx` vs `client/app/game/[gameId]/page.tsx`
- **Issue:** `client/components/ChessBoard.tsx` contains an isolated local `ChessBoard` component with drag-and-drop piece handling. `client/app/game/[gameId]/page.tsx` does not render `ChessBoard`; instead it renders a placeholder `<div>` with a single hardcoded button: `"Move e2 → e4"`.
- **Impact:** Users cannot play games on the interactive board in the game room.

### 8. Unmounted Game Routes
- **Files:** `server/src/routes/game.routes.ts` & `server/src/controllers/game.controller.ts`
- **Issue:** `game.routes.ts` exports an empty router. `createGame` controller is never registered (`router.post("/", createGame)` is missing).
- **Impact:** `POST /api/v1/games` returns `404 Cannot POST /api/v1/games`.

### 9. Pawn Promotion Ignored in Moves
- **Files:** `server/src/services/chess.service.ts` & `server/src/server.ts`
- **Issue:** `makeChessMove(gameId, from, to)` does not accept a promotion parameter (e.g. `{ from, to, promotion: "q" }`).
- **Impact:** In chess.js, pawn moves reaching the 1st/8th rank without a promotion piece throw an illegal move error, making it impossible to promote pawns.

### 10. In-Memory State Loss & Default Position Bug
- **File:** `server/src/services/chess.service.ts` (lines 50–54)
- **Issue:** `chess.service.ts` stores games in `Map<string, Chess>()`. If a server restarts or the Map is cleared, `makeChessMove` initializes `createChessGame(gameId)` with standard starting FEN instead of rehydrating from MongoDB's `currentPosition`.
- **Impact:** Game state resets to the initial board position upon the next move if in-memory cache was lost.

### 11. Duplicate Root Route in `server.ts`
- **File:** `server/src/server.ts` (lines 27–29 and 318–322)
- **Issue:** `app.get("/", ...)` is defined twice in `server.ts`. Line 27 returns `"Hi, Jexts here!"` while line 318 returns JSON `{ message: "ChessLord server is running" }`.

### 12. Hardcoded Ports and URLs
- **Files:** `server/src/server.ts` (line 324), `client/lib/socket.ts` (line 3)
- **Issue:** Server listens strictly on `5000` rather than `process.env.PORT || 5000`. Frontend Socket client points to `"http://localhost:5000"` rather than `process.env.NEXT_PUBLIC_SOCKET_URL`.
- **Impact:** Breaks deployment across staging/production environments (e.g. Vercel, Render, Railway).

---

## 6. Security & Authorization Analysis

### Actual Security Issues Identified

1. **Unauthenticated Socket Connections & Spoofed Player Identity:**
   - Socket.io connection in `server.ts` performs no handshake authentication (JWT token is neither read from cookies nor verified in auth headers).
   - In `joinGame`, `userId` is passed directly in the client payload `{ gameId, userId }`. A malicious client can pass any user ID to impersonate white or black players in active games.
   - **Remedy:** Implement Socket.io authentication middleware (`io.use(...)`) verifying the JWT cookie/token on connection and storing the authenticated `userId` on `socket.data.userId`.

2. **Insecure Cookie Configuration for Local Development:**
   - In `auth.controller.ts`, cookies are set with `secure: true, sameSite: "none", partitioned: true`.
   - On standard HTTP local development (`http://localhost:3000` to `http://localhost:5000`), browsers reject `secure: true` cookies over non-HTTPS connections.
   - **Remedy:** Configure cookie security conditionally: `secure: process.env.NODE_ENV === "production"`.

3. **No Rate Limiting on Authentication Endpoints:**
   - `POST /api/v1/auth/login` and `POST /api/v1/auth/register` have no rate limiting (`express-rate-limit` is absent).
   - Vulnerable to credential stuffing and brute-force attacks.

### Recommended Security Hardening
- **Header Security:** Install and configure `helmet` for HTTP header protection.
- **CORS Hardening:** Validate allowed origins strictly against environment variables; prevent wildcard or mismatched credentials configurations.
- **Input Sanitization:** Sanitize usernames to prevent XSS in chat or public profiles.
- **Authorization on Game Creation / Modification:** Ensure that `createGame` requires a logged-in user and that the caller cannot forge other players' ratings or game records.

---

## 7. Development Rules & Guidelines for AI Agents

Any AI coding agent modifying this repository **MUST** adhere to the following directives:

1. **Consult `AGY.md` First:** Always check this file before implementing architectural changes, adding routes, or refactoring services.
2. **Do Not Rewrite Working Code:** Refactor only code that has identified bugs or is clearly incomplete. Preserve existing styling and conventions.
3. **Strict Separation of Concerns:**
   - `routes/`: Map HTTP verbs and endpoints to middlewares and controllers.
   - `controllers/`: Handle request parsing, validation responses, and HTTP status codes.
   - `services/`: Handle business logic (e.g., chess rule processing, matchmaking algorithms).
   - `models/`: Mongoose schemas, indexes, and document interfaces.
   - `middleware/`: Reusable request interceptors (authentication, authorization, logging, rate limiting).
4. **Maintain Type Safety:** Avoid `any` types. Update interfaces in `server/src/types/` and model definitions when modifying database or request structures.
5. **Always Connect Database Before Server Starts:** Ensure `connectDB()` resolves before `httpServer.listen(...)` begins accepting traffic.
6. **Keep Socket & REST Payloads Synchronized:** If an event or API contract changes, update both backend handlers and frontend callers simultaneously.
7. **Handle Full Chess Rule Set:** Always handle pawn promotion (`promotion: "q" | "r" | "b" | "n"`), castling, en passant, threefold repetition, and 50-move rule states via `chess.js`.
8. **Environment Variable Hygiene:** Never commit secret keys or credentials. Use `.env.example` templates for configuration requirements.
9. **Update `AGY.md` Upon Completion:** Whenever major features, bug fixes, or architectural changes are completed, update this file to reflect the new state.

---

## 8. Prioritized Roadmap & Task Backlog

### Priority Legend
- 🔴 **P0 — Critical / Blocking:** Bugs and omissions that prevent basic server startup, authentication, or gameplay.
- 🟠 **P1 — High Priority:** Core gameplay features, complete UI screens, and clock management.
- 🟡 **P2 — Medium Priority:** Social features (friendships), leaderboards, user profile editing, game history.
- 🟢 **P3 — Nice to Have / Polish:** Animations, sound effects, chat system, AI bot play, match analysis.

---

### Phase 1: Critical Fixes & Core Stability (P0)

#### Task 1.1: Connect MongoDB on Server Startup
- **Priority:** 🔴 P0
- **Rationale:** Server currently fails all database queries because Mongoose never initializes connection.
- **Files:** `server/src/server.ts`, `server/src/configs/db.config.ts`
- **Expected Result:** Database connects reliably before server accepts requests.

#### Task 1.2: Add `cookie-parser` & Fix JWT Auth Middleware
- **Priority:** 🔴 P0
- **Rationale:** Auth middleware fails on missing cookies and searches `email: undefined` due to payload mismatch.
- **Files:** `server/src/server.ts`, `server/src/middleware/auth.middleware.ts`, `server/src/controllers/auth.controller.ts`
- **Expected Result:** Cookies are parsed; JWT includes `userId`, `email`, `role`; `isUserLoggedIn` authenticates users correctly.

#### Task 1.3: Fix Route Shadowing in `user.routes.ts` & Auth on `/auth/me`
- **Priority:** 🔴 P0
- **Rationale:** `/api/v1/users/me` is intercepted by `/:id` and `/api/v1/auth/me` lacks auth middleware.
- **Files:** `server/src/routes/user.routes.ts`, `server/src/routes/auth.routes.ts`
- **Expected Result:** `GET /api/v1/users/me` and `GET /api/v1/auth/me` return authenticated user profile without 400/401 errors.

#### Task 1.4: Fix Socket `joinGame` Contract & Add Handshake Auth
- **Priority:** 🔴 P0
- **Rationale:** Client emits string while server expects object; anyone can spoof player identities.
- **Files:** `server/src/server.ts`, `client/app/game/[gameId]/page.tsx`, `client/lib/socket.ts`
- **Expected Result:** Socket validates JWT cookie on handshake; `joinGame` receives `{ gameId }` and binds authenticated user.

#### Task 1.5: Connect Interactive `ChessBoard` to Socket Game Arena
- **Priority:** 🔴 P0
- **Rationale:** Client game page currently has a placeholder box and hardcoded button instead of a playable board.
- **Files:** `client/app/game/[gameId]/page.tsx`, `client/components/ChessBoard.tsx`
- **Expected Result:** Users drag and drop pieces to make moves, receiving real-time board updates and FEN synchronization.

---

### Phase 2: Core Gameplay & Essential REST APIs (P1)

#### Task 2.1: Implement Game REST Endpoints & Route Mounting
- **Priority:** 🟠 P1
- **Rationale:** Missing ability to create games, retrieve game details, or list open matches.
- **Files:** `server/src/routes/game.routes.ts`, `server/src/controllers/game.controller.ts`
- **Expected Result:** Endpoints for `POST /api/v1/games`, `GET /api/v1/games/:id`, `GET /api/v1/games/user/:userId`.

#### Task 2.2: Implement Pawn Promotion & In-Memory Rehydration in Chess Service
- **Priority:** 🟠 P1
- **Rationale:** Pawns cannot promote; in-memory game map resets to starting FEN if cache drops.
- **Files:** `server/src/services/chess.service.ts`, `server/src/server.ts`, `client/components/ChessBoard.tsx`
- **Expected Result:** Promotion dialog on frontend; promotion piece passed to server; games rehydrate from MongoDB FEN.

#### Task 2.3: Server-Side Chess Clocks & Timeouts
- **Priority:** 🟠 P1
- **Rationale:** Time control fields exist in database but timers do not run.
- **Files:** `server/src/server.ts`, `server/src/models/game.model.ts`, `client/app/game/[gameId]/page.tsx`
- **Expected Result:** Active player's clock counts down; increment added on move completion; flag fall / timeout triggers game over.

#### Task 2.4: Build Authentication UI (Login & Register Pages)
- **Priority:** 🟠 P1
- **Rationale:** No UI exists for registration or login.
- **Files:** `client/app/login/page.tsx`, `client/app/register/page.tsx`, `client/components/NavBar.tsx`
- **Expected Result:** Responsive forms with validation, error toasts, and auth state management.

---

### Phase 3: Matchmaking, Social Features & Profiles (P2)

#### Task 3.1: Lobby & Matchmaking Queue
- **Priority:** 🟡 P2
- **Rationale:** Players need a way to find opponents without manually exchanging game IDs.
- **Files:** `server/src/server.ts`, `server/src/controllers/game.controller.ts`, `client/app/page.tsx`, `client/app/game/page.tsx`
- **Expected Result:** "Play Online" matchmaking queue matching players by time control and rating.

#### Task 3.2: Friendship System Implementation
- **Priority:** 🟡 P2
- **Rationale:** Model exists (`friendship.model.ts`) but has no controllers, routes, or UI.
- **Files:** `server/src/controllers/friendship.controller.ts`, `server/src/routes/friendship.routes.ts`, `client/app/friends/page.tsx`
- **Expected Result:** Send, accept, reject friend requests, and challenge friends to games.

#### Task 3.3: User Profile & Leaderboard Pages
- **Priority:** 🟡 P2
- **Rationale:** Navigation bar links to `/leaderboard` and `/profile` return 404.
- **Files:** `client/app/profile/page.tsx`, `client/app/leaderboard/page.tsx`
- **Expected Result:** View player statistics, recent games, Elo rating graph, and global top player list.

---

### Phase 4: Reliability, Security & Testing (P2 / P3)

#### Task 4.1: Automated Test Suite (Jest & Supertest)
- **Priority:** 🟡 P2
- **Rationale:** Zero automated tests currently exist.
- **Files:** `server/tests/auth.test.ts`, `server/tests/game.test.ts`, `server/tests/chess.service.test.ts`
- **Expected Result:** Comprehensive test coverage for auth endpoints, move validation, and game lifecycle.

#### Task 4.2: Global Error Handler & Rate Limiting
- **Priority:** 🟢 P3
- **Rationale:** Enhance API resiliency and defense against brute force attacks.
- **Files:** `server/src/server.ts`, `server/src/middleware/error.middleware.ts`
- **Expected Result:** Consistent JSON error responses and rate-limited auth endpoints.

---

## 9. Current State Summary

- **Project:** ChessLords
- **Architecture:** Monorepo with Next.js 16 (React 19, Tailwind CSS v4) frontend and Node.js/Express + Socket.io backend backed by MongoDB Atlas and `chess.js`.
- **Frontend Status:** Skeleton structure. Navigation bar present, game page contains Socket.io listener and placeholder box. `ChessBoard.tsx` contains `react-chessboard` but is unintegrated. Home page is blank. Auth pages missing.
- **Backend Status:** Express routes for auth and user profiles partially built. `chess.service.ts` provides move validation. Server entrypoint lacks DB connection, cookie parsing, and game route mounts.
- **Database Status:** Mongoose schemas defined for `User`, `Game`, `Friendship`, and `RefreshToken`. Indexes configured.
- **Authentication Status:** Bcrypt hashing and JWT cookies implemented in controllers, but broken due to missing `cookie-parser`, payload email omission, and route shadowing.
- **Real-Time Status:** Socket.io server and client scaffolding present; payload format mismatch on `joinGame`; pawn promotion and clock countdown missing.
- **Testing Status:** 0% test coverage. `server/tests` is empty.
- **Deployment Status:** Development setup only with hardcoded `localhost:5000` URLs.
- **Overall Completion:** ~25%

---

## 10. Top 7 Immediate Action Items for Next AI Agent

1. **Call `connectDB()` in `server.ts`**
   - *Priority:* 🔴 P0
   - *Files:* `server/src/server.ts`, `server/src/configs/db.config.ts`
   - *Result:* Mongoose connects to MongoDB before HTTP server starts.

2. **Mount `cookie-parser` & Fix JWT Payload**
   - *Priority:* 🔴 P0
   - *Files:* `server/src/server.ts`, `server/src/controllers/auth.controller.ts`, `server/src/middleware/auth.middleware.ts`
   - *Result:* Cookies are parsed on every request; JWT payload includes `{ userId, email, role }`; auth middleware passes.

3. **Fix Route Ordering & Middleware in `user.routes.ts` and `auth.routes.ts`**
   - *Priority:* 🔴 P0
   - *Files:* `server/src/routes/user.routes.ts`, `server/src/routes/auth.routes.ts`
   - *Result:* `/api/v1/users/me` is placed before `/:id`; `/api/v1/auth/me` uses `isUserLoggedIn`.

4. **Synchronize Socket `joinGame` and Add Socket Auth**
   - *Priority:* 🔴 P0
   - *Files:* `server/src/server.ts`, `client/app/game/[gameId]/page.tsx`, `client/lib/socket.ts`
   - *Result:* Sockets authenticate via JWT; frontend sends valid payload; players connect to their respective games.

5. **Integrate `ChessBoard.tsx` into `client/app/game/[gameId]/page.tsx`**
   - *Priority:* 🔴 P0
   - *Files:* `client/app/game/[gameId]/page.tsx`, `client/components/ChessBoard.tsx`
   - *Result:* Interactive drag-and-drop chessboard renders and communicates move events with the backend.

6. **Mount Game Routes in `server/src/routes/game.routes.ts`**
   - *Priority:* 🟠 P1
   - *Files:* `server/src/routes/game.routes.ts`, `server/src/controllers/game.controller.ts`
   - *Result:* REST endpoints for game creation and retrieval are active.

7. **Implement Promotion Support & State Rehydration in `chess.service.ts`**
   - *Priority:* 🟠 P1
   - *Files:* `server/src/services/chess.service.ts`, `server/src/server.ts`
   - *Result:* Moves support pawn promotion pieces; game service rehydrates from DB FEN if in-memory cache is cold.
