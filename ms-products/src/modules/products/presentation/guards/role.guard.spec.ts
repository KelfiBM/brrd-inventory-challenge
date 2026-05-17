import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Role } from '../enum/role.enum';
import { RolesGuard } from './role.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const mockRequest = {
        user: { roles: [Role.User] },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);

      const mockRequest = {
        user: { roles: [Role.Admin, Role.User] },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);

      const mockRequest = {
        user: { roles: [Role.User] },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should allow access when user has any of multiple required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin, Role.User]);

      const mockRequest = {
        user: { roles: [Role.User] },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user has no roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);

      const mockRequest = {
        user: { roles: undefined },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
