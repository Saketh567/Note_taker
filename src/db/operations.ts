import { initDB, calculateSize, NoteRecord } from './idb';
import { Note } from '../types';

const STORE_NAME = 'notes';

/**
 * Ensure note has all required fields (backward compatibility)
 */
const normalizeNote = (note: Partial<NoteRecord>): NoteRecord => {
  return {
    ...note,
    tags: note.tags || [],
    version: note.version || 1,
    subjectType: note.subjectType || 'general',
    aiMetadata: note.aiMetadata || undefined,
    aiInsights: note.aiInsights || undefined,
  } as NoteRecord;
};

/**
 * Get all notes from IndexedDB
 * Returns notes sorted by updatedAt descending (most recent first)
 */
export const getAllNotes = async (): Promise<Note[]> => {
  try {
    const db = await initDB();
    const notes = await db.getAll(STORE_NAME);
    // Normalize and sort by updatedAt descending
    return notes
      .map(normalizeNote)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Failed to get all notes from IndexedDB:', error);
    throw error;
  }
};

/**
 * Get a single note by ID
 */
export const getNote = async (id: string): Promise<Note | null> => {
  try {
    const db = await initDB();
    const note = await db.get(STORE_NAME, id);
    if (note) {
      return normalizeNote(note);
    }
    return null;
  } catch (error) {
    console.error(`Failed to get note ${id} from IndexedDB:`, error);
    throw error;
  }
};

/**
 * Save a note to IndexedDB
 * Calculates and stores the size of the content
 * Increments version number
 */
export const saveNote = async (note: Note): Promise<void> => {
  try {
    const db = await initDB();
    const size = calculateSize(note.content);
    // Increment version on every save
    const noteWithVersion: Note = {
      ...note,
      tags: note.tags || [],
      subjectType: note.subjectType || 'general',
      version: (note.version || 0) + 1,
    };
    const noteRecord: NoteRecord = {
      ...noteWithVersion,
      size,
    };
    await db.put(STORE_NAME, noteRecord);
  } catch (error) {
    console.error('Failed to save note to IndexedDB:', error);
    throw error;
  }
};

/**
 * Delete a note from IndexedDB
 */
export const deleteNote = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
  } catch (error) {
    console.error(`Failed to delete note ${id} from IndexedDB:`, error);
    throw error;
  }
};

/**
 * Save multiple notes to IndexedDB (used for import)
 * Ensures version is set for each note
 */
export const saveNotes = async (notes: Note[]): Promise<void> => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const note of notes) {
      const size = calculateSize(note.content);
      // Ensure version and tags are set
      const noteWithDefaults: Note = {
        ...note,
        tags: note.tags || [],
        subjectType: note.subjectType || 'general',
        version: note.version || 1,
      };
      const noteRecord: NoteRecord = {
        ...noteWithDefaults,
        size,
      };
      await store.put(noteRecord);
    }

    await tx.done;
  } catch (error) {
    console.error('Failed to save notes to IndexedDB:', error);
    throw error;
  }
};

/**
 * Clear all notes from IndexedDB (used for replace import)
 */
export const clearAllNotes = async (): Promise<void> => {
  try {
    const db = await initDB();
    await db.clear(STORE_NAME);
  } catch (error) {
    console.error('Failed to clear all notes from IndexedDB:', error);
    throw error;
  }
};
