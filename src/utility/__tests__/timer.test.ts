import { sleep, execAfter } from '../timer';

/* eslint no-async-promise-executor: 0 */
/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/explicit-module-boundary-types: 0 */

it('pauses for 2000 ms', () => {
  const startTime = Date.now();

  // execute test in a promise as sleep will
  // only pause when run with keyward 'await'
  // from and async function
  return new Promise<void>(async (resolve) => {
    // test sleep for 2s
    await sleep(2000);

    expect(Date.now() - startTime).toBeGreaterThanOrEqual(2000);
    resolve();
  });
});

it('executes a function after 500 ms', () => {
  const startTime = Date.now();

  return execAfter(() => {
    expect(Date.now() - startTime).toBeGreaterThanOrEqual(500);
    return true;
  }, 500).promise;
});

it('executes a function after 500 ms and validates the response', () => {
  const startTime = Date.now();

  const { promise } = execAfter(() => {
    expect(Date.now() - startTime).toBeGreaterThanOrEqual(500);
    return 'done';
  }, 500);

  return promise.then((msg) => {
    expect(msg).toEqual('done');
  });
});

it('executes a function to run after 500 ms but cancels it in 100 ms', () => {
  const startTime = Date.now();

  return new Promise<void>(async (resolve) => {
    const t = execAfter(() => {
      fail('function executed');
    }, 500);

    t.promise.catch((msg) => {
      expect(msg).toEqual('canceled');
    });

    await sleep(100);
    t.cancel();

    try {
      await t.promise;
    } catch (err) {
      expect(err).toEqual('canceled');
    }

    expect(Date.now() - startTime).toBeLessThan(500);
    resolve();
  });
});

it('executes a function to run every 100 ms and cancels it after 1050 ms', () => {
  return new Promise<void>(async (resolve) => {
    const t = execAfter(
      () => {
        return true;
      },
      100,
      true,
    );

    t.promise.then((msg) => {
      expect(msg).toEqual('canceled');
    });

    await sleep(1050);
    t.cancel();
    await t.promise;

    expect(t.count).toEqual(10);
    resolve();
  });
});

it('executes a function to run every 100 ms and it cancels itself after it runs 10 times', () => {
  const startTime = Date.now();
  let counter = 0;

  const t = execAfter(
    () => {
      counter++;
      return counter < 10;
    },
    100,
    true,
  );

  return t.promise.then(() => {
    expect(Date.now() - startTime).toBeGreaterThanOrEqual(1000);
    expect(t.count).toEqual(10);
  });
});
