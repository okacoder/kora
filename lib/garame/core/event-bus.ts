type EventCallback = (data: any) => void;

class EventBus {
  private static instance: EventBus;
  private events = new Map<string, EventCallback[]>();

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  async emit(event: string, data?: any): Promise<void> {
    const callbacks = this.events.get(event);
    if (callbacks) {
      // Execute callbacks asynchronously
      await Promise.all(
        callbacks.map(callback => 
          Promise.resolve().then(() => callback(data))
        )
      );
    }

    // Also emit wildcard event for global listeners
    const wildcardCallbacks = this.events.get('*');
    if (wildcardCallbacks) {
      await Promise.all(
        wildcardCallbacks.map(callback => 
          Promise.resolve().then(() => callback({ event, data }))
        )
      );
    }
  }

  once(event: string, callback: EventCallback): void {
    const onceCallback = (data: any) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  clear(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  // Get all registered events (useful for debugging)
  getEvents(): string[] {
    return Array.from(this.events.keys());
  }
}

export const globalEventBus = EventBus.getInstance();

// Common game events
export const GameEvents = {
  // Room events
  ROOM_CREATED: 'room.created',
  ROOM_JOINED: 'room.joined',
  ROOM_LEFT: 'room.left',
  ROOM_UPDATED: 'room.updated',
  
  // Game events
  GAME_STARTED: 'game.started',
  GAME_ENDED: 'game.ended',
  GAME_ACTION: 'game.action',
  GAME_STATE_UPDATED: 'game.state.updated',
  
  // Player events
  PLAYER_JOINED: 'player.joined',
  PLAYER_LEFT: 'player.left',
  PLAYER_READY: 'player.ready',
  PLAYER_ACTION: 'player.action',
  
  // AI events
  AI_THINKING: 'ai.thinking',
  AI_ACTION: 'ai.action',
} as const;