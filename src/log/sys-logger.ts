import winston from 'winston';

export declare var logger: winston.Logger;

var _formatLogLine = false

/**
 * Initializes the logging infrastructure
 *
 * @param name   the name of this logger
 * @param level  the log level
 */
export function initLogger(name: string, level: string) {

  logger = winston.createLogger({
    level: level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.label({
        label: name
      }),
    )
  });
}

/**
 * Sends log messages to the console.
 * 
 * @param unstructured is set to true then logs are written as a
 *                     human readable line format instead of JSON
 */
export function addConsoleLog(unstructured = false) {
  if (logger) {
    if (unstructured) {
      logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({
              all: true
            }),
            winston.format.printf(
              info => `${info.timestamp} ${info.level} [${info.label}] ${info.message}`
            )
          )
        })
      );
      _formatLogLine = true

    } else {
      logger.add(
        new winston.transports.Console({
          format: winston.format.json()
        })
      ); 
    }
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
      if (_formatLogLine) {
        logger.error(this.formatLogLine(message, meta));  
      } else {
        var { msg, data } = this.formatLogMetadata(message, meta)
        logger.error(msg, data);
      }
    }
  }

  warn(message: string, ...meta: any[]) {
    if (logger.levels['warn'] <= logger.levels[logger.level]) {
      if (_formatLogLine) {
        logger.warn(this.formatLogLine(message, meta));  
      } else {
        var { msg, data } = this.formatLogMetadata(message, meta)
        logger.warn(msg, data);
      }
    }
  }

  info(message: string, ...meta: any[]) {
    if (logger.levels['info'] <= logger.levels[logger.level]) {
      if (_formatLogLine) {
        logger.info(this.formatLogLine(message, meta));  
      } else {
        var { msg, data } = this.formatLogMetadata(message, meta)
        logger.info(msg, data);
      }
    }
  }

  debug(message: string, ...meta: any[]) {
    if (logger.levels['debug'] <= logger.levels[logger.level]) {
      if (_formatLogLine) {
        logger.debug(this.formatLogLine(message, meta));  
      } else {
        var { msg, data } = this.formatLogMetadata(message, meta)
        logger.debug(msg, data);
      }
    }
  }

  private formatLogLine(message: string, meta: any[]): string {

    var msg = `${this.name}: ${message}`;
    var data = {}

    for (var i = 0; i < meta.length; i++) {
      let m = meta[i]
      if (m instanceof Object) {
        Object.assign(data, m)
      } else {
        msg += (i == 0 ? ': ' : '; ') + m;
      }
    }
    if (Object.keys(data).length) {
      msg += "\n" + JSON.stringify(data, null, 2);
    }
    return msg;
  }

  private formatLogMetadata(message: string, meta: any[]): { msg: string, data: any } {

    var msg = message;
    var data: any = { name: this.name, logdata: {} }

    for (var i = 0; i < meta.length; i++) {
      let m = meta[i]
      if (m instanceof Object) {
        Object.assign(data.logdata, m)
      } else {
        msg += (i == 0 ? ': ' : '; ') + m
      }
    }
    return { msg, data }
  }
}
