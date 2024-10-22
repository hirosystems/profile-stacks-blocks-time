import {
  TransactionVersion,
  makeSTXTokenTransfer,
  broadcastTransaction,
} from "@stacks/transactions";
import {
  createApiKeyMiddleware,
  createFetchFn,
  StacksMainnet,
  StacksTestnet,
} from "@stacks/network";
import dotenv from "dotenv";
import {
  getStxAddress,
  generateWallet,
  generateNewAccount,
} from "@stacks/wallet-sdk";
import fs from "fs";

dotenv.config();
const ENV = process.env;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const TIMEOUT = 15 * 60 * 1000; // 10 minutes in milliseconds

const STAGE = {
  FUNDING_1: 1,
  FUNDING_2: 2,
  PROFILING: 3,
  STATISTICS: 4,
};

const currentStage = STAGE.PROFILING;

const stacksNetworkApi = () => {
  const url = ENV.STACKS_API;
  const apiKey = ENV.STACKS_API_KEY;

  const opts = { url };
  if (apiKey?.length) {
    const apiMiddleware = createApiKeyMiddleware({ apiKey });
    opts.fetchFn = createFetchFn(apiMiddleware);
  }
  switch (ENV.STACKS_CHAIN) {
    case "mainnet":
      return new StacksMainnet(opts);
    case "testnet":
      return new StacksTestnet(opts);
  }
};

const network = stacksNetworkApi();
// network.chainId = ENV.STACKS_CHAINID;

let wallet = await generateWallet({
  secretKey: ENV.STACKS_MNEMONIC,
  password: "optional-password",
});

const getNextNonce = async (principal) => {
  const apiUrl = `${ENV.STACKS_API}/extended/v1/address/${principal}/nonces`;

  const response = await fetch(apiUrl, {
    headers: {
      "x-api-key": ENV.STACKS_API_KEY,
    },
  });
  const nonce = (await response.json()).possible_next_nonce;
  // console.log(nonce);
  return nonce;
};

//////// funding

// generate 25 accounts and send 10k STX to each of them
const funding_1 = async () => {
  wallet = generate_x_accounts(30);
  const biggestAccount = wallet.accounts[0];
  const biggestAddr = getStxAddress({
    account: biggestAccount,
    transactionVersion: TransactionVersion.Testnet,
  });
  let nextNonce = await getNextNonce(biggestAddr);

  for (let i = 1; i <= 25; i++) {
    const account = wallet.accounts[i];
    const mainnetAddress25s = getStxAddress({
      account,
      transactionVersion: TransactionVersion.Testnet,
    });
    // send stx to them
    const tx = await makeSTXTokenTransfer({
      network,
      nonce: nextNonce,
      recipient: mainnetAddress25s,
      amount: 100_000_000_000,
      anchorMode: "any",
      senderKey: biggestAccount.stxPrivateKey,
    });
    nextNonce++;
    const result = await broadcastTransaction(tx, network);
    console.log("result ", result);
  }
};

// generate 625 accounts and send 100 STX to each of them
const funding_2 = async () => {
  wallet = generate_x_accounts(1000);

  for (let i = 1; i <= 25; i++) {
    const senderAccount = wallet.accounts[i];
    const senderAddr = getStxAddress({
      account: senderAccount,
      transactionVersion: TransactionVersion.Testnet,
    });
    let nextNonce = await getNextNonce(senderAddr);

    for (let j = 1; j <= 25; j++) {
      const receiverAccount = wallet.accounts[i * 25 + j];
      const receiverAddress = getStxAddress({
        account: receiverAccount,
        transactionVersion: TransactionVersion.Testnet,
      });
      // send stx to them
      const tx = await makeSTXTokenTransfer({
        network,
        nonce: nextNonce,
        recipient: receiverAddress,
        amount: 1_000_000_000,
        anchorMode: "any",
        senderKey: senderAccount.stxPrivateKey,
      });
      nextNonce++;
      const result = await broadcastTransaction(tx, network);
      console.log("result ", result);
    }
  }
};

const stxTxProfiling = async (recipient, senderKey, senderAddr) => {
  const nonce = await getNextNonce(senderAddr);
  const tx = await makeSTXTokenTransfer({
    network,
    nonce,
    recipient,
    amount: 99_000,
    anchorMode: "any",
    senderKey,
    fee: 4_000,
  });

  let result = await broadcastTransaction(tx, network);
  const currentTime = Date.now();

  fs.appendFileSync(
    "txs_broadcasted.json",
    JSON.stringify(result.txid, null, 2)
  );
  fs.appendFileSync("txs_pending.json", ",\n");
  console.log("result ", result);
  let myTx = {
    txid: result.txid,
    updated_receipt: false,
    receipt_time: currentTime,
    block_time: null,
    delta_time: null,
    local_receipt_time: currentTime,
    local_block_time: null,
    local_delta_time: null,
  };

  myTx = await get_receipt_time(myTx);
  // timeout after 10 minutes of not being anchored
  myTx = await get_block_time(myTx);

  // write to file each tx
  fs.appendFileSync("txs_pending.json", JSON.stringify(myTx, null, 2));
  fs.appendFileSync("txs_pending.json", "\n");

  return myTx;
};

