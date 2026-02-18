// All known Clanker factory contract addresses across versions
export const CLANKER_FACTORY_ADDRESSES = [
    '0xE85A59c628F7d27878ACeB4bf3b35733630083a9', // v4.0.0
    '0x2A787b2362021cC3eEa3C24C4748a6cD5B687382', // v3.1.0
    '0x375C15db32D28cEcdcAB5C03Ab889bf15cbD2c5E', // v3.0.0
    '0x732560fa1d1A76350b1A500155BA978031B53833', // v2.0.0
    '0x9B84fcE5Dcd9a38d2D01d5D72373F6b6b067c3e1', // v1.0.0
    '0x250c9FB2b411B48273f69879007803790A6AeA47', // v0.0.0
] as const;

// TokenCreated event ABI — covers both older and newer Clanker factory signatures.
// We use a broad ABI that captures the token address from the event.
// The exact event signature may vary across versions, so we watch for any log
// from these contracts and parse the token address from the first indexed topic.
export const TOKEN_CREATED_EVENT_ABI = [
    {
        type: 'event',
        name: 'TokenCreated',
        inputs: [
            { name: 'tokenAddress', type: 'address', indexed: true },
            { name: 'positionId', type: 'uint256', indexed: false },
            { name: 'deployer', type: 'address', indexed: true },
            { name: 'fid', type: 'uint256', indexed: false },
            { name: 'name', type: 'string', indexed: false },
            { name: 'symbol', type: 'string', indexed: false },
            { name: 'supply', type: 'uint256', indexed: false },
            { name: 'lockedLiquidityPercentage', type: 'uint256', indexed: false },
            { name: 'castHash', type: 'string', indexed: false },
        ],
    },
] as const;

// Minimal ABI for older factory versions that emit a simpler event
export const TOKEN_CREATED_EVENT_ABI_SIMPLE = [
    {
        type: 'event',
        name: 'TokenCreated',
        inputs: [
            { name: 'tokenAddress', type: 'address', indexed: true },
            { name: 'deployer', type: 'address', indexed: true },
            { name: 'name', type: 'string', indexed: false },
            { name: 'symbol', type: 'string', indexed: false },
        ],
    },
] as const;
