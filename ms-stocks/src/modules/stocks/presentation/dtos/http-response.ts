export class HttpResponse<T> {
  constructor(
    public readonly data?: T,
    public readonly message?: string,
    public readonly statusCode?: number,
    public readonly error?: {
      message: string;
    }
  ) {}
}