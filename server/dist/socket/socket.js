"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = void 0;
const matchmaking_socket_1 = require("./matchmaking.socket");
const game_socket_1 = require("./game.socket");
const chat_socket_1 = require("./chat.socket");
const socketAuth_middleware_1 = require("../middleware/socketAuth.middleware");
const setupSocket = (io) => {
    io.use(socketAuth_middleware_1.socketAuthMiddleware);
    io.on("connection", (socket) => {
        const identity = socket.data.authenticated
            ? `${socket.data.username} (${socket.data.userId})`
            : "guest";
        console.log(`Player connected: ${socket.id} as ${identity}`);
        (0, matchmaking_socket_1.setupMatchmakingSocket)(io, socket);
        (0, game_socket_1.setupGameSocket)(io, socket);
        (0, chat_socket_1.setupChatSocket)(io, socket);
        socket.on("disconnect", () => {
            console.log("Player disconnected:", socket.id);
            void (0, game_socket_1.handleGameDisconnect)(io, socket);
        });
    });
};
exports.setupSocket = setupSocket;
