'use strict';

const { Permissions } = require('discord.js');

class Base {}

Base.REQUIRED_PERMISSIONS = new Permissions(388160);

Base.COLOR_POLL   = 0x3b88c3;
Base.COLOR_EXPOLL = Base.COLOR_POLL + 1;
Base.COLOR_RESULT = 0xdd2e44;
Base.COLOR_WAIT   = 0x9867c6;
Base.COLOR_ERROR  = 0xffcc4d;
Base.COLOR_HELP   = 0xff922f;

Object.freeze(Base);

module.exports = Base;
