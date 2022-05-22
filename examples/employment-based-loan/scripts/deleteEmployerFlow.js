const ethers = require("ethers");
const { Framework } = require("@superfluid-finance/sdk-core");
require("dotenv").config();

const loanAddress = ""; //NOTE - need to change to reflect actual loan address

async function main() {

  const url = `${process.env.RPC_URL}`;
  const customHttpProvider = new ethers.providers.JsonRpcProvider(url);

  const sf = await Framework.create({
    chainId: process.env.CHAIN_ID,
    provider: customHttpProvider,
    customSubgraphQueriesEndpoint: "",
    dataMode: "WEB3_ONLY"
  });

  const employer = sf.createSigner({
    privateKey:
      process.env.EMPLOYER_PRIVATE_KEY,
    provider: customHttpProvider
  });

  const daix = await sf.loadSuperToken("fDAIx");
    
  const employerDeleteFlowOperation = sf.cfaV1.deleteFlow({
      sender: employer.address,
      receiver: loanAddress,
      superToken: daix.address
  });

  console.log('running delete flow script...');

  await employerDeleteFlowOperation.exec(employer).then(console.log);
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });