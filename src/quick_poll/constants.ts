import { Permissions } from 'discord.js';

interface ConstantStruct {
  MANUAL_URL: string;
  SUPPORT_URL: string;
  DONATION_URL: string;

  REQUIRED_PERMISSIONS: Permissions;

  DEFAULT_PREFIX: string;
  DEFAULT_LOCALE: string;

  QUEUE_TIMEOUT: number;

  COLOR_POLL: number;
  COLOR_EXPOLL: number;
  COLOR_RESULT: number;
  COLOR_WAIT: number;
  COLOR_ERROR: number;
  COLOR_HELP: number;

  QUERY_MAX: number;
  OPTION_MAX: number;
}

export const constants: ConstantStruct = {
  MANUAL_URL: String(process.env.MANUAL_URL),
  SUPPORT_URL: String(process.env.SUPPORT_URL),
  DONATION_URL: String(process.env.DONATION_URL),

  REQUIRED_PERMISSIONS: new Permissions(388160),

  DEFAULT_PREFIX: '/',
  DEFAULT_LOCALE: 'ja',

  QUEUE_TIMEOUT: 60000,

  COLOR_POLL: 0x3b88c3,
  COLOR_EXPOLL: 0x3b88c4,
  COLOR_RESULT: 0xdd2e44,
  COLOR_WAIT: 0x9867c6,
  COLOR_ERROR: 0xffcc4d,
  COLOR_HELP: 0xff922f,

  QUERY_MAX: 200,
  OPTION_MAX: 200,
};