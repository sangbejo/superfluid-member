// eslint-disable-next-line no-global-assign
if (typeof module === "undefined") module = {};

// eslint-disable-next-line no-undef
Superfluid_getConfig = module.exports = function getConfig(chainId, version) {
    const DEFAULT_CONFIGS = {
        //
        // Testing environemts
        //
        31337: {
            // for local testing hardhat
            nativeTokenSymbol: "ETH",
        },
        1337: {
            // for local testing localhost
            nativeTokenSymbol: "ETH",
        },
        4447: {
            // for local testing (truffle internal ganache)
            nativeTokenSymbol: "ETH",
        },
        5777: {
            // for local testing (external ganache)
            nativeTokenSymbol: "ETH",
        },

        //
        // ETHEREUM
        //
        5: {
            // goerli
            nativeTokenSymbol: "ETH",
            resolverAddress: "0x3710AB3fDE2B61736B8BB0CE845D6c61F667a78E",
            versions: {
                v1: {
                    subgraphQueryEndpoint:
                        "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-dev-goerli",
                },
            },
        },
        4: {
            // rinkeby
            nativeTokenSymbol: "ETH",
            resolverAddress: "0x659635Fab0A0cef1293f7eb3c7934542B6A6B31A",
            versions: {
                v1: {
                    subgraphQueryEndpoint:
                        "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-dev-rinkeby",
                },
            },
        },

        3: {
            // ropsten
            nativeTokenSymbol: "ETH",
            resolverAddress: "0x3b44e06D96BcA9412CBc23F80F41B9e30933571a",
            versions: {
                v1: {
                    subgraphQueryEndpoint:
                        "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-dev-ropsten",
                },
            },
        },
        42: {
            // kovan
            nativeTokenSymbol: "ETH",
            resolverAddress: "0x851d3dd9dc97c1df1DA73467449B3893fc76D85B",
            versions: {
                v1: {
                    subgraphQueryEndpoint:
                        "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-dev-kovan",
                },
            },
        },

        //
        // MATIC: https://docs.matic.network/docs/develop/network-details/network/
        //
        137: {
            // (matic) mainnet
            nativeTokenSymbol: "MATIC",
            resolverAddress: "0xE0cc76334405EE8b39213E620587d815967af39C",
            versions: {
                v1: {
                    subgraphQueryEndpoint:
                        "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-dev-matic",
                },
            },
        },
        80001: {
            // (matic) mumbai testnet
            nativeTokenSymbol: "MATIC",
            resolverAddress: "0x8C54C83FbDe3C59e59dd6E324531FB93d4F504d3",
            versions: {
                v1: {
                    subgraphQueryEndpoint:
                        "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-dev-mumbai",
                },
            },
        },

        //
        // xDAI: https://www.xdaichain.com/for-users/wallets/metamask/metamask-setup
        //
        0x64: {
            nativeTokenSymbol: "xDAI",
            resolverAddress: "0xD2009765189164b495c110D61e4D301729079911",
            versions: {
                v1: {
                    subgraphQueryEndpoint:
                        "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-dev-xdai",
                },
            },
        },

        // ARTIS
        0x03c401: {
            // (artis) tau1 testnet
            resolverAddress: "0x79D426CD219eDCFEB2dCbcf7ea0F8B3642C56F47",
        },

        //
        // ARBITRUM (testnet rinkeby)
        //
        421611: {
            // arbitrum testnet
            resolverAddress: "0x79D426CD219eDCFEB2dCbcf7ea0F8B3642C56F47",
        },
    };

    let configs = {
        ...DEFAULT_CONFIGS[chainId],
    };
    // load version specific configs
    if (configs.versions) {
        configs = {
            ...configs,
            ...configs.versions[version],
        };
        delete configs.versions;
    }
    // overriding environment variables
    if (global && global.process && global.process.env.TEST_RESOLVER_ADDRESS) {
        configs.resolverAddress = global.process.env.TEST_RESOLVER_ADDRESS;
    }

    return configs;
};
