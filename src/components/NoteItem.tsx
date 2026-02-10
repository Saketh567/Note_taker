import { useState, useRef, useEffect } from 'react';
import { Note } from '../types';

interface NoteItemProps {
  note: Note;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}

export function NoteItem({ note, isActive, onSelect, onDelete, onRename }: NoteItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(note.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync edit value when note title changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(note.title);
    }
  }, [note.title, isEditing]);

  // Auto-focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      onDelete(note.id);
    }
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(note.title);
  };

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed.length > 0) {
      onRename(note.id, trimmed);
    }
    // If empty, revert to original title
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(note.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      onClick={() => onSelect(note.id)}
      className={`
        group relative p-4 cursor-pointer border-b border-gray-200
        transition-colors duration-150
        ${isActive 
          ? 'bg-blue-50 border-l-4 border-l-blue-500' 
          : 'bg-white border-l-4 border-l-transparent hover:bg-gray-50'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-8">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onClick={(e) => e.stopPropagation()}
              className="
                w-full text-sm font-semibold text-gray-900
                bg-white border border-blue-500 rounded px-1.5 py-0.5
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            />
          ) : (
            <h3 
              onClick={handleTitleClick}
              className="
                text-sm font-semibold text-gray-900 truncate
                hover:text-blue-600 hover:underline
                cursor-text
              "
              title="Click to rename"
            >
              {note.title || 'Untitled Note'}
            </h3>
          )}
          <p className="text-xs text-gray-500 mt-1 truncate">
            {note.content || 'No content'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {formatDate(note.updatedAt)}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="
            absolute top-3 right-3
            opacity-0 group-hover:opacity-100
            transition-opacity duration-150
            p-1.5 rounded
            text-gray-400 hover:text-red-600 hover:bg-red-50
            focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500
          "
          aria-label="Delete note"
          title="Delete note"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
