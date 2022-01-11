jest.setTimeout(120000);

import exp from 'constants';
import {
  Reducer,
  Store,
  Dispatch,
  combineReducers,
  createStore,
  applyMiddleware
} from 'redux';
import {
  Epic,
  createEpicMiddleware
} from 'redux-observable';

import {
  sleep,
  execAfter,
  combineEpicsWithGlobalErrorHandler,
  reduxLogger,
  setLogLevel,
  LOG_LEVEL_TRACE
} from '../..';

import {
  SUCCESS,
  ERROR,
  ErrorPayload,
  Action,
  createFollowUpAction,
  createAction,
  createErrorAction
} from '../action';
import {
  serviceEpic,
  serviceEpicFanOut,
  serviceEpicSubscription
} from '../service';

// set trace log level
if (process.env.DEBUG) {
  setLogLevel(LOG_LEVEL_TRACE);
}

type TestState = {
  value1: number
  value2: number
  error?: Error
}
const initialState = {value1: 0, value2: 0};

type TestPayloadIn = {
  in: number
}
type TestPayloadOut = {
  out: number
}
type TestPayload = TestPayloadIn | TestPayloadOut | ErrorPayload;

it('dispatches an action to test a service epic', async() => {
  const rootReducer = combineReducers({
    testState: (state: TestState = initialState, action: Action<TestPayload>): TestState => {
      console.log('reduce', {action, state});
      // reduce service result

      switch(action.type) {
        case 'TEST_SERVICE_CALL': {
          const payload = <TestPayloadIn>action.payload!;
          expect(payload.in).toEqual(5);
          return {
            ...state,
            value1: payload.in
          };
        }
        case SUCCESS: {
          const payload = <TestPayloadOut>action.payload!;
          expect(payload.out).toEqual(10);
          return {
            ...state,
            value2: payload.out
          };
        }
        case ERROR: {
          const payload = <ErrorPayload>action.payload!;
          return {
            ...state,
            error: payload.err
          };
        }
      }
      return state;
    }
  });
  type RootState = ReturnType<typeof rootReducer>;

  const epicMiddleware = createEpicMiddleware();
  const store = createStore(
    rootReducer,
    applyMiddleware(reduxLogger, epicMiddleware)
  );

  const rootEpic = combineEpicsWithGlobalErrorHandler(<Epic[]>[
    serviceEpic<TestPayloadIn, RootState>(
      'TEST_SERVICE_CALL',
      async (action, state$) => {
        console.log('dispatch', {action});
        // invoke service epic

        expect(action.payload!.in).toEqual(5);
        return createFollowUpAction<TestPayloadOut, TestPayloadIn>(action, SUCCESS, { out: action.payload!.in * 2 });
      }
    )
  ]);
  epicMiddleware.run(rootEpic);

  store.dispatch(createAction<TestPayloadIn>('TEST_SERVICE_CALL', { in: 5 }));
  await sleep(100);

  const state = store.getState().testState;
  if (state.error) {
    fail(state.error)
  }
  expect(state).toEqual({value1: 5, value2: 10});
});

it('dispatches an action to test a service fan out epic', async() => {
  const rootReducer = combineReducers({
    testState: (state: TestState = initialState, action: Action<TestPayload>): TestState => {
      console.log('reduce', {action, state});
      // reduce service result

      switch(action.type) {
        case 'TEST_SERVICE_CALL_1': {
          const payload = <TestPayloadIn>action.payload!;
          expect(payload.in).toEqual(5);
          break;
        }
        case 'TEST_SERVICE_CALL_2': {
          const payload = <TestPayloadIn>action.payload!;
          expect(payload.in).toEqual(5);
          break;
        }
        case 'TEST_SERVICE_RESP_1': {
          const payload = <TestPayloadOut>action.payload!;
          return {
            ...state,
            value1: state.value1 + payload.out,
            value2: Date.now()
          }
        }
        case 'TEST_SERVICE_RESP_2': {
          const payload = <TestPayloadOut>action.payload!;
          return {
            ...state,
            value1: state.value1 * payload.out,
            value2: Date.now()
          }
        }
        case 'TEST_SERVICE_RESP_3': {
          const payload = <TestPayloadOut>action.payload!;
          return {
            ...state,
            value1: state.value1 + payload.out,
            value2: Date.now()
          }
        }
      }
      return state;
    }
  });
  type RootState = ReturnType<typeof rootReducer>;

  const epicMiddleware = createEpicMiddleware();
  const store = createStore(
    rootReducer,
    applyMiddleware(reduxLogger, epicMiddleware)
  );

  const rootEpic = combineEpicsWithGlobalErrorHandler(<Epic[]>[
    // following calls will execute and return responses asynchronously
    serviceEpicFanOut<TestPayloadIn, RootState>(
      'TEST_SERVICE_CALL_1',
      {
        call1: async (action, state$, callSync) => {
          console.log('service call1', {action});
          // invoke service epic
          expect(action.payload!.in).toEqual(5);
    
          await sleep(100);
          return createFollowUpAction<TestPayloadOut, TestPayloadIn>(action, 'TEST_SERVICE_RESP_1', { out: action.payload!.in * 5 });
        },
        call2: async (action, state$, callSync) => {
          console.log('service call2', {action});
          // invoke service epic
          expect(action.payload!.in).toEqual(5);
    
          let dependsAction = <Action<TestPayloadOut>>(await callSync['call1']);
          return createFollowUpAction<TestPayloadOut, TestPayloadIn>(action, 'TEST_SERVICE_RESP_2', { out: dependsAction.payload!.out * 2 });
        },
        call3: async (action, state$, callSync) => {
          console.log('service call3', {action});
          // invoke service epic
          expect(action.payload!.in).toEqual(5);
    
          return createFollowUpAction<TestPayloadOut, TestPayloadIn>(action, 'TEST_SERVICE_RESP_3', { out: action.payload!.in * 8 });
        }
      }
    ),
    // following calls will execute asynchronously but responses are returned synchronously
    serviceEpicFanOut<TestPayloadIn, RootState>(
      'TEST_SERVICE_CALL_2',
      {
        call1: async (action, state$, callSync) => {
          console.log('service call1', {action});
          // invoke service epic
          expect(action.payload!.in).toEqual(5);
    
          await sleep(100);
          return createFollowUpAction<TestPayloadOut, TestPayloadIn>(action, 'TEST_SERVICE_RESP_1', { out: action.payload!.in * 5 });
        },
        call2: async (action, state$, callSync) => {
          console.log('service call2', {action});
          // invoke service epic
          expect(action.payload!.in).toEqual(5);
    
          let dependsAction = <Action<TestPayloadOut>>(await callSync['call1']);
          return createFollowUpAction<TestPayloadOut, TestPayloadIn>(action, 'TEST_SERVICE_RESP_2', { out: dependsAction.payload!.out * 2 });
        },
        call3: async (action, state$, callSync) => {
          console.log('service call3', {action});
          // invoke service epic
          expect(action.payload!.in).toEqual(5);
    
          return createFollowUpAction<TestPayloadOut, TestPayloadIn>(action, 'TEST_SERVICE_RESP_3', { out: action.payload!.in * 8 });
        }
      },
      true
    )
  ]);
  epicMiddleware.run(rootEpic);

  store.dispatch(createAction<TestPayloadIn>('TEST_SERVICE_CALL_1', { in: 5 }));
  await sleep(1000);

  let state = store.getState().testState;
  if (state.error) {
    fail(state.error)
  }
  expect(state.value1).toEqual(3250);

  store.dispatch(createAction<TestPayloadIn>('TEST_SERVICE_CALL_2', { in: 5 }));
  await sleep(1000);

  state = store.getState().testState;
  if (state.error) {
    fail(state.error)
  }
  expect(state.value1).toEqual(163790);
});

