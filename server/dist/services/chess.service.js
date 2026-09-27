"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChessGame = exports.makeChessMove = exports.getChessGame = exports.createChessGame = void 0;
const chess_js_1 = require("chess.js");
const games = new Map();
const createChessGame = (gameId, fen) => {
    const chess = fen
        ? new chess_js_1.Chess(fen)
        : new chess_js_1.Chess();
    games.set(gameId, chess);
    return chess;
};
exports.createChessGame = createChessGame;
const getChessGame = (gameId) => {
    return games.get(gameId);
};
exports.getChessGame = getChessGame;
const makeChessMove = (gameId, from, to, promotion) => {
    let chess = games.get(gameId);
    if (!chess) {
        chess = (0, exports.createChessGame)(gameId);
    }
    try {
        const move = chess.move({
            from,
            to,
            promotion,
        });
        return {
            success: true,
            move: {
                color: move.color,
                from: move.from,
                to: move.to,
                san: move.san,
            },
            fen: chess.fen(),
            turn: chess.turn() === "w"
                ? "white"
                : "black",
            isCheck: chess.isCheck(),
            isCheckmate: chess.isCheckmate(),
            isDraw: chess.isDraw(),
            isGameOver: chess.isGameOver(),
        };
    }
    catch (_a) {
        return {
            success: false,
            message: "Illegal chess move",
        };
    }
};
exports.makeChessMove = makeChessMove;
const deleteChessGame = (gameId) => {
    games.delete(gameId);
};
exports.deleteChessGame = deleteChessGame;
