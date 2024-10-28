import { describe, it, expect } from "vitest";
import { z } from 'zod';
import {
  generateFileTestsSchema,
  TestFileSchemaLoose,
  createTestFileSchema,
  GenerateFileTestsInput
} from './schema';

describe('Schema', () => {
  describe('generateFileTestsSchema', () => {
    it('should validate correct input', () => {
      const validInput = {
        files: [
          { path: 'src/component.tsx', content: 'component content' },
          { path: 'lib/util.ts', content: 'util content' }
        ]
      };
      expect(() => generateFileTestsSchema.parse(validInput)).not.toThrow();
    });

    it('should reject invalid input', () => {
      const invalidInput = {
        files: [
          { path: 123, content: 'invalid path type' },
          { content: 'missing path' }
        ]
      };
      expect(() => generateFileTestsSchema.parse(invalidInput)).toThrow();
    });
  });

  describe('TestFileSchemaLoose', () => {
    it('should validate correct input', () => {
      const validInput = {
        tests: [
          { name: 'test1.ts', content: 'test content 1' },
          { name: 'test2.ts', content: 'test content 2' }
        ]
      };
      expect(() => TestFileSchemaLoose.parse(validInput)).not.toThrow();
    });

    it('should reject invalid input', () => {
      const invalidInput = {
        tests: [
          { name: 123, content: 'invalid name type' },
          { content: 'missing name' }
        ]
      };
      expect(() => TestFileSchemaLoose.parse(invalidInput)).toThrow();
    });
  });

  describe('createTestFileSchema', () => {
    it('should create a schema that validates the correct number of tests', () => {
      const schema = createTestFileSchema(2);
      const validInput = {
        tests: [
          { name: 'test1.ts', content: 'test content 1' },
          { name: 'test2.ts', content: 'test content 2' }
        ]
      };
      expect(() => schema.parse(validInput)).not.toThrow();

      const invalidInput = {
        tests: [
          { name: 'test1.ts', content: 'test content 1' }
        ]
      };
      expect(() => schema.parse(invalidInput)).toThrow('Number of test files must match number of input files (expected 2)');
    });
  });

  describe('GenerateFileTestsInput type', () => {
    it('should be inferred correctly from generateFileTestsSchema', () => {
      const input: GenerateFileTestsInput = {
        files: [
          { path: 'src/component.tsx', content: 'component content' },
          { path: 'lib/util.ts', content: 'util content' }
        ]
      };
      expect(generateFileTestsSchema.parse(input)).toEqual(input);
    });
  });
});
