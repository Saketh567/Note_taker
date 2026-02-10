import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Note } from '../types';

const DB_NAME = 'note-taker-v4';
const DB_VERSION = 2; // Increment version for schema update
const STORE_NAME = 'notes';

// Extended Note type with size field for IndexedDB
export interface NoteRecord extends Note {
  size: number;
}

interface NoteTakerDB extends DBSchema {
  notes: {
    key: string;
    value: NoteRecord;
    indexes: {
      'by-updatedAt': number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<NoteTakerDB>> | null = null;

/**
 * Initialize the IndexedDB database
 */
export const initDB = (): Promise<IDBPDatabase<NoteTakerDB>> => {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = openDB<NoteTakerDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        // Create the notes store with id as keyPath
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        // Create index for sorting by updatedAt
        store.createIndex('by-updatedAt', 'updatedAt', { unique: false });
      }
      // Version 2 adds 'version' field to Note type, no schema change needed (IndexedDB is schemaless)
    },
  });

  return dbPromise;
};

/**
 * Calculate size of note content in bytes
 */
export const calculateSize = (content: string): number => {
  return new Blob([content]).size;
};

/**
 * Check if note exceeds warning threshold (10MB)
 */
export const isLargeFile = (size: number): boolean => {
  const TEN_MB = 10 * 1024 * 1024;
  return size > TEN_MB;
};
