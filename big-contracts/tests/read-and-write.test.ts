import { Cl, ClarityValue } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { resolve } from "node:path";

const accounts = simnet.getAccounts();
const account1 = accounts.get("wallet_1")!;

const MAX_READ_COUNT = 29;
const MAX_READ_LENGTH = 46;
// Hits READ_COUNT before hitting WRITE_COUNT
// const MAX_WRITE_COUNT = 100;
const MAX_WRITE_COUNT = 0;
const MAX_WRITE_LENGTH = 265;
// Takes more than 5-10 minutes with the max_computation to run the simnet unit test
const MAX_COMPUTATION = 0;
// const MAX_COMPUTATION = 1000;

const contract_name = "read-and-write";

describe("test full block size limits", () => {
  it("ensures simnet is well initalised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  // deploy SC
  it("check deploy SC", () => {
    const contractName = "read-and-write";
    const codeBody = fs
      .readFileSync(resolve(__dirname, "../contracts/read-and-write.clar"))
      .toString();

    const { result: actual } = simnet.deployContract(
      contractName,
      codeBody,
      { clarityVersion: 3 },
      account1,
    );
    // succesfully deployed
    expect(actual).toStrictEqual(Cl.bool(true));
  });

  it("check read-count-test limit 29 numbers", () => {
    let clNumbers: ClarityValue[] = [];
    let clResponse: ClarityValue[] = [];
    for (let i = 0; i < MAX_READ_COUNT; i++) {
      clNumbers.push(Cl.uint(i % 1000));
      clResponse.push(Cl.ok(Cl.bool(true)));
    }

    const { result: actual } = simnet.callPublicFn(
      contract_name,
      "read-count-test",
      [Cl.list(clNumbers)],
      account1,
    );
    // succesfully called
    expect(actual).toBeOk(Cl.list(clResponse));
    const { result: actual2 } = simnet.callPublicFn(
      contract_name,
      "read-count-test",
      [Cl.list(clNumbers)],
      account1,
    );
    // succesfully called
    expect(actual2).toBeOk(Cl.list(clResponse));
  });

  it("check read-length-test limit 23 numbers", () => {
    let clNumbers: ClarityValue[] = [];
    let clResponse: ClarityValue[] = [];
    for (let i = 0; i < MAX_READ_LENGTH; i++) {
      clNumbers.push(Cl.uint((i % 1000) + 1));
      clResponse.push(Cl.ok(Cl.bool(true)));
    }

    const { result: actual } = simnet.callPublicFn(
      contract_name,
      "read-length-test",
      [Cl.list(clNumbers)],
      account1,
    );
    // succesfully called
    expect(actual).toBeOk(Cl.list(clResponse));
    const { result: actual2 } = simnet.callPublicFn(
      contract_name,
      "read-length-test",
      [Cl.list(clNumbers)],
      account1,
    );
    // succesfully called
    expect(actual2).toBeOk(Cl.list(clResponse));
  });

  it("check write-count-test limit 100 numbers", () => {
    let clNumbers: ClarityValue[] = [];
    let clResponse: ClarityValue[] = [];
    for (let i = 0; i < MAX_WRITE_COUNT; i++) {
      clNumbers.push(Cl.uint((i % 1000) + 1));
      clResponse.push(Cl.ok(Cl.bool(true)));
    }

    const { result: actual } = simnet.callPublicFn(
      contract_name,
      "write-count-test",
      [Cl.list(clNumbers)],
      account1,
    );
    // succesfully called
    expect(actual).toBeOk(Cl.list(clResponse));
    const { result: actual2 } = simnet.callPublicFn(
      contract_name,
      "write-count-test",
      [Cl.list(clNumbers)],
      account1,
    );
    // succesfully called
    expect(actual2).toBeOk(Cl.list(clResponse));
  });

  it("check write-length-test limit 265 numbers", () => {
    let clNumbers: ClarityValue[] = [];
    let clResponse: ClarityValue[] = [];
    for (let i = 0; i < MAX_WRITE_LENGTH; i++) {
      clNumbers.push(Cl.uint((i % 1000) + 1));
      clResponse.push(Cl.ok(Cl.bool(true)));
    }

    const { result: actual } = simnet.callPublicFn(
      contract_name,
      "write-length-test",
      [Cl.list(clNumbers)],
      account1,
    );
    // succesfully called
    expect(actual).toBeOk(Cl.bool(true));
    const { result: actual2 } = simnet.callPublicFn(
      contract_name,
      "write-length-test",
      [Cl.list(clNumbers)],
      account1,
    );
    // succesfully called
    expect(actual2).toBeOk(Cl.bool(true));
  });

  it("check computation-test limit 1000 numbers", () => {
    let clNumbers: ClarityValue[] = [];
    for (let i = 0; i < MAX_COMPUTATION; i++) {
      clNumbers.push(Cl.int((i % 1000) + 1));
    }

    const { result: actual } = simnet.callPublicFn(
      contract_name,
      "computation-test",
      [Cl.list(clNumbers), Cl.int(0)],
      account1,
    );
    // succesfully called
    expect(actual).toBeOk(Cl.int(0));
    const { result: actual2 } = simnet.callPublicFn(
      contract_name,
      "computation-test",
      [Cl.list(clNumbers), Cl.int(0)],
      account1,
    );
    // succesfully called
    expect(actual2).toBeOk(Cl.int(0));
  });
});

describe("test smallest block size limit", () => {
  it("check read-count-test limit 1 numbers", () => {
    let clNumbers: ClarityValue[] = [];
    let clResponse: ClarityValue[] = [];
    for (let i = 0; i < 1; i++) {
      clNumbers.push(Cl.uint(i % 1000));
      clResponse.push(Cl.ok(Cl.bool(true)));
    }

    const { result: actual } = simnet.callPublicFn(
      contract_name,
      "read-count-test",
      [Cl.list(clNumbers)],
      account1,
    );
    // succesfully called
    expect(actual).toBeOk(Cl.list(clResponse));
    const { result: actual2 } = simnet.callPublicFn(
      contract_name,
      "read-count-test",
      [Cl.list(clNumbers)],
      account1,
    );
    // succesfully called
    expect(actual2).toBeOk(Cl.list(clResponse));
  });

  it("check read-length-test limit 1 numbers", () => {
    let clNumbers: ClarityValue[] = [];
    let clResponse: ClarityValue[] = [];
    for (let i = 0; i < 1; i++) {
      clNumbers.push(Cl.uint((i % 1000) + 1));
      clResponse.push(Cl.ok(Cl.bool(true)));
    }

    const { result: actual } = simnet.callPublicFn(
      contract_name,
      "read-length-test",
      [Cl.list(clNumbers)],
      account1,
    );
    // succesfully called
    expect(actual).toBeOk(Cl.list(clResponse));
    const { result: actual2 } = simnet.callPublicFn(
      contract_name,
      "read-length-test",
      [Cl.list(clNumbers)],
      account1,
    );
    // succesfully called
    expect(actual2).toBeOk(Cl.list(clResponse));
  });

  it("check write-count-test limit 1 numbers", () => {
    let clNumbers: ClarityValue[] = [];
    let clResponse: ClarityValue[] = [];
    for (let i = 0; i < 1; i++) {
      clNumbers.push(Cl.uint((i % 1000) + 1));
      clResponse.push(Cl.ok(Cl.bool(true)));
    }

    const { result: actual } = simnet.callPublicFn(
      contract_name,
      "write-count-test",
      [Cl.list(clNumbers)],
      account1,
    );
    // succesfully called
    expect(actual).toBeOk(Cl.list(clResponse));
    const { result: actual2 } = simnet.callPublicFn(
      contract_name,
      "write-count-test",
      [Cl.list(clNumbers)],
      account1,
    );
    // succesfully called
    expect(actual2).toBeOk(Cl.list(clResponse));
  });

  it("check write-length-test limit 1 numbers", () => {
    let clNumbers: ClarityValue[] = [];
    let clResponse: ClarityValue[] = [];
    for (let i = 0; i < 50; i++) {
      clNumbers.push(Cl.uint((i % 1000) + 1));
      clResponse.push(Cl.ok(Cl.bool(true)));
    }

    const { result: actual } = simnet.callPublicFn(
      contract_name,
      "write-length-test",
      [Cl.list(clNumbers)],
      account1,
    );
    // succesfully called
    expect(actual).toBeOk(Cl.bool(true));
    const { result: actual2 } = simnet.callPublicFn(
      contract_name,
      "write-length-test",
      [Cl.list(clNumbers)],
      account1,
    );
    // succesfully called
    expect(actual2).toBeOk(Cl.bool(true));
  });

  it("check computation-test limit 1 numbers", () => {
    let clNumbers: ClarityValue[] = [];
    for (let i = 0; i < 1; i++) {
      clNumbers.push(Cl.int((i % 1000) + 1));
    }

    const { result: actual } = simnet.callPublicFn(
      contract_name,
      "computation-test",
      [Cl.list(clNumbers), Cl.int(0)],
      account1,
    );
    // succesfully called
    expect(actual).toBeOk(Cl.int(0));
    const { result: actual2 } = simnet.callPublicFn(
      contract_name,
      "computation-test",
      [Cl.list(clNumbers), Cl.int(0)],
      account1,
    );
    // succesfully called
    expect(actual2).toBeOk(Cl.int(0));
  });
});
