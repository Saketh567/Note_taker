import { useState, useCallback } from 'react';
import { Note } from '../../types';
import { AIStatus } from '../../services/llm';
import { SubjectType } from '../../services/insights';
import { Editor, EditorRef } from '../Editor';
import { InsightsPanel } from '../InsightsPanel';
import { SidebarDrawer } from '../navigation/SidebarDrawer';
import { BottomTabBar, MobileTab } from '../navigation/BottomTabBar';

import { LoadingSpinner } from '../LoadingSpinner';
import { WarningBanner } from '../WarningBanner';
import { ConflictBanner } from '../ConflictBanner';
import { InsightErrorBoundary } from '../InsightErrorBoundary';

interface MobileLayoutProps {
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
 * Mobile layout (< 768px)
 * Single column with tab navigation between Editor and Insights
 * Sidebar as slide-out drawer
 */
export function MobileLayout(props: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('editor');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  } = props;

  const handleSelectNoteWithClose = useCallback((id: string) => {
    onSelectNote(id);
    setIsSidebarOpen(false);
    setActiveTab('editor');
  }, [onSelectNote]);

  const handleCreateNoteWithClose = useCallback(() => {
    onCreateNote();
    setIsSidebarOpen(false);
    setActiveTab('editor');
  }, [onCreateNote]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen">
        <LoadingSpinner message="Loading notes..." />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden">
      {/* Mobile Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Open menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h1 className="text-base font-semibold text-gray-800 truncate flex-1 mx-3">
          {activeNote?.title || 'Note Taker AI'}
        </h1>

        <div className="flex items-center gap-1">
          {isSaving && (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {/* Conflict Banner */}
        {conflict?.hasConflict && (
          <div className="absolute top-0 left-0 right-0 z-20">
            <ConflictBanner
              visible={true}
              onReload={onConflictReload}
              onIgnore={onConflictIgnore}
            />
          </div>
        )}

        {/* Large File Warning */}
        {isActiveNoteLarge && (
          <div className="absolute top-0 left-0 right-0 z-10">
            <WarningBanner size={new Blob([activeNote?.content || '']).size} />
          </div>
        )}

        {/* Editor View */}
        {activeTab === 'editor' && (
          <div className="h-full overflow-auto pb-[56px]">
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
        )}

        {/* Insights View */}
        {activeTab === 'insights' && (
          <div className="h-full overflow-auto pb-[56px]">
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
        )}
      </main>

      {/* Bottom Tab Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Floating Action Button for New Note */}
      <button
        onClick={handleCreateNoteWithClose}
        className="
          fixed right-4 bottom-[72px] z-30
          w-14 h-14 rounded-full
          bg-blue-600 text-white
          shadow-lg shadow-blue-600/30
          flex items-center justify-center
          hover:bg-blue-700 active:scale-95
          transition-all duration-150
        "
        aria-label="Create new note"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Sidebar Drawer */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        notes={notes}
        activeNoteId={activeNoteId}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onSelectNote={handleSelectNoteWithClose}
        onCreateNote={handleCreateNoteWithClose}
        onDeleteNote={onDeleteNote}
        onRenameNote={onRenameNote}
        onExport={onExport}
        onImport={onImport}
        searchInputRef={searchInputRef}
      />
    </div>
  );
}
