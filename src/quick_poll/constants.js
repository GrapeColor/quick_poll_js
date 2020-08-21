'use strict';

const { Permissions } = require('discord.js');

class Constants {}

Constants.REQUIRED_PERMISSIONS = new Permissions(388160);

Constants.COLOR_POLL =   0x3b88c3;
Constants.COLOR_EXPOLL = 0x3b88c4;
Constants.COLOR_RESULT = 0xdd2e44;
Constants.COLOR_WAIT =   0x9867c6;
Constants.COLOR_ERROR =  0xffcc4d;
Constants.COLOR_HELP =   0xff922f;

Constants.QUEUE_TIMEOUT = 60000;

module.exports =  Constants;
