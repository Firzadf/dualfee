// Runs on Hardhat's in-process network (no keys, no RPC). `npm test` inside contracts/.
const assert = require('node:assert');
const hre = require('hardhat');

const p = hre.network.provider;
const rpc = (method, params = []) => p.request({ method, params });
const word = (n) => BigInt(n).toString(16).padStart(64, '0');
const SEL_RECORD = '0x5c253272'; // record(bytes32,uint8,uint128,uint128)
const SEL_COUNT = '0x06661abd'; // count()

describe('FeeRegistry', () => {
  let from, addr;
  before(async () => {
    const art = await hre.artifacts.readArtifact('FeeRegistry');
    [from] = await rpc('eth_accounts');
    const tx = await rpc('eth_sendTransaction', [{ from, data: art.bytecode }]);
    addr = (await rpc('eth_getTransactionReceipt', [tx])).contractAddress;
  });

  it('records a comparison and emits ComparisonRecorded', async () => {
    const hash = 'ab'.repeat(32);
    const data = SEL_RECORD + hash + word(2) + word(1240982190000000000000n) + word(12219141200000000n);
    const tx = await rpc('eth_sendTransaction', [{ from, to: addr, data }]);
    const r = await rpc('eth_getTransactionReceipt', [tx]);
    assert.strictEqual(r.status, '0x1');
    assert.strictEqual(r.logs.length, 1);
    assert.strictEqual(r.logs[0].topics[2], '0x' + hash);
    assert.strictEqual(BigInt(r.logs[0].topics[3]), 2n);
    const count = await rpc('eth_call', [{ to: addr, data: SEL_COUNT }, 'latest']);
    assert.strictEqual(BigInt(count), 1n);
  });

  it('rejects an empty hash', async () => {
    const data = SEL_RECORD + '0'.repeat(64) + word(0) + word(1) + word(1);
    await assert.rejects(rpc('eth_sendTransaction', [{ from, to: addr, data }]));
  });
});
