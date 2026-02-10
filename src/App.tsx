import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Note } from './types';
import { exportNotes } from './utils/export';
import { importNotes, ImportMode } from './utils/import';
import { 
  getAllNotes, 
  saveNote, 
  deleteNote, 
  saveNotes, 
  clearAllNotes,
  getNote
} from './db/operations';
import { isLargeFile } from './db/idb';
import { postMessage, onMessage } from './utils/sync';
import { checkConnection, AIStatus } from './services/llm';
import { SubjectType, detectSubjectType } from './services/insights';
import { useViewport } from './hooks/useViewport';
import { MobileLayout } from './components/layout/MobileLayout';
import { DesktopLayout } from './components/layout/DesktopLayout';
import { EditorRef } from './components/Editor';

// Generate a unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Extract title from content
const extractTitle = (content: string): string => {
  const firstLine = content.split('\n')[0].trim();
  if (firstLine) {
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
  }
  return '';
};

// Count words
const countWords = (text: string): number => {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

// Count characters
const countChars = (text: string): number => {
  return text.length;
};

// Conflict state type
interface ConflictState {
  hasConflict: boolean;
  externalVersion: number;
}

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatus>('checking');
  const [subjectType, setSubjectType] = useState<SubjectType>('general');
  
  // Refs
  const saveTimerRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<EditorRef>(null);

  // Viewport detection for responsive layout
  const { isMobile } = useViewport();

  // Load notes from IndexedDB on mount
  useEffect(() => {
    const loadNotes = async () => {
      setIsLoading(true);
      try {
        const loadedNotes = await getAllNotes();
        setNotes(loadedNotes);
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, []);

  // Check AI connection on mount
  useEffect(() => {
    const checkAIConnection = async () => {
      setAiStatus('checking');
      const isConnected = await checkConnection();
      setAiStatus(isConnected ? 'connected' : 'offline');
    };

    checkAIConnection();
  }, []);

  // Subscribe to multi-tab sync messages
  useEffect(() => {
    const unsubscribe = onMessage(async (message) => {
      if (message.noteId === activeNoteId) {
        const localNote = notes.find((n) => n.id === message.noteId);
        if (localNote && message.version > localNote.version) {
          setConflict({
            hasConflict: true,
            externalVersion: message.version,
          });
        }
      }
    });

    return unsubscribe;
  }, [activeNoteId, notes]);

  // Update subject type when note changes
  useEffect(() => {
    const activeNote = notes.find(n => n.id === activeNoteId);
    if (activeNote) {
      if (activeNote.subjectType && activeNote.subjectType !== 'general') {
        setSubjectType(activeNote.subjectType);
      } else if (activeNote.content) {
        setSubjectType(detectSubjectType(activeNote.content));
      }
    }
  }, [activeNoteId, notes]);

  // Debounced save to IndexedDB (300ms)
  const debouncedSave = useCallback(async (noteToSave: Note) => {
    setIsSaving(true);
    try {
      await saveNote(noteToSave);
      postMessage(noteToSave.id, noteToSave.version);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Schedule debounced save
  useEffect(() => {
    if (isLoading) return;
    
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    
    const mostRecentNote = notes[0];
    if (mostRecentNote) {
      saveTimerRef.current = window.setTimeout(() => {
        debouncedSave(mostRecentNote);
      }, 300);
    }

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [notes, isLoading, debouncedSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) {
      return notes;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return notes.filter((note) => 
      note.title.toLowerCase().includes(query) || 
      note.content.toLowerCase().includes(query) ||
      note.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [notes, searchQuery]);

  // Calculate stats for active note
  const wordCount = useMemo(() => {
    if (!activeNoteId) return 0;
    const note = notes.find((n) => n.id === activeNoteId);
    return note ? countWords(note.content) : 0;
  }, [notes, activeNoteId]);

  const charCount = useMemo(() => {
    if (!activeNoteId) return 0;
    const note = notes.find((n) => n.id === activeNoteId);
    return note ? countChars(note.content) : 0;
  }, [notes, activeNoteId]);

  const isActiveNoteLarge = useMemo(() => {
    if (!activeNoteId) return false;
    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return false;
    const size = new Blob([note.content]).size;
    return isLargeFile(size);
  }, [notes, activeNoteId]);

  // Create a new note
  const handleCreateNote = useCallback(async () => {
    const newNote: Note = {
      id: generateId(),
      title: '',
      content: '',
      updatedAt: Date.now(),
      version: 1,
      tags: [],
      subjectType: 'general',
    };
    
    try {
      await saveNote(newNote);
      setNotes((prevNotes) => [newNote, ...prevNotes]);
      setActiveNoteId(newNote.id);
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('Failed to create note. Please try again.');
    }
  }, []);

  // Select a note
  const handleSelectNote = useCallback((id: string) => {
    setActiveNoteId(id);
    setConflict(null);
  }, []);

  // Delete a note
  const handleDeleteNote = useCallback(async (id: string) => {
    try {
      await deleteNote(id);
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
      
      if (activeNoteId === id) {
        setActiveNoteId(null);
        setConflict(null);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note. Please try again.');
    }
  }, [activeNoteId]);

  // Update note content
  const handleUpdateNote = useCallback((id: string, content: string) => {
    setNotes((prevNotes) => {
      const noteIndex = prevNotes.findIndex((n) => n.id === id);
      if (noteIndex === -1) return prevNotes;

      const updatedNote: Note = {
        ...prevNotes[noteIndex],
        content,
        title: extractTitle(content),
        updatedAt: Date.now(),
        version: (prevNotes[noteIndex].version || 0) + 1,
      };

      const newNotes = [...prevNotes];
      newNotes.splice(noteIndex, 1);
      newNotes.unshift(updatedNote);

      return newNotes;
    });
  }, []);

  // Update full note (for AI features, tags, etc.)
  const handleUpdateNoteFull = useCallback(async (updatedNote: Note) => {
    setNotes((prevNotes) => {
      const noteIndex = prevNotes.findIndex((n) => n.id === updatedNote.id);
      if (noteIndex === -1) return prevNotes;

      const newNotes = [...prevNotes];
      newNotes[noteIndex] = updatedNote;

      saveNote(updatedNote)
        .then(() => {
          postMessage(updatedNote.id, updatedNote.version);
        })
        .catch((error) => {
          console.error('Failed to update note:', error);
        });

      return newNotes;
    });
  }, []);

  // Handle subject type change
  const handleSubjectChange = useCallback((subject: SubjectType) => {
    setSubjectType(subject);
    
    if (activeNoteId) {
      const activeNote = notes.find(n => n.id === activeNoteId);
      if (activeNote && activeNote.subjectType !== subject) {
        const updatedNote: Note = {
          ...activeNote,
          subjectType: subject,
          updatedAt: Date.now(),
          version: (activeNote.version || 0) + 1,
        };
        handleUpdateNoteFull(updatedNote);
      }
    }
  }, [activeNoteId, notes, handleUpdateNoteFull]);

  // Rename note
  const handleRenameNote = useCallback(async (id: string, newTitle: string) => {
    setNotes((prevNotes) => {
      const noteIndex = prevNotes.findIndex((n) => n.id === id);
      if (noteIndex === -1) return prevNotes;

      const updatedNote: Note = {
        ...prevNotes[noteIndex],
        title: newTitle,
        updatedAt: Date.now(),
        version: (prevNotes[noteIndex].version || 0) + 1,
      };

      const newNotes = [...prevNotes];
      newNotes[noteIndex] = updatedNote;

      saveNote(updatedNote)
        .then(() => {
          postMessage(updatedNote.id, updatedNote.version);
        })
        .catch((error) => {
          console.error('Failed to rename note:', error);
        });

      return newNotes;
    });
  }, []);

  // Handle conflict reload
  const handleConflictReload = useCallback(async () => {
    if (!activeNoteId || !conflict) return;

    try {
      const latestNote = await getNote(activeNoteId);
      if (latestNote) {
        setNotes((prevNotes) =>
          prevNotes.map((n) => (n.id === activeNoteId ? latestNote : n))
        );
      }
    } catch (error) {
      console.error('Failed to reload note:', error);
      alert('Failed to reload changes. Please try again.');
    }
    setConflict(null);
  }, [activeNoteId, conflict]);

  // Handle conflict ignore
  const handleConflictIgnore = useCallback(() => {
    setConflict(null);
  }, []);

  // Handle AI status check retry
  const handleAICheck = useCallback(async () => {
    setAiStatus('checking');
    const isConnected = await checkConnection();
    setAiStatus(isConnected ? 'connected' : 'offline');
  }, []);

  // Export notes
  const handleExport = useCallback(() => {
    exportNotes(notes);
  }, [notes]);

  // Import notes
  const handleImport = useCallback(async (fileContent: string, mode: ImportMode) => {
    const result = importNotes(fileContent, notes, mode);
    
    if (result.success) {
      const importedData = JSON.parse(fileContent);
      let newNotes: Note[];
      
      if (mode === 'replace') {
        newNotes = [...importedData.notes];
        await clearAllNotes();
      } else {
        const currentNotesMap = new Map(notes.map((n) => [n.id, n]));
        importedData.notes.forEach((importedNote: Note) => {
          currentNotesMap.set(importedNote.id, importedNote);
        });
        newNotes = Array.from(currentNotesMap.values());
      }
      
      newNotes.sort((a, b) => b.updatedAt - a.updatedAt);
      await saveNotes(newNotes);
      setNotes(newNotes);
      
      alert(result.message);
    } else {
      alert(`Import failed: ${result.message}`);
    }
  }, [notes]);

  // Get active note
  const activeNote = activeNoteId 
    ? notes.find((n) => n.id === activeNoteId) || null
    : null;

  // Common props for all layouts
  const layoutProps = {
    notes: filteredNotes,
    activeNoteId,
    activeNote,
    searchQuery,
    aiStatus,
    subjectType,
    conflict,
    isLoading,
    isSaving,
    isActiveNoteLarge,
    wordCount,
    charCount,
    searchInputRef,
    editorRef,
    onSearchChange: setSearchQuery,
    onSelectNote: handleSelectNote,
    onCreateNote: handleCreateNote,
    onDeleteNote: handleDeleteNote,
    onRenameNote: handleRenameNote,
    onUpdateNote: handleUpdateNote,
    onUpdateNoteFull: handleUpdateNoteFull,
    onSubjectChange: handleSubjectChange,
    onExport: handleExport,
    onImport: handleImport,
    onConflictReload: handleConflictReload,
    onConflictIgnore: handleConflictIgnore,
    onAICheck: handleAICheck,
  };

  // Render appropriate layout based on viewport
  if (isMobile) {
    return <MobileLayout {...layoutProps} />;
  }

  // Use DesktopLayout for both tablet and desktop (responsive within component)
  return <DesktopLayout {...layoutProps} />;
}

export default App;
