interface ConflictBannerProps {
  visible: boolean;
  onReload: () => void;
  onIgnore: () => void;
}

export function ConflictBanner({ visible, onReload, onIgnore }: ConflictBannerProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="
      px-4 py-3 
      bg-amber-50 border-b border-amber-200 
      flex items-center justify-between gap-4
    ">
      <div className="flex items-center gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-amber-600 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span className="text-sm font-medium text-amber-800">
          This note was modified in another tab
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onReload}
          className="
            px-3 py-1.5 rounded
            bg-amber-600 hover:bg-amber-700
            text-white text-xs font-medium
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-amber-500
          "
        >
          Reload Changes
        </button>
        <button
          onClick={onIgnore}
          className="
            px-3 py-1.5 rounded
            bg-amber-100 hover:bg-amber-200
            text-amber-800 text-xs font-medium
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-amber-500
          "
        >
          Ignore
        </button>
      </div>
    </div>
  );
}
