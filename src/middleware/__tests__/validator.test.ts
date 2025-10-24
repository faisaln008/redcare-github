import { Request, Response, NextFunction } from 'express';
import { validateSearchQuery } from '../validator';
import { ValidationError } from '../../utils/errors';

describe('Validator Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      query: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  describe('validateSearchQuery', () => {
    it('should pass validation with valid parameters', () => {
      mockRequest.query = {
        language: 'typescript',
        createdAfter: '2024-01-01',
        sort: 'stars',
        order: 'desc',
        page: '1',
        perPage: '30',
      };

      expect(() => {
        validateSearchQuery(mockRequest as Request, mockResponse as Response, nextFunction);
      }).not.toThrow();

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should pass validation with no parameters', () => {
      mockRequest.query = {};

      expect(() => {
        validateSearchQuery(mockRequest as Request, mockResponse as Response, nextFunction);
      }).not.toThrow();

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should convert string numbers to actual numbers', () => {
      mockRequest.query = {
        page: '2',
        perPage: '50',
      };

      validateSearchQuery(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.query.page).toBe(2);
      expect(mockRequest.query.perPage).toBe(50);
    });

    it('should throw ValidationError for invalid sort value', () => {
      mockRequest.query = {
        sort: 'invalid',
      };

      expect(() => {
        validateSearchQuery(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid order value', () => {
      mockRequest.query = {
        order: 'invalid',
      };

      expect(() => {
        validateSearchQuery(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid date format', () => {
      mockRequest.query = {
        createdAfter: 'not-a-date',
      };

      expect(() => {
        validateSearchQuery(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for page less than 1', () => {
      mockRequest.query = {
        page: '0',
      };

      expect(() => {
        validateSearchQuery(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for page greater than 100', () => {
      mockRequest.query = {
        page: '101',
      };

      expect(() => {
        validateSearchQuery(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for perPage greater than max', () => {
      mockRequest.query = {
        perPage: '101',
      };

      expect(() => {
        validateSearchQuery(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(ValidationError);
    });

    it('should accept valid programming languages', () => {
      const validLanguages = ['typescript', 'javascript', 'python', 'c++', 'c#', 'objective-c'];

      validLanguages.forEach((language) => {
        mockRequest.query = { language };
        expect(() => {
          validateSearchQuery(mockRequest as Request, mockResponse as Response, nextFunction);
        }).not.toThrow();
      });
    });

    it('should strip unknown query parameters', () => {
      mockRequest.query = {
        language: 'typescript',
        unknownParam: 'value',
      };

      validateSearchQuery(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.query).not.toHaveProperty('unknownParam');
      expect(mockRequest.query).toHaveProperty('language');
    });
  });
});

