# @dualfee/sdk

Estimate the same Portaldot V3 operation on both execution surfaces and pick the cheaper one.

- **EVM**: pallet-revive Ethereum JSON-RPC, `eth_estimateGas × eth_gasPrice` (wei, 18 dp)
- **Native**: Substrate, `ReviveApi` dry-run (storage deposit limit > 0) + `TransactionPaymentApi.query_info` (planck, 14 dp)

All amounts are `bigint`. Nothing is signed or sent.

```ts
import { estimateBoth, pickCheapest, presetOps, getApi, liveDecimals, DEFAULT_NETWORK, formatUnits } from '@dualfee/sdk';

// read decimals from the runtime instead of assuming them
const api = await getApi(DEFAULT_NETWORK.substrateWss);
const d = await liveDecimals(api); // { nativeDecimals: 14, nativeToEthRatio: 10000n, evmDecimals: 18, symbol: 'tPOT' }
const network = { ...DEFAULT_NETWORK, nativeDecimals: d.nativeDecimals, evmDecimals: d.evmDecimals ?? 18 };

const c = await estimateBoth(
  { kind: 'erc20Transfer', from: '0x03c5…d912', token: '0xe011…dbc2', to: '0x521d…5b93', amount: 1n },
  { api, network },
);
c.evm;          // { status: 'ok', gas, gasPrice, feeWei, totalPlanck, ... } | { status: 'unavailable', reason }
c.native;       // { status: 'ok', partialFee, storageDeposit, totalPlanck, weight, ... } | { status: 'unavailable', reason }
c.ratioAllIn;   // EVM ÷ (native fee + deposit)
c.ratioVsNativeFeeOnly; // EVM ÷ native fee (how headline multiples are usually computed)
c.recommended;  // 'evm' | 'native' | 'either' | null
formatUnits(c.native.status === 'ok' ? c.native.totalPlanck : 0n, network.nativeDecimals);

const { surface } = await pickCheapest(presetOps()[3].tx, { api, network, tieBreak: 'native' });
```

### Operations (`DualTx`)

| kind | EVM leg | native leg |
| --- | --- | --- |
| `nativeTransfer` | value transfer (planck → wei ×10⁴) | `balances.transferKeepAlive` |
| `erc20Transfer` | `transfer(address,uint256)` call | same call as `revive.call` |
| `contractDeploy` | create with bytecode | `revive.instantiateWithCode` |
| `calldata` | call / create with your data | `revive.call` / `revive.instantiateWithCode` |
| `assetsTransfer` | unavailable (no verified precompile) | `assets.transferKeepAlive` |

### Account mapping (pallet-revive)

```ts
import { h160ToAccountId32, accountId32ToH160, h160ToSs58, isEthDerived } from '@dualfee/sdk';
h160ToAccountId32('0x03c5…d912'); // 0x03c5…d912 + ee×12  (fallback account)
accountId32ToH160(native32);      // eth-derived: first 20 bytes; otherwise last 20 bytes of keccak256
h160ToSs58('0x03c5…d912');        // SS58, prefix 42
```

### FeeRegistry helpers

`comparisonHash(c)` (keccak256 of the canonical JSON), `encodeRecord(hash, opType, evmFeeWei, nativeFeePlanck)`, `opTypeOf(kind)`, `RECORD_SELECTOR` (`0x5c253272`).
