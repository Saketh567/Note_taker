export type SubjectType = 'general' | 'math' | 'chemistry' | 'code' | 'language';

// Simple hash function for content comparison
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export interface Definition {
  term: string;
  explanation: string;
}

export interface AIInsights {
  summary: string;
  definitions: Definition[];
  additionalContext: string;
  studyQuestions: string[];
  generatedAt: number;
  contentHash: string;
}

/**
 * Generate comprehensive insights for note content via Kimi Cloud API
 */
export async function generateInsights(
  content: string,
  subjectType: SubjectType = 'general'
): Promise<AIInsights> {
  console.log('[insights.ts] Starting insights generation...');

  const truncatedContent = content.length > 6000 
    ? content.substring(0, 6000) + '\n\n[Content truncated...]' 
    : content;

  const subjectContext = {
    general: 'general knowledge',
    math: 'mathematics',
    chemistry: 'chemistry',
    code: 'programming and computer science',
    language: 'language learning',
  }[subjectType] || 'general knowledge';

  const prompt = `Analyze these notes about ${subjectContext} and provide a structured JSON response with:
- summary: A concise 2-3 sentence summary
- definitions: An array of 2-4 key terms with explanations (each with "term" and "explanation" fields)
- additionalContext: A paragraph with relevant additional information (2-3 sentences)
- studyQuestions: An array of 3 thought-provoking study questions

Notes to analyze:
"""
${truncatedContent}
"""

Return ONLY valid JSON, no markdown code blocks, no extra text.`;

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content: 'You are an educational AI assistant. Always respond with valid JSON matching the requested structure.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Rate limited. Please wait a moment.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  const text = data.response || '';

  console.log('[insights.ts] Received response from API');

  // Safe parse JSON
  let parsed: {
    summary?: string;
    definitions?: Definition[];
    additionalContext?: string;
    studyQuestions?: string[];
  };

  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    parsed = JSON.parse(jsonText.trim());
  } catch (e) {
    console.error('[insights.ts] JSON parse error:', e);
    parsed = {};
  }

  const insights: AIInsights = {
    summary: parsed.summary || 'No summary available.',
    definitions: Array.isArray(parsed.definitions) ? parsed.definitions : [],
    additionalContext: parsed.additionalContext || '',
    studyQuestions: Array.isArray(parsed.studyQuestions) ? parsed.studyQuestions : [],
    generatedAt: Date.now(),
    contentHash: hashContent(content),
  };

  console.log('[insights.ts] Insights generated successfully');
  return insights;
}

/**
 * Check if insights are stale (content has changed)
 */
export function isInsightsStale(insights: AIInsights | undefined, currentContent: string): boolean {
  if (!insights) {
    return true;
  }
  const currentHash = hashContent(currentContent);
  return insights.contentHash !== currentHash;
}

/**
 * Auto-detect subject type based on content keywords
 */
export function detectSubjectType(content: string): SubjectType {
  const lowerContent = content.toLowerCase();
  
  const codeKeywords = ['function', 'const', 'let', 'var', '=>', 'return', 'import', 'export', 'class', 'if (', 'for ('];
  if (codeKeywords.some(kw => lowerContent.includes(kw))) {
    return 'code';
  }
  
  const chemKeywords = ['h2o', 'co2', 'molecule', 'reaction', 'acid', 'base', 'ph ', 'ion', 'compound', 'element'];
  if (chemKeywords.some(kw => lowerContent.includes(kw))) {
    return 'chemistry';
  }
  
  const mathKeywords = ['equation', 'integral', 'derivative', 'function', 'x =', 'y =', '∫', '∑', 'π', '√'];
  if (mathKeywords.some(kw => lowerContent.includes(kw))) {
    return 'math';
  }
  
  const langKeywords = ['verb', 'noun', 'grammar', 'sentence', 'translate', 'meaning', 'pronunciation'];
  if (langKeywords.some(kw => lowerContent.includes(kw))) {
    return 'language';
  }
  
  return 'general';
}
