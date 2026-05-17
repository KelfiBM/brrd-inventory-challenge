import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    mockJwtService = {
      verifyAsync: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow request with valid token', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer valid.token.here',
            },
          }),
        }),
      } as ExecutionContext;

      const payload = { sub: 1, username: 'test' };
      mockJwtService.verifyAsync.mockResolvedValue(payload);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        'valid.token.here',
      );
    });

    it('should attach user payload to request', async () => {
      const request = {
        headers: {
          authorization: 'Bearer valid.token.here',
        },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as ExecutionContext;

      const payload = { sub: 1, username: 'testuser' };
      mockJwtService.verifyAsync.mockResolvedValue(payload);

      await guard.canActivate(mockContext);

      expect(request['user']).toEqual(payload);
    });

    it('should throw UnauthorizedException when token is missing', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when authorization header is missing', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: undefined,
            },
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token type is not Bearer', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Basic some.token',
            },
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when JWT verification fails', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer invalid.token',
            },
          }),
        }),
      } as ExecutionContext;

      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle malformed authorization header', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'MalformedHeader',
            },
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle authorization header with single space', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer token.with.dot',
            },
          }),
        }),
      } as ExecutionContext;

      mockJwtService.verifyAsync.mockResolvedValue({ sub: 1 });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle various valid token payloads', async () => {
      const payloads = [
        { sub: 1, username: 'user1' },
        { sub: 2, username: 'user2', roles: ['admin'] },
        { sub: 3, email: 'user@example.com' },
      ];

      for (const payload of payloads) {
        const mockContext = {
          switchToHttp: () => ({
            getRequest: () => ({
              headers: {
                authorization: 'Bearer token',
              },
            }),
          }),
        } as ExecutionContext;

        mockJwtService.verifyAsync.mockResolvedValue(payload);

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
      }
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer authorization header', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer extracted.token.here',
            },
          }),
        }),
      } as ExecutionContext;

      mockJwtService.verifyAsync.mockResolvedValue({ sub: 1 });

      await guard.canActivate(mockContext);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        'extracted.token.here',
      );
    });

    it('should return undefined for non-Bearer tokens', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Basic credentials',
            },
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle empty token after Bearer', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer ',
            },
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
