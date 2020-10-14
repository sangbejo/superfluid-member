// SPDX-License-Identifier: MIT
/* solhint-disable not-rely-on-time */
pragma solidity 0.7.3;

import { ISuperfluid } from "../interfaces/superfluid/ISuperfluid.sol";
import { ISuperAgreement } from "../interfaces/superfluid/ISuperAgreement.sol";
import { ISuperfluidGovernance } from "../interfaces/superfluid/ISuperfluidGovernance.sol";
import { ISuperfluidToken } from "../interfaces/superfluid/ISuperfluidToken.sol";

import { FixedSizeData } from "../utils/FixedSizeData.sol";
import { Math } from "@openzeppelin/contracts/math/Math.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { SignedSafeMath } from "@openzeppelin/contracts/math/SignedSafeMath.sol";


/**
 * @title Superfluid's token implementation
 *
 * @author Superfluid
 */
abstract contract SuperfluidToken is ISuperfluidToken
{

    using SafeMath for uint256;
    using SignedSafeMath for int256;

    /// @dev Superfluid contract
    ISuperfluid internal _host;

    /// @dev Active agreement bitmap
    mapping(address => uint256) internal _inactiveAgreementBitmap;

    /// @dev Settled balance for the account
    mapping(address => int256) internal _balances;

    /// @dev ISuperfluidToken.getAccountActiveAgreements implementation
    function getHost()
       external view
       override(ISuperfluidToken)
       returns(address host)
    {
       return address(_host);
    }

    /**************************************************************************
     * Real-time balance functions
     *************************************************************************/

    /// @dev ISuperfluidToken.isAccountInsolvent implementation
    function isAccountInsolvent(
       address account
    )
       external view override
       returns(bool)
    {
       (int256 amount, ,) = realtimeBalanceOf(account, block.timestamp);
       return amount < 0;
    }

    /// @dev ISuperfluidToken.realtimeBalanceOf implementation
    function realtimeBalanceOf(
       address account,
       uint256 timestamp
    )
       public view override
       returns (int256 availableBalance, uint256 deposit, uint256 owedDeposit)
    {
        int256 realtimeBalance = _balances[account];
        ISuperAgreement[] memory activeAgreements = getAccountActiveAgreements(account);
        for (uint256 i = 0; i < activeAgreements.length; i++) {
            (
                int256 agreementDynamicBalance,
                uint256 agreementDeposit,
                uint256 agreementOwedDeposit) = activeAgreements[i]
                    .realtimeBalanceOf(
                         this,
                         account,
                         timestamp
                     );
            realtimeBalance = realtimeBalance.add(agreementDynamicBalance);
            deposit = deposit.add(agreementDeposit);
            owedDeposit = owedDeposit.add(agreementOwedDeposit);
        }
        //availableBalance = realtimeBalance;
        availableBalance = realtimeBalance
            .sub(int256(deposit))
            .add(int256(Math.min(deposit, owedDeposit)));
    }

    /// @dev ISuperfluidToken.realtimeBalanceOfNow implementation
    function realtimeBalanceOfNow(
       address account
    )
       external view override
       returns (int256 availableBalance, uint256 deposit, uint256 owedDeposit) {
       return realtimeBalanceOf(account, block.timestamp);
    }

    /// @dev ISuperfluidToken.getAccountActiveAgreements implementation
    function getAccountActiveAgreements(address account)
       public view override
       returns(ISuperAgreement[] memory)
    {
       return _host.mapAgreementClasses(~_inactiveAgreementBitmap[account]);
    }

    /**************************************************************************
     * Token implementation helpers
     *************************************************************************/

    function _mint(
        address account,
        int256 amount
    )
        internal
    {
        _balances[account] = _balances[account].add(amount);
    }

    function _burn(
        address account,
        int256 amount
    )
        internal
    {
        (int256 availableBalance,,) = realtimeBalanceOf(account, block.timestamp);
        require(availableBalance >= amount, "SuperfluidToken: burn amount exceeds balance");
        _balances[account] = _balances[account].sub(amount);
    }

    function _move(
        address from,
        address to,
        int256 amount
    )
        internal
    {
        (int256 availableBalance,,) = realtimeBalanceOf(from, block.timestamp);
        require(availableBalance >= amount, "SuperfluidToken: move amount exceeds balance");
        _balances[from] = _balances[from].sub(amount);
        _balances[to] = _balances[to].add(amount);
    }

    /**************************************************************************
     * Super Agreement hosting functions
     *************************************************************************/

    /// @dev ISuperfluidToken.createAgreement implementation
    function createAgreement(
        bytes32 id,
        bytes32[] calldata data
    )
        external override
    {
        // TODO check data existence??
        address agreementClass = msg.sender;
        bytes32 slot = keccak256(abi.encode("AgreementData", agreementClass, id));
        FixedSizeData.storeData(slot, data);
        emit AgreementCreated(agreementClass, id, data);
    }

    /// @dev ISuperfluidToken.getAgreementData implementation
    function getAgreementData(
        address agreementClass,
        bytes32 id,
        uint dataLength
    )
        external view override
        returns(bytes32[] memory data)
    {
        bytes32 slot = keccak256(abi.encode("AgreementData", agreementClass, id));
        data = FixedSizeData.loadData(slot, dataLength);
    }

    /// @dev ISuperfluidToken.updateAgreementData implementation
    function updateAgreementData(
        bytes32 id,
        bytes32[] calldata data
    )
        external override
    {
        address agreementClass = msg.sender;
        bytes32 slot = keccak256(abi.encode("AgreementData", agreementClass, id));
        FixedSizeData.storeData(slot, data);
        emit AgreementUpdated(msg.sender, id, data);
    }

    /// @dev ISuperfluidToken.terminateAgreement implementation
    function terminateAgreement(
        bytes32 id,
        uint dataLength
    )
        external override
    {
        address agreementClass = msg.sender;
        bytes32 slot = keccak256(abi.encode("AgreementData", agreementClass, id));
        FixedSizeData.eraseData(slot, dataLength);
        emit AgreementTerminated(msg.sender, id);
    }

    /// @dev ISuperfluidToken.liquidateAgreement implementation
    function liquidateAgreement
    (
        address liquidator,
        bytes32 id,
        address account,
        uint256 deposit
    )
        external override
        onlyAgreement
    {
        ISuperfluidGovernance gov = _host.getGovernance();
        address rewardAccount = gov.getRewardAddress(this);

        // reward go to liquidator if reward address is null
        if (rewardAccount == address(0)) {
            rewardAccount = liquidator;
        }

        (int256 availableBalance, , ) = realtimeBalanceOf(account, block.timestamp);

        int256 remain = availableBalance.add(int256(deposit));

        // Liquidation rules:
        // #1 Can the agreement deposit can still cover the available balance deficit?
        if (remain > 0) {
            // #1.1 yes: then the reward address takes the deposit
            _balances[rewardAccount] = _balances[rewardAccount].add(int256(deposit));
            // #2.1 the account pays for the deposit
            _balances[account] = _balances[account].sub(int256(deposit));
            emit AgreementLiquidated(msg.sender, id, account, rewardAccount, deposit);
        } else {
            // #1.2 no: then the liquidator takes the deposit
            _balances[liquidator] = _balances[liquidator].add(int256(deposit));
            // #2.2 the account still pays for the deposit, but also refunded with the deficit
            _balances[account] = _balances[account]
                .sub(availableBalance)
                .sub(int256(deposit));
            // #2.3 and the reward address pay the deficit
            _balances[rewardAccount] = _balances[rewardAccount].add(availableBalance);
            emit AgreementLiquidated(msg.sender, id, account, liquidator, deposit);
        }
    }

    /// @dev ISuperfluidToken.updateAgreementState implementation
    function updateAgreementStateSlot(
        address account,
        uint256 slotId,
        bytes32[] calldata slotData
    )
        external override
    {
        bytes32 slot = keccak256(abi.encode("AgreementState", msg.sender, account, slotId));
        FixedSizeData.storeData(slot, slotData);
        // FIXME change how this is done
        //_addAgreementClass(msg.sender, account);
        emit AgreementStateUpdated(msg.sender, account, slotId);
    }

    /// @dev ISuperfluidToken.getAgreementState implementation
    function getAgreementStateSlot(
        address agreementClass,
        address account,
        uint256 slotId,
        uint dataLength
    )
        external override view
        returns (bytes32[] memory slotData) {
        bytes32 slot = keccak256(abi.encode("AgreementState", agreementClass, account, slotId));
        slotData = FixedSizeData.loadData(slot, dataLength);
    }

    function settleBalance(
        address account,
        int256 delta
    )
        external override
        onlyAgreement
    {
        _balances[account] = _balances[account].add(delta);
    }

    /**************************************************************************
    * Modifiers
    *************************************************************************/

    modifier onlyHost() {
        require(address(_host) == msg.sender, "SuperfluidToken: Only host contract allowed");
        _;
    }

    modifier onlyAgreement() {
        require(_host.isAgreementClassListed(ISuperAgreement(msg.sender)), "SF: Only listed agreeement allowed");
        _;
    }

}
