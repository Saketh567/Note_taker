import { useState, useEffect, useCallback, useRef } from 'react';
import { Note } from '../types';
import { AIStatus } from '../services/llm';
import { generateInsights, isInsightsStale, AIInsights, SubjectType } from '../services/insights';
import { useIdleTimer } from '../hooks/useIdleTimer';

interface InsightsPanelProps {
  note: Note | null;
  aiStatus: AIStatus;
  subjectType: SubjectType;
  onUpdateNote: (note: Note) => void;
}

// Rate limiting constants
const COOLDOWN_MS = 3000; // 3 seconds between requests
const RETRY_DELAY_MS = 3000; // 3 seconds before retry on 429

export function InsightsPanel({ note, aiStatus, subjectType, onUpdateNote }: InsightsPanelProps) {
  const [insights, setInsights] = useState<AIInsights | undefined>(note?.aiInsights);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // AbortController ref for cancelling pending requests
  const abortControllerRef = useRef<AbortController | null>(null);
  const cooldownTimerRef = useRef<number | null>(null);
  const lastRequestTimeRef = useRef<number>(0);

  // Sync insights when note changes
  useEffect(() => {
    setInsights(note?.aiInsights);
    setError(null);
  }, [note?.id]);

  // Cancel pending request on unmount or note change
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, [note?.id]);

  // Start cooldown timer
  const startCooldown = useCallback(() => {
    lastRequestTimeRef.current = Date.now();
    setCooldownRemaining(Math.ceil(COOLDOWN_MS / 1000));
    
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }
    
    cooldownTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - lastRequestTimeRef.current;
      const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      
      if (remaining <= 0) {
        setCooldownRemaining(0);
        if (cooldownTimerRef.current) {
          clearInterval(cooldownTimerRef.current);
          cooldownTimerRef.current = null;
        }
      } else {
        setCooldownRemaining(remaining);
      }
    }, 1000);
  }, []);

  const generate = useCallback(async (isRetry = false) => {
    if (!note || aiStatus !== 'connected') return;

    // Check cooldown
    const timeSinceLastRequest = Date.now() - lastRequestTimeRef.current;
    if (!isRetry && timeSinceLastRequest < COOLDOWN_MS) {
      setError(`Please wait ${Math.ceil((COOLDOWN_MS - timeSinceLastRequest) / 1000)}s between requests`);
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();

    setIsGenerating(true);
    setError(null);
    setIsRetrying(false);

    try {
      startCooldown();
      const newInsights = await generateInsights(
        note.content, 
        subjectType
      );
      
      setInsights(newInsights);
      
      // Update note with new insights
      const updatedNote: Note = {
        ...note,
        aiInsights: newInsights,
      };
      onUpdateNote(updatedNote);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate insights';
      
      // Handle rate limiting
      if (errorMessage.toLowerCase().includes('rate') || 
          errorMessage.toLowerCase().includes('429') ||
          errorMessage.toLowerCase().includes('too many')) {
        setIsRetrying(true);
        setError('Service busy, retrying in 3 seconds...');
        
        // Auto-retry after delay
        setTimeout(() => {
          generate(true);
        }, RETRY_DELAY_MS);
        return;
      }
      
      setError(errorMessage);
      setIsRetrying(false);
    } finally {
      if (!isRetrying) {
        setIsGenerating(false);
      }
      abortControllerRef.current = null;
    }
  }, [note, aiStatus, subjectType, onUpdateNote, startCooldown, isRetrying]);

  // Auto-generate on idle (30 seconds)
  const handleIdle = useCallback(() => {
    if (!autoGenerate || !note || aiStatus !== 'connected') return;
    
    // Check cooldown before auto-generating
    const timeSinceLastRequest = Date.now() - lastRequestTimeRef.current;
    if (timeSinceLastRequest < COOLDOWN_MS) {
      return; // Skip if in cooldown
    }
    
    if (isInsightsStale(note.aiInsights, note.content)) {
      generate();
    }
  }, [autoGenerate, note, aiStatus, generate]);

  useIdleTimer({
    timeout: 30000,
    onIdle: handleIdle,
    enabled: autoGenerate && aiStatus === 'connected' && !!note && !isGenerating && cooldownRemaining === 0,
  });

  const isOffline = aiStatus === 'offline';
  const hasContent = note && note.content.trim().length > 50;
  
  let isStale = false;
  try {
    isStale = !!note && isInsightsStale(insights, note.content);
  } catch (e) {
    isStale = true;
  }

  const isInCooldown = cooldownRemaining > 0;

  if (!note) {
    return (
      <div className="w-1/2 h-full flex items-center justify-center bg-gray-50 border-l border-gray-200">
        <p className="text-gray-400 text-sm">Select a note to see AI insights</p>
      </div>
    );
  }

  return (
    <div className="w-1/2 h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">AI Insights</h3>
          <p className="text-xs text-gray-500">
            {insights?.generatedAt ? (
              <>Last updated: {formatTimeAgo(insights.generatedAt)}</>
            ) : (
              'No insights generated yet'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={autoGenerate}
              onChange={(e) => setAutoGenerate(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Auto
          </label>
          
          <button
            onClick={() => generate()}
            disabled={isOffline || !hasContent || isGenerating || isInCooldown || isRetrying}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium
              transition-colors duration-150
              ${isOffline || !hasContent || isInCooldown
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {isGenerating || isRetrying ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isRetrying ? 'Retrying...' : 'Generating...'}
              </>
            ) : isInCooldown ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Wait {cooldownRemaining}s
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {insights ? 'Refresh' : 'Generate'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Rate limit notice */}
      <div className="px-4 py-1.5 bg-blue-50 border-b border-blue-100">
        <p className="text-[10px] text-blue-600 text-center">
          Demo mode: Max 20 requests per minute
        </p>
      </div>

      {/* Stale warning */}
      {isStale && insights?.generatedAt && !isGenerating && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-xs text-amber-800">
            Note has changed. Click Refresh to update insights.
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isOffline ? (
          <div className="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-sm text-gray-500">AI is offline</p>
            <p className="text-xs text-gray-400 mt-1">Check your connection</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 mb-3">{error}</p>
            {!isRetrying && (
              <button
                onClick={() => generate()}
                disabled={isInCooldown}
                className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                {isInCooldown ? `Wait ${cooldownRemaining}s` : 'Try Again'}
              </button>
            )}
          </div>
        ) : !insights ? (
          <div className="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm text-gray-500">
              {hasContent
                ? 'Click Generate to get AI insights'
                : 'Add more content to generate insights'}
            </p>
            {hasContent && autoGenerate && (
              <p className="text-xs text-gray-400 mt-1">Or wait 30s for auto-generation</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <section>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Summary</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {insights.summary || 'No summary available.'}
              </p>
            </section>

            {/* Key Definitions */}
            <section>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Key Definitions</h4>
              {insights.definitions && insights.definitions.length > 0 ? (
                <dl className="space-y-2">
                  {insights.definitions.map((def, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <dt className="text-sm font-medium text-gray-800">
                        {def?.term || 'Unknown term'}
                      </dt>
                      <dd className="text-sm text-gray-600 mt-0.5">
                        {def?.explanation || 'No explanation available.'}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-gray-400 italic">No key definitions available.</p>
              )}
            </section>

            {/* Additional Context */}
            <section>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Additional Context</h4>
              {insights.additionalContext ? (
                <p className="text-sm text-gray-700 leading-relaxed">
                  {insights.additionalContext}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">No additional context available.</p>
              )}
            </section>

            {/* Study Questions */}
            <section>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Study Questions</h4>
              {insights.studyQuestions && insights.studyQuestions.length > 0 ? (
                <ol className="list-decimal list-inside space-y-2">
                  {insights.studyQuestions.map((question, index) => (
                    <li key={index} className="text-sm text-gray-700 pl-2">
                      {question || `Question ${index + 1}`}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-gray-400 italic">No study questions available.</p>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
        <span>Original note is never modified</span>
        {insights?.contentHash && (
          <span className="text-gray-400">
            Based on {note.content?.length?.toLocaleString() || '0'} chars
          </span>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  if (!timestamp || typeof timestamp !== 'number') {
    return 'unknown';
  }
  
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 0) return 'just now';
  if (seconds < 60) return 'just now';
  if (seconds < 120) return '1 minute ago';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 7200) return '1 hour ago';
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  
  return new Date(timestamp).toLocaleDateString();
}
