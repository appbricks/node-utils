import equal from 'fast-deep-equal';
import Logger from '../log/logger';

export const secure = "KEY_CHAIN";

let queue = Promise.resolve();

/**
 * Storage key update notifications
 */
export enum NotificationType {
  Unchanged = 0,
  Added,
  Modified,
  Removed
}
export interface StorageNotification {
  (key: string, value: any, action: NotificationType): void;
}

/**
 * Platform specific storage implementation
 * 
 * i.e. React Native AsyncStorage
 */
export interface Storage {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null | undefined>;
}

var localStorageImpl : Storage;
export function setLocalStorageImpl(storage: Storage) {
  localStorageImpl = storage;
}

/**
 * Local storage abstraction of a platform specific capability.
 */
export default class LocalStorage {

  private logger: Logger;
  private queue: Promise<string | void>;

  private id: string;
  private data?: { [key: string]: any };

  private notificationCallbacks: { [key: string]: StorageNotification[] }

  /**
   * Creates and instance of the store
   *
   * @param {string} id  A unique ID that identifies the data object
   *                     persisted by this storage instance.
   */
  constructor(id: string) {
    if (id == null) {
      throw("Store ID cannot be null.");
    }

    this.logger = new Logger("LocalStorage");
    this.queue = Promise.resolve();

    this.id = id;

    this.notificationCallbacks = {}
  }

  /**
   * Synchronizes the in-memory LocalStorage with 
   * the platform's persisted storage value. Once
   * loaded all updates to the in-memory data will
   * be written to the platform's persisted storage
   * asynchronously.
   */
  async init() {
    await this.queue;

    if (!this.data) {
      this.queue = localStorageImpl.getItem(this.id)
        .then(dataDoc => {
          this.data = dataDoc ? JSON.parse(dataDoc) : {};

          this.logger.info('Initialized store "' + this.id + '"');
          this.logger.trace('key "' + this.id + '" loaded: ', this.data);
        });

      await this.queue;
    }
  }

  /**
   * @returns {boolean}  Returns if the store has been loaded 
   *                     from the persitance layer.
   */
  isInitialized() : boolean {
    return this.data !== undefined;
  }

  /**
   * @param {string}    key                  The key to notify on. If the key is '*' or null then
   *                                         the callback will be called for any key value change.
   * @param {StorageNotification}  callback  The callback function to register for notifications
   *                                         when an item has been added, deleted or changed.
   */
  registerNotificationHandler(key: string, callback: StorageNotification) {
    var callbackList = this.notificationCallbacks[key];
    if (!callbackList) {
      callbackList = [];
    }
    callbackList.push(callback);
    this.notificationCallbacks[key] = callbackList;
  }

  /**
   * Sends a notification for a key change.
   * 
   * @param {string} key               the key to notify on
   * @param {string} value             the value of the key
   * @param {NotificationType} action  the notification action
   */
  private async _sendNotifications(key: string, value: string, action: NotificationType) {

    // notification callbacks for any key
    var callbacks = this.notificationCallbacks['*']
    if (callbacks) {
      callbacks.forEach(cb => cb(key, value, action));
    }
    // notification callbacks for a specific key
    callbacks = this.notificationCallbacks[key]
    if (callbacks) {
      callbacks.forEach((cb) => (cb(key, value, action)));
    }
  }

  /**
   * Saves the in-memory data to the platform's
   * persisted storage.
   */
  private async _persist() {
    await this.queue;

    const dataDoc = JSON.stringify(this.data);
    this.queue = localStorageImpl.setItem(this.id, dataDoc)
      .then(() => {
        Logger.trace('LocalStorage', 'key "' + this.id + '" saved: ', this.data);
      });
  }

  /**
   * Ensures all changes have been persisted 
   * to the underlying storage implementation
   */
  async flush() {
    await this.queue;
  }
  
  /**
   * Stores an item in the local storage
   *
   * @param {string} key  the key of the item to set in the local store
   * @param {any} value   the value to set
   * @returns {any}       the previous value if any
   */
  async setItem(key: string, value: any): Promise<any> {
    var oldValue = this.data![key]
    if (equal(oldValue, value)) {
      this._sendNotifications(key, value, NotificationType.Unchanged);
    } else {
      this.data![key] = value;
      this._sendNotifications(key, value, !oldValue ? NotificationType.Added : NotificationType.Modified);
      await this._persist();
    }
    return oldValue;
  }

  /**
   * Removes an item from local storage
   *
   * @param {string} key  the key of the item to delete
   * @returns {any}       the value of the deleted item
   */
  async removeItem(key: string): Promise<any> {

    let value = this.data![key];
    if (value) {
      delete this.data![key];
      this._sendNotifications(key, value, NotificationType.Removed);
      this._persist();
    }
    return value;
  }

  /**
   * Retrieves an item from the local storage
   *
   * @param {string} key  the key of the item to lookup
   * @returns {any}       the value
   */
  getItem(key: string) {
    return this.data![key];
  }

  /**
   * Clears the app local storage
   */
  async clear() {
    for (const key in this.data!) {
      this._sendNotifications(key, this.data![key], NotificationType.Removed);
    }
    this.data! = {};
    this._persist();
  }
}
