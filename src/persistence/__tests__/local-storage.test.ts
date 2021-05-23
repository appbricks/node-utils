import equal from 'fast-deep-equal';

import { setLogLevel, LOG_LEVEL_TRACE } from '../../log/logger';
import LocalStorage, { NotificationType, setLocalStorageImpl } from '../local-storage';

// set trace log level
if (process.env.DEBUG) {
  setLogLevel(LOG_LEVEL_TRACE);
}

it('propagates an initialization error from the underlying storage impl', async () => {

  setLocalStorageImpl({
    setItem: (key: string, value: string): Promise<void> => {
      fail('setItem call to impl not expected');
      return Promise.resolve();
    },
    getItem: (key: string): Promise<string | null | undefined> => {
      expect(key).toEqual('test1');

      return new Promise((resolve, reject) => {
        reject('getItem error');
      });
    }
  });

  let stg = new LocalStorage('test1');
  try {
    await stg.init();
  } catch (err) {
    expect(err).toEqual('getItem error');
  }
});

it('propagates an error from the underlying storage impl when persisting the data', async () => {

  setLocalStorageImpl({
    setItem: (key: string, value: string): Promise<void> => {
      expect(key).toEqual('test2');

      return new Promise((resolve, reject) => {
        reject('setItem error');
      });
    },
    getItem: (key: string): Promise<string | null | undefined> => {
      expect(key).toEqual('test2');

      return new Promise((resolve, reject) => {
        resolve(null);
      });
    }
  });

  let stg = new LocalStorage('test2');
  try {
    await stg.init();
    // set item and queue persistence to local impl
    let v = await stg.setItem('a', '1');
    expect(v).toBeUndefined();
  } catch (err) {
    fail(err);
  }

  try {
    // first queued save should have failed
    let v = await stg.setItem('b', '2');
  } catch (err) {
    expect(err).toEqual('setItem error');
  }
});

it('crud persists to the underlying storage impl', async () => {
  var storedValues: { [key: string]: any };
  setLocalStorageImpl({
    setItem: (key: string, value: string): Promise<void> => {
      expect(key).toEqual('test3');

      return new Promise((resolve, reject) => {
        storedValues = JSON.parse(value);
        resolve();
      });
    },
    getItem: (key: string): Promise<string | null | undefined> => {
      expect(key).toEqual('test3');

      return new Promise((resolve, reject) => {
        resolve(JSON.stringify(storedValues));
      });
    }
  });

  let stg = new LocalStorage('test3');
  try {
    await stg.init();
    expect(stg.isInitialized()).toBeTruthy();

    expect(await stg.setItem('a', 1)).toBeUndefined();
    expect(stg.getItem('a')).toEqual(1);

    expect(await stg.setItem('b', {aa: 'AA', bb: 'BB'})).toBeUndefined();
    let b = stg.getItem('b');
    expect(equal(b, {aa: 'AA', bb: 'BB'})).toBeTruthy();

    expect(await stg.setItem('a', 11)).toEqual(1);
    stg.setItem('c', 3);
    stg.setItem('d', 4);
    stg.setItem('e', 5);

    await stg.flush();
    expect(storedValues!).toBeDefined();
    expect(equal(storedValues!, {
      a: 11,
      b: {
        aa: 'AA',
        bb: 'BB'
      },
      c: 3,
      d: 4,
      e: 5
    })).toBeTruthy();

    expect(await stg.removeItem('c')).toEqual(3);
    stg.removeItem('e');

    await stg.flush();
    expect(equal(storedValues!, {
      a: 11,
      b: {
        aa: 'AA',
        bb: 'BB'
      },
      d: 4,
    })).toBeTruthy();

    await stg.clear();
    await stg.flush();
    expect(equal(storedValues!, {})).toBeTruthy();

  } catch (err) {
    fail(err);
  }
});

it('triggers crud notifications', async () => {
  var storedValues: { [key: string]: any };
  setLocalStorageImpl({
    setItem: (key: string, value: string): Promise<void> => {
      expect(key).toEqual('test4');

      return new Promise((resolve, reject) => {
        storedValues = JSON.parse(value);
        resolve();
      });
    },
    getItem: (key: string): Promise<string | null | undefined> => {
      expect(key).toEqual('test4');

      return new Promise((resolve, reject) => {
        resolve(JSON.stringify(storedValues));
      });
    }
  });

  let aUnchanged = 0;
  let aAdded = 0;
  let aModified = 0;
  let aRemoved = 0;

  let bUnchanged = 0;
  let bAdded = 0;
  let bModified = 0;
  let bRemoved = 0;

  let anyUnchanged = 0;
  let anyAdded = 0;
  let anyModified = 0;
  let anyRemoved = 0;

  let inKey = '';
  let inValue = 0;

  let stg = new LocalStorage('test4');
  stg.registerNotificationHandler('a', (key: string, value: any, action: NotificationType) => {
    expect(key).toEqual('a');
    expect(value).toEqual(inValue);
    switch (action) {
      case NotificationType.Unchanged: { ++aUnchanged; break }
      case NotificationType.Added: { ++aAdded; break }
      case NotificationType.Modified: { ++aModified; break }
      case NotificationType.Removed: { ++aRemoved; break }
    }
  })
  stg.registerNotificationHandler('b', (key: string, value: any, action: NotificationType) => {
    expect(key).toEqual('b');
    expect(value).toEqual(inValue);
    switch (action) {
      case NotificationType.Unchanged: { ++bUnchanged; break }
      case NotificationType.Added: { ++bAdded; break }
      case NotificationType.Modified: { ++bModified; break }
      case NotificationType.Removed: { ++bRemoved; break }
    }
  })
  stg.registerNotificationHandler('*', (key: string, value: any, action: NotificationType) => {
    expect(key).toEqual(inKey);
    expect(value).toEqual(inValue);
    switch (action) {
      case NotificationType.Unchanged: { ++anyUnchanged; break }
      case NotificationType.Added: { ++anyAdded; break }
      case NotificationType.Modified: { ++anyModified; break }
      case NotificationType.Removed: { ++anyRemoved; break }
    }
  })

  try {
    await stg.init();
    expect(stg.isInitialized()).toBeTruthy();

    let testKeyValues: { key: string, value: number, set: boolean }[] = [
      { key: 'a', value: 1, set: true },
      { key: 'b', value: 1, set: true },
      { key: 'a', value: 1, set: true },
      { key: 'a', value: 2, set: true },
      { key: 'b', value: 2, set: true },
      { key: 'a', value: 3, set: true },
      { key: 'a', value: 4, set: true },
      { key: 'a', value: 4, set: false },
      { key: 'a', value: 11, set: true },
      { key: 'c', value: 33, set: true }
    ];
    testKeyValues.forEach(testKeyValue => {
      inKey = testKeyValue.key;
      inValue = testKeyValue.value;
      if (testKeyValue.set) {
        stg.setItem(inKey, inValue);
      } else {
        stg.removeItem(inKey);
      }
    })
    await stg.flush();

    expect(aUnchanged).toEqual(1);
    expect(aAdded).toEqual(2);
    expect(aModified).toEqual(3);
    expect(aRemoved).toEqual(1);

    expect(bUnchanged).toEqual(0);
    expect(bAdded).toEqual(1);
    expect(bModified).toEqual(1);
    expect(bRemoved).toEqual(0);

    expect(anyUnchanged).toEqual(1);
    expect(anyAdded).toEqual(4);
    expect(anyModified).toEqual(4);
    expect(anyRemoved).toEqual(1);

  } catch (err) {
    fail(err);
  }
});
