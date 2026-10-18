export interface RatingProgressionPoint {
  date: string;
  rating: number;
  change: number;
  opponent?: string;
  opponentRating?: number;
  result?: "win" | "loss" | "draw";
  format?: "Bullet" | "Blitz" | "Rapid" | "Classical" | "Custom";
  gameId?: string;
}

export interface FormatPerformance {
  format: "Bullet" | "Blitz" | "Rapid" | "Classical";
  gamesPlayed: number;
  won: number;
  lost: number;
  drawn: number;
  winRate: number;
}

export interface ColorPerformance {
  gamesPlayed: number;
  won: number;
  lost: number;
  drawn: number;
  winRate: number;
}

export interface StreakStats {
  currentStreak: {
    count: number;
    type: "win" | "loss" | "draw" | "none";
  };
  bestWinStreak: number;
  recentForm: ("win" | "loss" | "draw")[];
  winRateLast10: number;
}

export interface RecentMatchItem {
  id: string;
  date: string;
  formattedDate: string;
  timeControlName: string;
  format: "Bullet" | "Blitz" | "Rapid" | "Classical" | "Custom";
  userColor: "white" | "black";
  opponentName: string;
  opponentRating: number;
  result: "win" | "loss" | "draw";
  movesCount: number;
  ratingChange: number;
  status: string;
}

export interface UserFullStatistics {
  userId: string;
  username: string;
  name: string;
  profilePic: string;
  bio: string;
  rating: number;
  peakRating: number;
  lowestRating: number;
  ratingChange: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  winRate: number;
  ratingHistory: RatingProgressionPoint[];
  historicalBreakdown: {
    byFormat: FormatPerformance[];
    byColor: {
      white: ColorPerformance;
      black: ColorPerformance;
    };
    streaks: StreakStats;
    recentMatches: RecentMatchItem[];
  };
}
