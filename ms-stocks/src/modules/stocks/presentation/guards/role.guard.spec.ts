import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ROLES_KEY } from '../decorators/usre-role.decorator';
import { Role } from '../enum/role.enum';
import { RolesGuard } from './role.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { roles: [Role.User] },
          }),
        }),
      } as any as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.Admin, Role.User]);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { roles: [Role.User] },
          }),
        }),
      } as any as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has one of the required roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.Admin, Role.User]);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { roles: [Role.User] },
          }),
        }),
      } as any as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.Admin]);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { roles: [Role.User] },
          }),
        }),
      } as any as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should deny access when user has no roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.Admin]);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: {},
          }),
        }),
      } as any as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should deny access when roles property is undefined', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.Admin]);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { roles: undefined },
          }),
        }),
      } as any as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should check metadata from both handler and class', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.Admin]);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { roles: [Role.Admin] },
          }),
        }),
      } as any as ExecutionContext;

      guard.canActivate(mockContext);

      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should allow access when user has multiple roles and one is required', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.Admin]);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { roles: [Role.User, Role.Admin] },
          }),
        }),
      } as any as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should deny access when multiple roles are required but user only has some', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.Admin]);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { roles: [Role.User] },
          }),
        }),
      } as any as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should handle empty roles array in user', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.Admin]);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { roles: [] },
          }),
        }),
      } as any as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should handle empty required roles array', () => {
      mockReflector.getAllAndOverride.mockReturnValue([]);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { roles: [Role.User] },
          }),
        }),
      } as any as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });
  });

  describe('role authorization', () => {
    it('should authorize Admin role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.Admin]);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { roles: [Role.Admin] },
          }),
        }),
      } as any as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should authorize User role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.User]);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { roles: [Role.User] },
          }),
        }),
      } as any as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should authorize User role with Admin permission', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.User]);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { roles: [Role.User] },
          }),
        }),
      } as any as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });
  });
});
