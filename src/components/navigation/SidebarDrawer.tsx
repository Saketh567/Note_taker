import { useEffect, useRef } from 'react';
import { Sidebar } from '../Sidebar';
import { Note } from '../../types';
import { useSwipe } from '../../hooks/useSwipe';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  activeNoteId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  onRenameNote: (id: string, newTitle: string) => void;
  onExport: () => void;
  onImport: (fileContent: string, mode: 'merge' | 'replace') => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

/**
 * Mobile slide-out drawer containing the sidebar
 * Swipe left to close, backdrop click to close
 */
export function SidebarDrawer({
  isOpen,
  onClose,
  ...sidebarProps
}: SidebarDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  
  // Swipe left to close
  const swipeCallback = useSwipe<HTMLDivElement>({
    onSwipeLeft: () => {
      if (isOpen) onClose();
    },
    threshold: 50,
  });

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Set swipe ref to drawer element
  useEffect(() => {
    if (drawerRef.current && typeof swipeCallback === 'object' && 'current' in swipeCallback) {
      (swipeCallback as React.MutableRefObject<HTMLDivElement | null>).current = drawerRef.current;
    }
  }, [swipeCallback]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          fixed top-0 left-0 bottom-0 z-50
          w-[85vw] max-w-[320px] min-w-[280px]
          bg-white shadow-xl
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Notes sidebar"
      >
        {/* Swipe handle indicator */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gray-300 rounded-full mr-1" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="
            absolute top-2 right-2 z-10
            p-2 rounded-full
            bg-gray-100 text-gray-600
            hover:bg-gray-200
            min-w-[44px] min-h-[44px]
            flex items-center justify-center
          "
          aria-label="Close sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Sidebar content */}
        <div className="h-full pt-12">
          <Sidebar {...sidebarProps} />
        </div>
      </div>
    </>
  );
}
