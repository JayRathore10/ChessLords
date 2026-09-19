# ♟ ChessLords

A real-time multiplayer chess platform built with **Next.js, Express, Socket.IO, MongoDB, and chess.js**.

ChessLords provides an online chess experience with real-time gameplay, matchmaking, private rooms, friend games, game timers, ratings, player profiles, and multiple time controls.

## Features

* Real-time multiplayer chess
* Quick Match matchmaking
* Play with friends
* Private rooms with room codes
* Shareable game links
* Pass & Play mode
* Rated and casual games
* Multiple time controls
* Increment-based clocks
* Real-time move synchronization
* Automatic game timeout handling
* Chess move validation using `chess.js`
* Player ratings
* Player statistics
* User profiles
* Profile picture support
* Game status tracking
* Online player statistics
* Active game statistics
* Responsive chess board
* Socket.IO powered real-time communication

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Socket.IO Client
* react-chessboard

### Backend

* Node.js
* Express.js
* TypeScript
* Socket.IO
* MongoDB
* Mongoose
* chess.js
* Multer

### Architecture

```text
                    ┌─────────────────────┐
                    │      Next.js        │
                    │      Frontend       │
                    └──────────┬──────────┘
                               │
                     HTTP / Socket.IO
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express + Node.js │
                    │      Backend        │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        ┌──────────┐     ┌────────────┐   ┌───────────┐
        │ Socket.IO│     │ chess.js   │   │  MongoDB  │
        │ Real-time│     │ Game Logic │   │  Database │
        └──────────┘     └────────────┘   └───────────┘
```

## Game Modes

### Quick Match

Find an opponent through the matchmaking queue.

Players can choose:

* Time control
* Rated or casual game
* Preferred color

The server automatically matches compatible players and creates a game.

### Friend Game

Create a private room and invite another player using:

* Room code
* Shareable room link

### Pass & Play

Play a local game with two players using the same device.

## Time Controls

ChessLords supports multiple chess time controls, including:

* Bullet
* Blitz
* Rapid
* Custom time controls
* Increment-based games

Each game maintains independent clocks for White and Black.

Example:

```text
3 + 0
3 minutes initial time
0 second increment
```

```text
10 + 5
10 minutes initial time
5 second increment
```

## Real-Time Gameplay

ChessLords uses **Socket.IO** to synchronize games between players.

The server handles events such as:

```text
joinGame
makeMove
gameOver
gameTimeout
matchFound
queueJoined
queueLeft
queueError
```

This allows both players to receive moves and game-state changes in real time without manually refreshing the page.

## Chess Logic

Game validation is handled on the server using `chess.js`.

The server maintains the current game state including:

```text
currentPosition
whiteTime
blackTime
status
result
gameType
timeControl
```

Possible game states include:

```text
waiting
active
completed
abandoned
```

Possible results include:

```text
white
black
draw
none
```

## Matchmaking

The matchmaking system maintains a queue of players looking for opponents.

```text
Player
   │
   ▼
Join Queue
   │
   ▼
Matchmaking Queue
   │
   ├── Compatible player found
   │
   ▼
Create Game
   │
   ▼
Notify both players
   │
   ▼
Start Chess Game
```

The lobby also provides live information such as:

* Online players
* Active games
* Total games

## Project Structure

```text
ChessLords/
│
├── client/                 # Next.js frontend
│
├── server/                 # Express + Socket.IO backend
│
├── graphify-out/           # Generated architecture/graph output
│
├── AGY.md
├── taskList.md
└── README.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/JayRathore10/ChessLords.git
cd ChessLords
```

### 2. Install dependencies

Install frontend dependencies:

```bash
cd client
npm install
```

Install backend dependencies:

```bash
cd ../server
npm install
```

### 3. Configure environment variables

Create the required `.env` files for both the frontend and backend.

#### Client

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

#### Server

Configure your backend environment with values for your MongoDB connection, frontend URL, authentication secrets, and other server configuration.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
FRONTEND=http://localhost:3000
JWT_SECRET=your_jwt_secret
```

> Do not commit `.env` files or production secrets to the repository.

### 4. Start the backend

```bash
cd server
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### 5. Start the frontend

Open another terminal:

```bash
cd client
npm run dev
```

The frontend will be available at:

```text
http://localhost:3000
```

## Game Flow

A typical multiplayer game follows this flow:

```text
Authentication
      │
      ▼
     Lobby
      │
      ├───────────────┐
      │               │
      ▼               ▼
 Quick Match      Friend Game
      │               │
      ▼               ▼
 Matchmaking       Room Creation
      │               │
      └───────┬───────┘
              ▼
         Chess Game
              │
              ▼
       Real-time Moves
              │
              ▼
        Game Completion
              │
              ▼
       Update Statistics
```

## Security & Validation

ChessLords performs important game operations on the backend rather than relying only on the client.

The server is responsible for:

* Validating chess moves
* Managing game state
* Managing timers
* Handling game completion
* Managing matchmaking
* Synchronizing players
* Updating game results

This prevents the client from being the sole source of truth for game state.

## Future Improvements

Planned improvements include:

* Chess game history
* Player leaderboard
* ELO/rating improvements
* Spectator mode
* Rematch functionality
* Draw offers
* Resignation handling
* Game analysis
* Move history and PGN export
* Chess puzzles
* Notifications
* Tournament system
* Improved matchmaking based on rating

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/your-feature
```

3. Make your changes
4. Commit your changes

```bash
git commit -m "feat: add your feature"
```

5. Push the branch

```bash
git push origin feature/your-feature
```

6. Open a Pull Request

## Author

**Jay Rathore**

* GitHub: [JayRathore10](https://github.com/JayRathore10)

## License

This project is currently available for development and educational purposes.

---

Built with Next.js, Express, Socket.IO, MongoDB and chess.js.
