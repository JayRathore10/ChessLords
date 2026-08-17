import { Chess } from "chess.js";

const games = new Map<string, Chess>();

export const createChessGame = (
  gameId: string,
  fen?: string
) => {
  const chess = fen
    ? new Chess(fen)
    : new Chess();

  games.set(gameId, chess);

  return chess;
};

export const getChessGame = (
  gameId: string
) => {
  return games.get(gameId);
};

export const makeChessMove = (
  gameId: string,
  from: string,
  to: string
) => {
  let chess = games.get(gameId);

  if (!chess) {
    chess = createChessGame(gameId);
  }

  try {
    const move = chess.move({
      from,
      to,
    });

    return {
      success: true,

      move,

      fen: chess.fen(),

      turn:
        chess.turn() === "w"
          ? "white"
          : "black",

      isCheck: chess.isCheck(),

      isCheckmate:
        chess.isCheckmate(),

      isDraw: chess.isDraw(),

      isGameOver:
        chess.isGameOver(),
    };
  } catch {
    return {
      success: false,
      message: "Illegal chess move",
    };
  }
};

export const deleteChessGame = (
  gameId: string
) => {
  games.delete(gameId);
};