### How to run this:

1. Create account using, optionally save it to `testing.json` for future reference.
```bash
stx make_keychain -t | jq
```
2. Set-up .env following .env.sample
3. Faucet the account created on the wanted networks 
```bash
curl -X POST "https://api.nakamoto-4.stg.hiro.so/extended/v1/faucets/stx?address=ST248KVX1SRDCWDZYWYCE0HHJT2RGRKJGGQCE60RP&stacking=true"
```
4. Fund the first 25 accounts using.
```js
export const currentStage = STAGE.FUNDING_1;
```
4. Fund the first 625 accounts using.
```js
export const currentStage = STAGE.FUNDING_2;
```
5. Deploy Smart Contract.
```js
export const CONTRACT_NAME = "read-and-write-90-percentage";
export const currentStage = STAGE.DEPLOY_SC;
```
6. Start profiling with wanted options.
- Create a folder with the name `CHAIN_ID` of your network if it's not already created.
```js
export const TX_PERCENTAGE = 90;
export const currentStage = STAGE.PROFILING;
```
7. Clean the results and see stats
- On txs_pending.json, add `,` after the `}` and `[` and `]` at the beginning and end of the file.
```js
export const currentStage = STAGE.STATISTICS;
```

### Conclusion after this profile and investigations

There were so many transactions that the node that got them couldn't send them to all his peers and the miner nodes haven't received them.
There were seen in the mempool of the node that got them, but not in the miner nodes.
So, they appeared as pending transactions, but they will never be mined if the nodes having them don't try to send them again to their peers.
