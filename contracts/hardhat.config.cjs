// Hardhat config for Portaldot V3 testnet (pallet-revive Ethereum RPC).
// Deliberately contains NO private keys and reads none from the environment.
// Deploy from the browser instead: the app's /deploy page uses your injected wallet (MetaMask).
// pallet-revive on this runtime accepts EVM bytecode (revive.allowEVMBytecode), so plain solc output works.

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.28',
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'cancun' },
  },
  paths: { sources: './src', artifacts: './hh-artifacts', cache: './cache' },
  networks: {
    portaldot: {
      url: 'https://test-evm-rpc-v3.portaldot.dev',
      chainId: 420420777,
      accounts: [],
    },
  },
};
