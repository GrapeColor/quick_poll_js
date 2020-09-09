'use strict';

const { Permissions } = require('discord.js');

exports.MANUAL_URL   = process.env.MANUAL_URL;
exports.SUPPORT_URL  = process.env.SUPPORT_URL;
exports.DONATION_URL = process.env.DONATION_URL;

exports.REQUIRED_PERMISSIONS = new Permissions(388160);

exports.DEFAULT_PREFIX = '/';
exports.DEFAULT_LOCALE = 'ja';

exports.QUEUE_TIMEOUT = 60000;

exports.COLOR_POLL   = 0x3b88c3;
exports.COLOR_EXPOLL = 0x3b88c4;
exports.COLOR_RESULT = 0xdd2e44;
exports.COLOR_WAIT   = 0x9867c6;
exports.COLOR_ERROR  = 0xffcc4d;
exports.COLOR_HELP   = 0xff922f;

exports.QUERY_MAX = 200;
exports.OPTION_MAX = 200;
