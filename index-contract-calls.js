import {
  TransactionVersion,
  makeSTXTokenTransfer,
  broadcastTransaction,
  makeContractCall,
  AnchorMode,
  Cl,
  makeContractDeploy,
  codeBodyString,
  ClarityVersion,
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
import fs, { readFileSync } from "fs";
import {
  CONTRACT_NAME,
  currentStage,
  DIRECTORY_OUTPUT,
  FILENAME_BROADCAST_OUTPUT,
  FILENAME_PENDING_OUTPUT,
  MAX_COMPUTATION,
  MAX_READ_COUNT,
  MAX_READ_LENGTH,
  MAX_WRITE_COUNT,
  MAX_WRITE_LENGTH,
  STAGE,
  TX_COUNT_COMPUTATION,
  TX_COUNT_READ_COUNT,
  TX_COUNT_READ_LENGTH,
  TX_COUNT_WRITE_COUNT,
  TX_COUNT_WRITE_LENGTH,
  TX_FEE,
} from "./config.js";

dotenv.config();
const ENV = process.env;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const TIMEOUT = 20 * 60 * 1000; // 10 minutes in milliseconds
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
if (ENV.STACKS_CHAINID) {
  network.chainId = ENV.STACKS_CHAINID;
}

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
  const jsonResponse = await response.json();
  console.log(jsonResponse);
  let nonce;
  if (jsonResponse.last_executed_tx_nonce === null) {
    nonce = 0;
  } else {
    nonce = jsonResponse.last_executed_tx_nonce + 1;
  }
  return nonce;
};

//////// funding

