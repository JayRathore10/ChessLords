"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const socket_io_1 = require("socket.io");
const env_config_1 = require("./configs/env.config");
const game_routes_1 = __importDefault(require("./routes/game.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const db_config_1 = require("./configs/db.config");
const socket_1 = require("./socket/socket");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: env_config_1.FRONTEND || "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// app.use("/images", express.static("public/images"));
app.use("/images", express_1.default.static("public/images", {
    setHeaders: (res) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
}));
app.use((0, cookie_parser_1.default)());
app.use("/api/v1/games", game_routes_1.default);
app.use("/api/v1/auth", auth_routes_1.default);
app.use("/api/v1/users", user_routes_1.default);
app.get("/", (req, res) => {
    res.send("Hi, Jexts here!");
});
const httpServer = http_1.default.createServer(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: env_config_1.FRONTEND || "http://localhost:3000",
        methods: ["GET", "POST", "DELETE", "PUT"],
        credentials: true,
    },
});
const matchmakingQueue = [];
// Helper to remove a socket from matchmaking queue
const removeFromQueue = (socketId) => {
    const index = matchmakingQueue.findIndex((p) => p.socketId === socketId);
    if (index !== -1) {
        const removed = matchmakingQueue.splice(index, 1)[0];
        console.log(`[Queue] Removed ${removed.username} (${socketId}) from queue`);
        return true;
    }
    return false;
};
(0, socket_1.setupSocket)(io);
app.get("/", (req, res) => {
    res.json({
        message: "ChessLord server is running",
    });
});
httpServer.listen(5000, () => {
    (0, db_config_1.connectDB)();
    console.log("ChessLord server running on http://localhost:5000");
});
