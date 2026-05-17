import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { HttpResponse } from '../dtos/http-response';
import { HttpResponseInterceptor } from './http-response.interceptor';

describe('HttpResponseInterceptor', () => {
  let interceptor: HttpResponseInterceptor;

  beforeEach(() => {
    interceptor = new HttpResponseInterceptor();
  });

  describe('intercept - Success Cases', () => {
    it('should wrap successful response with default status code 200', async () => {
      const mockData = { id: 1, name: 'Test Product' };
      const mockResponse = { statusCode: undefined };

      const mockNext = {
        handle: () => of(mockData),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe((result: HttpResponse<any>) => {
          expect(result).toBeInstanceOf(HttpResponse);
          expect(result.data).toEqual(mockData);
          expect(result.message).toBe('Request processed successfully');
          expect(result.statusCode).toBe(200);
          resolve(undefined);
        });
      });
    });

    it('should wrap successful response with custom status code', async () => {
      const mockData = { id: 1, name: 'Created Product' };
      const mockResponse = { statusCode: 201 };

      const mockNext = {
        handle: () => of(mockData),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe((result: HttpResponse<any>) => {
          expect(result.statusCode).toBe(201);
          expect(result.message).toBe('Request processed successfully');
          resolve(undefined);
        });
      });
    });

    it('should handle null data in successful response', async () => {
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => of(null),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe((result: HttpResponse<any>) => {
          expect(result.data).toBeNull();
          expect(result.message).toBe('Request processed successfully');
          expect(result.statusCode).toBe(200);
          resolve(undefined);
        });
      });
    });

    it('should handle undefined data in successful response', async () => {
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => of(undefined),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe((result: HttpResponse<any>) => {
          expect(result.data).toBeUndefined();
          expect(result.message).toBe('Request processed successfully');
          resolve(undefined);
        });
      });
    });

    it('should handle array data in successful response', async () => {
      const mockData = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' },
      ];
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => of(mockData),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe((result: HttpResponse<any>) => {
          expect(result.data).toEqual(mockData);
          expect(Array.isArray(result.data)).toBe(true);
          expect(result.data.length).toBe(2);
          resolve(undefined);
        });
      });
    });

    it('should handle complex nested object data', async () => {
      const mockData = {
        id: 'prod-123',
        name: 'Product',
        details: {
          category: 'Electronics',
          specs: { color: 'Black', weight: '500g' },
        },
      };
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => of(mockData),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe((result: HttpResponse<any>) => {
          expect(result.data).toEqual(mockData);
          expect(result.data.details.specs.color).toBe('Black');
          resolve(undefined);
        });
      });
    });
  });

  describe('intercept - Error Cases', () => {
    it('should handle HttpException with status code 400', async () => {
      const httpException = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => throwError(() => httpException),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe({
          error: (error) => {
            expect(error).toBeInstanceOf(HttpException);
            expect(error.getStatus()).toBe(400);
            const response = error.getResponse() as HttpResponse<any>;
            expect(response).toBeInstanceOf(HttpResponse);
            expect(response.statusCode).toBe(400);
            expect(response.message).toBe('Bad Request');
            expect(response.data).toBeUndefined();
            resolve(undefined);
          },
        });
      });
    });

    it('should handle HttpException with status code 404', async () => {
      const httpException = new HttpException('Product Not Found', HttpStatus.NOT_FOUND);
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => throwError(() => httpException),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe({
          error: (error) => {
            expect(error.getStatus()).toBe(404);
            const response = error.getResponse() as HttpResponse<any>;
            expect(response.message).toBe('Product Not Found');
            expect(response.statusCode).toBe(404);
            resolve(undefined);
          },
        });
      });
    });

    it('should handle HttpException with status code 500', async () => {
      const httpException = new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => throwError(() => httpException),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe({
          error: (error) => {
            expect(error.getStatus()).toBe(500);
            const response = error.getResponse() as HttpResponse<any>;
            expect(response.message).toBe('Internal Server Error');
            resolve(undefined);
          },
        });
      });
    });

    it('should handle generic Error with default status code 500', async () => {
      const error = new Error('Database connection failed');
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => throwError(() => error),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe({
          error: (thrownError) => {
            expect(thrownError).toBeInstanceOf(HttpException);
            expect(thrownError.getStatus()).toBe(500);
            const response = thrownError.getResponse() as HttpResponse<any>;
            expect(response.message).toBe('Database connection failed');
            expect(response.statusCode).toBe(500);
            resolve(undefined);
          },
        });
      });
    });

    it('should extract error message from Error object', async () => {
      const error = new Error('Validation failed: Price must be positive');
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => throwError(() => error),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe({
          error: (thrownError) => {
            const response = thrownError.getResponse() as HttpResponse<any>;
            expect(response.message).toBe('Validation failed: Price must be positive');
            resolve(undefined);
          },
        });
      });
    });

    it('should handle error with undefined message', async () => {
      const error = new Error();
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => throwError(() => error),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe({
          error: (thrownError) => {
            const response = thrownError.getResponse() as HttpResponse<any>;
            expect(response.message).toBe('An unexpected error occurred');
            resolve(undefined);
          },
        });
      });
    });

    it('should handle HttpException with 401 Unauthorized', async () => {
      const httpException = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => throwError(() => httpException),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe({
          error: (error) => {
            expect(error.getStatus()).toBe(401);
            const response = error.getResponse() as HttpResponse<any>;
            expect(response.statusCode).toBe(401);
            resolve(undefined);
          },
        });
      });
    });

    it('should handle HttpException with 403 Forbidden', async () => {
      const httpException = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => throwError(() => httpException),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe({
          error: (error) => {
            expect(error.getStatus()).toBe(403);
            resolve(undefined);
          },
        });
      });
    });

    it('should handle HttpException with 422 Unprocessable Entity', async () => {
      const httpException = new HttpException(
        'Invalid product data',
        HttpStatus.UNPROCESSABLE_ENTITY
      );
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => throwError(() => httpException),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe({
          error: (error) => {
            expect(error.getStatus()).toBe(422);
            const response = error.getResponse() as HttpResponse<any>;
            expect(response.message).toBe('Invalid product data');
            resolve(undefined);
          },
        });
      });
    });
  });

  describe('intercept - Response Status Codes', () => {
    it('should preserve 201 Created status code from response', async () => {
      const mockData = { id: 'new-product', name: 'New Product' };
      const mockResponse = { statusCode: 201 };

      const mockNext = {
        handle: () => of(mockData),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe((result: HttpResponse<any>) => {
          expect(result.statusCode).toBe(201);
          resolve(undefined);
        });
      });
    });

    it('should preserve 204 No Content status code from response', async () => {
      const mockResponse = { statusCode: 204 };

      const mockNext = {
        handle: () => of(null),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe((result: HttpResponse<any>) => {
          expect(result.statusCode).toBe(204);
          resolve(undefined);
        });
      });
    });

    it('should default to 200 when status code is not set on response', async () => {
      const mockData = { id: 1, name: 'Product' };
      const mockResponse = {};

      const mockNext = {
        handle: () => of(mockData),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe((result: HttpResponse<any>) => {
          expect(result.statusCode).toBe(200);
          resolve(undefined);
        });
      });
    });
  });

  describe('intercept - Data Transformation', () => {
    it('should transform string data', async () => {
      const mockData = 'Operation successful';
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => of(mockData),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe((result: HttpResponse<any>) => {
          expect(result.data).toBe('Operation successful');
          expect(typeof result.data).toBe('string');
          resolve(undefined);
        });
      });
    });

    it('should transform number data', async () => {
      const mockData = 42;
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => of(mockData),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe((result: HttpResponse<any>) => {
          expect(result.data).toBe(42);
          expect(typeof result.data).toBe('number');
          resolve(undefined);
        });
      });
    });

    it('should transform boolean data', async () => {
      const mockData = true;
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => of(mockData),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe((result: HttpResponse<any>) => {
          expect(result.data).toBe(true);
          expect(typeof result.data).toBe('boolean');
          resolve(undefined);
        });
      });
    });

    it('should transform empty object data', async () => {
      const mockData = {};
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => of(mockData),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe((result: HttpResponse<any>) => {
          expect(result.data).toEqual({});
          resolve(undefined);
        });
      });
    });

    it('should transform empty array data', async () => {
      const mockData: any[] = [];
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => of(mockData),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe((result: HttpResponse<any>) => {
          expect(result.data).toEqual([]);
          expect(Array.isArray(result.data)).toBe(true);
          resolve(undefined);
        });
      });
    });
  });

  describe('intercept - Message Handling', () => {
    it('should always return success message for successful responses', async () => {
      const mockData = { id: 1 };
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => of(mockData),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe((result: HttpResponse<any>) => {
          expect(result.message).toBe('Request processed successfully');
          resolve(undefined);
        });
      });
    });

    it('should include custom error message from HttpException', async () => {
      const customMessage = 'Custom validation error message';
      const httpException = new HttpException(customMessage, HttpStatus.BAD_REQUEST);
      const mockResponse = { statusCode: 200 };

      const mockNext = {
        handle: () => throwError(() => httpException),
      };

      const context = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const observable = interceptor.intercept(context, mockNext as any);

      return new Promise((resolve) => {
        observable.subscribe({
          error: (error) => {
            const response = error.getResponse() as HttpResponse<any>;
            expect(response.message).toBe(customMessage);
            resolve(undefined);
          },
        });
      });
    });
  });
});
