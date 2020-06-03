import { LOG_LEVEL_TRACE, LOG_LEVEL_DEBUG, LOG_LEVEL_INFO, LOG_LEVEL_WARN, setLogLevel } from '../logger';

import Logger from '../logger';

/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/explicit-module-boundary-types: 0 */

/** Mock console logger with assertions **/

let msgAssertion: RegExp;
let msgFormatAssertion: any;
let msgParamAssertions: string[];

const consoleLogFn = console.log;
const mockedLogFn = jest.fn((message?: any, ...optionalParams: any[]): void => {
  expect(message).toMatch(msgAssertion);

  let j = 0;
  if (msgFormatAssertion != undefined) {
    expect(optionalParams[0]).toEqual(msgFormatAssertion);
    j++;
  }
  expect(optionalParams.length - j).toEqual(msgParamAssertions.length);
  for (let i = j; i < optionalParams.length; i++) {
    expect(optionalParams[i]).toEqual(msgParamAssertions[i - j]);
  }
});

beforeEach(() => {
  console.log = mockedLogFn;
});

afterEach(() => {
  console.log = consoleLogFn;
});

/** Log helper functions */

function logMessages() {
  const logger = new Logger('TestLogger');

  // Error message
  msgFormatAssertion = 'color: #CC0000; font-weight: bold';
  msgParamAssertions = ['arg1', 'arg2'];

  msgAssertion = /\[\d{2}\/\d{2}\/\d{4}.*\] ERROR \(some name\): an error message/;
  Logger.error('some name', 'an error message', 'arg1', 'arg2');
  msgAssertion = /\[\d{2}\/\d{2}\/\d{4}.*\] ERROR \(TestLogger\): an error message/;
  logger.error('an error message', 'arg1', 'arg2');

  // Warning message
  msgFormatAssertion = 'color: #FF9933; font-weight: bold';
  msgParamAssertions = ['arg1', 'arg2', 'arg3'];

  msgAssertion = /\[\d{2}\/\d{2}\/\d{4}.*\] WARN \(some name\): a warning message/;
  Logger.warn('some name', 'a warning message', 'arg1', 'arg2', 'arg3');
  msgAssertion = /\[\d{2}\/\d{2}\/\d{4}.*\] WARN \(TestLogger\): a warning message/;
  logger.warn('a warning message', 'arg1', 'arg2', 'arg3');

  // Informational message
  msgFormatAssertion = 'color: #009933; font-style: italic';
  msgParamAssertions = ['arg1', 'arg2', 'arg3', 'arg4'];

  msgAssertion = /\[\d{2}\/\d{2}\/\d{4}.*\] INFO \(some name\): an informational message/;
  Logger.info('some name', 'an informational message', 'arg1', 'arg2', 'arg3', 'arg4');
  msgAssertion = /\[\d{2}\/\d{2}\/\d{4}.*\] INFO \(TestLogger\): an informational message/;
  logger.info('an informational message', 'arg1', 'arg2', 'arg3', 'arg4');

  msgFormatAssertion = undefined;

  // Debug message
  msgParamAssertions = ['arg1'];

  msgAssertion = /\[\d{2}\/\d{2}\/\d{4}.*\] DEBUG \(some name\): a debug message/;
  Logger.debug('some name', 'a debug message', 'arg1');
  msgAssertion = /\[\d{2}\/\d{2}\/\d{4}.*\] DEBUG \(TestLogger\): a debug message/;
  logger.debug('a debug message', 'arg1');

  // Trace message
  msgParamAssertions = ['arg1', 'arg4'];

  msgAssertion = /\[\d{2}\/\d{2}\/\d{4}.*\] TRACE \(some name\): a trace message/;
  Logger.trace('some name', 'a trace message', 'arg1', 'arg4');
  msgAssertion = /\[\d{2}\/\d{2}\/\d{4}.*\] TRACE \(TestLogger\): a trace message/;
  logger.trace('a trace message', 'arg1', 'arg4');
}

/** Run Tests **/

it('logs errors only', () => {
  logMessages();
  expect(mockedLogFn.mock.calls.length).toBe(2);
  mockedLogFn.mock.calls.length = 0;
});

it('logs warnings and errors only', () => {
  setLogLevel(LOG_LEVEL_WARN);
  logMessages();
  expect(mockedLogFn.mock.calls.length).toBe(4);
  mockedLogFn.mock.calls.length = 0;
});

it('logs info, warnings and errors only', () => {
  setLogLevel(LOG_LEVEL_INFO);
  logMessages();
  expect(mockedLogFn.mock.calls.length).toBe(6);
  mockedLogFn.mock.calls.length = 0;
});

it('logs debug, info, warnings and errors only', () => {
  setLogLevel(LOG_LEVEL_DEBUG);
  logMessages();
  expect(mockedLogFn.mock.calls.length).toBe(8);
  mockedLogFn.mock.calls.length = 0;
});

it('logs all messages', () => {
  setLogLevel(LOG_LEVEL_TRACE);
  logMessages();
  expect(mockedLogFn.mock.calls.length).toBe(10);
  mockedLogFn.mock.calls.length = 0;
});
