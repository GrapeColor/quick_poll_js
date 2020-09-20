import QuickPoll from './quick_poll/index.mjs';

const quickPoll = new QuickPoll(Number(process.argv[2]), Number(process.argv[3]));
quickPoll.login(process.env['QUICK_POLL_TOKEN']);
