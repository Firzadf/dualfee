import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ApiPromise } from '@polkadot/api';
import { DEFAULT_NETWORK, PORTALDOT_V3, evmChainId, evmRpc, getApi, hexToBigInt, liveDecimals, type NetworkConfig } from '@dualfee/sdk';

export type EvmStatus =
  | { ok: true; chainId: number; block: number; gasPrice: bigint; latencyMs: number; updatedAt: number }
  | { ok: false; error: string };

export type NativeStatus =
  | {
      ok: true;
      chain: string;
      specVersion: number;
      block: number;
      decimals: number;
      symbol: string;
      evmDecimals: number | null;
      ratio: bigint | null;
      /** Round trip of chain_getHeader over the shared WebSocket. */
      latencyMs: number;
      /** Time from first connect attempt to a ready ApiPromise (metadata included). */
      handshakeMs: number;
      /** transactionPayment.nextFeeMultiplier as a float (FixedU128 / 1e18), null if the pallet lacks it. */
      feeMultiplier: number | null;
      depositPerByte: bigint | null;
      depositPerItem: bigint | null;
      updatedAt: number;
    }
  | { ok: false; error: string };

export type NetStatus = {
  evm: EvmStatus | null;
  native: NativeStatus | null;
};

export type Net = NetStatus & {
  /** The single shared ApiPromise (null until connected). Every page reuses it. */
  api: ApiPromise | null;
  /** Both surfaces have answered (ok or error). Measuring before this would only time out. */
  ready: boolean;
  /** Network config with decimals read from the live runtime. */
  config: NetworkConfig;
  retry: () => void;
};

const POLL_MS = 12_000;
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Network config with decimals taken from the live runtime when available (falls back to verified constants). */
export function networkFrom(status: NetStatus): NetworkConfig {
  const n = status.native;
  if (n && n.ok) return { ...DEFAULT_NETWORK, nativeDecimals: n.decimals, evmDecimals: n.evmDecimals ?? DEFAULT_NETWORK.evmDecimals };
  return DEFAULT_NETWORK;
}

const Ctx = createContext<Net | null>(null);

/* eslint-disable @typescript-eslint/no-explicit-any */
async function readNative(api: ApiPromise, handshakeMs: number): Promise<NativeStatus> {
  const t = performance.now();
  const header = await api.rpc.chain.getHeader();
  const latencyMs = Math.round(performance.now() - t);
  const [chain, d, mult] = await Promise.all([
    api.rpc.system.chain(),
    liveDecimals(api),
    (api.query as any).transactionPayment?.nextFeeMultiplier?.().catch(() => null) ?? Promise.resolve(null),
  ]);
  const rv = (api.consts as any).revive;
  return {
    ok: true,
    chain: chain.toString(),
    specVersion: api.runtimeVersion.specVersion.toNumber(),
    block: header.number.toNumber(),
    decimals: d.nativeDecimals,
    symbol: d.symbol,
    evmDecimals: d.evmDecimals,
    ratio: d.nativeToEthRatio,
    latencyMs,
    handshakeMs,
    feeMultiplier: mult ? Number(BigInt(mult.toString()) / 10n ** 12n) / 1e6 : null,
    depositPerByte: rv?.depositPerByte ? BigInt(rv.depositPerByte.toString()) : null,
    depositPerItem: rv?.depositPerItem ? BigInt(rv.depositPerItem.toString()) : null,
    updatedAt: Date.now(),
  };
}

async function readEvm(chainId: number | null): Promise<EvmStatus> {
  const url = PORTALDOT_V3.evmRpc;
  const t = performance.now();
  const blockHex = await evmRpc<string>(url, 'eth_blockNumber');
  const latencyMs = Math.round(performance.now() - t);
  const [priceHex, id] = await Promise.all([evmRpc<string>(url, 'eth_gasPrice'), chainId ?? evmChainId(url)]);
  return { ok: true, chainId: id, block: Number(hexToBigInt(blockHex)), gasPrice: hexToBigInt(priceHex), latencyMs, updatedAt: Date.now() };
}

/**
 * One provider for the whole app, mounted above the router: it opens the EVM RPC and the Substrate
 * WebSocket once, at boot (while the splash is still on screen), and every route reads from it.
 * Navigating to /app/leaderboard therefore never opens a second ApiPromise.
 */
export function NetworkProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<NetStatus>({ evm: null, native: null });
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [epoch, setEpoch] = useState(0);
  const chainIdRef = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    let apiRef: ApiPromise | null = null;
    let handshakeMs = 0;
    const t0 = performance.now();

    const pollEvm = async () => {
      try {
        const e = await readEvm(chainIdRef.current);
        if (e.ok) chainIdRef.current = e.chainId;
        if (alive) setS((p) => ({ ...p, evm: e }));
      } catch (err) {
        if (alive) setS((p) => ({ ...p, evm: { ok: false, error: msg(err) } }));
      }
    };
    const pollNative = async () => {
      if (!apiRef) return;
      try {
        const n = await readNative(apiRef, handshakeMs);
        if (alive) setS((p) => ({ ...p, native: n }));
      } catch (err) {
        if (alive) setS((p) => ({ ...p, native: { ok: false, error: msg(err) } }));
      }
    };

    void pollEvm();
    (async () => {
      try {
        const a = await getApi(PORTALDOT_V3.substrateWss);
        handshakeMs = Math.round(performance.now() - t0);
        apiRef = a;
        if (!alive) return;
        setApi(a);
        await pollNative();
      } catch (err) {
        if (alive) setS((p) => ({ ...p, native: { ok: false, error: msg(err) } }));
      }
    })();

    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void pollEvm();
      void pollNative();
    }, POLL_MS);
    return () => { alive = false; clearInterval(id); };
  }, [epoch]);

  const retry = useCallback(() => { setS({ evm: null, native: null }); setEpoch((e) => e + 1); }, []);
  const value = useMemo<Net>(() => ({ ...s, api, ready: s.evm !== null && s.native !== null, config: networkFrom(s), retry }), [s, api, retry]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNet(): Net {
  const v = useContext(Ctx);
  if (!v) throw new Error('useNet must be used inside <NetworkProvider>');
  return v;
}

/** Back-compat alias used by older pages. */
export const useNetworkStatus = useNet;
