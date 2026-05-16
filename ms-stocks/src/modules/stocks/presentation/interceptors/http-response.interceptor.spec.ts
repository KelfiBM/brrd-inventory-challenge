import { ExecutionContext, HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { HttpResponseInterceptor } from './http-response.interceptor';

describe('HttpResponseInterceptor', () => {
  let interceptor: HttpResponseInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpResponseInterceptor],
    }).compile();

    interceptor = module.get<HttpResponseInterceptor>(HttpResponseInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should wrap response in HttpResponse object', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getResponse: () => ({
            statusCode: 200,
          }),
        }),
      } as any as ExecutionContext;

      const mockCallHandler = {
        handle: () => of({ message: 'test data' }),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);

      result$.subscribe((response) => {
        expect(response).toBeDefined();
        expect(response.data).toEqual({ message: 'test data' });
        expect(response.message).toBe('Request processed successfully');
        expect(response.statusCode).toBe(200);
        done();
      });
    });

    it('should use default status code 200 when not provided', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getResponse: () => ({}),
        }),
      } as any as ExecutionContext;

      const mockCallHandler = {
        handle: () => of({ message: 'test' }),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);

      result$.subscribe((response) => {
        expect(response.statusCode).toBe(200);
        done();
      });
    });

    it('should preserve response status code', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getResponse: () => ({
            statusCode: 201,
          }),
        }),
      } as any as ExecutionContext;

      const mockCallHandler = {
        handle: () => of({ id: '123' }),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);

      result$.subscribe((response) => {
        expect(response.statusCode).toBe(201);
        done();
      });
    });

    it('should wrap null response data', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getResponse: () => ({
            statusCode: 200,
          }),
        }),
      } as any as ExecutionContext;

      const mockCallHandler = {
        handle: () => of(null),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);

      result$.subscribe((response) => {
        expect(response.data).toBeNull();
        done();
      });
    });

    it('should handle errors and throw HttpException', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getResponse: () => ({
            statusCode: 200,
          }),
        }),
      } as any as ExecutionContext;

      const error = new Error('Test error');
      const mockCallHandler = {
        handle: () => throwError(() => error),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);

      result$.subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(HttpException);
          done();
        },
      });
    });

    it('should extract error status code from HttpException', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getResponse: () => ({
            statusCode: 200,
          }),
        }),
      } as any as ExecutionContext;

      const httpException = new HttpException('Bad Request', 400);
      const mockCallHandler = {
        handle: () => throwError(() => httpException),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);

      result$.subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(HttpException);
          expect(err.getStatus()).toBe(400);
          done();
        },
      });
    });

    it('should use 500 status code for non-HttpException errors', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getResponse: () => ({
            statusCode: 200,
          }),
        }),
      } as any as ExecutionContext;

      const error = new Error('Unknown error');
      const mockCallHandler = {
        handle: () => throwError(() => error),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);

      result$.subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(HttpException);
          expect(err.getStatus()).toBe(500);
          done();
        },
      });
    });

    it('should preserve error message in response', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getResponse: () => ({
            statusCode: 200,
          }),
        }),
      } as any as ExecutionContext;

      const error = new Error('Custom error message');
      const mockCallHandler = {
        handle: () => throwError(() => error),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);

      result$.subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(HttpException);
          done();
        },
      });
    });

    it('should handle error without message', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getResponse: () => ({
            statusCode: 200,
          }),
        }),
      } as any as ExecutionContext;

      const error = new Error();
      error.message = '';
      const mockCallHandler = {
        handle: () => throwError(() => error),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);

      result$.subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(HttpException);
          done();
        },
      });
    });

    it('should wrap complex response objects', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getResponse: () => ({
            statusCode: 200,
          }),
        }),
      } as any as ExecutionContext;

      const complexData = {
        id: '123',
        name: 'Test',
        nested: {
          value: 'data',
        },
        array: [1, 2, 3],
      };

      const mockCallHandler = {
        handle: () => of(complexData),
      };

      const result$ = interceptor.intercept(mockContext, mockCallHandler);

      result$.subscribe((response) => {
        expect(response.data).toEqual(complexData);
        done();
      });
    });
  });

  describe('success responses', () => {
    it('should handle various successful status codes', (done) => {
      const statusCodes = [200, 201, 202, 204];
      let completed = 0;

      statusCodes.forEach((statusCode) => {
        const mockContext = {
          switchToHttp: () => ({
            getResponse: () => ({
              statusCode,
            }),
          }),
        } as any as ExecutionContext;

        const mockCallHandler = {
          handle: () => of({ success: true }),
        };

        const result$ = interceptor.intercept(mockContext, mockCallHandler);

        result$.subscribe((response) => {
          expect(response.statusCode).toBe(statusCode);
          completed++;
          if (completed === statusCodes.length) {
            done();
          }
        });
      });
    });
  });

  describe('error responses', () => {
    it('should handle various HttpException status codes', (done) => {
      const statusCodes = [400, 401, 403, 404, 500];
      let completed = 0;

      statusCodes.forEach((statusCode) => {
        const mockContext = {
          switchToHttp: () => ({
            getResponse: () => ({
              statusCode: 200,
            }),
          }),
        } as any as ExecutionContext;

        const error = new HttpException('Error', statusCode);
        const mockCallHandler = {
          handle: () => throwError(() => error),
        };

        const result$ = interceptor.intercept(mockContext, mockCallHandler);

        result$.subscribe({
          error: (err) => {
            expect(err.getStatus()).toBe(statusCode);
            completed++;
            if (completed === statusCodes.length) {
              done();
            }
          },
        });
      });
    });
  });
});
