import QuickPoll from './quick_poll/index.mjs';

const quickPoll = new QuickPoll(
  Number(process.env['QUICK_POLL_SHARD_ID']),
  Number(process.env['QUICK_POLL_NUM_SHARDS'])
);
quickPoll.login(process.env['QUICK_POLL_TOKEN']);
