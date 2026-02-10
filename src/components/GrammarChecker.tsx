import { useState, useCallback, useRef } from 'react';
import { AIStatus } from '../services/llm';

interface GrammarCheckerProps {
  content: string;
  aiStatus: AIStatus;
  onApplyCorrection: (original: string, corrected: string) => void;
}

interface GrammarSuggestion {
  original: string;
  suggestion: string;
  explanation: string;
}

interface GrammarResult {
  corrected: string;
  suggestions: GrammarSuggestion[];
}

// Rate limiting
const COOLDOWN_MS = 3000;

export function GrammarChecker({ content, aiStatus, onApplyCorrection }: GrammarCheckerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<GrammarResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const lastCheckTimeRef = useRef<number>(0);

  const isOffline = aiStatus === 'offline';
  const hasContent = content.trim().length > 20;
  const isInCooldown = cooldownRemaining > 0;

  const startCooldown = () => {
    lastCheckTimeRef.current = Date.now();
    setCooldownRemaining(3);
    
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - lastCheckTimeRef.current;
      const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      
      if (remaining <= 0) {
        setCooldownRemaining(0);
        clearInterval(interval);
      } else {
        setCooldownRemaining(remaining);
      }
    }, 1000);
  };

  const checkGrammar = useCallback(async () => {
    if (!hasContent || isOffline || isInCooldown) return;

    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      startCooldown();
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful writing assistant. Check grammar and spelling. Return JSON with "corrected" (full text) and "changes" (array of {original, suggestion, explanation}).'
            },
            {
              role: 'user',
              content: `Check this text:\n\n${content}`
            }
          ],
          temperature: 0.3,
        }),
      });

      if (response.status === 429) {
        throw new Error('Rate limited. Please wait a moment.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const text = data.response || '';

      // Parse JSON response
      let parsed: GrammarResult;
      try {
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
        const parsedJson = JSON.parse(jsonText.trim());
        
        parsed = {
          corrected: parsedJson.corrected || content,
          suggestions: Array.isArray(parsedJson.changes) ? parsedJson.changes : [],
        };
      } catch (e) {
        // Fallback
        parsed = {
          corrected: text.trim() || content,
          suggestions: [],
        };
      }

      setResult(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check grammar');
    } finally {
      setIsChecking(false);
    }
  }, [content, hasContent, isOffline, isInCooldown]);

  const handleApplyAll = () => {
    if (result?.corrected) {
      onApplyCorrection(content, result.corrected);
      setResult(null);
    }
  };

  const handleDismiss = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="relative">
      <button
        onClick={checkGrammar}
        disabled={isOffline || !hasContent || isChecking || isInCooldown}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium
          transition-colors duration-150
          ${isOffline || !hasContent || isInCooldown
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
          }
        `}
        title={
          isOffline
            ? 'AI is offline'
            : !hasContent
            ? 'Add more content to check grammar'
            : isInCooldown
            ? `Wait ${cooldownRemaining}s`
            : 'Check grammar and spelling'
        }
      >
        {isChecking ? (
          <>
            <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            Checking...
          </>
        ) : isInCooldown ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {cooldownRemaining}s
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Grammar
          </>
        )}
      </button>

      {/* Results dropdown */}
      {(result || error) && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            {error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : result ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-800">Grammar Suggestions</h4>
                
                {result.suggestions.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {result.suggestions.slice(0, 3).map((suggestion, index) => (
                      <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <span className="line-through text-red-600">{suggestion.original}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-green-600 font-medium">{suggestion.suggestion}</span>
                        </div>
                        {suggestion.explanation && (
                          <p className="text-gray-500 mt-1">{suggestion.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Corrected text preview:</p>
                  <p className="text-sm text-gray-700 bg-green-50 p-2 rounded line-clamp-3">
                    {result.corrected}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleApplyAll}
                    className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                  >
                    Apply All
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
