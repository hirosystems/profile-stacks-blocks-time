import { Cl, ClarityValue } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { resolve } from "node:path";

const accounts = simnet.getAccounts();
const account1 = accounts.get("wallet_1")!;


const MAX_READ_COUNT = 350;
const MAX_READ_LENGTH = 110;
// Hits READ_COUNT before hitting WRITE_COUNT
// const MAX_WRITE_COUNT = 100;
const MAX_WRITE_COUNT = 0;
const MAX_WRITE_LENGTH = 265;
const MAX_COMPUTATION = 1000;

const contract_name = "read-and-write";

describe("example tests", () => {
  it("ensures simnet is well initalised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  // deploy SC
  it("check deply SC", () => {

    const contractName = "read-and-write";
    const codeBody =
    fs.readFileSync(resolve(__dirname, '../contracts/read-and-write.clar'))
      .toString();

    simnet.deployContract(
      contractName,
      codeBody,
      { clarityVersion: 3},
      account1
    )
  });

  // read count test
  it("check read-count-test limit 350 numbers", () => {
    let clNumbers: ClarityValue[] = [];
    for (let i = 0; i < MAX_READ_COUNT; i++) clNumbers.push(Cl.uint(i % 1000));

    simnet.callPublicFn(
      contract_name,
      "read-count-test",
      [Cl.list(clNumbers)],
      account1
    );
  });

  it("check read-length-test limit 110 numbers", () => {
    let clNumbers: ClarityValue[] = [];
    for (let i = 0; i < MAX_READ_LENGTH; i++) clNumbers.push(Cl.uint(i % 1000));

    simnet.callPublicFn(
      contract_name,
      "read-length-test",
      [Cl.list(clNumbers)],
      account1
    );
  });

  it("check write-count-test limit 110 numbers", () => {
    let clNumbers: ClarityValue[] = [];
    for (let i = 0; i < MAX_WRITE_COUNT; i++)
      clNumbers.push(Cl.uint((i % 1000) + 1));

    simnet.callPublicFn(
      contract_name,
      "write-count-test",
      [Cl.list(clNumbers)],
      account1
    );
  });

  it("check write-length-test limit 110 numbers", () => {
    let clNumbers: ClarityValue[] = [];
    for (let i = 0; i < MAX_WRITE_LENGTH; i++)
      clNumbers.push(Cl.uint(i % 1000));

    simnet.callPublicFn(
      contract_name,
      "write-length-test",
      [Cl.list(clNumbers)],
      account1
    );
  });

  it("check computation-test limit 110 numbers", () => {
    let clNumbers: ClarityValue[] = [];
    for (let i = 0; i < MAX_COMPUTATION; i++)
      clNumbers.push(Cl.int((i % 10) + 1));

    simnet.callPublicFn(
      contract_name,
      "computation-test",
      [Cl.list(clNumbers), Cl.int(0)],
      account1
    );
  });
});
