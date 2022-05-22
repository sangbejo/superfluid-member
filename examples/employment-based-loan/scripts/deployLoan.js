const ethers = require("ethers");
const { Framework } = require("@superfluid-finance/sdk-core");
const Factory = require("../artifacts/contracts/LoanFactory.sol/LoanFactory.json");
const FactoryABI = Factory.abi;
const MOCKAggregator = require("../artifacts/contracts/test/MockV3Aggregator.sol/MockV3Aggregator.json");
const MOCK_ABI = MOCKAggregator.abi;
require("dotenv").config();

const collateralTokenAddress = ""; //NOTE - must be changed to reflect the address of collateral token being used
//latest factory address goes here
const factoryAddress = ""; // NOTE: must change to reflect actual address of the factory

//latest mockV3Aggregator goes here
const mockV3AggregatorAddress = ""; //NOTE - must change to reflect actual address of this contract

async function main() {

  const url = `${process.env.RPC_URL}`;
  const customHttpProvider = new ethers.providers.JsonRpcProvider(url);

  const sf = await Framework.create({
    chainId: process.env.CHAIN_ID,
    provider: customHttpProvider,
    customSubgraphQueriesEndpoint: "",
    dataMode: "WEB3_ONLY"
  });

  const borrower = sf.createSigner({
    privateKey:
      process.env.BORROWER_PRIVATE_KEY,
    provider: customHttpProvider
  });

  const employer = sf.createSigner({
    privateKey:
      process.env.EMPLOYER_PRIVATE_KEY,
    provider: customHttpProvider
  });

  console.log('running deploy loan script...')
  // We get the contract to deploy
  const loanFactory = new ethers.Contract(factoryAddress, FactoryABI, borrower);
  const daix = await sf.loadSuperToken("fDAIx");

  //this will be our collateral token
  const collateralToken = await sf.loadSuperToken(collateralTokenAddress);

  let borrowAmount = ethers.utils.parseEther("100");
  let interest = 10;
  let paybackMonths = 12;
  let collateralAmount = ethers.utils.parseEther("100");

  console.log('borrower: ', borrower.address);
  console.log("employer: ", employer.address);
  console.log(borrowAmount);
  console.log(interest);
  console.log(paybackMonths);
  console.log(collateralAmount);

  console.log(collateralToken.address);
  await loanFactory.connect(borrower).createNewLoan(
    borrowAmount.toString(), //borrowing 1000 fDAI tokens
    interest, // 10% annual interest
    paybackMonths, //in months
    collateralAmount.toString(), // total collateral amount required
    employer.address, //address of employer
    borrower.address, //address of borrower
    daix.address,
    collateralToken.address,
    sf.settings.config.hostAddress,
    mockV3AggregatorAddress,
    8
  )
  
  console.log("succeeded");
  
  //NOTE - you may need to run this script 2x - one to deploy, and another with the above call to createNewLoan() commented out so that you can simply read the address of the most recently created loan...

  //note - make sure that this is updated w the most recent loan id
  let loanAddress = await loanFactory.idToLoan(1);
    
  console.log("Loan contract deployed to:", loanAddress);
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });