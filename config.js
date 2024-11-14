import dotenv from "dotenv";
dotenv.config();
const ENV = process.env;

export const STAGE = {
  FUNDING_1: 1,
  DEPLOY_SC: 2,
  FUNDING_2: 3,
  PROFILING: 4,
  STATISTICS: 5,
};

export const BLOCK_LIMITS = {
  read_count: 15_000,
  read_length: 100_000_000,
  runtime: 5_000_000_000,
  write_count: 15_000,
  write_length: 15_000_000,
};

export const MAX_READ_COUNT = 29;
export const MAX_READ_LENGTH = 23;
export const MAX_WRITE_COUNT = 100;
export const MAX_WRITE_LENGTH = 265;
export const MAX_COMPUTATION = 1000;

// It should be for making a tx with cost X% of the total max
// Most of the contract calls don't increase lineary so it doesn't work as expected
// 20 as TX_PERCENTAGE is a lot less than 20% of the block limit for write_length
export const TX_PERCENTAGE = 90;

export const CONTRACT_NAME = "read-and-write-90-percentage";
export const FILENAME_PENDING_OUTPUT = `./outputs/${ENV.STACKS_CHAINID}/txs_pending.json`;
export const FILENAME_BROADCAST_OUTPUT = `./outputs/${ENV.STACKS_CHAINID}/txs_broadcasted.json`;
export const FILENAME_STATS_OUTPUT = `./outputs/${ENV.STACKS_CHAINID}/txs_stats.json`;

export const currentStage = STAGE.STATISTICS;
