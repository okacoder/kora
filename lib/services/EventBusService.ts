import { injectable } from 'inversify';
import { IEventBusService } from '@/lib/interfaces/services/IEventBusService';

@injectable()
export class EventBusService implements IEventBusService {
  private events: Map<string, Set<(data: any) => void>> = new Map();

  async emit(event: string, data: any): Promise<void> {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  on(event: string, handler: (data: any) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }

  once(event: string, handler: (data: any) => void): void {
    const onceHandler = (data: any) => {
      handler(data);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }
}