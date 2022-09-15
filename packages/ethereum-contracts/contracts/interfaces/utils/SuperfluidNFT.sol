// SPDX-License-Identifier: AGPLv3
pragma solidity 0.8.16;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import {
    ISuperfluid
} from "../superfluid/ISuperfluid.sol";
import {
    IConstantFlowAgreementV1
} from "../agreements/IConstantFlowAgreementV1.sol";
import "./StringLib.sol";

/**
* An ERC-721 based NFT representing Superfluid agreement states
* Expects to be owned by a contract implementing the xxx interface.
* The owner can mint and burn tokens.
* The owner is responsible for not breaking anything when handing over ownership.
* Ownership can be handed over using the method transferOwnership() inherited by Ownable.
*/
contract SuperfluidNFT is ERC721, Ownable {
    error NFT_NOT_TRANSFERABLE();

    using Strings for uint256;

    ISuperfluid internal _host;
    IConstantFlowAgreementV1 internal _cfa;

    constructor(ISuperfluid host) ERC721("Superfluid", "SF") {
        _host = host;
        _cfa = IConstantFlowAgreementV1(address(_host.getAgreementClass(
            keccak256("org.superfluid-finance.agreements.ConstantFlowAgreement.v1")
        )));
    }

    // Overridden transfer method invokes the owner hook for all transfers.
    // _beforeTokenTransfer() was not used because it's invoked on minting too, adding complication.
    function _transfer(address from, address to, uint256 tokenId) internal override {
        revert NFT_NOT_TRANSFERABLE();
    }

    function mint(address sender, address receiver) public onlyOwner returns(uint256) {
        uint256 tokenId = uint256(keccak256(abi.encode(sender, receiver)));
        _safeMint(receiver, tokenId);
        return tokenId;
    }

    function burn(uint256 tokenId) public onlyOwner {
        _burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        return string(abi.encodePacked(
            "https://nft.x.superfluid.dev/cfa/",
            tokenId.toString()
        ));
    }
}