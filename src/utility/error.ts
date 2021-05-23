import Logger from '../log/logger';

/**
 * Detailed error with extra information
 */
export default class ExError extends Error {

  private cause?: Error;

  /**
   * Constructs and error instance with detailed
   * information including an ability to chain
   * errors.
   *
   * @param name  A name by which to identify this error instance
   * @param err   An error message or Error object
   * @param cause The cause of the error. If 'err' parameter is
   *              an Error instance and 'cause' is not provided
   *              then that is considered the cause.
   */
  constructor(name: string, err?: any, cause?: Error) {
    Logger.trace('Creating Error: ', name, err, cause);

    if (err instanceof Error) {
      let e = <Error>err;

      super(e.message);
      this.cause = e;

    } else if (err) {

      if (typeof err === 'string') {
        super(err);

      } else {
        const errName = Object.getOwnPropertyDescriptor(err, 'name');
        const errStack = Object.getOwnPropertyDescriptor(err, 'stack');
        const errMessage = Object.getOwnPropertyDescriptor(err, 'message');

        if (errMessage) {
          super(errMessage.value);
          if (!cause && errName) {
            this.cause = new Error();
            this.cause.name = errName.value;
            this.cause.message = errMessage.value;
            if (errStack) {
              this.cause.stack = errStack.value;
            }
          }
        } else if (errName) {
          super(errName.value);
        } else {
          super(name);
        }
      }

      if (cause && !this.cause) {
        this.cause = cause;
      }
    } else {
      super(name)
    }

    // Maintains proper stack trace for where our
    // error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExError)
    }

    this.name = name;
  }

  toString(): string {
    return this.name;
  }
}
