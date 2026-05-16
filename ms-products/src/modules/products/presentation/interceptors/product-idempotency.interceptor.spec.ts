import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { of } from 'rxjs';
import { ProductIdempotencyInterceptor } from './product-idempotency.interceptor';

describe('ProductIdempotencyInterceptor', () => {
  let interceptor: ProductIdempotencyInterceptor;
  let cacheManager: Cache;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ProductIdempotencyInterceptor,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    interceptor = module.get<ProductIdempotencyInterceptor>(ProductIdempotencyInterceptor);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  describe('intercept', () => {
    it('should pass through request without authorization header', async () => {
      const mockRequest = {
        headers: {},
        body: { test: 'data' },
        method: 'POST',
        url: '/api/products',
      };

      const mockNext = {
        handle: () => of({ result: 'success' }),
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const observable = await interceptor.intercept(context, mockNext as any);
      return new Promise((resolve) => {
        observable.subscribe((response) => {
          expect(response).toEqual({ result: 'success' });
          resolve(undefined);
        });
      });
    });

    it('should cache response with valid authorization header', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer token-123',
        },
        body: { test: 'data' },
        method: 'POST',
        url: '/api/products',
      };

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const mockNext = {
        handle: () => of({ result: 'success' }),
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const observable = await interceptor.intercept(context, mockNext as any);
      return new Promise((resolve) => {
        observable.subscribe((response) => {
          expect(response).toEqual({ result: 'success' });
          expect(cacheManager.set).toHaveBeenCalled();
          resolve(undefined);
        });
      });
    });

    it('should return cached response if exists', async () => {
      const cachedResponse = { result: 'cached' };
      const mockRequest = {
        headers: {
          authorization: 'Bearer token-123',
        },
        body: { test: 'data' },
        method: 'POST',
        url: '/api/products',
      };

      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedResponse);

      const mockNext = {
        handle: () => of({ result: 'fresh' }),
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const observable = await interceptor.intercept(context, mockNext as any);
      return new Promise((resolve) => {
        observable.subscribe((response) => {
          expect(response).toEqual(cachedResponse);
          expect(cacheManager.get).toHaveBeenCalled();
          resolve(undefined);
        });
      });
    });

    it('should create hash from method, url, token, and body', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer token-123',
        },
        body: { test: 'data' },
        method: 'PATCH',
        url: '/api/products/123',
      };

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const mockNext = {
        handle: () => of({ result: 'success' }),
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const observable = await interceptor.intercept(context, mockNext as any);
      return new Promise((resolve) => {
        observable.subscribe(() => {
          expect(cacheManager.set).toHaveBeenCalled();
          const callArgs = (cacheManager.set as jest.Mock).mock.calls[0];
          expect(callArgs[0]).toBeDefined();
          expect(callArgs[1]).toEqual({ result: 'success' });
          expect(callArgs[2]).toBe(3600 * 1000); // 1 hour
          resolve(undefined);
        });
      });
    });

    it('should cache for 1 hour (3600000ms)', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer token-123',
        },
        body: { test: 'data' },
        method: 'POST',
        url: '/api/products',
      };

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const mockNext = {
        handle: () => of({ result: 'success' }),
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const observable = await interceptor.intercept(context, mockNext as any);
      return new Promise((resolve) => {
        observable.subscribe(() => {
          const callArgs = (cacheManager.set as jest.Mock).mock.calls[0];
          expect(callArgs[2]).toBe(3600 * 1000);
          resolve(undefined);
        });
      });
    });
  });
});
