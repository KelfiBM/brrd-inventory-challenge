import { CallHandler, ExecutionContext, Inject, NestInterceptor } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Request } from 'express';
import { createHash } from 'node:crypto';
import { map, Observable, of } from 'rxjs';
import { CACHE_MANAGER } from '../../../../configs/app.const';

export class ProductIdempotencyInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    const authorizationToken = this.extractAuthorizationToken(request);
    if (!authorizationToken) {
      return next.handle();
    }

    const requestBody = JSON.stringify(request.body);
    const hashBody = `${request.method}:${request.url}:${authorizationToken}:${requestBody}`;

    const hash = createHash('sha256').update(hashBody).digest('hex');

    const processedRequest = await this.cacheManager.get(hash);
    if (processedRequest) {
      return of(processedRequest);
    }

    return next.handle().pipe(
      map((response) => {
        this.cacheManager.set(hash, response, 3600); // Cache for 1 hour
        return response;
      })
    );
  }

  private extractAuthorizationToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
