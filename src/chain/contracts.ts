// Clanker factory addresses on Base mainnet
export const CLANKER_FACTORY_ADDRESSES = [
    '0x2964Cde93aBC2840003FD1307F9f9fD734493774', // Clanker v1
    '0x966835a643ec1B854486DA3B635aEd5BCDb75db6', // Clanker v2
    '0x0000000000013949f288172F7E1721b0d25721B0', // Clank.fun v4
].map(addr => addr.toLowerCase() as `0x${string}`);

// Doppler Airlock contract address on Base mainnet
export const DOPPLER_AIRLOCK_ADDRESS = '0x660eAaEdEBc968f8f3694354FA8EC0b4c5Ba8D12' as `0x${string}`;

// ABIs
export const CLANKER_TOKEN_CREATED_ABI = 'event TokenCreated(address indexed tokenAddress, uint256 positionId, address indexed deployer, uint256 fid, string name, string symbol, uint256 supply, uint256 lockedLiquidityPercentage, string castHash)';

export const DOPPLER_TOKEN_CREATED_ABI = 'event TokenCreated(address indexed tokenAddress, address indexed creator, string name, string symbol)';
