import winston from 'winston';

export declare var logger: winston.Logger;

var loggerName: string;

/**
 * Initializes the logging infrastructure
 *
 * @param name   the name of this logger
 * @param level  the log level
 */
export function initLogger(name: string, level: string) {

  loggerName = name

  logger = winston.createLogger({
    level: level,
  });
}

/**
 * Sends log messages to the console.
 */
export function addConsoleLog(colorize = true) {
  if (logger) {
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize({
            all: colorize
          }),
          winston.format.label({
            label: loggerName
          }),
          winston.format.printf(
            info => `${new Date().toISOString()} ${info.level}${' '.repeat(15 - info.level.length)} [${info.label}] ${info.message}`
          )
        )
      })
    );
  } else {
    throw('logger has not been initialized');
  }
}

/**
 * Logger instance with an attached logging context.
 * This ensures the current source context is logged
 * with each message.
 */
export class Logger {

  name!: string;

  /**
   * Constructs a logger with
   * an instance association
   *
   * @param src  the logging source instance object or name
   */
  constructor(src: any) {
    if (src instanceof Object) {
      this.name = src.constructor.name;
    } else {
      this.name = src;
    }
  }

  error(message: string, ...meta: any[]) {
    if (logger.levels['error'] <= logger.levels[logger.level]) {
      logger.error(this.formatLog(message, meta));
    }
  }

  warn(message: string, ...meta: any[]) {
    if (logger.levels['warn'] <= logger.levels[logger.level]) {
      logger.warn(this.formatLog(message, meta));
    }
  }

  info(message: string, ...meta: any[]) {
    if (logger.levels['info'] <= logger.levels[logger.level]) {
      logger.info(this.formatLog(message, meta));
    }
  }

  debug(message: string, ...meta: any[]) {
    if (logger.levels['debug'] <= logger.levels[logger.level]) {
      logger.debug(this.formatLog(message, meta));
    }
  }

  private formatLog(message: string, meta: any[]): string {

    var i: number;
    var msg = `${this.name}: ${message}`

    for (i = 0; i < meta.length; i++) {
      msg += i == 0 ? ': ' : '; '

      let m = meta[i]
      if (m instanceof Object) {
        msg += JSON.stringify(m, null, 2)
      } else {
        msg += m
      }
    }
    return msg
  }
}
