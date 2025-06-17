import { EventEmitter } from 'events';

export interface GameEvent {
  type: string;
  data: any;
  timestamp: Date;
}

class EventBus extends EventEmitter {
  async emit(event: string, data: any): Promise<void> {
    super.emit(event, {
      type: event,
      data,
      timestamp: new Date()
    });
  }

  subscribe(event: string, handler: (event: GameEvent) => void): void {
    this.on(event, handler);
  }

  unsubscribe(event: string, handler: (event: GameEvent) => void): void {
    this.off(event, handler);
  }
}

export const globalEventBus = new EventBus();