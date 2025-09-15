import type { RecordModel } from 'pocketbase';
import { describe, expect, it } from 'vitest';
import { createQueryResult, sortRecords } from '../../src/lib/utils';

describe('utils', () => {
  describe('createQueryResult', () => {
    it('should return loading state when isLoading is true', () => {
      const result = createQueryResult(true, null, null);

      expect(result).toEqual({
        isLoading: true,
        isSuccess: false,
        isError: false,
        error: null,
        data: null,
      });
    });

    it('should return error state when error is provided', () => {
      const result = createQueryResult(false, 'Something went wrong', null);

      expect(result).toEqual({
        isLoading: false,
        isSuccess: false,
        isError: true,
        error: 'Something went wrong',
        data: null,
      });
    });

    it('should return success state when data is provided', () => {
      const mockData = [{ id: '1', title: 'Test' }];
      const result = createQueryResult(false, null, mockData);

      expect(result).toEqual({
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null,
        data: mockData,
      });
    });

    it('should return success state with empty array when data is null', () => {
      const result = createQueryResult(false, null, null);

      expect(result).toEqual({
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null,
        data: null,
      });
    });
  });

  describe('sortRecords', () => {
    function createMockRecord<T>(value: T, index: number): RecordModel {
      return {
        ...value,
        id: `${index + 1}`,
        collectionId: `${index + 1}`,
        collectionName: 'test',
      };
    }
    function createMockRecords<T>(...values: T[]): RecordModel[] {
      return values.map((value, index) => createMockRecord(value, index));
    }

    const mockRecords = createMockRecords({ title: 'Charlie', created: '2023-01-01' }, { title: 'Alpha', created: '2023-01-02' }, { title: 'Beta', created: '2023-01-03' });

    it('should sort records by string field in ascending order', () => {
      const result = sortRecords(mockRecords, 'title');

      expect(result).toEqual([
        { id: '2', title: 'Alpha', created: '2023-01-02', collectionId: '2', collectionName: 'test' },
        { id: '3', title: 'Beta', created: '2023-01-03', collectionId: '3', collectionName: 'test' },
        { id: '1', title: 'Charlie', created: '2023-01-01', collectionId: '1', collectionName: 'test' },
      ]);
    });

    it('should sort records by string field in descending order', () => {
      const result = sortRecords(mockRecords, '-title');

      expect(result).toEqual([
        { id: '1', title: 'Charlie', created: '2023-01-01', collectionId: '1', collectionName: 'test' },
        { id: '3', title: 'Beta', created: '2023-01-03', collectionId: '3', collectionName: 'test' },
        { id: '2', title: 'Alpha', created: '2023-01-02', collectionId: '2', collectionName: 'test' },
      ]);
    });

    it('should sort records by string field with explicit + prefix', () => {
      const result = sortRecords(mockRecords, '+title');

      expect(result).toEqual([
        { id: '2', title: 'Alpha', created: '2023-01-02', collectionId: '2', collectionName: 'test' },
        { id: '3', title: 'Beta', created: '2023-01-03', collectionId: '3', collectionName: 'test' },
        { id: '1', title: 'Charlie', created: '2023-01-01', collectionId: '1', collectionName: 'test' },
      ]);
    });

    it('should sort records by numeric field in ascending order', () => {
      const numericRecords = createMockRecords({ id: '1', value: 30, collectionId: '1', collectionName: 'test' }, { id: '2', value: 10, collectionId: '1', collectionName: 'test' }, { id: '3', value: 20, collectionId: '1', collectionName: 'test' });

      const result = sortRecords(numericRecords, 'value');

      expect(result).toEqual([
        { id: '2', value: 10, collectionId: '2', collectionName: 'test' },
        { id: '3', value: 20, collectionId: '3', collectionName: 'test' },
        { id: '1', value: 30, collectionId: '1', collectionName: 'test' },
      ]);
    });

    it('should sort records by numeric field in descending order', () => {
      const numericRecords = createMockRecords({ id: '1', value: 30, collectionId: '1', collectionName: 'test' }, { id: '2', value: 10, collectionId: '1', collectionName: 'test' }, { id: '3', value: 20, collectionId: '1', collectionName: 'test' });

      const result = sortRecords(numericRecords, '-value');

      expect(result).toEqual([
        { id: '1', value: 30, collectionId: '1', collectionName: 'test' },
        { id: '3', value: 20, collectionId: '3', collectionName: 'test' },
        { id: '2', value: 10, collectionId: '2', collectionName: 'test' },
      ]);
    });

    it('should handle mixed types by converting to string', () => {
      const mixedRecords = createMockRecords({ id: '1', value: 30, collectionId: '1', collectionName: 'test' }, { id: '2', value: '10', collectionId: '2', collectionName: 'test' }, { id: '3', value: 20, collectionId: '3', collectionName: 'test' });

      const result = sortRecords(mixedRecords, 'value');

      expect(result).toEqual([
        { id: '2', value: '10', collectionId: '2', collectionName: 'test' },
        { id: '3', value: 20, collectionId: '3', collectionName: 'test' },
        { id: '1', value: 30, collectionId: '1', collectionName: 'test' },
      ]);
    });

    it('should handle undefined values', () => {
      const recordsWithUndefined = createMockRecords({ id: '1', title: 'Charlie', collectionId: '1', collectionName: 'test' }, { id: '2', title: undefined, collectionId: '2', collectionName: 'test' }, { id: '3', title: 'Alpha', collectionId: '3', collectionName: 'test' });

      const result = sortRecords(recordsWithUndefined, 'title');

      expect(result).toEqual([
        { id: '3', title: 'Alpha', collectionId: '3', collectionName: 'test' },
        { id: '1', title: 'Charlie', collectionId: '1', collectionName: 'test' },
        { id: '2', title: undefined, collectionId: '2', collectionName: 'test' },
      ]);
    });

    it('should handle null values', () => {
      const recordsWithNull = createMockRecords({ id: '1', title: 'Charlie', collectionId: '1', collectionName: 'test' }, { id: '2', title: null, collectionId: '2', collectionName: 'test' }, { id: '3', title: 'Alpha', collectionId: '3', collectionName: 'test' });

      const result = sortRecords(recordsWithNull, 'title');

      expect(result).toEqual([
        { id: '3', title: 'Alpha', collectionId: '3', collectionName: 'test' },
        { id: '1', title: 'Charlie', collectionId: '1', collectionName: 'test' },
        { id: '2', title: null, collectionId: '2', collectionName: 'test' },
      ]);
    });

    it('should handle empty array', () => {
      const result = sortRecords([], 'title');

      expect(result).toEqual([]);
    });

    it('should handle single record', () => {
      const singleRecord = createMockRecords({ id: '1', title: 'Test', collectionId: '1', collectionName: 'test' });
      const result = sortRecords(singleRecord, 'title');

      expect(result).toEqual(singleRecord);
    });

    it('should handle equal string values', () => {
      const equalRecords = createMockRecords({ id: '1', title: 'Same', collectionId: '1', collectionName: 'test' }, { id: '2', title: 'Same', collectionId: '2', collectionName: 'test' }, { id: '3', title: 'Same', collectionId: '3', collectionName: 'test' });

      const result = sortRecords(equalRecords, 'title');

      expect(result).toEqual(equalRecords);
    });

    it('should handle equal numeric values', () => {
      const equalRecords = createMockRecords({ id: '1', value: 10, collectionId: '1', collectionName: 'test' }, { id: '2', value: 10, collectionId: '2', collectionName: 'test' }, { id: '3', value: 10, collectionId: '3', collectionName: 'test' });

      const result = sortRecords(equalRecords, 'value');

      expect(result).toEqual(equalRecords);
    });

    it('should handle mixed types with equal values after string conversion', () => {
      const mixedEqualRecords = createMockRecords({ id: '1', value: 10, collectionId: '1', collectionName: 'test' }, { id: '2', value: '10', collectionId: '2', collectionName: 'test' });

      const result = sortRecords(mixedEqualRecords, 'value');

      expect(result).toEqual(mixedEqualRecords);
    });
  });
});
