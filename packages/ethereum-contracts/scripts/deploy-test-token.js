const {web3tx} = require("@decentral.ee/web3-helpers");
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const getConfig = require("./libs/getConfig");

const {
    getScriptRunnerFactory: S,
    extractWeb3Options,
    builtTruffleContractLoader,
} = require("./libs/common");

/**
 * @dev Deploy test token (Mintable ERC20) to the network.
 * @param {Array} argv Overriding command line arguments
 * @param {boolean} options.isTruffle Whether the script is used within native truffle framework
 * @param {Web3} options.web3  Injected web3 instance
 * @param {Address} options.from Address to deploy contracts from
 * @param {boolean} options.resetToken Reset the token deployment
 *
 * Usage: npx truffle exec scripts/deploy-test-token.js : {TOKEN_SYMBOL}
 */
module.exports = eval(`(${S.toString()})()`)(async function (
    args,
    options = {}
) {
    console.log("======== Deploying test token ========");
    let {resetToken} = options;

    if (args.length !== 1) {
        throw new Error("Wrong number of arguments");
    }
    const tokenSymbol = args.pop();
    console.log("Token symbol", tokenSymbol);

    resetToken = resetToken || !!process.env.RESET_TOKEN;
    console.log("reset token: ", resetToken);

    const networkType = await this.web3.eth.net.getNetworkType();
    const networkId = await web3.eth.net.getId();
    const chainId = await this.web3.eth.getChainId();
    console.log("network Type: ", networkType);
    console.log("network ID: ", networkId);
    console.log("chain ID: ", chainId);
    const config = getConfig(chainId);

    const {TestResolver, TestToken} = await SuperfluidSDK.loadContracts({
        ...extractWeb3Options(options),
        additionalContracts: ["TestResolver", "TestToken"],
        contractLoader: builtTruffleContractLoader,
    });

    const testResolver = await TestResolver.at(config.resolverAddress);
    console.log("Resolver address", testResolver.address);

    // deploy test token and its super token
    const name = `tokens.${tokenSymbol}`;
    let testTokenAddress = await testResolver.get(name);
    if (
        resetToken ||
        testTokenAddress === "0x0000000000000000000000000000000000000000"
    ) {
        const testToken = await web3tx(TestToken.new, "TestToken.new")(
            tokenSymbol + " Fake Token",
            tokenSymbol,
            18
        );
        testTokenAddress = testToken.address;
        await web3tx(testResolver.set, `TestResolver set ${name}`)(
            name,
            testTokenAddress
        );
    } else {
        console.log("Token already deployed");
    }
    console.log(`Token ${tokenSymbol} address`, testTokenAddress);

    console.log("======== Test token deployed ========");
});
