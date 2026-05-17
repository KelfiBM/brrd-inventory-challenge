import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    // Admin user tests
    it('should return admin user when username exists', async () => {
      const result = await service.findOne('user_admin');
      expect(result).toBeDefined();
      expect(result?.username).toBe('user_admin');
      expect(result?.id).toBe(1);
    });

    it('should return user with correct password hash for admin', async () => {
      const result = await service.findOne('user_admin');
      expect(result).toBeDefined();
      expect(result?.password).toBe('hashed_password');
    });

    it('should return admin user with admin role', async () => {
      const result = await service.findOne('user_admin');
      expect(result).toBeDefined();
      expect(result?.roles).toContain('admin');
      expect(result?.roles).toEqual(['admin']);
    });

    it('should have correct admin user structure', async () => {
      const result = await service.findOne('user_admin');
      expect(result).toEqual({
        id: 1,
        username: 'user_admin',
        password: 'hashed_password',
        roles: ['admin'],
      });
    });

    // Regular user tests
    it('should return regular user when username exists', async () => {
      const result = await service.findOne('user_user');
      expect(result).toBeDefined();
      expect(result?.username).toBe('user_user');
      expect(result?.id).toBe(2);
    });

    it('should return user with correct password hash for regular user', async () => {
      const result = await service.findOne('user_user');
      expect(result).toBeDefined();
      expect(result?.password).toBe('hashed_password');
    });

    it('should return regular user with user role', async () => {
      const result = await service.findOne('user_user');
      expect(result).toBeDefined();
      expect(result?.roles).toContain('user');
      expect(result?.roles).toEqual(['user']);
    });

    it('should have correct regular user structure', async () => {
      const result = await service.findOne('user_user');
      expect(result).toEqual({
        id: 2,
        username: 'user_user',
        password: 'hashed_password',
        roles: ['user'],
      });
    });

    // Non-existent user tests
    it('should return undefined when username does not exist', async () => {
      const result = await service.findOne('nonexistent_user');
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty username', async () => {
      const result = await service.findOne('');
      expect(result).toBeUndefined();
    });

    it('should return undefined for whitespace username', async () => {
      const result = await service.findOne('   ');
      expect(result).toBeUndefined();
    });

    it('should return undefined for null-like usernames', async () => {
      const result = await service.findOne('null');
      expect(result).toBeUndefined();
    });

    // Case sensitivity tests
    it('should be case-sensitive for username search', async () => {
      const result = await service.findOne('USER_ADMIN');
      expect(result).toBeUndefined();
    });

    it('should be case-sensitive for user_User search', async () => {
      const result = await service.findOne('user_User');
      expect(result).toBeUndefined();
    });

    it('should be case-sensitive for lowercase searches', async () => {
      const result = await service.findOne('user_admin'.toLowerCase());
      expect(result).toBeDefined();
    });

    // User structure validation tests
    it('should have correct user structure for admin', async () => {
      const result = await service.findOne('user_admin');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('password');
      expect(result).toHaveProperty('roles');
    });

    it('should have correct user structure for regular user', async () => {
      const result = await service.findOne('user_user');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('password');
      expect(result).toHaveProperty('roles');
    });

    it('should have numeric id', async () => {
      const adminUser = await service.findOne('user_admin');
      const regularUser = await service.findOne('user_user');

      expect(typeof adminUser?.id).toBe('number');
      expect(typeof regularUser?.id).toBe('number');
    });

    it('should have string username', async () => {
      const result = await service.findOne('user_admin');
      expect(typeof result?.username).toBe('string');
    });

    it('should have string password', async () => {
      const result = await service.findOne('user_admin');
      expect(typeof result?.password).toBe('string');
    });

    it('should have array roles', async () => {
      const adminUser = await service.findOne('user_admin');
      const regularUser = await service.findOne('user_user');

      expect(Array.isArray(adminUser?.roles)).toBe(true);
      expect(Array.isArray(regularUser?.roles)).toBe(true);
    });

    // User uniqueness tests
    it('should have unique user ids', async () => {
      const adminUser = await service.findOne('user_admin');
      const regularUser = await service.findOne('user_user');

      expect(adminUser?.id).not.toBe(regularUser?.id);
    });

    it('should have unique usernames', async () => {
      const adminUser = await service.findOne('user_admin');
      const regularUser = await service.findOne('user_user');

      expect(adminUser?.username).not.toBe(regularUser?.username);
    });

    // Async behavior tests
    it('should be async function', async () => {
      const result = service.findOne('user_admin');
      expect(result instanceof Promise).toBe(true);
    });

    it('should resolve to user or undefined', async () => {
      const adminResult = await service.findOne('user_admin');
      const noUserResult = await service.findOne('nonexistent');

      expect(adminResult).toBeDefined();
      expect(noUserResult).toBeUndefined();
    });

    // Role validation tests
    it('admin user should have exactly one role', async () => {
      const result = await service.findOne('user_admin');
      expect(result?.roles.length).toBe(1);
    });

    it('regular user should have exactly one role', async () => {
      const result = await service.findOne('user_user');
      expect(result?.roles.length).toBe(1);
    });

    it('admin role should be "admin"', async () => {
      const result = await service.findOne('user_admin');
      expect(result?.roles[0]).toBe('admin');
    });

    it('user role should be "user"', async () => {
      const result = await service.findOne('user_user');
      expect(result?.roles[0]).toBe('user');
    });

    // Multiple calls consistency tests
    it('should return consistent results on multiple calls', async () => {
      const call1 = await service.findOne('user_admin');
      const call2 = await service.findOne('user_admin');
      const call3 = await service.findOne('user_admin');

      expect(call1).toEqual(call2);
      expect(call2).toEqual(call3);
    });

    it('should not modify user data on retrieval', async () => {
      const firstCall = await service.findOne('user_admin');
      const secondCall = await service.findOne('user_admin');

      expect(firstCall?.id).toBe(secondCall?.id);
      expect(firstCall?.username).toBe(secondCall?.username);
      expect(firstCall?.password).toBe(secondCall?.password);
      expect(firstCall?.roles).toEqual(secondCall?.roles);
    });

    // Edge cases
    it('should handle very long username searches', async () => {
      const longUsername = 'a'.repeat(1000);
      const result = await service.findOne(longUsername);
      expect(result).toBeUndefined();
    });

    it('should handle special characters in search', async () => {
      const specialUsername = 'user@admin!#$%';
      const result = await service.findOne(specialUsername);
      expect(result).toBeUndefined();
    });

    it('should return undefined for search with spaces', async () => {
      const usernameWithSpace = 'user admin';
      const result = await service.findOne(usernameWithSpace);
      expect(result).toBeUndefined();
    });
  });
});
