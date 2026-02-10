import { useState, useCallback, useRef, useEffect } from 'react';
import { Note } from '../types';
import { AIStatus } from '../services/llm';
import type { WorkerRequest, WorkerResponse } from '../workers/llm.worker';

interface AISidebarProps {
  note: Note | null;
  aiStatus: AIStatus;
  onUpdateNote: (note: Note) => void;
}

export function AISidebar({ note, aiStatus, onUpdateNote }: AISidebarProps) {
  const [summary, setSummary] = useState(note?.aiMetadata?.summary || '');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestsRef = useRef<Map<string, (response: WorkerResponse) => void>>(new Map());

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/llm.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      
      // Handle streaming chunks
      if (response.chunk) {
        setSummary(prev => prev + response.chunk);
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

  // Update summary when note changes
  useEffect(() => {
    setSummary(note?.aiMetadata?.summary || '');
    setSuggestedTags([]);
    setError(null);
  }, [note?.id]);

  const sendWorkerMessage = useCallback((request: WorkerRequest): Promise<WorkerResponse> => {
    return new Promise((resolve) => {
      pendingRequestsRef.current.set(request.id, resolve);
      workerRef.current?.postMessage(request);
    });
  }, []);

  const handleGenerateSummary = useCallback(async () => {
    if (!note || aiStatus !== 'connected') return;
    
    setIsGeneratingSummary(true);
    setError(null);
    setSummary(''); // Clear previous summary for streaming

    try {
      const request: WorkerRequest = {
        id: `summary-${Date.now()}`,
        type: 'SUMMARIZE',
        payload: { content: note.content },
      };

      const response = await sendWorkerMessage(request);
      
      if (response.success && typeof response.data === 'string') {
        // Update note with summary metadata
        const updatedNote: Note = {
          ...note,
          aiMetadata: {
            summary: response.data,
            lastAnalyzed: Date.now(),
          },
        };
        onUpdateNote(updatedNote);
      } else if (response.error) {
        setError(response.error);
        setSummary(note.aiMetadata?.summary || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
      setSummary(note.aiMetadata?.summary || '');
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [note, aiStatus, onUpdateNote, sendWorkerMessage]);

  const handleSuggestTags = useCallback(async () => {
    if (!note || aiStatus !== 'connected') return;
    
    setIsGeneratingTags(true);
    setError(null);

    try {
      const request: WorkerRequest = {
        id: `tags-${Date.now()}`,
        type: 'TAGS',
        payload: { content: note.content },
      };

      const response = await sendWorkerMessage(request);
      
      if (response.success && Array.isArray(response.data)) {
        setSuggestedTags(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suggest tags');
    } finally {
      setIsGeneratingTags(false);
    }
  }, [note, aiStatus, sendWorkerMessage]);

  const handleAddTag = useCallback((tag: string) => {
    if (!note) return;
    
    const updatedNote: Note = {
      ...note,
      tags: [...(note.tags || []), tag],
    };
    onUpdateNote(updatedNote);
    
    // Remove from suggested tags
    setSuggestedTags(prev => prev.filter(t => t !== tag));
  }, [note, onUpdateNote]);

  const isOffline = aiStatus === 'offline';
  const hasContent = note && note.content.trim().length > 0;

  return (
    <div className="w-72 h-full flex flex-col bg-gray-50 border-l border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          AI Features
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Summary Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Summary</h4>
            <button
              onClick={handleGenerateSummary}
              disabled={isOffline || !hasContent || isGeneratingSummary}
              className={`
                px-2 py-1 text-xs rounded
                transition-colors duration-150
                ${isOffline || !hasContent
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }
              `}
              title={isOffline ? 'Start Ollama to use AI features' : !hasContent ? 'Add content to summarize' : ''}
            >
              {isGeneratingSummary ? 'Generating...' : 'Generate'}
            </button>
          </div>
          
          {isGeneratingSummary && !summary && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              Analyzing content...
            </div>
          )}
          
          {summary && (
            <p className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200">
              {summary}
            </p>
          )}
          
          {!summary && !isGeneratingSummary && (
            <p className="text-xs text-gray-400 italic">
              {isOffline ? 'Connect to Ollama to generate summaries' : 'Click Generate to create a summary'}
            </p>
          )}
        </div>

        {/* Tags Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Suggested Tags</h4>
            <button
              onClick={handleSuggestTags}
              disabled={isOffline || !hasContent || isGeneratingTags}
              className={`
                px-2 py-1 text-xs rounded
                transition-colors duration-150
                ${isOffline || !hasContent
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }
              `}
              title={isOffline ? 'Start Ollama to use AI features' : !hasContent ? 'Add content to suggest tags' : ''}
            >
              {isGeneratingTags ? 'Suggesting...' : 'Suggest'}
            </button>
          </div>

          {isGeneratingTags && suggestedTags.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              Analyzing content...
            </div>
          )}

          {suggestedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleAddTag(tag)}
                  className="
                    inline-flex items-center gap-1 px-2 py-1
                    bg-purple-50 text-purple-700 text-xs
                    rounded-full border border-purple-200
                    hover:bg-purple-100 transition-colors duration-150
                  "
                  title="Click to add tag"
                >
                  {tag}
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
                </button>
              ))}
            </div>
          )}

          {suggestedTags.length === 0 && !isGeneratingTags && (
            <p className="text-xs text-gray-400 italic">
              {isOffline ? 'Connect to Ollama to suggest tags' : 'Click Suggest to get AI-recommended tags'}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Keyboard shortcut hint */}
      <div className="p-3 border-t border-gray-200 bg-gray-100">
        <p className="text-xs text-gray-500">
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-gray-600 font-mono">Ctrl</kbd>
          {' + '}
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-gray-600 font-mono">Enter</kbd>
          {' to continue writing'}
        </p>
      </div>
    </div>
  );
}
