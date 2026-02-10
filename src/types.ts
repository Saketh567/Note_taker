export type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  version: number;
  tags: string[];
  subjectType: 'general' | 'math' | 'chemistry' | 'code' | 'language';
  aiMetadata?: {
    summary?: string;
    lastAnalyzed?: number;
  };
  aiInsights?: {
    summary: string;
    definitions: Array<{term: string, explanation: string}>;
    additionalContext: string;
    studyQuestions: string[];
    generatedAt: number;
    contentHash: string;
  };
};
