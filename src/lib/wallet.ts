import { PORTALDOT_V3 } from '@dualfee/sdk';

type Eip1193 = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };

export function injected(): Eip1193 | null {
  return ((window as unknown as { ethereum?: Eip1193 }).ethereum) ?? null;
}

export async function connect(): Promise<string> {
  const eth = injected();
  if (!eth) throw new Error('No injected wallet found. Install MetaMask (or any EIP-1193 wallet) to use this page.');
  const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
  await ensureChain();
  return accounts[0];
}

export async function ensureChain() {
  const eth = injected()!;
  const current = (await eth.request({ method: 'eth_chainId' })) as string;
  if (current.toLowerCase() === PORTALDOT_V3.chainIdHex) return;
  try {
    await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: PORTALDOT_V3.chainIdHex }] });
  } catch (e) {
    if ((e as { code?: number }).code !== 4902) throw e;
    await eth.request({
      method: 'wallet_addEthereumChain',
      params: [{ chainId: PORTALDOT_V3.chainIdHex, chainName: PORTALDOT_V3.name, rpcUrls: [PORTALDOT_V3.evmRpc], nativeCurrency: { name: 'tPOT', symbol: 'tPOT', decimals: 18 } }],
    });
  }
}

export async function sendTx(from: string, tx: { to?: string; data: string }): Promise<string> {
  const eth = injected()!;
  await ensureChain();
  return (await eth.request({ method: 'eth_sendTransaction', params: [{ from, ...tx }] })) as string;
}

export type Receipt = { status: string; contractAddress: string | null; blockNumber: string; transactionHash: string };

export async function waitReceipt(hash: string, timeoutMs = 120_000): Promise<Receipt | null> {
  const eth = injected()!;
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const r = (await eth.request({ method: 'eth_getTransactionReceipt', params: [hash] })) as Receipt | null;
    if (r) return r;
    await new Promise((res) => setTimeout(res, 3000));
  }
  return null;
}
