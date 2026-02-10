import { useState, useEffect, useRef, useCallback } from 'react';
import { Note } from '../types';
import { NoteItem } from './NoteItem';
import { ImportMode } from '../utils/import';

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  onRenameNote: (id: string, newTitle: string) => void;
  onExport: () => void;
  onImport: (fileContent: string, mode: ImportMode) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

export function Sidebar({
  notes,
  activeNoteId,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onRenameNote,
  onExport,
  onImport,
  searchInputRef,
}: SidebarProps) {
  // Local state for input (debounced)
  const [inputValue, setInputValue] = useState(searchQuery);
  const debounceTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [showImportOptions, setShowImportOptions] = useState(false);

  // Sync input value when searchQuery changes externally (e.g., Escape to clear)
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Debounced search update (200ms)
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear existing timer
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = window.setTimeout(() => {
      onSearchChange(newValue);
    }, 200);
  }, [onSearchChange]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle export click
  const handleExport = () => {
    onExport();
  };

  // Handle import click - show file picker
  const handleImportClick = () => {
    setShowImportOptions(true);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onImport(content, importMode);
      // Reset file input
      e.target.value = '';
      setShowImportOptions(false);
    };
    reader.onerror = () => {
      alert('Failed to read file');
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Proceed with import after selecting mode
  const proceedWithImport = () => {
    fileInputRef.current?.click();
  };

  // Cancel import
  const cancelImport = () => {
    setShowImportOptions(false);
  };

  // Sort notes by updatedAt descending (most recent first)
  const sortedNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

  const hasNotes = notes.length > 0;
  const isSearching = searchQuery.trim().length > 0;
  const showEmptyState = !hasNotes && !isSearching;
  const showNoMatches = hasNotes && notes.length === 0 && isSearching;

  return (
    <div className="w-80 h-full flex flex-col bg-gray-100 border-r border-gray-200">
      {/* Header with Search and New Note button */}
      <div className="p-4 bg-white border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Notes</h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {sortedNotes.length}
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Search notes..."
            className="
              w-full pl-9 pr-8 py-2
              text-sm text-gray-700
              bg-gray-50 border border-gray-200 rounded-lg
              placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-shadow duration-150
            "
          />
          {inputValue && (
            <button
              onClick={() => {
                setInputValue('');
                onSearchChange('');
                searchInputRef.current?.focus();
              }}
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                p-0.5 rounded
                text-gray-400 hover:text-gray-600 hover:bg-gray-200
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
              aria-label="Clear search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <button
          onClick={onCreateNote}
          className="
            w-full flex items-center justify-center gap-2
            px-4 py-2.5 rounded-lg
            bg-blue-600 hover:bg-blue-700
            text-white font-medium
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Note
        </button>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto">
        {showEmptyState ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm">No notes yet</p>
            <p className="text-xs mt-1">Create your first note</p>
          </div>
        ) : showNoMatches ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-sm">No matches found</p>
            <p className="text-xs mt-1">Try a different search</p>
          </div>
        ) : sortedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-sm">No notes</p>
          </div>
        ) : (
          sortedNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              isActive={note.id === activeNoteId}
              onSelect={onSelectNote}
              onDelete={onDeleteNote}
              onRename={onRenameNote}
            />
          ))
        )}
      </div>

      {/* Footer with Export/Import */}
      <div className="p-3 bg-white border-t border-gray-200">
        {showImportOptions ? (
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-700">Import mode:</p>
            <div className="flex gap-2">
              <button
                onClick={() => setImportMode('merge')}
                className={`
                  flex-1 px-3 py-2 text-xs font-medium rounded
                  transition-colors duration-150
                  ${importMode === 'merge'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }
                `}
              >
                Merge
              </button>
              <button
                onClick={() => setImportMode('replace')}
                className={`
                  flex-1 px-3 py-2 text-xs font-medium rounded
                  transition-colors duration-150
                  ${importMode === 'replace'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }
                `}
              >
                Replace
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={proceedWithImport}
                className="
                  flex-1 px-3 py-2 text-xs font-medium rounded
                  bg-blue-600 hover:bg-blue-700 text-white
                  transition-colors duration-150
                "
              >
                Choose File
              </button>
              <button
                onClick={cancelImport}
                className="
                  px-3 py-2 text-xs font-medium rounded
                  bg-gray-100 hover:bg-gray-200 text-gray-700
                  transition-colors duration-150
                "
              >
                Cancel
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="
                flex-1 flex items-center justify-center gap-1.5
                px-3 py-2 rounded
                bg-gray-100 hover:bg-gray-200
                text-gray-700 text-xs font-medium
                transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-gray-400
              "
              title="Export all notes to JSON"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export
            </button>
            <button
              onClick={handleImportClick}
              className="
                flex-1 flex items-center justify-center gap-1.5
                px-3 py-2 rounded
                bg-gray-100 hover:bg-gray-200
                text-gray-700 text-xs font-medium
                transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-gray-400
              "
              title="Import notes from JSON file"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Import
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
