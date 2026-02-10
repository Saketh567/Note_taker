import { Note } from '../types';
import { ExportData } from './export';

export type ImportMode = 'merge' | 'replace';

export interface ImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  newCount: number;
  updatedCount: number;
}

export interface ImportError {
  success: false;
  message: string;
}

/**
 * Validate import data structure
 */
function validateImportData(data: unknown): data is ExportData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const exportData = data as Record<string, unknown>;

  // Check version
  if (typeof exportData.version !== 'string') {
    return false;
  }

  // Check exportedAt
  if (typeof exportData.exportedAt !== 'string') {
    return false;
  }

  // Check notes array
  if (!Array.isArray(exportData.notes)) {
    return false;
  }

  // Validate each note
  return exportData.notes.every((note: unknown) => {
    if (typeof note !== 'object' || note === null) {
      return false;
    }
    const n = note as Record<string, unknown>;
    return (
      typeof n.id === 'string' &&
      typeof n.title === 'string' &&
      typeof n.content === 'string' &&
      typeof n.updatedAt === 'number'
    );
  });
}

/**
 * Import notes from file content
 * @param fileContent - JSON string from file
 * @param currentNotes - Current notes in state
 * @param mode - 'merge' or 'replace'
 * @returns ImportResult with counts and message
 */
export function importNotes(
  fileContent: string,
  currentNotes: Note[],
  mode: ImportMode
): ImportResult | ImportError {
  try {
    const parsed = JSON.parse(fileContent);

    if (!validateImportData(parsed)) {
      return {
        success: false,
        message: 'Invalid file format. Expected valid JSON with notes array.',
      };
    }

    const importedNotes = parsed.notes;
    let newNotes: Note[];
    let newCount = 0;
    let updatedCount = 0;

    if (mode === 'replace') {
      // Replace: clear all and set to imported
      newNotes = [...importedNotes];
      newCount = importedNotes.length;
    } else {
      // Merge: add new notes, overwrite existing IDs
      const currentNotesMap = new Map(currentNotes.map((n) => [n.id, n]));

      importedNotes.forEach((importedNote: Note) => {
        if (currentNotesMap.has(importedNote.id)) {
          updatedCount++;
        } else {
          newCount++;
        }
        currentNotesMap.set(importedNote.id, importedNote);
      });

      newNotes = Array.from(currentNotesMap.values());
    }

    // Sort by updatedAt descending
    newNotes.sort((a, b) => b.updatedAt - a.updatedAt);

    const totalCount = newCount + updatedCount;
    const message =
      mode === 'replace'
        ? `Imported ${totalCount} notes (replaced all)`
        : `Imported ${totalCount} notes (${newCount} new, ${updatedCount} updated)`;

    return {
      success: true,
      message,
      importedCount: totalCount,
      newCount,
      updatedCount,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
