import { Note } from '../../types';
import { AIStatus } from '../../services/llm';
import { SubjectType } from '../../services/insights';
import { Sidebar } from '../Sidebar';
import { Editor, EditorRef } from '../Editor';
import { Footer } from '../Footer';
import { LoadingSpinner } from '../LoadingSpinner';
import { WarningBanner } from '../WarningBanner';
import { ConflictBanner } from '../ConflictBanner';
import { AIStatusBar } from '../AIStatusBar';
import { InsightsPanel } from '../InsightsPanel';
import { InsightErrorBoundary } from '../InsightErrorBoundary';

interface DesktopLayoutProps {
  notes: Note[];
  activeNoteId: string | null;
  activeNote: Note | null;
  searchQuery: string;
  aiStatus: AIStatus;
  subjectType: SubjectType;
  conflict: { hasConflict: boolean; externalVersion: number } | null;
  isLoading: boolean;
  isSaving: boolean;
  isActiveNoteLarge: boolean;
  wordCount: number;
  charCount: number;
  searchInputRef: React.RefObject<HTMLInputElement>;
  editorRef: React.RefObject<EditorRef>;
  onSearchChange: (query: string) => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  onRenameNote: (id: string, newTitle: string) => void;
  onUpdateNote: (id: string, content: string) => void;
  onUpdateNoteFull: (note: Note) => void;
  onSubjectChange: (subject: SubjectType) => void;
  onExport: () => void;
  onImport: (fileContent: string, mode: 'merge' | 'replace') => void;
  onConflictReload: () => void;
  onConflictIgnore: () => void;
  onAICheck: () => void;
}

/**
 * Desktop layout (> 1024px)
 * Three-pane layout: Sidebar | Editor | Insights
 */
export function DesktopLayout(props: DesktopLayoutProps) {
  const {
    notes,
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
    onSearchChange,
    onSelectNote,
    onCreateNote,
    onDeleteNote,
    onRenameNote,
    onUpdateNote,
    onUpdateNoteFull,
    onSubjectChange,
    onExport,
    onImport,
    onConflictReload,
    onConflictIgnore,
    onAICheck,
  } = props;

  if (isLoading) {
    return (
      <div className="h-screen w-screen">
        <LoadingSpinner message="Loading notes from IndexedDB..." />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white">
      {/* Left Sidebar */}
      <Sidebar
        notes={notes}
        activeNoteId={activeNoteId}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onSelectNote={onSelectNote}
        onCreateNote={onCreateNote}
        onDeleteNote={onDeleteNote}
        onRenameNote={onRenameNote}
        onExport={onExport}
        onImport={onImport}
        searchInputRef={searchInputRef}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Conflict Banner */}
        <ConflictBanner
          visible={conflict?.hasConflict ?? false}
          onReload={onConflictReload}
          onIgnore={onConflictIgnore}
        />

        {/* Large File Warning */}
        {isActiveNoteLarge && (
          <WarningBanner size={new Blob([activeNote?.content || '']).size} />
        )}

        {/* Saving Indicator */}
        {isSaving && (
          <div className="absolute top-4 right-4 z-50">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Saving...
            </div>
          </div>
        )}

        {/* Editor + Insights Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Panel */}
          <div className="flex-1 flex flex-col min-w-0">
            <Editor
              ref={editorRef}
              note={activeNote}
              aiStatus={aiStatus}
              subjectType={subjectType}
              onSubjectChange={onSubjectChange}
              onUpdate={onUpdateNote}
              onUpdateNote={onUpdateNoteFull}
            />
          </div>

          {/* Insights Panel */}
          <InsightErrorBoundary
            onReset={() => {
              if (activeNote) {
                const clearedNote: Note = {
                  ...activeNote,
                  aiInsights: undefined,
                  updatedAt: Date.now(),
                  version: (activeNote.version || 0) + 1,
                };
                onUpdateNoteFull(clearedNote);
              }
            }}
          >
            <InsightsPanel
              note={activeNote}
              aiStatus={aiStatus}
              subjectType={subjectType}
              onUpdateNote={onUpdateNoteFull}
            />
          </InsightErrorBoundary>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50">
          <Footer wordCount={wordCount} charCount={charCount} />
          <AIStatusBar status={aiStatus} onCheck={onAICheck} />
        </div>
      </div>
    </div>
  );
}
