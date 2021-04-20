import { functionKey } from '../function';

it('returns a unique key for a function', () => {
  const fn1 = (): string => {
    return 'test function 1';
  };
  expect(fn1()).toEqual('test function 1');
  expect(functionKey(fn1)).toEqual('L1');
  expect(functionKey(fn1)).toEqual('L1');
  expect(fn1()).toEqual('test function 1');

  const fn2 = (): string => {
    return 'test function 2';
  };
  expect(fn2()).toEqual('test function 2');
  expect(functionKey(fn2)).toEqual('L2');
  expect(functionKey(fn2)).toEqual('L2');
  expect(fn2()).toEqual('test function 2');

  expect(functionKey(fn1)).toEqual('L1');
  expect(functionKey(fn2)).toEqual('L2');
});
