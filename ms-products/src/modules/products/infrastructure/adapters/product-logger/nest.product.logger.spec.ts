import { Test, TestingModule } from '@nestjs/testing';
import { NestProductLogger } from './nest.product.logger';

describe('NestProductLogger', () => {
  let logger: NestProductLogger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NestProductLogger],
    }).compile();

    logger = module.get<NestProductLogger>(NestProductLogger);
  });

  describe('error', () => {
    it('should log error message', () => {
      const spy = jest.spyOn(logger['logger'], 'error');

      logger.error('Test error', 'trace');

      expect(spy).toHaveBeenCalledWith('Test error', 'trace');
    });

    it('should accept metadata', () => {
      const spy = jest.spyOn(logger['logger'], 'error');

      logger.error('Test error', 'trace', 'meta1', 'meta2');

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      const spy = jest.spyOn(logger['logger'], 'warn');

      logger.warn('Test warning');

      expect(spy).toHaveBeenCalledWith('Test warning');
    });

    it('should accept metadata', () => {
      const spy = jest.spyOn(logger['logger'], 'warn');

      logger.warn('Test warning', 'meta1', 'meta2');

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('log', () => {
    it('should log message', () => {
      const spy = jest.spyOn(logger['logger'], 'log');

      logger.log('Test message');

      expect(spy).toHaveBeenCalledWith('Test message');
    });

    it('should accept metadata', () => {
      const spy = jest.spyOn(logger['logger'], 'log');

      logger.log('Test message', 'meta1', 'meta2');

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('verbose', () => {
    it('should log verbose message', () => {
      const spy = jest.spyOn(logger['logger'], 'verbose');

      logger.verbose('Test verbose message');

      expect(spy).toHaveBeenCalledWith('Test verbose message');
    });

    it('should accept metadata', () => {
      const spy = jest.spyOn(logger['logger'], 'verbose');

      logger.verbose('Test verbose message', 'meta1', 'meta2');

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('all log methods consistency', () => {
    it('should have consistent error method signature', () => {
      expect(typeof logger.error).toBe('function');

      const spy = jest.spyOn(logger['logger'], 'error');
      logger.error('Test', 'trace');

      expect(spy).toHaveBeenCalled();
    });

    it('should have consistent warn method signature', () => {
      expect(typeof logger.warn).toBe('function');

      const spy = jest.spyOn(logger['logger'], 'warn');
      logger.warn('Test');

      expect(spy).toHaveBeenCalled();
    });

    it('should have consistent log method signature', () => {
      expect(typeof logger.log).toBe('function');

      const spy = jest.spyOn(logger['logger'], 'log');
      logger.log('Test');

      expect(spy).toHaveBeenCalled();
    });

    it('should have consistent verbose method signature', () => {
      expect(typeof logger.verbose).toBe('function');

      const spy = jest.spyOn(logger['logger'], 'verbose');
      logger.verbose('Test');

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('error logging with different traces', () => {
    it('should accept string trace', () => {
      const spy = jest.spyOn(logger['logger'], 'error');

      logger.error('Error occurred', 'stack trace here');

      expect(spy).toHaveBeenCalledWith('Error occurred', 'stack trace here');
    });

    it('should accept Error object', () => {
      const spy = jest.spyOn(logger['logger'], 'error');
      const error = new Error('Test error');

      logger.error('Error occurred', error.stack);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('metadata handling', () => {
    it('should handle multiple metadata arguments for error', () => {
      const spy = jest.spyOn(logger['logger'], 'error');

      logger.error('Error', 'trace', { context: 'test' }, { userId: '123' });

      expect(spy).toHaveBeenCalled();
    });

    it('should handle multiple metadata arguments for warn', () => {
      const spy = jest.spyOn(logger['logger'], 'warn');

      logger.warn('Warning', { level: 'high' }, { code: 'WARN001' });

      expect(spy).toHaveBeenCalled();
    });

    it('should handle multiple metadata arguments for log', () => {
      const spy = jest.spyOn(logger['logger'], 'log');

      logger.log('Info', { source: 'adapter' }, { action: 'create' });

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('logger instance', () => {
    it('should have internal logger instance', () => {
      expect((logger as any)['logger']).toBeDefined();
    });

    it('should be able to spy on all logger methods', () => {
      const errorSpy = jest.spyOn((logger as any)['logger'], 'error');
      const warnSpy = jest.spyOn((logger as any)['logger'], 'warn');
      const logSpy = jest.spyOn((logger as any)['logger'], 'log');
      const verboseSpy = jest.spyOn((logger as any)['logger'], 'verbose');

      expect(errorSpy).toBeDefined();
      expect(warnSpy).toBeDefined();
      expect(logSpy).toBeDefined();
      expect(verboseSpy).toBeDefined();
    });
  });
});
