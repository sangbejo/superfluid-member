// SPDX-License-Identifier: AGPLv3
pragma solidity 0.8.12;

/**
 * @title Call utilities library that is absent from the OpenZeppelin
 * @author Superfluid
 */
library CallUtils {

    /// CallUtils: Target reverted when response.length is 0
    error TargetReverted();

    /// @dev Get the revert message from a call
    /// @notice This is needed in order to get the human-readable revert message from a call
    /// @param res Response of the call
    /// @return Revert message string
    function getRevertMsg(bytes memory res) internal pure returns (string memory) {
        // If the _res length is less than 68, then the transaction failed silently (without a revert message)
        if (res.length == 0) return "CallUtils: target reverted";
        // solhint-disable-next-line no-inline-assembly
        assembly {
            // Slice the sighash.
            res := add(res, 0x04)
        }
        return abi.decode(res, (string)); // All that remains is the revert string
    }

    /// @notice Handles the returned revert response data
    /// TODO else if retData first 4 bytes is Panic(uint256) => revert it in assembly
    ///      else this is a custom error and we should revert it in assembly
    /// @param retData retData of the call
    /// @return Revert message string
    function revertFromReturnedData(bytes memory retData) internal pure returns (string memory) {
        if (retData.length == 0) revert TargetReverted();

        // keccak256("Error(string)") = 08c379a0
        if (bytes4(retData) == bytes4(0x08c379a0)) {
            // solhint-disable-next-line no-inline-assembly
            assembly {
                // Slice the sighash.
                retData := add(retData, 0x04)
            }
            string memory err = abi.decode(retData, (string));
            revert(err);
        }

        // keccak256("Panic(uint256)") = 4e487b71
        // if (bytes4(retData) == bytes4(0x4e487b71)) {
            
        // }

        uint256 length = retData.length;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            // Slice the sighash.
            retData := add(retData, 0x04)
            revert(0, length)
        }
    }

    /**
    * @dev Helper method to parse data and extract the method signature (selector).
    *
    * Copied from: https://github.com/argentlabs/argent-contracts/
    * blob/master/contracts/modules/common/Utils.sol#L54-L60
    */
    function parseSelector(bytes memory callData) internal pure returns (bytes4 selector) {
        require(callData.length >= 4, "CallUtils: invalid callData");
        // solhint-disable-next-line no-inline-assembly
        assembly {
            selector := mload(add(callData, 0x20))
        }
    }

    /**
     * @dev Pad length to 32 bytes word boundary
     */
    function padLength32(uint256 len) internal pure returns (uint256 paddedLen) {
        return ((len / 32) +  (((len & 31) > 0) /* rounding? */ ? 1 : 0)) * 32;
    }

    /**
     * @dev Validate if the data is encoded correctly with abi.encode(bytesData)
     *
     * Expected ABI Encode Layout:
     * | word 1      | word 2           | word 3           | the rest...
     * | data length | bytesData offset | bytesData length | bytesData + padLength32 zeros |
     */
    function isValidAbiEncodedBytes(bytes memory data) internal pure returns (bool) {
        if (data.length < 64) return false;
        uint bytesOffset;
        uint bytesLen;
        // bytes offset is always expected to be 32
        assembly { bytesOffset := mload(add(data, 32)) }
        if (bytesOffset != 32) return false;
        assembly { bytesLen := mload(add(data, 64)) }
        // the data length should be bytesData.length + 64 + padded bytes length
        return data.length == 64 + padLength32(bytesLen);
    }

}
