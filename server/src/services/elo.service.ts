// server/src/services/elo.service.ts

const K_FACTOR = 32;

export function calculateElo(
  whiteRating: number,
  blackRating: number,
  result: "white" | "black" | "draw"
) {
  const expectedWhite = 1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
  const expectedBlack = 1 / (1 + Math.pow(10, (whiteRating - blackRating) / 400));

  let actualWhite = 0.5;
  let actualBlack = 0.5;

  if (result === "white") {
    actualWhite = 1;
    actualBlack = 0;
  } else if (result === "black") {
    actualWhite = 0;
    actualBlack = 1;
  }

  const newWhiteRating = Math.round(whiteRating + K_FACTOR * (actualWhite - expectedWhite));
  const newBlackRating = Math.round(blackRating + K_FACTOR * (actualBlack - expectedBlack));

  return {
    whiteRatingChange: newWhiteRating - whiteRating,
    blackRatingChange: newBlackRating - blackRating,
    newWhiteRating,
    newBlackRating,
  };
}