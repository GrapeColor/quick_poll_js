import QuickPoll from './quick_poll/index';

const quickPoll = new QuickPoll(Number(process.argv[2]), Number(process.argv[3]));
quickPoll.login(String(process.env.QUICK_POLL_TOKEN));
