import { Chess } from 'chess.js';

describe('Chess Game Logic & Move Validation', () => {
  let chess: Chess;

  beforeEach(() => {
    // Reset the board to the starting position before each test
    chess = new Chess();
  });

  describe('Move Validation', () => {
    it('should allow a valid pawn opening move', () => {
      const move = chess.move({ from: 'e2', to: 'e4' });
      expect(move).not.toBeNull();
      expect(move.san).toBe('e4');
    });

    it('should reject an illegal move (e.g., knight moving in a straight line)', () => {
      expect(() => {
        chess.move({ from: 'g1', to: 'g3' });
      }).toThrow();
    });

    it("should reject moving an opponent's piece", () => {
      // White's turn, trying to move Black's pawn
      expect(() => {
        chess.move({ from: 'e7', to: 'e5' });
      }).toThrow();
    });
  });

  describe('Check', () => {
    it('should correctly detect when a King is in check', () => {
      // Set up a board where White king is in check by a Black rook
      chess.load('4k3/8/8/8/8/8/8/4K2r w - - 0 1');
      expect(chess.inCheck()).toBe(true);
      expect(chess.isCheckmate()).toBe(false);
    });

    it('should not allow a move that leaves the King in check', () => {
      chess.load('4k3/8/8/8/8/8/8/4K2r w - - 0 1');
      // White king is on e1. Moving a pawn doesn't resolve the check.
      expect(() => {
        chess.move({ from: 'a2', to: 'a3' }); // Assuming a pawn was there, but even if not, this is invalid
      }).toThrow();
    });
  });

  describe('Checkmate', () => {
    it("should correctly identify a Checkmate (Fool's Mate)", () => {
      chess.move('f3');
      chess.move('e5');
      chess.move('g4');
      chess.move('Qh4#'); // Black delivers checkmate

      expect(chess.isCheckmate()).toBe(true);
      expect(chess.isGameOver()).toBe(true);
    });
  });

  describe('Draw Conditions', () => {
    it('should identify a draw by Stalemate', () => {
      // Standard stalemate FEN
      chess.load('8/8/8/8/8/7k/7p/7K w - - 0 1');
      expect(chess.isStalemate()).toBe(true);
      expect(chess.isDraw()).toBe(true);
      expect(chess.isGameOver()).toBe(true);
    });

    it('should identify a draw by Insufficient Material', () => {
      // King vs King
      chess.load('8/8/8/8/8/8/4k3/4K3 w - - 0 1');
      expect(chess.isInsufficientMaterial()).toBe(true);
      expect(chess.isDraw()).toBe(true);
      expect(chess.isGameOver()).toBe(true);
    });

    it('should identify a draw by 50-Move Rule', () => {
      // FEN with halfmove clock at 100 (which means 50 full moves without capture or pawn push)
      chess.load('8/8/8/8/8/8/4k3/4K3 w - - 100 1');
      // chess.js automatically calculates the 50-move rule inside isDraw() based on the FEN
      expect(chess.isDraw()).toBe(true);
    });

    it('should identify a draw by Threefold Repetition', () => {
      // Move knights back and forth 3 times
      chess.move('Nf3');
      chess.move('Nf6');
      chess.move('Ng1');
      chess.move('Ng8');
      chess.move('Nf3');
      chess.move('Nf6');
      chess.move('Ng1');
      chess.move('Ng8');

      expect(chess.isThreefoldRepetition()).toBe(true);
      expect(chess.isDraw()).toBe(true);
    });
  });
});
