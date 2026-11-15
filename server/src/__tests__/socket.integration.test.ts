import { createServer } from "http";
import { Server, Socket as ServerSocket } from "socket.io";
import Client, { Socket as ClientSocket } from "socket.io-client";
import { AddressInfo } from "net";

describe("Socket.IO Integration Tests", () => {
  let io: Server;
  let serverSocket: ServerSocket;
  let clientSocket1: ClientSocket;
  let clientSocket2: ClientSocket;
  let port: number;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    
    // Mock the basic room logic your server uses
    io.on("connection", (socket) => {
      serverSocket = socket;

      socket.on("joinGame", ({ gameId, userId }) => {
        socket.join(gameId);
        socket.to(gameId).emit("playerJoined", { userId });
      });

      socket.on("makeMove", (data) => {
        socket.to(data.gameId).emit("moveMade", data);
      });

      socket.on("offerDraw", ({ gameId }) => {
        socket.to(gameId).emit("drawOffered");
      });

      socket.on("resign", ({ gameId, userId }) => {
        io.to(gameId).emit("gameOver", { reason: "resignation", loser: userId });
      });

      socket.on("timeout", ({ gameId, userId }) => {
        io.to(gameId).emit("gameOver", { reason: "timeout", loser: userId });
      });

      socket.on("leaveGame", ({ gameId }) => {
        socket.leave(gameId);
        socket.to(gameId).emit("playerLeft");
      });
    });

    httpServer.listen(() => {
      port = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterAll(() => {
    io.close();
  });

  beforeEach((done) => {
    clientSocket1 = Client(`http://localhost:${port}`);
    clientSocket2 = Client(`http://localhost:${port}`);

    let connected = 0;
    const checkDone = () => {
      connected++;
      if (connected === 2) done();
    };

    clientSocket1.on("connect", checkDone);
    clientSocket2.on("connect", checkDone);
  });

  afterEach(() => {
    if (clientSocket1.connected) clientSocket1.disconnect();
    if (clientSocket2.connected) clientSocket2.disconnect();
  });

  it("should allow players to join a game room", (done) => {
    const gameId = "game_123";

    clientSocket2.on("playerJoined", (data) => {
      expect(data.userId).toBe("user_1");
      done();
    });

    clientSocket2.emit("joinGame", { gameId, userId: "user_2" });

    setTimeout(() => {
      clientSocket1.emit("joinGame", { gameId, userId: "user_1" });
    }, 50);
  });

  it("should broadcast made moves to the opponent", (done) => {
    const gameId = "game_123";
    const moveData = { gameId, from: "e2", to: "e4", fen: "new_fen_string" };

    clientSocket1.emit("joinGame", { gameId, userId: "user_1" });
    clientSocket2.emit("joinGame", { gameId, userId: "user_2" });

    clientSocket2.on("moveMade", (data) => {
      expect(data.from).toBe("e2");
      expect(data.to).toBe("e4");
      expect(data.fen).toBe("new_fen_string");
      done();
    });

    setTimeout(() => {
      clientSocket1.emit("makeMove", moveData);
    }, 50);
  });

  it("should handle draw offers", (done) => {
    const gameId = "game_123";
    
    clientSocket1.emit("joinGame", { gameId, userId: "user_1" });
    clientSocket2.emit("joinGame", { gameId, userId: "user_2" });

    clientSocket2.on("drawOffered", () => {
      expect(true).toBe(true);
      done();
    });

    setTimeout(() => {
      clientSocket1.emit("offerDraw", { gameId });
    }, 50);
  });

  it("should handle resignations and end the game", (done) => {
    const gameId = "game_123";
    
    clientSocket1.emit("joinGame", { gameId, userId: "user_1" });
    clientSocket2.emit("joinGame", { gameId, userId: "user_2" });

    clientSocket2.on("gameOver", (data) => {
      expect(data.reason).toBe("resignation");
      expect(data.loser).toBe("user_1");
      done();
    });

    setTimeout(() => {
      clientSocket1.emit("resign", { gameId, userId: "user_1" });
    }, 50);
  });

  it("should handle timeouts", (done) => {
    const gameId = "game_123";
    
    clientSocket1.emit("joinGame", { gameId, userId: "user_1" });
    clientSocket2.emit("joinGame", { gameId, userId: "user_2" });

    clientSocket2.on("gameOver", (data) => {
      expect(data.reason).toBe("timeout");
      expect(data.loser).toBe("user_2"); 
      done();
    });

    setTimeout(() => {
      clientSocket1.emit("timeout", { gameId, userId: "user_2" });
    }, 50);
  });

  it("should handle leaving the game and reconnection", (done) => {
    const gameId = "game_123";
    let p1JoinCount = 0;

    // 1. Setup P2's listeners FIRST
    clientSocket2.on("playerJoined", (data) => {
      if (data.userId === "user_1") {
        p1JoinCount++;
        // The first time is the initial join, the second time is the reconnect
        if (p1JoinCount === 2) {
          done();
        }
      }
    });

    clientSocket2.on("playerLeft", () => {
      // 4. As soon as P2 sees P1 leave, P1 rejoins
      clientSocket1.emit("joinGame", { gameId, userId: "user_1" });
    });

    // 2. P2 joins first so they are in the room to hear P1
    clientSocket2.emit("joinGame", { gameId, userId: "user_2" });

    // 3. Stagger P1's actions slightly so the server has time to process P2
    setTimeout(() => {
      // Initial join
      clientSocket1.emit("joinGame", { gameId, userId: "user_1" });

      // Leave shortly after
      setTimeout(() => {
        clientSocket1.emit("leaveGame", { gameId });
      }, 50);
    }, 50);
  });
});