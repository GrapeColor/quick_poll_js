import { Permissions } from 'discord.js';

export const CONST = {
  MANUAL_URL:   process.env['MANUAL_URL'],
  SUPPORT_URL:  process.env['SUPPORT_URL'],
  DONATION_URL: process.env['DONATION_URL'],

  REQUIRED_PERMISSIONS: new Permissions(388160),

  DEFAULT_PREFIX: '/',
  DEFAULT_LOCALE: 'ja',

  RESET_RATE_LIMIT: 10,
  RATE_LIMIT_BOT_COMMAND: 5,

  QUEUE_TIMEOUT: 3 * 60 * 1000,

  COLOR_POLL:   0x3b88c3,
  COLOR_EXPOLL: 0x3b88c4,
  COLOR_RESULT: 0xdd2e44,
  COLOR_WAIT:   0x9867c6,
  COLOR_ERROR:  0xffcc4d,
  COLOR_HELP:   0xff922f,

  MAX_OPTIONS: 20,
  MAX_NUMBER: 10,

  QUERY_MAX:  200,
  OPTION_MAX: 200
};
