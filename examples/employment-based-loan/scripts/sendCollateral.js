const loanAddress = ""; //NOTe - update with actual loan address
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

    console.log('sending collateral...')
    await employmentLoan.connect(borrower).sendCollateral().then(console.log);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });