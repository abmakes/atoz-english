import { StorageManager } from '../../../../src/lib/pixi-engine/core/StorageManager';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem(key: string): string | null {
      return store[key] ?? null;
    },
    setItem(key: string, value: string): void {
      store[key] = value.toString();
    },
    removeItem(key: string): void {
      delete store[key];
    },
    clear(): void {
      store = {};
    },
    key(index: number): string | null {
        return Object.keys(store)[index] || null;
    },
    get length(): number {
        return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('StorageManager', () => {
  let storageManager: StorageManager;
  const testNamespace = 'test-ns';

  beforeEach(() => {
    // Clear the mock before each test
    localStorageMock.clear();
    storageManager = new StorageManager(testNamespace);
  });

  it('should initialize with a namespace', () => {
    expect(storageManager).toBeDefined();
    // Check internal property if accessible, or test via behavior
  });

  it('should correctly check if storage is available', () => {
    // Assuming the mock makes it available
    expect(storageManager.isStorageAvailable()).toBe(true);

    // You might need more complex mocking to test the unavailable case
  });

  it('should set and get items correctly', () => {
    const key = 'testKey';
    const value = { data: 'testData' };
    storageManager.set(key, value);
    const retrievedValue = storageManager.get<typeof value>(key);
    expect(retrievedValue).toEqual(value);
  });

  it('should return null when getting a non-existent key', () => {
    const retrievedValue = storageManager.get('nonExistentKey');
    expect(retrievedValue).toBeNull();
  });

  it('should handle different data types', () => {
    storageManager.set('string', 'hello');
    storageManager.set('number', 123);
    storageManager.set('boolean', true);
    storageManager.set('object', { a: 1 });
    storageManager.set('array', [1, 2, 3]);

    expect(storageManager.get<string>('string')).toBe('hello');
    expect(storageManager.get<number>('number')).toBe(123);
    expect(storageManager.get<boolean>('boolean')).toBe(true);
    expect(storageManager.get<{ a: number }>('object')).toEqual({ a: 1 });
    expect(storageManager.get<number[]>('array')).toEqual([1, 2, 3]);
  });

  it('should apply namespace to keys', () => {
    const key = 'namespacedKey';
    const value = 'namespacedValue';
    storageManager.set(key, value);

    // Directly check mock localStorage
    const namespacedKey = `${testNamespace}/${key}`;
    expect(localStorageMock.getItem(namespacedKey)).toBe(JSON.stringify(value));
    expect(storageManager.get(key)).toBe(value); // Ensure get still works with original key
  });

  it('should remove items correctly', () => {
    const key = 'removeKey';
    storageManager.set(key, 'toRemove');
    expect(storageManager.get(key)).not.toBeNull();
    storageManager.remove(key);
    expect(storageManager.get(key)).toBeNull();

    // Check mock localStorage directly
    const namespacedKey = `${testNamespace}/${key}`;
    expect(localStorageMock.getItem(namespacedKey)).toBeNull();
  });

  it('should clear items only within its namespace', () => {
    const keyInNamespace = 'inNsKey';
    const keyOutOfNamespace = 'otherNs/outNsKey'; // Simulate key from another namespace

    storageManager.set(keyInNamespace, 'data1');
    localStorageMock.setItem(keyOutOfNamespace, JSON.stringify('data2'));

    expect(storageManager.get(keyInNamespace)).toBe('data1');
    expect(localStorageMock.getItem(keyOutOfNamespace)).toBe(JSON.stringify('data2'));

    storageManager.clear();

    expect(storageManager.get(keyInNamespace)).toBeNull(); // Item in namespace should be cleared
    expect(localStorageMock.getItem(keyOutOfNamespace)).toBe(JSON.stringify('data2')); // Item outside should remain
  });

  it('should handle JSON parsing errors during get gracefully', () => {
      const key = 'badJsonKey';
      const namespacedKey = `${testNamespace}/${key}`;
      localStorageMock.setItem(namespacedKey, '{invalid json' );

      // Suppress console.error during this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const retrievedValue = storageManager.get(key);
      expect(retrievedValue).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
  });

  it('should handle errors during set gracefully', () => {
    const key = 'setErrorKey';
    const value = { a: 1 };
    const originalSetItem = localStorageMock.setItem;
    localStorageMock.setItem = () => { throw new Error('Simulated set error'); };

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // set should not throw, just log error
    expect(() => storageManager.set(key, value)).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
    localStorageMock.setItem = originalSetItem; // Restore original function
  });

}); 