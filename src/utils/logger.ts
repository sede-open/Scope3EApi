import pino, { Level, DestinationStream } from 'pino';
import pretty from 'pino-pretty';
import path from 'path';
import { Environment, getConfig } from '../config';

export const getLogStreamListeners = (): DestinationStream => {
  const {
    logging: { writeLogsToFile },
  } = getConfig();
  const terminalLoggerEntity = pretty({
    colorize: true,
    translateTime: 'HH:MM:ss.l',
    ignore: 'hostname,pid',
    destination: 1,
  });

  if (!writeLogsToFile) {
    return terminalLoggerEntity;
  }

  const createFileLoggerEntry = (level: Level) => ({
    level,
    stream: pretty({
      colorize: false,
      translateTime: 'HH:MM:ss.l',
      ignore: 'hostname,pid',
      destination: pino.destination({
        dest: path.resolve(__dirname, `../../logs/${level}.log`),
        append: true,
        mkdir: true,
      }),
    }),
  });

  return pino.multistream([
    terminalLoggerEntity,
    createFileLoggerEntry('info'),
    createFileLoggerEntry('warn'),
    createFileLoggerEntry('error'),
    createFileLoggerEntry('fatal'),
  ]);
};

// Creates a pretty logger for local environments, and JSON format logs in production environments.
export const logger = [
  Environment.DEV,
  Environment.STAGING,
  Environment.PREPROD,
  Environment.PROD,
].includes(getConfig().environment)
  ? pino({
      level: getConfig().logLevel ?? 'info',
    })
  : pino(
      {
        level: getConfig().logLevel ?? 'info',
      },
      getLogStreamListeners()
    );
