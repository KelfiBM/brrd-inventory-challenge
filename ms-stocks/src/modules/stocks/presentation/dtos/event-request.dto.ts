export class EventRequestDto<T> {
  metadata: {
    correlationId: string;
    timestamp: Date;
  };
  data: T;
}
