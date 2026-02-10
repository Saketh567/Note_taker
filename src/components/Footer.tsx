interface FooterProps {
  wordCount: number;
  charCount: number;
}

export function Footer({ wordCount, charCount }: FooterProps) {
  return (
    <div className="
      px-4 py-2 
      bg-white border-t border-gray-200 
      text-xs text-gray-500
      flex items-center justify-between
    ">
      <div className="flex items-center gap-4">
        <span>
          <strong className="text-gray-700">{wordCount}</strong> words
        </span>
        <span>
          <strong className="text-gray-700">{charCount}</strong> characters
        </span>
      </div>
      <div className="text-gray-400">
        Note Taker
      </div>
    </div>
  );
}
