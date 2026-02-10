import { generateSummary, suggestTags, continueWriting } from '../services/llm';

// Web Worker for LLM operations to prevent UI blocking

export type WorkerMessageType = 'SUMMARIZE' | 'TAGS' | 'CONTINUE';

export interface WorkerRequest {
  id: string;
  type: WorkerMessageType;
  payload: {
    content: string;
    cursorPosition?: number;
  };
}

export interface WorkerResponse {
  id: string;
  type: WorkerMessageType;
  success: boolean;
  data?: string | string[];
  error?: string;
  chunk?: string; // For streaming
}

// Handle messages from main thread
self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = event.data;

  try {
    switch (type) {
      case 'SUMMARIZE': {
        const summary = await generateSummary(payload.content, (chunk) => {
          // Stream chunks back to main thread
          const streamResponse: WorkerResponse = {
            id,
            type,
            success: true,
            chunk,
          };
          self.postMessage(streamResponse);
        });
        
        // Send final response
        const response: WorkerResponse = {
          id,
          type,
          success: true,
          data: summary,
        };
        self.postMessage(response);
        break;
      }

      case 'TAGS': {
        const tags = await suggestTags(payload.content);
        
        const response: WorkerResponse = {
          id,
          type,
          success: true,
          data: tags,
        };
        self.postMessage(response);
        break;
      }

      case 'CONTINUE': {
        const continuation = await continueWriting(
          payload.content,
          payload.cursorPosition || payload.content.length,
          (chunk) => {
            // Stream chunks back to main thread
            const streamResponse: WorkerResponse = {
              id,
              type,
              success: true,
              chunk,
            };
            self.postMessage(streamResponse);
          }
        );
        
        // Send final response
        const response: WorkerResponse = {
          id,
          type,
          success: true,
          data: continuation,
        };
        self.postMessage(response);
        break;
      }

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    const errorResponse: WorkerResponse = {
      id,
      type,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    self.postMessage(errorResponse);
  }
});

export {};
