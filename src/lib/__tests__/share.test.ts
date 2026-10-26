import { describe, expect, it } from 'vitest';
import { decodeLabParams, encodeLabParams, presetToLab, shareUrl, MAX_URL_HEX } from '../share';

const A = '0x03c502abb79e8eee50135c91933d059d982dd912';

describe('share links', () => {
  it('round-trips lab params', () => {
    const p = { op: 'erc20' as const, from: A, token: A, recipient: '0x2222222222222222222222222222222222222222', tokenAmount: '1.5', run: true };
    const { query } = encodeLabParams(p);
    expect(decodeLabParams('?' + query)).toEqual({ params: p, errors: [] });
  });
  it('produces /app/lab?op=deploy links', () => {
    expect(shareUrl('https://dualfee.vercel.app/', { op: 'deploy', code: 'sample' }).url).toBe('https://dualfee.vercel.app/app/lab?op=deploy&code=sample');
  });
  it('rejects invalid values instead of passing them on', () => {
    const r = decodeLabParams('op=nuke&from=0x123&amount=1e9&code=<script>');
    expect(r.params).toEqual({});
    expect(r.errors).toEqual(['unknown op "nuke"', 'invalid from', 'invalid amount', 'invalid code']);
  });
  it('omits oversized custom bytecode from the URL', () => {
    const big = '0x' + 'ab'.repeat(MAX_URL_HEX);
    const r = encodeLabParams({ op: 'deploy', code: big });
    expect(r.omitted).toEqual(['code']);
    expect(r.query).toBe('op=deploy');
  });
  it('maps leaderboard presets to lab links', () => {
    expect(presetToLab('deploy-registry')).toEqual({ op: 'deploy', code: 'registry' });
    expect(presetToLab('assets-transfer')).toBeNull();
  });
});
