import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('canActivate', () => {
    it('should allow access with valid token', async () => {
      const payload = { sub: 'user-123', email: 'user@test.com' };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockRequest['user']).toEqual(payload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException when no token provided', async () => {
      const mockRequest = {
        headers: {},
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when authorization header is missing Bearer prefix', async () => {
      const mockRequest = {
        headers: {
          authorization: 'invalid-token',
        },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid token'));

      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should extract token from Bearer authorization header', async () => {
      const payload = { sub: 'user-123' };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

      const mockRequest = {
        headers: {
          authorization: 'Bearer my-secret-token',
        },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      await guard.canActivate(context);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('my-secret-token');
    });
  });
});
