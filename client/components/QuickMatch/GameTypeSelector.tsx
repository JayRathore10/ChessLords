interface GameTypeSelectorProps{
  gameType: "rated" | "casual";
  setGameType: React.Dispatch<React.SetStateAction<"rated" | "casual">>;
};

const GameTypeSelector = ({ gameType, setGameType } : GameTypeSelectorProps) => {
  return (
    <div className="flex items-center bg-[var(--surface-main)] border border-[var(--surface-border)] rounded-xl p-1 text-xs font-semibold">
      <button
        onClick={() => setGameType("rated")}
        className={`px-3 py-1.5 rounded-lg transition ${
          gameType === "rated"
            ? "bg-[var(--primary)] text-[var(--surface-main)] shadow"
            : "text-gray-400 hover:text-white"
        }`}
      >
        Rated
      </button>
      <button
        onClick={() => setGameType("casual")}
        className={`px-3 py-1.5 rounded-lg transition ${
          gameType === "casual"
            ? "bg-white/15 text-white"
            : "text-gray-400 hover:text-white"
        }`}
      >
        Casual
      </button>
    </div>
  );
};

export default GameTypeSelector;
