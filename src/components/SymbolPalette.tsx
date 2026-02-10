import { useState, useRef, useEffect, useCallback } from 'react';
import { SYMBOLS, Symbol, SymbolCategory, searchSymbols, getRecentSymbols, addRecentSymbol } from '../data/symbols';

interface SymbolPaletteProps {
  onInsertSymbol: (symbol: string) => void;
  disabled?: boolean;
}

export function SymbolPalette({ onInsertSymbol, disabled = false }: SymbolPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SymbolCategory>('recent');
  const [recentSymbols, setRecentSymbols] = useState<Symbol[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent symbols when opened
  useEffect(() => {
    if (isOpen) {
      setRecentSymbols(getRecentSymbols());
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSymbolClick = useCallback((symbol: Symbol) => {
    onInsertSymbol(symbol.char);
    addRecentSymbol(symbol);
    setIsOpen(false);
    setSearchQuery('');
  }, [onInsertSymbol]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value) {
      setActiveCategory('recent'); // Will show search results
    }
  };

  // Get symbols to display
  const getDisplaySymbols = (): Symbol[] => {
    if (searchQuery) {
      return searchSymbols(searchQuery);
    }
    if (activeCategory === 'recent') {
      return recentSymbols;
    }
    return SYMBOLS[activeCategory] || [];
  };

  const displaySymbols = getDisplaySymbols();

  const categories: { key: SymbolCategory; label: string }[] = [
    { key: 'recent', label: 'Recent' },
    { key: 'math', label: 'Math' },
    { key: 'chemistry', label: 'Chemistry' },
    { key: 'code', label: 'Code' },
    { key: 'language', label: 'Language' },
    { key: 'greek', label: 'Greek' },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium
          transition-colors duration-150
          ${disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
        title="Insert symbol"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Symbols
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Search bar */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search symbols..."
                className="
                  w-full pl-9 pr-3 py-2
                  text-sm text-gray-700
                  bg-gray-50 border border-gray-200 rounded
                  placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                "
                autoFocus
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex overflow-x-auto border-b border-gray-200">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => {
                  setActiveCategory(cat.key);
                  setSearchQuery('');
                }}
                className={`
                  px-3 py-2 text-xs font-medium whitespace-nowrap
                  transition-colors duration-150
                  ${activeCategory === cat.key && !searchQuery
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Symbol grid */}
          <div className="p-3 max-h-64 overflow-y-auto">
            {displaySymbols.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                {searchQuery ? 'No symbols found' : 'No recent symbols'}
              </p>
            ) : (
              <div className="grid grid-cols-6 gap-1">
                {displaySymbols.map((symbol, index) => (
                  <button
                    key={`${symbol.char}-${index}`}
                    onClick={() => handleSymbolClick(symbol)}
                    className="
                      aspect-square flex items-center justify-center
                      text-lg hover:bg-blue-50 hover:text-blue-600
                      rounded transition-colors duration-150
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                    "
                    title={`${symbol.name}${symbol.shortcut ? ` (${symbol.shortcut})` : ''}`}
                  >
                    {symbol.char}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Shortcut hint */}
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            Type <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded font-mono">/</kbd> then shortcut (e.g., <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded font-mono">/int</kbd>)
          </div>
        </div>
      )}
    </div>
  );
}
