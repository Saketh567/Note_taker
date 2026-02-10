import { Note } from '../types';

export interface ExportData {
  version: string;
  exportedAt: string;
  notes: Note[];
}

/**
 * Generate filename for export
 * Format: note-taker-backup-YYYY-MM-DD.json
 */
export function generateExportFilename(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `note-taker-backup-${year}-${month}-${day}.json`;
}

/**
 * Export notes to JSON file and trigger download
 */
export function exportNotes(notes: Note[]): void {
  const exportData: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    notes: notes,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = generateExportFilename();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
