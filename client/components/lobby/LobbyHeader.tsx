import { Crown , Swords} from "lucide-react"

type LobbyStats = {
  activeGames: number;
  totalGames: number;
  onlinePlayers: number;
};


const LobbyHeader = ({ lobbyStats }: { lobbyStats: LobbyStats }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-border">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary-gradient flex items-center justify-center text-surface-main shadow-lg shadow-black/40">
            <Crown className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary-gradient">
            Play Chess
          </h1>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Select your mode, challenge players worldwide, or play with friends.
        </p>
      </div>
      <div className="flex items-center gap-4 bg-surface-card border border-surface-border rounded-2xl px-5 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-(--success) animate-pulse" />
          <div className="text-left">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Online</p>
            <p className="text-sm font-bold text-white">{lobbyStats.onlinePlayers}</p>
          </div>
        </div>
        <div className="w-px h-6 bg-surface-border" />
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-primary" />
          <div className="text-left">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Active Games</p>
            <p className="text-sm font-bold text-white">{lobbyStats.activeGames}</p>
          </div>
        </div>
      </div>
    </div>

  )
}

export default LobbyHeader;
