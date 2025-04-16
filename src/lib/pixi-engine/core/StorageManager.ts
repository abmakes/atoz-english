/**
 * Provides an abstraction layer for interacting with localStorage,
 * handling namespacing and potential errors.
 */
export class StorageManager {
  private namespace: string;

  /**
   * Creates an instance of StorageManager.
   * @param namespace - An optional namespace prefix for all keys stored by this instance.
   */
  constructor(namespace: string = 'pixi-engine') {
    this.namespace = namespace;
    if (!this.isStorageAvailable()) {
      console.warn("StorageManager: localStorage is not available.");
    }
  }

  /**
   * Checks if localStorage is available and usable.
   * @returns True if localStorage is available, false otherwise.
   */
  public isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch {
      // localStorage is not available or accessible
      return false;
    }
  }

  /**
   * Prefixes the given key with the namespace.
   * @param key - The original key.
   * @returns The namespaced key.
   */
  private _getNamespacedKey(key: string): string {
    return `${this.namespace}/${key}`;
  }

  /**
   * Retrieves an item from localStorage.
   * @param key - The key of the item to retrieve.
   * @returns The retrieved item (parsed from JSON), or null if not found or error occurs.
   */
  public get<T>(key: string): T | null {
    if (!this.isStorageAvailable()) return null;
    try {
      const item = localStorage.getItem(this._getNamespacedKey(key));
      return item ? JSON.parse(item) as T : null;
    } catch (error) {
      console.error(`StorageManager: Error getting item '${key}'`, error);
      return null;
    }
  }

  /**
   * Stores an item in localStorage.
   * @param key - The key under which to store the item.
   * @param value - The value to store (will be JSON.stringify'd).
   */
  public set<T>(key: string, value: T): void {
    if (!this.isStorageAvailable()) return;
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this._getNamespacedKey(key), serializedValue);
    } catch (error) {
      console.error(`StorageManager: Error setting item '${key}'`, error);
    }
  }

  /**
   * Removes an item from localStorage.
   * @param key - The key of the item to remove.
   */
  public remove(key: string): void {
    if (!this.isStorageAvailable()) return;
    try {
      localStorage.removeItem(this._getNamespacedKey(key));
    } catch (error) {
      console.error(`StorageManager: Error removing item '${key}'`, error);
    }
  }

  /**
   * Clears all items within this manager's namespace from localStorage.
   */
  public clear(): void {
    if (!this.isStorageAvailable()) return;
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(`${this.namespace}/`)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error(`StorageManager: Error clearing namespace '${this.namespace}'`, error);
    }
  }
}
