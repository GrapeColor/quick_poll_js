import { Permissions } from 'discord.js';

/**
 * Constant structure.
 * @typedef {Object} Const
 * @property {string} MANUAL_URL
 * @property {string} SUPPORT_URL
 * @property {string} DONATION_URL
 * @property {Permissions} REQUIRED_PERMISSIONS
 * @property {string} DEFAULT_PREFIX
 * @property {string} DEFAULT_LOCALE
 * @property {number} QUEUE_TIMEOUT
 * @property {number} COLOR_POLL
 * @property {number} COLOR_EXPOLL
 * @property {number} COLOR_RESULT
 * @property {number} COLOR_WAIT
 * @property {number} COLOR_ERROR
 * @property {number} COLOR_HELP
 * @property {number} MAX_OPTIONS
 * @property {number} MAX_NUMBER
 * @property {number} QUERY_MAX
 * @property {number} OPTION_MAX
 */

/**
 * Constants common within the app.
 * @type {Const}
 */
export const CONST = {
  MANUAL_URL:   process.env['MANUAL_URL'],
  SUPPORT_URL:  process.env['SUPPORT_URL'],
  DONATION_URL: process.env['DONATION_URL'],

  REQUIRED_PERMISSIONS: new Permissions(388160),

  DEFAULT_PREFIX: '/',
  DEFAULT_LOCALE: 'ja',

  QUEUE_TIMEOUT: 60000,

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
