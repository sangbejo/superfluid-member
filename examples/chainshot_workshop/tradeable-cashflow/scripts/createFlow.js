const hre = require("hardhat");
const { Framework } = require("@superfluid-finance/sdk-core");
const { ethers, providers } = require("ethers");
require("dotenv");
// const TradeableCashflow = require("../artifacts/contracts/TradeableCashflow.sol/TradeableCashflow.json");
// const TradeableCashflowABI = TradeableCashflow.abi;

async function main() {

  const url = `${process.env.KOVAN_RPC_URL}`;
  const customHttpProvider = new ethers.providers.JsonRpcProvider(url);

  const sf = await Framework.create({
    chainId: 42,
    provider: customHttpProvider,
    customSubgraphQueriesEndpoint: "",
    dataMode: "WEB3_ONLY"
  });
  const signer = sf.createSigner({
    privateKey:
      process.env.DEPLOYER_PRIVATE_KEY,
    provider: customHttpProvider
  });

  const daix = await sf.loadSuperToken("fDAIx");

//add logic...
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

