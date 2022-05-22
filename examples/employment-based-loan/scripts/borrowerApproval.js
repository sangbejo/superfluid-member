const loanAddress = ""; //NOTE: this must be changed to reflect the live loan address
const collateralTokenAddress = ""; //NOTE: this must be changed to reflect the collateral token being used
const ethers = require("ethers");
const { Framework } = require("@superfluid-finance/sdk-core");
const LoanContract = require("../artifacts/contracts/EmploymentLoan.sol/EmploymentLoan.json");
const LoanContractABI = LoanContract.abi;
require("dotenv").config();

//NOTE
//lender should call lend on the above contract using sdk

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
        privateKey: process.env.BORROWER_PRIVATE_KEY,
        provider: customHttpProvider
    });

    const employmentLoan = new ethers.Contract(loanAddress, LoanContractABI, borrower);

    //NOTE - this is a token which was deployed for testing purposes only on kovan. choose a new token to reflect your preferences
    const collateralToken = await sf.loadSuperToken(collateralTokenAddress);

    const collateralAmount = await employmentLoan.collateralAmount();

    const borrowerApprovalOperation = collateralToken.approve({
        receiver: loanAddress,
        amount: collateralAmount
    });

    console.log('approving collateral spend...')
    await borrowerApprovalOperation.exec(borrower).then(console.log);    
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });