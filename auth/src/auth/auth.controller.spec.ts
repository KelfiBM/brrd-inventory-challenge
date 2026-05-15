import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signIn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('authService should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signIn', () => {
    // Successful sign-in tests
    it('should call authService.signIn with correct parameters', async () => {
      const mockToken = 'mock_jwt_token';
      mockAuthService.signIn.mockResolvedValue({ access_token: mockToken });

      const signInDto = { username: 'user_admin', password: 'hashed_password' };
      const result = await controller.signIn(signInDto);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(
        'user_admin',
        'hashed_password',
      );
      expect(result).toEqual({ access_token: mockToken });
    });

    it('should return access token on successful sign in', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      mockAuthService.signIn.mockResolvedValue({ access_token: mockToken });

      const signInDto = { username: 'user_admin', password: 'hashed_password' };
      const result = await controller.signIn(signInDto);

      expect(result).toEqual({ access_token: mockToken });
      expect(result.access_token).toBe(mockToken);
    });

    it('should extract username and password from DTO', async () => {
      mockAuthService.signIn.mockResolvedValue({ access_token: 'token' });

      const signInDto = { username: 'testuser', password: 'testpass' };
      await controller.signIn(signInDto);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(
        'testuser',
        'testpass',
      );
    });

    // Error handling tests
    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockAuthService.signIn.mockRejectedValue(new UnauthorizedException());

      const signInDto = { username: 'user_admin', password: 'wrong_password' };
      await expect(controller.signIn(signInDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should propagate UnauthorizedException from service', async () => {
      const error = new UnauthorizedException('Invalid credentials');
      mockAuthService.signIn.mockRejectedValue(error);

      const signInDto = { username: 'user', password: 'pass' };
      await expect(controller.signIn(signInDto)).rejects.toThrow(error);
    });

    it('should not catch or modify service exceptions', async () => {
      const originalError = new Error('Custom auth error');
      mockAuthService.signIn.mockRejectedValue(originalError);

      const signInDto = { username: 'user', password: 'pass' };
      await expect(controller.signIn(signInDto)).rejects.toThrow(originalError);
    });

    // Multiple requests tests
    it('should handle multiple sign-in attempts', async () => {
      const mockToken1 = 'token1';
      const mockToken2 = 'token2';
      mockAuthService.signIn
        .mockResolvedValueOnce({ access_token: mockToken1 })
        .mockResolvedValueOnce({ access_token: mockToken2 });

      const signInDto1 = {
        username: 'user_admin',
        password: 'hashed_password',
      };
      const signInDto2 = { username: 'user_user', password: 'hashed_password' };

      const result1 = await controller.signIn(signInDto1);
      const result2 = await controller.signIn(signInDto2);

      expect(result1.access_token).toBe(mockToken1);
      expect(result2.access_token).toBe(mockToken2);
      expect(mockAuthService.signIn).toHaveBeenCalledTimes(2);
    });

    it('should handle sequential failed and successful attempts', async () => {
      mockAuthService.signIn
        .mockRejectedValueOnce(new UnauthorizedException())
        .mockResolvedValueOnce({ access_token: 'success_token' });

      const failDto = { username: 'user', password: 'wrong' };
      const successDto = { username: 'user', password: 'correct' };

      await expect(controller.signIn(failDto)).rejects.toThrow(
        UnauthorizedException,
      );
      const result = await controller.signIn(successDto);
      expect(result.access_token).toBe('success_token');
    });

    // DTO property handling tests
    it('should pass through all DTO properties to authService', async () => {
      mockAuthService.signIn.mockResolvedValue({
        access_token: 'mock_token',
      });

      const signInDto = {
        username: 'test_user',
        password: 'test_password',
        extra: 'field',
      };
      await controller.signIn(signInDto);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(
        'test_user',
        'test_password',
      );
    });

    it('should handle DTO with only required fields', async () => {
      mockAuthService.signIn.mockResolvedValue({
        access_token: 'mock_token',
      });

      const minimalDto = { username: 'user', password: 'pass' };
      await controller.signIn(minimalDto);

      expect(mockAuthService.signIn).toHaveBeenCalledWith('user', 'pass');
    });

    it('should handle DTO with undefined optional fields', async () => {
      mockAuthService.signIn.mockResolvedValue({
        access_token: 'token',
      });

      const dtoWithUndefined = {
        username: 'user',
        password: 'pass',
        rememberMe: undefined,
      };
      await controller.signIn(dtoWithUndefined);

      expect(mockAuthService.signIn).toHaveBeenCalledWith('user', 'pass');
    });

    // Response structure tests
    it('should return response with access_token property', async () => {
      mockAuthService.signIn.mockResolvedValue({
        access_token: 'token_value',
      });

      const result = await controller.signIn({
        username: 'user',
        password: 'pass',
      });

      expect(result).toHaveProperty('access_token');
      expect(typeof result.access_token).toBe('string');
    });

    it('should maintain order of service calls', async () => {
      const callOrder: string[] = [];
      mockAuthService.signIn.mockImplementation(async () => {
        callOrder.push('signIn');
        return { access_token: 'token' };
      });

      const signInDto = { username: 'user_admin', password: 'hashed_password' };
      await controller.signIn(signInDto);

      expect(callOrder).toEqual(['signIn']);
    });

    // Empty/null DTO tests
    it('should pass empty string username to service', async () => {
      mockAuthService.signIn.mockResolvedValue({ access_token: 'token' });

      const dtoWithEmptyUsername = {
        username: '',
        password: 'pass',
      };
      await controller.signIn(dtoWithEmptyUsername);

      expect(mockAuthService.signIn).toHaveBeenCalledWith('', 'pass');
    });

    it('should pass empty string password to service', async () => {
      mockAuthService.signIn.mockResolvedValue({ access_token: 'token' });

      const dtoWithEmptyPassword = {
        username: 'user',
        password: '',
      };
      await controller.signIn(dtoWithEmptyPassword);

      expect(mockAuthService.signIn).toHaveBeenCalledWith('user', '');
    });

    // Special characters and edge cases
    it('should handle usernames with special characters', async () => {
      mockAuthService.signIn.mockResolvedValue({ access_token: 'token' });

      const dtoWithSpecialChars = {
        username: 'user@example.com',
        password: 'pass',
      };
      await controller.signIn(dtoWithSpecialChars);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(
        'user@example.com',
        'pass',
      );
    });

    it('should handle passwords with special characters', async () => {
      mockAuthService.signIn.mockResolvedValue({ access_token: 'token' });

      const dtoWithSpecialPassChars = {
        username: 'user',
        password: 'p@$$w0rd!#%',
      };
      await controller.signIn(dtoWithSpecialPassChars);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(
        'user',
        'p@$$w0rd!#%',
      );
    });

    // Return value integrity tests
    it('should return exact service response', async () => {
      const expectedResponse = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.abc123',
      };
      mockAuthService.signIn.mockResolvedValue(expectedResponse);

      const result = await controller.signIn({
        username: 'user',
        password: 'pass',
      });

      expect(result).toEqual(expectedResponse);
      expect(result).toBe(expectedResponse);
    });

    it('should handle very long access tokens', async () => {
      const longToken = 'a'.repeat(10000);
      mockAuthService.signIn.mockResolvedValue({
        access_token: longToken,
      });

      const result = await controller.signIn({
        username: 'user',
        password: 'pass',
      });

      expect(result.access_token).toBe(longToken);
      expect(result.access_token.length).toBe(10000);
    });

    // Additional branch coverage tests
    it('should directly return authService result without modification', async () => {
      const serviceResult = { access_token: 'direct_token' };
      mockAuthService.signIn.mockResolvedValue(serviceResult);

      const result = await controller.signIn({
        username: 'user',
        password: 'pass',
      });

      expect(result).toBe(serviceResult);
    });

    it('should pass exact DTO fields to service', async () => {
      mockAuthService.signIn.mockResolvedValue({ access_token: 'token' });

      const dto = { username: 'exact_user', password: 'exact_pass' };
      await controller.signIn(dto);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(
        'exact_user',
        'exact_pass',
      );
    });

    it('should call signIn method on authService', async () => {
      const callTracker = { called: false };
      mockAuthService.signIn.mockImplementation(async () => {
        callTracker.called = true;
        return { access_token: 'token' };
      });

      await controller.signIn({ username: 'user', password: 'pass' });

      expect(callTracker.called).toBe(true);
    });

    it('should handle successful token retrieval from service', async () => {
      const successToken = 'success_jwt_token';
      mockAuthService.signIn.mockResolvedValue({ access_token: successToken });

      const result = await controller.signIn({
        username: 'user',
        password: 'pass',
      });

      expect(result.access_token).toBe(successToken);
    });

    it('should immediately throw when service throws', async () => {
      const testError = new UnauthorizedException('Test error');
      mockAuthService.signIn.mockRejectedValue(testError);

      await expect(
        controller.signIn({ username: 'user', password: 'pass' }),
      ).rejects.toThrow(testError);
    });

    it('should handle DTO with both username and password properties', async () => {
      mockAuthService.signIn.mockResolvedValue({ access_token: 'token' });

      const completeDto = {
        username: 'complete_user',
        password: 'complete_pass',
      };
      await controller.signIn(completeDto);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(
        'complete_user',
        'complete_pass',
      );
    });

    it('should ensure service method is awaited', async () => {
      mockAuthService.signIn.mockResolvedValue({
        access_token: 'awaited_token',
      });

      const result = await controller.signIn({
        username: 'user',
        password: 'pass',
      });

      expect(result.access_token).toBe('awaited_token');
    });

    it('should return response with structure { access_token: string }', async () => {
      mockAuthService.signIn.mockResolvedValue({ access_token: 'test_token' });

      const result = await controller.signIn({
        username: 'user',
        password: 'pass',
      });

      expect(result).toHaveProperty('access_token');
      expect(typeof result.access_token).toBe('string');
    });

    it('should not add or remove properties from service response', async () => {
      const originalResponse = { access_token: 'token_only' };
      mockAuthService.signIn.mockResolvedValue(originalResponse);

      const result = await controller.signIn({
        username: 'user',
        password: 'pass',
      });

      expect(Object.keys(result).length).toBe(1);
      expect(result).toEqual(originalResponse);
    });
  });
});