// generate 25 accounts and send 100k STX to each of them
const funding1 = async () => {
  wallet = generateXAccounts(30);
  const biggestAccount = wallet.accounts[0];
  const biggestAddr = getStxAddress({
    account: biggestAccount,
    transactionVersion: TransactionVersion.Testnet,
  });
  let nextNonce = await getNextNonce(biggestAddr);
  console.log("nextNonce ", nextNonce);

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

// generate 625 accounts and send 1k STX to each of them
const funding2 = async () => {
  wallet = generateXAccounts(1000);

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

// deploy SC on wanted network
const deploySmartContract = async () => {
  wallet = generateXAccounts(30);
  const deployAccount = wallet.accounts[0];
  const deployAddress = getStxAddress({
    account: deployAccount,
    transactionVersion: TransactionVersion.Testnet,
  });
  const nonce = await getNextNonce(deployAddress);

  const txOptions = {
    contractName: CONTRACT_NAME,
    codeBody: readFileSync(
      "./big-contracts/contracts/read-and-write.clar",
    ).toString(),
    senderKey: deployAccount.stxPrivateKey,
    fee: TX_FEE,
    nonce,
    anchorMode: AnchorMode.Any,
    clarityVersion: 3,
    network: network,
  };

  console.log("content:", txOptions.codeBody);
  const tx = await makeContractDeploy(txOptions);
  let result = await broadcastTransaction(tx, network);
  console.log("deployed: ", result);
  return result;
};

// based on the number of the index, perform a given limit
// <= 100 perform read-count
// <= 200 perform read-length
// <= 300 perform write-count
// <= 400 perform write-length

const readCountCall = async (senderKey, senderAddr) => {
  wallet = generateXAccounts(30);
  const deployAccount = wallet.accounts[0];
  const deployAddress = getStxAddress({
    account: deployAccount,
    transactionVersion: TransactionVersion.Testnet,
  });
  const nonce = await getNextNonce(senderAddr);
  let numbers = [];
  for (let i = 0; i < MAX_READ_COUNT / 100; i++) {
    numbers.push(i);
  }

  const functionArgs = [Cl.list(numbers.map((n) => Cl.uint(n)))];

  const txOptions = {
    contractAddress: deployAddress,
    contractName: CONTRACT_NAME,
    functionName: "read-count-test",
    functionArgs,
    fee: TX_FEE,
    anchorMode: AnchorMode.Any,
    senderKey,
    nonce,
    network,
  };
  return await makeContractCall(txOptions);
};

const readLengthCall = async (senderKey, senderAddr) => {
  wallet = generateXAccounts(30);
  const deployAccount = wallet.accounts[0];
  const deployAddress = getStxAddress({
    account: deployAccount,
    transactionVersion: TransactionVersion.Testnet,
  });
  const nonce = await getNextNonce(senderAddr);
  let numbers = [];
  for (let i = 0; i < MAX_READ_LENGTH / 100; i++) {
    numbers.push(i);
  }

  const functionArgs = [Cl.list(numbers.map((n) => Cl.uint(n)))];

  const txOptions = {
    contractAddress: deployAddress,
    contractName: CONTRACT_NAME,
    functionName: "read-length-test",
    functionArgs,
    fee: TX_FEE,
    anchorMode: AnchorMode.Any,
    senderKey,
    nonce,
    network,
  };
  return await makeContractCall(txOptions);
};

const writeCountCall = async (senderKey, senderAddr) => {
  wallet = generateXAccounts(30);
  const deployAccount = wallet.accounts[0];
  const deployAddress = getStxAddress({
    account: deployAccount,
    transactionVersion: TransactionVersion.Testnet,
  });
  const nonce = await getNextNonce(senderAddr);
  let numbers = [];
  for (let i = 0; i < MAX_WRITE_COUNT / 100; i++) {
    numbers.push(i + 1);
  }

  const functionArgs = [Cl.list(numbers.map((n) => Cl.uint(n)))];

  const txOptions = {
    contractAddress: deployAddress,
    contractName: CONTRACT_NAME,
    functionName: "write-count-test",
    functionArgs,
    fee: TX_FEE,
    anchorMode: AnchorMode.Any,
    senderKey,
    nonce,
    network,
  };
  return await makeContractCall(txOptions);
};

const writeLengthCall = async (senderKey, senderAddr) => {
  wallet = generateXAccounts(30);
  const deployAccount = wallet.accounts[0];
  const deployAddress = getStxAddress({
    account: deployAccount,
    transactionVersion: TransactionVersion.Testnet,
  });
  const nonce = await getNextNonce(senderAddr);
  let numbers = [];
  for (let i = 0; i < MAX_WRITE_LENGTH / 100; i++) {
    numbers.push(i + 1);
  }

  const functionArgs = [Cl.list(numbers.map((n) => Cl.uint(n)))];

  const txOptions = {
    contractAddress: deployAddress,
    contractName: CONTRACT_NAME,
    functionName: "write-length-test",
    functionArgs: functionArgs,
    fee: TX_FEE,
    anchorMode: AnchorMode.Any,
    senderKey,
    nonce,
    network,
  };
  return await makeContractCall(txOptions);
};

const computationCall = async (senderKey, senderAddr) => {
  wallet = generateXAccounts(30);
  const deployAccount = wallet.accounts[0];
  const deployAddress = getStxAddress({
    account: deployAccount,
    transactionVersion: TransactionVersion.Testnet,
  });
  const nonce = await getNextNonce(senderAddr);
  let numbers = [];
  for (let i = 0; i < MAX_COMPUTATION / 100; i++) {
    numbers.push(i + 1);
  }

  const functionArgs = [Cl.list(numbers.map((n) => Cl.int(n))), Cl.int(0)];

  const txOptions = {
    contractAddress: deployAddress,
    contractName: CONTRACT_NAME,
    functionName: "computation-test",
    functionArgs: functionArgs,
    fee: TX_FEE,
    anchorMode: AnchorMode.Any,
    senderKey,
    nonce,
    network,
  };
  return await makeContractCall(txOptions);
};

const stxTxProfiling = async (index, senderKey, senderAddr, timeout) => {
  const nonce = await getNextNonce(senderAddr);

  let tx;
  // console.log("i: ", index);
  if (index >= 0 && index < 0 + TX_COUNT_READ_COUNT) {
    // console.log("i: ", index, "nothing");
    tx = await readCountCall(senderKey, senderAddr);
  } else if (index >= 100 && index < 100 + TX_COUNT_READ_LENGTH) {
    // console.log("i: ", index, "nothing");
    tx = await readLengthCall(senderKey, senderAddr);
  } else if (index >= 200 && index < 200 + TX_COUNT_WRITE_COUNT) {
    // console.log("i: ", index, "nothing");
    if (index <= 310) tx = await writeCountCall(senderKey, senderAddr);
  } else if (index >= 300 && index < 300 + TX_COUNT_WRITE_LENGTH) {
    // console.log("i: ", index, "tx");
    tx = await writeLengthCall(senderKey, senderAddr);
  } else if (index >= 400 && index < 400 + TX_COUNT_COMPUTATION) {
    // console.log("i: ", index, "nothing");
    tx = await computationCall(senderKey, senderAddr);
  }
  if (!tx) return;

  const waitTime = Math.floor((timeout / 400) * 1000);
  await wait(waitTime);

  let result = await broadcastTransaction(tx, network);
  const currentTime = Math.floor(Date.now() / 1000);
  console.log(result);
  if (!fs.existsSync(DIRECTORY_OUTPUT)) {
    fs.mkdirSync(DIRECTORY_OUTPUT);
  }
  fs.appendFileSync(
    FILENAME_BROADCAST_OUTPUT,
    JSON.stringify(result.txid, null, 2),
  );
  fs.appendFileSync(FILENAME_BROADCAST_OUTPUT, "\n");
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
  fs.appendFileSync(FILENAME_PENDING_OUTPUT, JSON.stringify(myTx, null, 2));
  fs.appendFileSync(FILENAME_PENDING_OUTPUT, "\n");

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
    if (
      fetchTransaction
        .toString()
        .includes("Unexpected token 'u', \"upstream c\"")
    ) {
      fs.appendFileSync(
        FILENAME_BROADCAST_OUTPUT,
        JSON.stringify(fetchTransaction, null, 2),
      );
      fs.appendFileSync(FILENAME_BROADCAST_OUTPUT, "\n");
    } else if (fetchedTransaction.receipt_time) {
      transaction.updated_receipt = true;
      transaction.receipt_time = fetchedTransaction.receipt_time;
      return transaction;
    }
    // couldn't get receipt time, will use the local time
    else if (transaction.block_time) {
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
  transaction.local_block_time = Math.floor(Date.now() / 1000);
  transaction.delta_time = transaction.block_time - transaction.receipt_time;
  transaction.local_delta_time =
    transaction.local_block_time - transaction.local_receipt_time;
  // TODO: remove console.log
  console.log(
    "execution cost read is: ",
    fetchedTransaction.execution_cost_read_count,
  );

  // TODO: add tenure when it started and tenure height when it got anchored
  // TODO: add stacks when it started and stacks height when it got anchored
  transaction.execution_cost_read_count =
    fetchedTransaction.execution_cost_read_count;
  transaction.execution_cost_read_length =
    fetchedTransaction.execution_cost_read_length;
  transaction.execution_cost_runtime =
    fetchedTransaction.execution_cost_runtime;
  transaction.execution_cost_write_count =
    fetchedTransaction.execution_cost_write_count;
  transaction.execution_cost_write_length =
    fetchedTransaction.execution_cost_write_length;

  console.log("transaction ", transaction);
  return transaction;
};

const getStatistics = async () => {
  const txs = JSON.parse(fs.readFileSync(FILENAME_PENDING_OUTPUT, "utf8"));
  const deltasPositive = [];
  const deltasAll = [];
  const deltasLocal = [];
  // Add minute-based tracking
  const minuteIntervalsPositive = {};
  const minuteIntervalsAll = {};

  for (const tx of txs) {
    // Track by minute intervals
    const minuteTaken = Math.ceil(tx.delta_time / 60);
    if (tx.delta_time > 0) {
      deltasPositive.push(tx.delta_time);
      deltasLocal.push(tx.local_delta_time);
      minuteIntervalsPositive[minuteTaken] =
        (minuteIntervalsPositive[minuteTaken] || 0) + 1;
    }
    deltasAll.push(tx.delta_time);
    minuteIntervalsAll[minuteTaken] =
      (minuteIntervalsAll[minuteTaken] || 0) + 1;
  }

  const minPositive = Math.min(...deltasPositive);
  const maxPositive = Math.max(...deltasPositive);
  const averagePositive =
    deltasPositive.reduce((a, b) => a + b, 0) / deltasPositive.length;
  const medianPositive = deltasPositive.sort((a, b) => a - b)[
    Math.floor(deltasPositive.length / 2)
  ];

  const minAll = Math.min(...deltasAll);
  const maxAll = Math.max(...deltasAll);
  const averageAll = deltasAll.reduce((a, b) => a + b, 0) / deltasAll.length;
  const medianAll = deltasAll.sort((a, b) => a - b)[
    Math.floor(deltasAll.length / 2)
  ];

  const minLocal = Math.min(...deltasLocal);
  const maxLocal = Math.max(...deltasLocal);
  const averageLocal =
    deltasLocal.reduce((a, b) => a + b, 0) / deltasLocal.length;
  const median_local = deltasLocal.sort((a, b) => a - b)[
    Math.floor(deltasLocal.length / 2)
  ];

  console.log("------------------------------------------------------------");
  console.log("Positive Deltas Node");
  console.log(
    `Min: ${minPositive}, Max: ${maxPositive}, Average: ${averagePositive}, Median: ${medianPositive}`,
  );
  console.log("------------------------------------------------------------");
  console.log("All Deltas Node");
  console.log(
    `Min: ${minAll}, Max: ${maxAll}, Average: ${averageAll}, Median: ${medianAll}`,
  );
  console.log("------------------------------------------------------------");
  console.log("Local User Benchmark");
  console.log(
    `Min: ${minLocal}, Max: ${maxLocal}, Average: ${averageLocal}, Median: ${median_local}`,
  );
  console.log("------------------------------------------------------------");

  // Print minute-based statistics
  console.log("\n Positive Transactions by minute intervals:");
  Object.keys(minuteIntervalsPositive)
    .sort((a, b) => Number(a) - Number(b))
    .forEach((minute) => {
      console.log(
        `${minute} minute(s): ${minuteIntervalsPositive[minute]} transactions`,
      );
    });
  console.log("------------------------------------------------------------");
  console.log("\n All Transactions by minute intervals:");
  Object.keys(minuteIntervalsPositive)
    .sort((a, b) => Number(a) - Number(b))
    .forEach((minute) => {
      console.log(
        `${minute} minute(s): ${minuteIntervalsAll[minute]} transactions`,
      );
    });

  // TODO: add cost limit metrics
};

const generateXAccounts = (number) => {
  for (let i = 1; i <= number; i++) {
    wallet = generateNewAccount(wallet);
  }
  return wallet;
};

// generate 625 accounts and send 1k STX to each of them
const profiling = async () => {
  wallet = generateXAccounts(1000);
  let txPromises = [];
  const biggestAccount = wallet.accounts[0];
  const biggestAddr = getStxAddress({
    account: biggestAccount,
    transactionVersion: TransactionVersion.Testnet,
  });

  // TODO: move back this to 625
  for (let i = 1; i <= 500; i++) {
    // each account send 1 stx to main address
    const senderAccount = wallet.accounts[i];
    const senderAddr = getStxAddress({
      account: senderAccount,
      transactionVersion: TransactionVersion.Testnet,
    });

    // Create a promise for each transaction with a timeout
    const txPromise = Promise.race([
      stxTxProfiling(
        i,
        senderAccount.stxPrivateKey,
        senderAddr,
        Math.floor(i / 3),
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Transaction timeout")), TIMEOUT),
      ),
    ]).catch((error) => {
      console.log(
        `Transaction for account ${i} timed out or failed: ${error.message}`,
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
        execution_cost_read_count: null,
        execution_cost_read_length: null,
        execution_cost_runtime: null,
        execution_cost_write_count: null,
        execution_cost_write_length: null,
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
    await funding1();
  } else if (currentStage === STAGE.DEPLOY_SC) {
    await deploySmartContract();
  } else if (currentStage === STAGE.FUNDING_2) {
    await funding2();
  } else if (currentStage === STAGE.PROFILING) {
    await profiling();
  } else if (currentStage === STAGE.STATISTICS) {
    await getStatistics();
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

const initializeFiles = () => {
  fs.writeFileSync(FILENAME_PENDING_OUTPUT, "");
  fs.writeFileSync(FILENAME_BROADCAST_OUTPUT, "");
};
