// Kimi Cloud API Service
// Proxies requests through /api/generate to keep API key secure

export type AIStatus = 'connected' | 'offline' | 'checking';

// Check if API is configured (env var exists on server)
export async function checkConnection(): Promise<boolean> {
  try {
    // Simple health check - we'll just check if we can reach the API endpoint
    // In production, the API route will return 500 if KIMI_API_KEY is missing
    const response = await fetch('/api/generate', {
      method: 'OPTIONS',
    });
    return response.ok;
  } catch (error) {
    console.error('[LLM] Connection check failed:', error);
    return false;
  }
}

// Always return connected since we use cloud API
export async function getBestModel(): Promise<string> {
  return 'kimi-latest';
}

interface KimiResponse {
  response: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate text using Kimi Cloud API
 * Proxies through /api/generate to keep API key secure
 */
async function generateText(
  prompt: string,
  systemPrompt?: string,
  onStream?: (chunk: string) => void
): Promise<string> {
  const messages = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: prompt });

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (response.status === 429) {
    const data = await response.json();
    throw new Error(data.message || 'Rate limited. Please wait a moment.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const data: KimiResponse = await response.json();
  
  // Simulate streaming if callback provided
  if (onStream && data.response) {
    const chunks = data.response.split(' ');
    let accumulated = '';
    for (const chunk of chunks) {
      accumulated += chunk + ' ';
      onStream(chunk + ' ');
      // Small delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  return data.response;
}

/**
 * Generate a summary of the note content
 */
export async function generateSummary(
  content: string,
  onStream?: (chunk: string) => void
): Promise<string> {
  const truncatedContent = content.length > 6000 
    ? content.substring(0, 6000) + '\n\n[Content truncated...]' 
    : content;

  const prompt = `Summarize this note concisely in 2-3 sentences:\n\n${truncatedContent}\n\nSummary:`;
  
  return generateText(prompt, undefined, onStream);
}

/**
 * Suggest tags based on note content
 */
export async function suggestTags(content: string): Promise<string[]> {
  const truncatedContent = content.length > 2000 
    ? content.substring(0, 2000) + '...' 
    : content;

  const prompt = `Given this note content, suggest 3-5 relevant tags as a comma-separated list. Only return the tags, nothing else:\n\n${truncatedContent}\n\nTags:`;

  const response = await generateText(prompt);
  
  // Parse comma-separated tags
  return response
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0 && tag.length < 30)
    .slice(0, 5);
}

/**
 * Continue writing from cursor position
 */
export async function continueWriting(
  content: string,
  cursorPosition: number,
  onStream?: (chunk: string) => void
): Promise<string> {
  const contentBefore = content.substring(0, cursorPosition);
  const truncated = contentBefore.length > 4000 
    ? contentBefore.substring(contentBefore.length - 4000) 
    : contentBefore;

  const prompt = `Continue this text naturally from where it stops. Write 1-2 sentences that flow from the existing content:\n\n${truncated}\n\nContinuation:`;

  return generateText(prompt, undefined, onStream);
}

/**
 * Check grammar and spelling
 */
export async function checkGrammar(content: string): Promise<{
  corrected: string;
  changes: Array<{original: string; suggestion: string; explanation: string}>;
}> {
  const prompt = `Fix the grammar and spelling in this text. Return a JSON response with:
- corrected: The fully corrected text
- changes: An array of specific changes made

Text to check:
"""
${content}
"""

JSON response:`;

  const systemPrompt = 'You are a helpful writing assistant. Always respond with valid JSON.';
  
  const response = await generateText(prompt, systemPrompt);
  
  try {
    // Try to extract JSON
    const jsonMatch = response.match(/```json\s*([\s\S]*?)```/) || 
                      response.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
    const parsed = JSON.parse(jsonText.trim());
    
    return {
      corrected: parsed.corrected || content,
      changes: Array.isArray(parsed.changes) ? parsed.changes : [],
    };
  } catch (e) {
    // Fallback: return original with empty changes
    return {
      corrected: content,
      changes: [],
    };
  }
}

/**
 * Generate insights for note content
 */
export async function generateInsights(
  content: string,
  subjectType: string = 'general'
): Promise<{
  summary: string;
  definitions: Array<{term: string; explanation: string}>;
  additionalContext: string;
  studyQuestions: string[];
}> {
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

  const systemPrompt = 'You are an educational AI assistant. Always respond with valid JSON matching the requested structure.';
  
  const response = await generateText(prompt, systemPrompt);
  
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)```/) || 
                      response.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
    const parsed = JSON.parse(jsonText.trim());
    
    return {
      summary: parsed.summary || 'No summary available.',
      definitions: Array.isArray(parsed.definitions) ? parsed.definitions : [],
      additionalContext: parsed.additionalContext || '',
      studyQuestions: Array.isArray(parsed.studyQuestions) ? parsed.studyQuestions : [],
    };
  } catch (e) {
    // Return safe defaults on parse error
    return {
      summary: response.substring(0, 200) + '...',
      definitions: [],
      additionalContext: '',
      studyQuestions: [],
    };
  }
}