it('dispatches an action to test a service subscription epic', async() => {
  let testServiceSubscriptionCallCounter = 0;
  let testSubscriptionUpdateCounter = 0;
  let successCounter = 0;
  let errorCounter = 0;
  let updateCounter = 0;

  const rootReducer = combineReducers({
    testState: (state: TestState = initialState, action: Action<TestPayload>): TestState => {
      console.log('reduce', {action, state});
      // reduce service result

      switch(action.type) {
        case 'TEST_SERVICE_SUBSCRIPTION_CALL': {
          testServiceSubscriptionCallCounter++;
          const payload = <TestPayloadIn>action.payload!;
          expect(payload.in).toEqual(10);
          break;
        }
        case 'TEST_SUBSCRIPTION_UPDATE': {
          testSubscriptionUpdateCounter++;
          const payload = <TestPayloadIn>action.payload!;
          expect(payload.in).toEqual(5);
          return {
            ...state,
            value2: state.value2 + payload.in
          };
        }
        case SUCCESS: {
          successCounter++;
          const payload = <TestPayloadOut>action.payload!;
          expect(payload.out).toEqual(20);
          return {
            ...state,
            value1: state.value1 + payload.out
          };
        }
        case ERROR: {
          errorCounter++;
          const payload = <ErrorPayload>action.payload!;
          expect(payload.err.message).toEqual('subscription connection error');
          return {
            ...state,
          };
        }
      }
      return state;
    }
  });
  type RootState = ReturnType<typeof rootReducer>;

  const epicMiddleware = createEpicMiddleware();
  const store = createStore(
    rootReducer,
    applyMiddleware(reduxLogger, epicMiddleware)
  );

  const rootEpic = combineEpicsWithGlobalErrorHandler(<Epic[]>[
    serviceEpicSubscription<TestPayloadIn, TestPayloadIn, RootState>(
      'TEST_SERVICE_SUBSCRIPTION_CALL',
      async (action, state$, update, error) => {
        console.log('service', {action});
        // invoke service epic
        expect(action.payload!.in).toEqual(10);

        // simulate subscription events
        execAfter(() => {
          console.log('update counter', updateCounter);

          if (updateCounter == 5) {
            error(createErrorAction(new Error('subscription connection error')));
            updateCounter++;
            return false;
          } else {
            update(
              createAction<TestPayloadIn>('TEST_SUBSCRIPTION_UPDATE', { in: 5 }),
              ++updateCounter == 10
            );
          }
          return updateCounter < 10;

        }, 100, true).promise.then(() => console.log('updates done'))

        return createFollowUpAction<TestPayloadOut, TestPayloadIn>(action, SUCCESS, { out: action.payload!.in * 2 });
      }
    )
  ]);
  epicMiddleware.run(rootEpic);

  store.dispatch(createAction<TestPayloadIn>('TEST_SERVICE_SUBSCRIPTION_CALL', { in: 10 }));
  await sleep(2000);

  const state = store.getState().testState;
  if (state.error) {
    fail(state.error)
  }
  expect(state).toEqual({value1: 40, value2: 45});

  expect(testServiceSubscriptionCallCounter).toEqual(2);
  expect(testSubscriptionUpdateCounter).toEqual(9);
  expect(successCounter).toEqual(2);
  expect(errorCounter).toEqual(1);
});