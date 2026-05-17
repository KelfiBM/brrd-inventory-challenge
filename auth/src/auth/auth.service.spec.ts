import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UserService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('userService should be defined', () => {
    expect(userService).toBeDefined();
  });

  it('jwtService should be defined', () => {
    expect(jwtService).toBeDefined();
  });

  describe('signIn', () => {
    // Valid credential tests
    it('should return access token for valid credentials (admin user)', async () => {
      const mockToken = 'mock_jwt_token_admin';
      mockJwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.signIn('user_admin', 'hashed_password');

      expect(result).toEqual({ access_token: mockToken });
      expect(mockJwtService.signAsync).toHaveBeenCalled();
    });

    it('should return access token for valid credentials (regular user)', async () => {
      const mockToken = 'mock_jwt_token_user';
      mockJwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.signIn('user_user', 'hashed_password');

      expect(result).toEqual({ access_token: mockToken });
      expect(mockJwtService.signAsync).toHaveBeenCalled();
    });

    // Invalid password tests
    it('should throw UnauthorizedException for invalid password', async () => {
      const error = await service
        .signIn('user_admin', 'wrong_password')
        .catch((e) => e);
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for null-like passwords', async () => {
      await expect(
        service.signIn('user_admin', 'invalid_pass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    // Non-existent user tests
    it('should throw UnauthorizedException for nonexistent user', async () => {
      await expect(
        service.signIn('nonexistent_user', 'any_password'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    // Empty/whitespace tests
    it('should throw UnauthorizedException for empty username', async () => {
      await expect(service.signIn('', 'hashed_password')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for empty password', async () => {
      await expect(service.signIn('user_admin', '')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for both empty credentials', async () => {
      await expect(service.signIn('', '')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    // JWT Payload structure tests
    it('should include user id in JWT payload', async () => {
      const mockToken = 'mock_jwt_token';
      mockJwtService.signAsync.mockResolvedValue(mockToken);

      await service.signIn('user_admin', 'hashed_password');

      const callArgs = mockJwtService.signAsync.mock.calls[0][0];
      expect(callArgs).toHaveProperty('id', 1);
    });

    it('should include username in JWT payload', async () => {
      const mockToken = 'mock_jwt_token';
      mockJwtService.signAsync.mockResolvedValue(mockToken);

      await service.signIn('user_admin', 'hashed_password');

      const callArgs = mockJwtService.signAsync.mock.calls[0][0];
      expect(callArgs).toHaveProperty('name', 'user_admin');
    });

    it('should include roles in JWT payload', async () => {
      const mockToken = 'mock_jwt_token';
      mockJwtService.signAsync.mockResolvedValue(mockToken);

      await service.signIn('user_admin', 'hashed_password');

      const callArgs = mockJwtService.signAsync.mock.calls[0][0];
      expect(callArgs).toHaveProperty('roles', ['admin']);
    });

    it('should have correct payload structure for admin user', async () => {
      const mockToken = 'mock_jwt_token';
      mockJwtService.signAsync.mockResolvedValue(mockToken);

      await service.signIn('user_admin', 'hashed_password');

      const callArgs = mockJwtService.signAsync.mock.calls[0][0];
      expect(callArgs).toEqual({
        id: 1,
        name: 'user_admin',
        roles: ['admin'],
      });
    });

    it('should have correct payload structure for regular user', async () => {
      const mockToken = 'mock_jwt_token';
      mockJwtService.signAsync.mockResolvedValue(mockToken);

      await service.signIn('user_user', 'hashed_password');

      const callArgs = mockJwtService.signAsync.mock.calls[0][0];
      expect(callArgs).toEqual({
        id: 2,
        name: 'user_user',
        roles: ['user'],
      });
    });

    it('should call jwtService.signAsync exactly once per successful signIn', async () => {
      mockJwtService.signAsync.mockResolvedValue('token');

      await service.signIn('user_admin', 'hashed_password');

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(1);
    });

    it('should not call jwtService.signAsync on failed authentication', async () => {
      await service.signIn('user_admin', 'wrong_password').catch(() => {});

      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    // Case sensitivity tests
    it('should be case-sensitive for username', async () => {
      await expect(
        service.signIn('USER_ADMIN', 'hashed_password'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should be case-sensitive for password', async () => {
      await expect(
        service.signIn('user_admin', 'HASHED_PASSWORD'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    // Special characters and edge cases
    it('should handle username with special characters correctly', async () => {
      await expect(
        service.signIn('user@admin', 'hashed_password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle password with special characters correctly', async () => {
      await expect(
        service.signIn('user_admin', 'pass$word!@#'),
      ).rejects.toThrow(UnauthorizedException);
    });

    // Token generation tests
    it('should generate unique tokens for multiple login attempts', async () => {
      const token1 = 'token_unique_1';
      const token2 = 'token_unique_2';
      mockJwtService.signAsync
        .mockResolvedValueOnce(token1)
        .mockResolvedValueOnce(token2);

      const result1 = await service.signIn('user_admin', 'hashed_password');
      const result2 = await service.signIn('user_admin', 'hashed_password');

      expect(result1.access_token).toBe(token1);
      expect(result2.access_token).toBe(token2);
    });

    it('should handle JWT signing errors gracefully', async () => {
      mockJwtService.signAsync.mockRejectedValueOnce(
        new Error('JWT signing failed'),
      );

      await expect(
        service.signIn('user_admin', 'hashed_password'),
      ).rejects.toThrow();
    });

    it('should verify user data before creating JWT', async () => {
      mockJwtService.signAsync.mockResolvedValue('token');

      await service.signIn('user_admin', 'hashed_password');

      const payload = mockJwtService.signAsync.mock.calls[0][0];
      expect(payload.id).toBeDefined();
      expect(payload.name).toBeDefined();
      expect(payload.roles).toBeDefined();
      expect(Array.isArray(payload.roles)).toBe(true);
    });

    // Additional branch coverage tests
    it('should handle successful password match and return token', async () => {
      const testToken = 'test_jwt_token_123';
      mockJwtService.signAsync.mockResolvedValue(testToken);

      const result = await service.signIn('user_admin', 'hashed_password');

      expect(result.access_token).toBe(testToken);
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('access_token');
    });

    it('should reach JWT signing after successful password validation', async () => {
      mockJwtService.signAsync.mockResolvedValue('token');
      const signAsyncSpy = jest.spyOn(mockJwtService, 'signAsync');

      await service.signIn('user_admin', 'hashed_password');

      expect(signAsyncSpy).toHaveBeenCalled();
      signAsyncSpy.mockRestore();
    });

    it('should not reach JWT signing when password validation fails', async () => {
      mockJwtService.signAsync.mockResolvedValue('token');
      const signAsyncSpy = jest.spyOn(mockJwtService, 'signAsync');

      await service.signIn('user_admin', 'wrong_password').catch(() => {});

      expect(signAsyncSpy).not.toHaveBeenCalled();
      signAsyncSpy.mockRestore();
    });

    it('should create payload with correct user properties', async () => {
      mockJwtService.signAsync.mockResolvedValue('token');

      await service.signIn('user_user', 'hashed_password');

      const payload = mockJwtService.signAsync.mock.calls[0][0];
      expect(payload.id).toBe(2);
      expect(payload.name).toBe('user_user');
      expect(payload.roles).toEqual(['user']);
    });

    it('should properly handle optional chaining with undefined user', async () => {
      await expect(
        service.signIn('totally_invalid_user', 'any_password'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should distinguish between null password and wrong password', async () => {
      await expect(service.signIn('user_admin', 'null')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should successfully authenticate and return token with exact match', async () => {
      const token = 'exact_match_token';
      mockJwtService.signAsync.mockResolvedValue(token);

      const result = await service.signIn('user_admin', 'hashed_password');

      expect(result).toEqual({ access_token: token });
    });

    it('should handle multiple authentication attempts independently', async () => {
      mockJwtService.signAsync
        .mockResolvedValueOnce('token1')
        .mockResolvedValueOnce('token2');

      const result1 = await service.signIn('user_admin', 'hashed_password');
      const result2 = await service.signIn('user_user', 'hashed_password');

      expect(result1.access_token).toBe('token1');
      expect(result2.access_token).toBe('token2');
    });
  });
});
