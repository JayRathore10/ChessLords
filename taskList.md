# ChessLord - Project Task Roadmap

This document outlines all pending and incomplete tasks across the ChessLord application, categorized by system domain and implementation priority.

---

## Part 1: Authentication & User Management

- [ ] **Auth Pages & UI**
  - [ ] Build User Registration Page (`client/app/register/page.tsx`).
  - [ ] Build User Login Page (`client/app/login/page.tsx`).
  - [ ] Implement form validations (email format, password strength, username uniqueness check).
- [ ] **State & Session Management**
  - [ ] Create global Auth Context / Zustand store to manage user session and JWT tokens.
  - [ ] Implement Axios / Fetch interceptor to handle token refresh via `refreshToken.model.ts` on `401 Unauthorized`.
  - [ ] Update [Navbar.tsx](file:///E:/chess-lords/client/components/NavBar.tsx) to dynamically render user profile, avatar, rating, and Logout button when authenticated.
- [ ] **Profile & User Settings**
  - [ ] Build User Profile Page (`client/app/profile/page.tsx`).
  - [ ] Implement avatar upload / selection and bio/username updates (`PATCH /api/v1/users/me`).
  - [ ] Add change password / security settings flow.

---

## Part 2: Game Creation, Lobby & Matchmaking

- [ ] **Landing Page & Play Hub**
  - [ ] Build modern landing page in [client/app/page.tsx](file:///E:/chess-lords/client/app/page.tsx) with hero section, quick play button, and game mode selector.
  - [ ] Build Play / Lobby Page (`client/app/game/page.tsx`) with game options (Bullet, Blitz, Rapid, Custom).
- [ ] **Matchmaking Queue System**
  - [ ] Implement server-side matchmaking queue (pairing players based on rating and selected time control).
  - [ ] Add client-side "Searching for opponent..." modal with cancel button and matchmaking timer.
  - [ ] Emit match found event and automatically route players to `/game/:gameId`.
- [ ] **Custom Games & Room Invites**
  - [ ] Build "Play with a Friend" modal allowing custom time controls and color selection.
  - [ ] Generate shareable invite links (`/game/:gameId?join=code`) for direct private matches.
  - [ ] Allow guest play or pass-and-play mode.

---

## Part 3: Gameplay, Chess Engine & In-Game UI

- [ ] **Pawn Promotion Selection Modal**
  - [ ] Create modal / overlay prompt to choose Queen, Rook, Bishop, or Knight upon pawn reaching the last rank.
- [ ] **Clocks & Timers**
  - [ ] Implement real-time countdown clocks for White and Black players with increment support (e.g. 3+2, 10+0).
  - [ ] Sync clock state with server timestamps to prevent client-side desync or tampering.
  - [ ] Implement automatic timeout handling (flagging player when clock reaches 0:00).
- [ ] **Game Actions & Controls**
  - [ ] Add "Resign" button with confirmation modal.
  - [ ] Add "Offer Draw" / "Accept Draw" / "Decline Draw" socket flow.
  - [ ] Add "Abort Game" option if no moves have been played.
- [ ] **Move History & Notation**
  - [ ] Format move list in standard algebraic notation (SAN) with move numbers.
  - [ ] Add interactive move navigation (click on past moves to view board state history).
  - [ ] Add PGN / FEN export and copy buttons.
- [ ] **Captured Pieces & Material Balance**
  - [ ] Display captured pieces for White and Black alongside player profiles.
  - [ ] Calculate and display material difference advantage (e.g., `+3`, `+1`).
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
