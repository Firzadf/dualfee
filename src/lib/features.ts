export type Feature = { to: string; title: string; body: string };

export const FEATURES: Feature[] = [
  { to: '/app/lab', title: 'Fee Lab', body: 'Transfer, ERC-20, deploy or raw calldata, priced on both surfaces in parallel, with a fee-vs-deposit breakdown and a shareable link.' },
  { to: '/app/leaderboard', title: 'Leaderboard', body: 'Six common ops measured live in your browser, each reproducible in the Lab with one click.' },
  { to: '/app/history', title: 'History', body: 'Every measurement saved locally, with ratio and gas-price charts over time.' },
  { to: '/app/calculator', title: 'Cost calculator', body: 'Ops per month → monthly cost on each surface, the cheaper path, and how much is a refundable deposit.' },
  { to: '/app/convert', title: 'Address converter', body: 'EVM 0x ↔ native SS58 / AccountId32 with pallet-revive’s mapping rules, validated and copyable.' },
  { to: '/app/verify', title: 'Export & verify', body: 'Export a measurement as JSON with a SHA-256 stamp; anyone can check it hasn’t been edited.' },
  { to: '/app/deploy', title: 'Deploy & record', body: 'Deploy FeeRegistry.sol with your own wallet and write a comparison on-chain. DualFee holds no keys.' },
];
