import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Note } from '../types';
import { AIStatus } from '../services/llm';
import { SymbolPalette } from './SymbolPalette';
import { GrammarChecker } from './GrammarChecker';
import type { WorkerRequest, WorkerResponse } from '../workers/llm.worker';
import { SubjectType } from '../services/insights';

export interface EditorRef {
  insertSymbol: (symbol: string) => void;
  getContent: () => string;
  setContent: (content: string) => void;
}

interface EditorProps {
  note: Note | null;
  aiStatus: AIStatus;
  subjectType: SubjectType;
  onSubjectChange: (subject: SubjectType) => void;
  onUpdate: (id: string, content: string) => void;
  onUpdateNote: (note: Note) => void;
}

export const Editor = forwardRef<EditorRef, EditorProps>(function Editor(
  { note, aiStatus, subjectType, onSubjectChange, onUpdate, onUpdateNote },
  ref
) {
  // CRITICAL: Uncontrolled textarea using ref + defaultValue pattern
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Store the current note ID to detect note switches
  const currentNoteIdRef = useRef<string | null>(null);
  
  // Ghost text state for AI continuation
  const [ghostText, setGhostText] = useState('');
  const [isGeneratingContinuation, setIsGeneratingContinuation] = useState(false);
  
  // Worker ref for AI operations
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestsRef = useRef<Map<string, (response: WorkerResponse) => void>>(new Map());

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    insertSymbol: (symbol: string) => {
      insertAtCursor(symbol);
    },
    getContent: () => textareaRef.current?.value || '',
    setContent: (content: string) => {
      if (textareaRef.current) {
        textareaRef.current.value = content;
        handleInput();
      }
    },
  }));

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/llm.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      
      // Handle streaming chunks for ghost text
      if (response.chunk && response.type === 'CONTINUE') {
        setGhostText(prev => prev + response.chunk);
        return;
      }
      
      // Handle final response
      const resolver = pendingRequestsRef.current.get(response.id);
      if (resolver) {
        resolver(response);
        pendingRequestsRef.current.delete(response.id);
      }
    });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const sendWorkerMessage = useCallback((request: WorkerRequest): Promise<WorkerResponse> => {
    return new Promise((resolve) => {
      pendingRequestsRef.current.set(request.id, resolve);
      workerRef.current?.postMessage(request);
    });
  }, []);

  // When the note changes, update the textarea value
  useEffect(() => {
    if (textareaRef.current && note) {
      if (currentNoteIdRef.current !== note.id) {
        textareaRef.current.value = note.content;
        currentNoteIdRef.current = note.id;
        setGhostText('');
        
        textareaRef.current.focus();
      }
    }
    
    if (!note && textareaRef.current) {
      textareaRef.current.value = '';
      currentNoteIdRef.current = null;
      setGhostText('');
    }
  }, [note?.id]);

  // Insert symbol at cursor position
  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea || !note) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    
    textarea.value = newValue;
    textarea.setSelectionRange(start + text.length, start + text.length);
    textarea.focus();
    
    handleInput();
  };

  // Handle input changes
  const handleInput = () => {
    if (note && textareaRef.current) {
      if (ghostText) {
        setGhostText('');
      }
      onUpdate(note.id, textareaRef.current.value);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && ghostText) {
      e.preventDefault();
      acceptGhostText();
      return;
    }

    if (e.key === 'Escape' && ghostText) {
      e.preventDefault();
      setGhostText('');
      return;
    }

    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      await generateContinuation();
      return;
    }
  };

  // Generate AI continuation
  const generateContinuation = async () => {
    if (!note || aiStatus !== 'connected' || !textareaRef.current) return;
    
    const content = textareaRef.current.value;
    if (!content.trim()) return;

    setIsGeneratingContinuation(true);
    setGhostText('');

    try {
      const cursorPosition = textareaRef.current.selectionStart;
      
      const request: WorkerRequest = {
        id: `continue-${Date.now()}`,
        type: 'CONTINUE',
        payload: { 
          content,
          cursorPosition,
        },
      };

      const response = await sendWorkerMessage(request);
      
      if (!response.success) {
        setGhostText('');
      }
    } catch (err) {
      console.error('Failed to generate continuation:', err);
      setGhostText('');
    } finally {
      setIsGeneratingContinuation(false);
    }
  };

  // Accept ghost text
  const acceptGhostText = () => {
    if (!note || !textareaRef.current || !ghostText) return;

    const currentContent = textareaRef.current.value;
    const cursorPosition = textareaRef.current.selectionStart;
    
    const newContent = 
      currentContent.substring(0, cursorPosition) + 
      ghostText + 
      currentContent.substring(cursorPosition);
    
    textareaRef.current.value = newContent;
    
    const newCursorPosition = cursorPosition + ghostText.length;
    textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    
    setGhostText('');
    
    onUpdate(note.id, newContent);
    
    textareaRef.current.focus();
  };

  // Handle adding a tag
  const handleAddTag = (tag: string) => {
    if (!note) return;
    
    const updatedNote: Note = {
      ...note,
      tags: [...(note.tags || []), tag],
    };
    onUpdateNote(updatedNote);
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    if (!note) return;
    
    const updatedNote: Note = {
      ...note,
      tags: note.tags?.filter(tag => tag !== tagToRemove) || [],
    };
    onUpdateNote(updatedNote);
  };

  // Handle grammar correction
  const handleGrammarCorrection = (_original: string, corrected: string) => {
    if (!note || !textareaRef.current) return;
    
    textareaRef.current.value = corrected;
    onUpdate(note.id, corrected);
    textareaRef.current.focus();
  };

  // Subject type options
  const subjectOptions: { value: SubjectType; label: string }[] = [
    { value: 'general', label: 'General' },
    { value: 'math', label: 'Math' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'code', label: 'Code' },
    { value: 'language', label: 'Language' },
  ];

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <p className="text-lg font-medium">Select a note to start editing</p>
          <p className="text-sm mt-1">or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white min-w-0">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center gap-3 flex-wrap">
        {/* Symbol Palette */}
        <SymbolPalette 
          onInsertSymbol={insertAtCursor} 
          disabled={aiStatus === 'checking'} 
        />

        {/* Subject Selector */}
        <select
          value={subjectType}
          onChange={(e) => onSubjectChange(e.target.value as SubjectType)}
          className="
            px-3 py-1.5 rounded text-sm font-medium
            bg-white border border-gray-300 text-gray-700
            focus:outline-none focus:ring-2 focus:ring-blue-500
            cursor-pointer
          "
        >
          {subjectOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Grammar Checker */}
        <GrammarChecker
          content={note.content}
          aiStatus={aiStatus}
          onApplyCorrection={handleGrammarCorrection}
        />

        {/* Keyboard shortcuts hint */}
        <div className="ml-auto text-xs text-gray-400 flex items-center gap-2">
          <span className="hidden sm:inline">
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-mono">Ctrl+Enter</kbd> continue
          </span>
        </div>
      </div>

      {/* Editor header */}
      <div className="px-6 py-3 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">
          {note.title || 'Untitled Note'}
        </h1>
        
        {/* Tags display */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {note.tags && note.tags.map((tag) => (
            <span
              key={tag}
              className="
                inline-flex items-center gap-1 px-2 py-0.5
                bg-blue-50 text-blue-700 text-xs
                rounded-full border border-blue-200
              "
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-blue-900 focus:outline-none"
                aria-label={`Remove tag ${tag}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          
          <QuickAddTag onAdd={handleAddTag} />
        </div>
        
        <p className="text-xs text-gray-400 mt-2">
          Last edited: {new Date(note.updatedAt).toLocaleString()}
        </p>
      </div>

      {/* Editor container */}
      <div className="flex-1 relative overflow-hidden">
        <textarea
          ref={textareaRef}
          defaultValue={note.content}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Start typing your note here..."
          className="
            absolute inset-0 w-full h-full px-6 py-4
            resize-none outline-none
            text-gray-700 leading-relaxed
            placeholder:text-gray-400
            font-mono text-sm
            bg-transparent z-10
          "
          spellCheck={false}
        />
        
        {/* Ghost text overlay */}
        {ghostText && (
          <GhostTextOverlay 
            text={ghostText}
            onAccept={acceptGhostText}
            onReject={() => setGhostText('')}
          />
        )}
        
        {/* Loading indicator */}
        {isGeneratingContinuation && !ghostText && (
          <div className="absolute bottom-4 right-6 z-20">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              Generating...
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// Quick add tag component
function QuickAddTag({ onAdd }: { onAdd: (tag: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
    }
    setValue('');
    setIsEditing(false);
  };

  const handleBlur = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
    }
    setValue('');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="inline-flex">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsEditing(false);
              setValue('');
            }
          }}
          placeholder="Add tag..."
          className="
            px-2 py-0.5 text-xs
            border border-gray-300 rounded-full
            focus:outline-none focus:ring-2 focus:ring-blue-500
            w-20
          "
        />
      </form>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="
        inline-flex items-center gap-1 px-2 py-0.5
        text-gray-400 text-xs
        hover:text-gray-600 hover:bg-gray-100
        rounded-full transition-colors duration-150
      "
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Add tag
    </button>
  );
}

// Ghost text overlay
interface GhostTextOverlayProps {
  text: string;
  onAccept: () => void;
  onReject: () => void;
}

function GhostTextOverlay({ text, onAccept, onReject }: GhostTextOverlayProps) {
  return (
    <div className="absolute bottom-4 left-6 right-6 z-20">
      <div className="
        bg-gray-900/90 backdrop-blur-sm text-white
        px-4 py-3 rounded-lg shadow-lg
        max-w-2xl
      ">
        <p className="text-sm text-gray-300 italic mb-2">
          {text}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono">Tab</kbd>
              accept
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono">Esc</kbd>
              reject
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAccept}
              className="
                px-3 py-1 text-xs font-medium rounded
                bg-purple-600 hover:bg-purple-700 text-white
                transition-colors duration-150
              "
            >
              Accept
            </button>
            <button
              onClick={onReject}
              className="
                px-3 py-1 text-xs font-medium rounded
                bg-gray-700 hover:bg-gray-600 text-gray-300
                transition-colors duration-150
              "
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
