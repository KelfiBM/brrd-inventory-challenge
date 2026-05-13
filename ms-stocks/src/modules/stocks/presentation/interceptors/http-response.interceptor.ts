import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
import { catchError, map, Observable, throwError } from 'rxjs';
import { HttpResponse } from '../dtos/http-response';

@Injectable()
export class HttpResponseInterceptor implements NestInterceptor {

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode || 200;
    
    return next.handle().pipe(
      map((response) => {
        return new HttpResponse(response, 'Request processed successfully', statusCode);
      }),
      catchError((error) => {
        const statusCode = error instanceof HttpException ? error.getStatus() : 500;
        const message = error.message || 'An unexpected error occurred';
        return throwError(() => new HttpException(
          new HttpResponse(undefined, undefined, undefined, {
            message,
          }),
          statusCode
        ));
      })
    )
  }
}
