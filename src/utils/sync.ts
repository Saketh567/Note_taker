// Multi-tab synchronization using BroadcastChannel API with localStorage fallback

const CHANNEL_NAME = 'note-taker-sync';
const STORAGE_KEY = 'note-taker-sync-fallback';

// Message type for sync
export interface SyncMessage {
  type: 'NOTE_UPDATED';
  noteId: string;
  version: number;
  timestamp: number;
}

// Callback type for message handlers
type MessageHandler = (message: SyncMessage) => void;

// Check if BroadcastChannel is supported
const isBroadcastChannelSupported = (): boolean => {
  return typeof BroadcastChannel !== 'undefined';
};

/**
 * Post a sync message to other tabs
 * Uses BroadcastChannel if available, falls back to localStorage
 */
export const postMessage = (noteId: string, version: number): void => {
  const message: SyncMessage = {
    type: 'NOTE_UPDATED',
    noteId,
    version,
    timestamp: Date.now(),
  };

  if (isBroadcastChannelSupported()) {
    // Use BroadcastChannel (modern browsers)
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(message);
    channel.close();
  } else {
    // Fallback to localStorage (Safari)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
      // Clear immediately to allow future updates
      setTimeout(() => {
        localStorage.removeItem(STORAGE_KEY);
      }, 100);
    } catch (error) {
      console.error('Failed to post sync message via localStorage:', error);
    }
  }
};

/**
 * Subscribe to sync messages from other tabs
 * Returns unsubscribe function
 */
export const onMessage = (handler: MessageHandler): (() => void) => {
  if (isBroadcastChannelSupported()) {
    // Use BroadcastChannel (modern browsers)
    const channel = new BroadcastChannel(CHANNEL_NAME);
    
    const messageHandler = (event: MessageEvent<SyncMessage>) => {
      if (event.data && event.data.type === 'NOTE_UPDATED') {
        handler(event.data);
      }
    };

    channel.addEventListener('message', messageHandler);

    // Return unsubscribe function
    return () => {
      channel.removeEventListener('message', messageHandler);
      channel.close();
    };
  } else {
    // Fallback to localStorage (Safari)
    const storageHandler = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const message: SyncMessage = JSON.parse(event.newValue);
          if (message.type === 'NOTE_UPDATED') {
            handler(message);
          }
        } catch (error) {
          console.error('Failed to parse sync message from localStorage:', error);
        }
      }
    };

    window.addEventListener('storage', storageHandler);

    // Return unsubscribe function
    return () => {
      window.removeEventListener('storage', storageHandler);
    };
  }
};
