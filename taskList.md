# ChessLord - Project Task Roadmap

This document outlines all pending and incomplete tasks across the ChessLord application, categorized by system domain and implementation priority.

---

## Part 1: Authentication & User Management

- [x] **Auth Pages & UI**
  - [x] Build User Registration Page (`client/app/register/page.tsx`).
  - [x] Build User Login Page (`client/app/login/page.tsx`).
  - [x] Implement form validations (email format, password strength, username uniqueness check).
- [x] **State & Session Management**
  - [x] Create global Auth Context / Zustand store to manage user session and JWT tokens.
  - [x] Implement Axios / Fetch interceptor to handle token refresh via `refreshToken.model.ts` on `401 Unauthorized`.
  - [x] Update [Navbar.tsx](file:///E:/chess-lords/client/components/NavBar.tsx) to dynamically render user profile, avatar, rating, and Logout button when authenticated.
- [x] **Profile & User Settings**
  - [x] Build User Profile Page (`client/app/profile/page.tsx`).
  - [x] Implement avatar upload / selection and bio/username updates (`PATCH /api/v1/users/me`).
  - [x] Add change password / security settings flow.

---

## Part 2: Game Creation, Lobby & Matchmaking

- [x] **Landing Page & Play Hub**
  - [x] Build modern landing page in [client/app/page.tsx](file:///E:/chess-lords/client/app/page.tsx) with hero section, quick play button, and game mode selector.
  - [x] Build Play / Lobby Page (`client/app/game/page.tsx`) with game options (Bullet, Blitz, Rapid, Custom).
- [x] **Matchmaking Queue System**
  - [x] Implement server-side matchmaking queue (pairing players based on rating and selected time control).
  - [x] Add client-side "Searching for opponent..." modal with cancel button and matchmaking timer.
  - [x] Emit match found event and automatically route players to `/game/:gameId`.
- [x] **Custom Games & Room Invites**
  - [x] Build "Play with a Friend" modal allowing custom time controls and color selection.
  - [x] Generate shareable invite links (`/game/:gameId?join=code`) for direct private matches.
  - [x] Allow guest play or pass-and-play mode.

---

## Part 3: Gameplay, Chess Engine & In-Game UI

- [ ] **Pawn Promotion Selection Modal**
  - [ ] Create modal / overlay prompt to choose Queen, Rook, Bishop, or Knight upon pawn reaching the last rank.
- [x] **Clocks & Timers**
  - [x] Implement real-time countdown clocks for White and Black players with increment support (e.g. 3+2, 10+0).
  - [ ] Sync clock state with server timestamps to prevent client-side desync or tampering.
  - [ ] Implement automatic timeout handling (flagging player when clock reaches 0:00).
- [x] **Game Actions & Controls**
  - [x] Add "Resign" button with confirmation modal.
  - [x] Add "Offer Draw" / "Accept Draw" / "Decline Draw" socket flow.
  - [x] Add "Abort Game" option if no moves have been played.
- [x] **Move History & Notation**
  - [x] Format move list in standard algebraic notation (SAN) with move numbers.
  - [ ] Add interactive move navigation (click on past moves to view board state history).
  - [ ] Add PGN / FEN export and copy buttons.
- [x] **Captured Pieces & Material Balance**
  - [x] Display captured pieces for White and Black alongside player profiles.
  - [x] Calculate and display material difference advantage (e.g., `+3`, `+1`).
- [ ] **Audio & Sound Effects**
  - [ ] Add audio effects for moves, captures, castling, checks, checkmates, low-time alerts, and game-over sound.

---

## Part 4: Real-time Socket & Server Infrastructure

- [ ] **Socket Authentication & Security**
  - [ ] Implement Socket.io JWT authentication middleware to verify user identity on connection.
  - [ ] Associate socket connections with validated `userId`.
- [ ] **Disconnection & Reconnection Handling**
  - [ ] Add reconnect handling (restore game state if a player temporarily drops and reconnects within 60 seconds).
  - [ ] Implement disconnect timer and award win on abandonment if the player does not return.
- [ ] **Rating System & Post-Game Sync**
  - [ ] Implement ELO / Glicko rating calculation algorithm on game completion.
  - [ ] Update user statistics (wins, losses, draws, rating history) in MongoDB on game end.
- [ ] **Spectator Mode**
  - [ ] Support spectator sockets joining `game:${gameId}` room as read-only viewers.
  - [ ] Show spectator count and live updates to viewers.

---

## Part 5: Social, Friends & Community Features

- [ ] **In-Game Chat**
  - [ ] Build in-game chat panel with player messages and quick pre-set emotes / greetings ("Good luck", "Well played").
  - [ ] Add chat moderation / profanity filtering and mute controls.
- [ ] **Friendship System**
  - [ ] Implement friend request routes and controllers utilizing [friendship.model.ts](file:///E:/chess-lords/server/src/models/friendship.model.ts).
  - [ ] Build Friends drawer / modal showing online status.
  - [ ] Add "Challenge Friend" button to directly send a game invite.
- [ ] **Leaderboard & Player Stats**
  - [ ] Build Leaderboards page (`client/app/leaderboard/page.tsx`) showing top players sorted by rating.
  - [ ] Display player stats (win rate %, total games, rating chart).

---

## Part 6: UI/UX, Theming & Responsiveness

- [ ] **Mobile Responsiveness & Layout**
  - [ ] Optimize chessboard layout and controls for mobile screens and portrait orientation.
  - [ ] Add haptic feedback or touch-friendly interactions for mobile browsers.
- [ ] **Theme Customization**
  - [ ] Support board themes (Wood, Glass, Neo, Classic Green, Dark Slate).
  - [ ] Support piece set themes (Standard, Neo, Classic, 3D).
- [ ] **Toast Notification System**
  - [ ] Integrate toast alerts for game challenges, friend requests, errors, and announcements.

---

## Part 7: Testing, Security & Deployment

- [ ] **Testing**
  - [ ] Write unit tests for chess move validation, checkmate/draw conditions in `chess.service.ts`.
  - [ ] Write integration tests for auth and game REST API routes.
  - [ ] Write socket event tests (joinGame, makeMove, draw offers, resign).
- [ ] **Security & Production Hardening**
  - [ ] Add rate limiting (`express-rate-limit`) on auth and game creation routes.
  - [ ] Sanitize input data and handle CORS production origins.
  - [ ] Add Dockerfile and docker-compose configurations for full-stack deployment.