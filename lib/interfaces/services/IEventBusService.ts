export interface IEventBusService {
  emit(event: string, data: any): Promise<void>;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
  once(event: string, handler: (data: any) => void): void;
}