"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = void 0;
const matchmaking_socket_1 = require("./matchmaking.socket");
const game_socket_1 = require("./game.socket");
const setupSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("Player connected:", socket.id);
        (0, matchmaking_socket_1.setupMatchmakingSocket)(io, socket);
        (0, game_socket_1.setupGameSocket)(io, socket);
        socket.on("disconnect", () => {
            console.log("Player disconnected:", socket.id);
        });
    });
};
exports.setupSocket = setupSocket;