const fetchTransaction = async (txid) => {
  const response = await fetch(`${ENV.STACKS_API}/extended/v1/tx/${txid}`, {
    headers: {
      "x-api-key": ENV.STACKS_API_KEY,
    },
  });
  return response.json();
};

const get_receipt_time = async (transaction) => {
  // fetch transaction
  while (true) {
    const fetchedTransaction = await fetchTransaction(transaction.txid);

    if (fetchedTransaction.receipt_time) {
      transaction.updated_receipt = true;
      transaction.receipt_time = fetchedTransaction.receipt_time;
      return transaction;
    }

    // couldn't get receipt time, will use the local time
    if (transaction.block_time) {
      return transaction;
    }

    // If neither receipt_time nor block_time is available, wait and retry
    await wait(1000);
  }
};

const get_block_time = async (transaction) => {
  if (transaction.block_time) {
    return transaction;
  }

  let fetchedTransaction = await fetchTransaction(transaction.txid);
  while (!fetchedTransaction.block_time) {
    await wait(1000);
    fetchedTransaction = await fetchTransaction(transaction.txid);
  }

  transaction.block_time = fetchedTransaction.block_time;
  transaction.local_block_time = Date.now();
  transaction.delta_time = transaction.block_time - transaction.receipt_time;
  transaction.local_delta_time =
    transaction.local_block_time - transaction.local_receipt_time;

  console.log("transaction ", transaction);
  return transaction;
};

// perform operations
const get_statistics = async () => {
  const txs = JSON.parse(fs.readFileSync("txs_stats.json", "utf8"));
  const deltas = [];
  const local_deltas = [];
  for (const tx of txs) {
    deltas.push(tx.delta_time);
    local_deltas.push(tx.local_delta_time);
    // console.log(tx);
  }

  const min = Math.min(...deltas);
  const max = Math.max(...deltas);
  const average = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const median = deltas.sort((a, b) => a - b)[Math.floor(deltas.length / 2)];

  const min_local = Math.min(...local_deltas);
  const max_local = Math.max(...local_deltas);
  const average_local =
    local_deltas.reduce((a, b) => a + b, 0) / local_deltas.length;
  const median_local = local_deltas.sort((a, b) => a - b)[
    Math.floor(local_deltas.length / 2)
  ];

  console.log(
    `Min: ${min}, Max: ${max}, Average: ${average}, Median: ${median}`
  );
  console.log(
    `Min: ${min_local}, Max: ${max_local}, Average: ${average_local}, Median: ${median_local}`
  );
};

const generate_x_accounts = (number) => {
  for (let i = 1; i <= number; i++) {
    wallet = generateNewAccount(wallet);
  }
  return wallet;
};

// generate 625 accounts and send 1k STX to each of them
const profiling = async () => {
  wallet = generate_x_accounts(1000);
  let txPromises = [];
  const biggestAccount = wallet.accounts[0];
  const biggestAddr = getStxAddress({
    account: biggestAccount,
    transactionVersion: TransactionVersion.Testnet,
  });

  for (let i = 1; i <= 625; i++) {
    // each account send 1 stx to main address
    const senderAccount = wallet.accounts[i];
    const senderAddr = getStxAddress({
      account: senderAccount,
      transactionVersion: TransactionVersion.Testnet,
    });

    // Create a promise for each transaction with a timeout
    const txPromise = Promise.race([
      stxTxProfiling(biggestAddr, senderAccount.stxPrivateKey, senderAddr),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Transaction timeout")), TIMEOUT)
      ),
    ]).catch((error) => {
      console.log(
        `Transaction for account ${i} timed out or failed: ${error.message}`
      );
      return {
        txid: null,
        updated_receipt: false,
        receipt_time: null,
        block_time: null,
        delta_time: null,
        local_receipt_time: null,
        local_block_time: null,
        local_delta_time: null,
      };
    });
    txPromises.push(txPromise);
  }
  // Wait for all promises to resolve
  const txs = await Promise.all(txPromises);

  fs.writeFileSync("txs.json", JSON.stringify(txs, null, 2));
};

const main = async () => {
  if (currentStage === STAGE.FUNDING_1) {
    await funding_1();
  } else if (currentStage === STAGE.FUNDING_2) {
    await funding_2();
  } else if (currentStage === STAGE.PROFILING) {
    await profiling();
  } else if (currentStage === STAGE.STATISTICS) {
    await get_statistics();
  } else {
    console.log("Invalid stage");
  }
};
main();

// // generate 15,625 accounts and send 10 STX to each of them
// for (let i = 1; i <= 25; i++) {
//   for (let j = 1; j <= 25; j++) {
//     const senderAccount625s = wallet.accounts[i * 25 + j];
//     for (let k = 1; k <= 25; k++) {
//       wallet = generateNewAccount(wallet);
//       const account = wallet.accounts[i * 25 * 25 + j * 25 + k];
//       const mainnetAddress625s = getStxAddress({
//         account,
//         transactionVersion: TransactionVersion.Testnet,
//       });
//       const tx = await makeSTXTokenTransfer({
//         network,
//         nonce: nextNonce,
//         recipient: mainnetAddress625s,
//         amount: 1_000_000,
//         anchorMode: 'any',
//         senderKey: senderAccount625s.stxPrivateKey,
//       });
//       const result = await broadcastAndWaitForTransaction(tx, network);
//       expect(result.tx_status).toBe('success');
//     }
//   }
// }
