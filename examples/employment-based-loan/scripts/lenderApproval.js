//most recent loan address
const loanAddress = ""; //NOTE - update w actual loan address
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

    const lender = sf.createSigner({
        privateKey: process.env.LENDER_PRIVATE_KEY,
        provider: customHttpProvider
    });

    const daix = await sf.loadSuperToken("fDAIx");

    const employmentLoan = new ethers.Contract(loanAddress, LoanContractABI, lender);

    const borrowAmount = await employmentLoan.borrowAmount();

    const lenderBalance = await daix.balanceOf({account: lender.address, providerOrSigner: lender});

    const lenderApprovalOperation = daix.approve({
        receiver: employmentLoan.address,
        amount: borrowAmount
    });

    await lenderApprovalOperation.exec(lender);    

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });