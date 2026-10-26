export type Feature = { to: string; title: string; body: string };

export const FEATURES: Feature[] = [
  { to: '/app/lab', title: 'Fee Lab', body: 'Transfer, ERC-20, deploy or raw calldata, priced on both surfaces in parallel with method, gas, weight and deposit.' },
  { to: '/app/leaderboard', title: 'Leaderboard', body: 'Six common ops measured live in your browser, cached locally with a timestamp.' },
  { to: '/app/deploy', title: 'Deploy & record', body: 'Deploy FeeRegistry.sol with your own wallet and write a comparison on-chain. DualFee holds no keys.' },
];
