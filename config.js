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


export const MAX_READ_COUNT = 350;
export const MAX_READ_LENGTH = 110;
export const MAX_WRITE_COUNT = 100;
export const MAX_WRITE_LENGTH = 265;
export const MAX_COMPUTATION = 1000;

export const TX_PERCENTAGE = 20;
// export const CONTRACT_NAME = 'write-and-read-name';
export const CONTRACT_NAME = "read-and-write-wasm";
export const FILENAME_PENDING_OUTPUT = `txs_pending_${ENV.STACKS_CHAINID}.json`
export const FILENAME_BROADCAST_OUTPUT = `txs_broadcasted_${ENV.STACKS_CHAINID}.json`
export const FILENAME_STATS_OUTPUT = `txs_stats_${ENV.STACKS_CHAINID}.json`

export const currentStage = STAGE.STATISTICS;
