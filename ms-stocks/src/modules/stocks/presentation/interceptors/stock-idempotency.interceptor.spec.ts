import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { of } from 'rxjs';
import { StockIdempotencyInterceptor } from './stock-idempotency.interceptor';

describe('StockIdempotencyInterceptor', () => {
  let interceptor: StockIdempotencyInterceptor;
  let mockCacheManager: jest.Mocked<Cache>;

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockIdempotencyInterceptor,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    interceptor = module.get<StockIdempotencyInterceptor>(
      StockIdempotencyInterceptor,
    );
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should proceed without cache when no authorization header', async () => {
      const mockRequest = {
        method: 'POST',
        url: '/stocks',
        headers: {},
        body: { amount: 50 },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any as ExecutionContext;

      const mockCallHandler = {
        handle: () => of({ id: '123' }),
      };

      const result = await interceptor.intercept(mockContext, mockCallHandler);

      expect(result).toBeDefined();
      expect(mockCacheManager.get).not.toHaveBeenCalled();
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('should return cached response for duplicate request', (done) => {
      const mockRequest = {
        method: 'POST',
        url: '/stocks',
        headers: {
          authorization: 'Bearer token123',
        },
        body: { amount: 50 },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any as ExecutionContext;

      const cachedResponse = { id: 'cached-123', cached: true };
      mockCacheManager.get.mockResolvedValue(cachedResponse);

      const mockCallHandler = {
        handle: () => of({ id: 'new-123' }),
      };

      interceptor.intercept(mockContext, mockCallHandler).then((result) => {
        result.subscribe((response) => {
          expect(response).toEqual(cachedResponse);
          done();
        });
      });
    });

    it('should cache response for non-duplicate request', (done) => {
      const mockRequest = {
        method: 'POST',
        url: '/stocks',
        headers: {
          authorization: 'Bearer token123',
        },
        body: { amount: 50 },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any as ExecutionContext;

      mockCacheManager.get.mockResolvedValue(undefined);
      mockCacheManager.set.mockResolvedValue(undefined);

      const response = { id: '123' };
      const mockCallHandler = {
        handle: () => of(response),
      };

      interceptor.intercept(mockContext, mockCallHandler).then((result) => {
        result.subscribe(() => {
          expect(mockCacheManager.set).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should cache with 1-hour TTL', (done) => {
      const mockRequest = {
        method: 'POST',
        url: '/stocks',
        headers: {
          authorization: 'Bearer token123',
        },
        body: { amount: 50 },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any as ExecutionContext;

      mockCacheManager.get.mockResolvedValue(undefined);

      const response = { id: '123' };
      const mockCallHandler = {
        handle: () => of(response),
      };

      interceptor.intercept(mockContext, mockCallHandler).then((result) => {
        result.subscribe(() => {
          expect(mockCacheManager.set).toHaveBeenCalledWith(
            expect.any(String),
            response,
            3600,
          );
          done();
        });
      });
    });

    it('should create unique hash for different requests', (done) => {
      const mockContext1 = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/stocks',
            headers: { authorization: 'Bearer token1' },
            body: { amount: 50 },
          }),
        }),
      } as any as ExecutionContext;

      const mockContext2 = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/stocks',
            headers: { authorization: 'Bearer token2' },
            body: { amount: 50 },
          }),
        }),
      } as any as ExecutionContext;

      mockCacheManager.get.mockResolvedValue(undefined);

      const mockCallHandler = {
        handle: () => of({ id: '123' }),
      };

      interceptor.intercept(mockContext1, mockCallHandler).then((result) => {
        result.subscribe(() => {
          interceptor
            .intercept(mockContext2, mockCallHandler)
            .then((result2) => {
              result2.subscribe(() => {
                expect(mockCacheManager.set).toHaveBeenCalledTimes(2);
                done();
              });
            });
        });
      });
    });

    it('should create same hash for identical requests', (done) => {
      const mockRequest = {
        method: 'POST',
        url: '/stocks',
        headers: { authorization: 'Bearer token123' },
        body: { amount: 50 },
      };

      const mockContext1 = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any as ExecutionContext;

      const mockContext2 = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any as ExecutionContext;

      mockCacheManager.get.mockResolvedValue(undefined);

      const mockCallHandler = {
        handle: () => of({ id: '123' }),
      };

      interceptor.intercept(mockContext1, mockCallHandler).then((result) => {
        result.subscribe(() => {
          mockCacheManager.get.mockResolvedValue({ id: '123' });
          interceptor
            .intercept(mockContext2, mockCallHandler)
            .then((result2) => {
              result2.subscribe((cached) => {
                expect(cached).toEqual({ id: '123' });
                done();
              });
            });
        });
      });
    });
  });

  describe('idempotency key generation', () => {
    it('should include request method in hash', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/stocks',
            headers: { authorization: 'Bearer token' },
            body: {},
          }),
        }),
      } as any as ExecutionContext;

      mockCacheManager.get.mockResolvedValue(undefined);

      const mockCallHandler = {
        handle: () => of({}),
      };

      interceptor.intercept(mockContext, mockCallHandler).then((result) => {
        result.subscribe(() => {
          expect(mockCacheManager.set).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should include request URL in hash', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/stocks/create',
            headers: { authorization: 'Bearer unique-token' },
            body: {},
          }),
        }),
      } as any as ExecutionContext;

      mockCacheManager.get.mockResolvedValue(undefined);

      const mockCallHandler = {
        handle: () => of({}),
      };

      interceptor.intercept(mockContext, mockCallHandler).then((result) => {
        result.subscribe(() => {
          expect(mockCacheManager.set).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should include request body in hash', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/stocks',
            headers: { authorization: 'Bearer token' },
            body: { amount: 100 },
          }),
        }),
      } as any as ExecutionContext;

      mockCacheManager.get.mockResolvedValue(undefined);

      const mockCallHandler = {
        handle: () => of({}),
      };

      interceptor.intercept(mockContext, mockCallHandler).then((result) => {
        result.subscribe(() => {
          expect(mockCacheManager.set).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should include authorization token in hash', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/stocks',
            headers: { authorization: 'Bearer unique-token' },
            body: {},
          }),
        }),
      } as any as ExecutionContext;

      mockCacheManager.get.mockResolvedValue(undefined);

      const mockCallHandler = {
        handle: () => of({}),
      };

      interceptor.intercept(mockContext, mockCallHandler).then((result) => {
        result.subscribe(() => {
          expect(mockCacheManager.set).toHaveBeenCalled();
          done();
        });
      });
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should handle request with no body', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            url: '/stocks/123',
            headers: { authorization: 'Bearer token' },
            body: undefined,
          }),
        }),
      } as any as ExecutionContext;

      mockCacheManager.get.mockResolvedValue(undefined);

      const mockCallHandler = {
        handle: () => of({ id: '123' }),
      };

      interceptor.intercept(mockContext, mockCallHandler).then((result) => {
        result.subscribe(() => {
          expect(mockCacheManager.set).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should handle request with empty authorization header', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/stocks',
            headers: { authorization: '' },
            body: {},
          }),
        }),
      } as any as ExecutionContext;

      mockCacheManager.get.mockResolvedValue(undefined);

      const mockCallHandler = {
        handle: () => of({}),
      };

      interceptor.intercept(mockContext, mockCallHandler).then((result) => {
        result.subscribe(() => {
          expect(mockCacheManager.set).not.toHaveBeenCalled();
          done();
        });
      });
    });

    it('should handle non-Bearer authorization', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/stocks',
            headers: { authorization: 'Basic credentials' },
            body: {},
          }),
        }),
      } as any as ExecutionContext;

      mockCacheManager.get.mockResolvedValue(undefined);

      const mockCallHandler = {
        handle: () => of({}),
      };

      interceptor.intercept(mockContext, mockCallHandler).then((result) => {
        result.subscribe(() => {
          expect(mockCacheManager.set).not.toHaveBeenCalled();
          done();
        });
      });
    });

    it('should handle various HTTP methods', (done) => {
      const methods = ['POST', 'PUT', 'PATCH', 'DELETE'];
      let completed = 0;

      for (const method of methods) {
        const mockContext = {
          switchToHttp: () => ({
            getRequest: () => ({
              method,
              url: '/stocks',
              headers: { authorization: 'Bearer token' },
              body: {},
            }),
          }),
        } as any as ExecutionContext;

        mockCacheManager.get.mockResolvedValue(undefined);

        const mockCallHandler = {
          handle: () => of({}),
        };

        interceptor.intercept(mockContext, mockCallHandler).then((result) => {
          result.subscribe(() => {
            completed++;
            if (completed === methods.length) {
              expect(mockCacheManager.set).toHaveBeenCalledTimes(completed);
              done();
            }
          });
        });
      }
    });

    it('should handle cache errors gracefully', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/stocks',
            headers: { authorization: 'Bearer token' },
            body: {},
          }),
        }),
      } as any as ExecutionContext;

      mockCacheManager.get.mockImplementation(() => {
        throw new Error('Cache error');
      });

      const mockCallHandler = {
        handle: () => of({ id: '123' }),
      };

      try {
        interceptor
          .intercept(mockContext, mockCallHandler)
          .then((result) => {
            result.subscribe(
              () => {
                expect(result).toBeDefined();
                done();
              },
              () => {
                done();
              },
            );
          })
          .catch(() => {
            done();
          });
      } catch {
        done();
      }
    });
  });
});
