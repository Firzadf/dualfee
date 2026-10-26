import { describe, expect, it } from 'vitest';
import { buildReport, canonicalize, sha256Hex, verifyReport } from '../report';
import { deployCmp } from './fixtures';

const network = { evmRpc: 'https://test-evm-rpc-v3.portaldot.dev', substrateWss: 'wss://test-node-v3.portaldot.dev', chainId: 420420777, nativeDecimals: 14, evmDecimals: 18 };

describe('report hashing', () => {
  it('sha256 matches the FIPS 180-2 "abc" vector', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('canonical JSON ignores key order and stringifies bigints', () => {
    expect(canonicalize({ b: 1, a: { d: 2n, c: [1, 'x'] } })).toBe('{"a":{"c":[1,"x"],"d":"2"},"b":1}');
    expect(canonicalize({ a: 1, b: 2 })).toBe(canonicalize({ b: 2, a: 1 }));
  });
  it('builds a stamped report that verifies', async () => {
    const r = await buildReport(deployCmp, { opId: 'deploy-erc20', label: 'Deploy', network, generatedAt: '2026-10-26T13:13:01.000Z' });
    expect(r.stamp.hash).toMatch(/^[0-9a-f]{64}$/);
    const v = await verifyReport(JSON.stringify(r, null, 2));
    expect(v.ok).toBe(true);
  });
  it('is deterministic for the same input', async () => {
    const meta = { opId: 'x', label: 'x', network, generatedAt: '2026-10-26T00:00:00.000Z' };
    expect((await buildReport(deployCmp, meta)).stamp.hash).toBe((await buildReport(deployCmp, meta)).stamp.hash);
  });
  it('detects tampering', async () => {
    const r = await buildReport(deployCmp, { opId: 'deploy-erc20', label: 'Deploy', network });
    const bad = JSON.parse(JSON.stringify(r));
    bad.comparison.ratioAllIn = 800;
    const v = await verifyReport(JSON.stringify(bad));
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toMatch(/mismatch/);
  });
  it('rejects non-reports', async () => {
    expect((await verifyReport('nope')).ok).toBe(false);
    expect((await verifyReport('{"schema":"other"}')).ok).toBe(false);
  });
});
