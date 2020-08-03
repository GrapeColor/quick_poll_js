'use strict';

const QuickPoll = require('./quick_poll/index');

const quickPoll = new QuickPoll(Number(process.argv[2]), Number(process.argv[3]));
quickPoll.login(process.env.QUICK_POLL_TOKEN);
