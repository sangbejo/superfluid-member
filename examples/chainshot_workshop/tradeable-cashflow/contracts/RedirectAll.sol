// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {ISuperfluid, ISuperToken, ISuperApp, ISuperAgreement, SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol"; //"@superfluid-finance/ethereum-monorepo/packages/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";

import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";

contract RedirectAll is SuperAppBase {

    using CFAv1Library for CFAv1Library.InitData;

    CFAv1Library.InitData public cfaV1;
    bytes32 constant public CFA_ID = keccak256("org.superfluid-finance.agreements.ConstantFlowAgreement.v1");

    ISuperToken private _acceptedToken; // accepted token
    address public _receiver;

   constructor(
        ISuperfluid host,
        ISuperToken acceptedToken,
        address receiver
    ) {
        assert(address(host) != address(0));
        assert(address(acceptedToken) != address(0));
        assert(address(receiver) != address(0));

        _acceptedToken = acceptedToken;
        _receiver = receiver;

        cfaV1 = CFAv1Library.InitData(
            host,
            IConstantFlowAgreementV1(
                address(host.getAgreementClass(CFA_ID))
            )
        );

        uint256 configWord = SuperAppDefinitions.APP_LEVEL_FINAL |
            // change from 'before agreement stuff to after agreement
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

        host.registerApp(configWord);
    }

    /**************************************************************************
     * Redirect Logic
     *************************************************************************/

    function currentReceiver()
        external
        view
        returns (
            uint256 startTime,
            address receiver,
            int96 flowRate
        )
    {
        if (_receiver != address(0)) {
            (startTime, flowRate, , ) = cfaV1.cfa.getFlow(
                _acceptedToken,
                address(this),
                _receiver
            );
            receiver = _receiver;
        }
    }

    event ReceiverChanged(address receiver);

    /// @dev If a new stream is opened, or an existing one is opened
    function _updateOutflow(bytes calldata ctx)
        private
        returns (bytes memory newCtx)
    {
       //TODO
    }

    // @dev Change the Receiver of the total flow
    function _changeReceiver(address newReceiver) internal {
        //TODO
    }

    /**************************************************************************
     * SuperApp callbacks
     *************************************************************************/

    function afterAgreementCreated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, //_agreementId
        bytes calldata, //_agreementData
        bytes calldata, //_cbdata
        bytes calldata _ctx
    )
        external
        override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        return _updateOutflow(_ctx);
    }

    function afterAgreementUpdated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata, // _agreementData,
        bytes calldata, // _cbdata,
        bytes calldata _ctx
    )
        external
        override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        return _updateOutflow(_ctx);
    }

    function afterAgreementTerminated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata, // _agreementData
        bytes calldata, // _cbdata,
        bytes calldata _ctx
    ) external override onlyHost returns (bytes memory newCtx) {
        // According to the app basic law, we should never revert in a termination callback
        if (!_isSameToken(_superToken) || !_isCFAv1(_agreementClass))
            return _ctx;
        return _updateOutflow(_ctx);
    }

    function _isSameToken(ISuperToken superToken) private view returns (bool) {
        return address(superToken) == address(_acceptedToken);
    }

    function _isCFAv1(address agreementClass) private view returns (bool) {
        return ISuperAgreement(agreementClass).agreementType() == CFA_ID;
    }

    modifier onlyHost() {
        require(
            msg.sender == address(cfaV1.host),
            "RedirectAll: support only one host"
        );
        _;
    }

    modifier onlyExpected(ISuperToken superToken, address agreementClass) {
        require(_isSameToken(superToken), "RedirectAll: not accepted token");
        require(_isCFAv1(agreementClass), "RedirectAll: only CFAv1 supported");
        _;
    }
}
