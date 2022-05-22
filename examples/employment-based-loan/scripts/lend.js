const ethers = require("ethers");
const { Framework } = require("@superfluid-finance/sdk-core");
const LoanContract = require("../artifacts/contracts/EmploymentLoan.sol/EmploymentLoan.json");
const LoanContractABI = LoanContract.abi;
require("dotenv").config();
const collateralTokenAddress = ""; //NOTE - add your collateral token address here

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

    //most recent loan address
    const loanAddress = ""; //NOTE - must be updated to reflect actual loan address

    const lender = sf.createSigner({
        privateKey: process.env.LENDER_PRIVATE_KEY,
        provider: customHttpProvider
    });

    const daix = await sf.loadSuperToken("fDAIx");
    const collateralToken = await sf.loadSuperToken(collateralTokenAddress);

    const employmentLoan = new ethers.Contract(loanAddress, LoanContractABI, lender);

    console.log(employmentLoan.address);

    const borrowAmount = await employmentLoan.borrowAmount();

    const allowance = await daix.allowance({owner: lender.address, spender: loanAddress, providerOrSigner: lender})

    const collateralBalance = await collateralToken.balanceOf({account: loanAddress, providerOrSigner: lender});
    console.log(collateralBalance.toString());

    const collateralAmount = await employmentLoan.collateralAmount();
    console.log(collateralAmount.toString())

    const paymentFlowrate = await employmentLoan.getPaymentFlowRate();
    
    await employmentLoan.connect(lender).lend();

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });