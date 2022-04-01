// SPDX-License-Identifier: MIT

// Ape Pixel Gang 10k NFT Project
//
// Author: 0xPilou

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ApePixelGang is ERC721Enumerable, Ownable {
    using SafeERC20 for IERC20;
    using Strings for uint256;

    uint256 public tokenCounter;
    uint256 public constant MAX_QTY = 10000;
    uint256 public price = 0.05 ether;
    uint256 public apecoinPrice = 15e18;
    uint256 public startBlock =
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

    address public constant boredApeContract =
        0x4c8734D7978373DE413aD6d36bFCafB7f76F6bb1;
    address public constant founder1 =
        0x2E2435DBADf4e825Ef7C83d871C0aB272EEcD438;
    address public constant founder2 =
        0xf1088C8a435e46f8e75EAcd62Df584D96B310866;
    address public constant apecoin =
        0x4d224452801ACEd8B2F0aebE155379bb5D594381;

    string baseTokenURI;
    string public notRevealedURI;
    bool public revealed = false;

    constructor(string memory _initNotRevealedURI)
        ERC721("Ape Pixel Gang", "APG")
    {
        tokenCounter = 0;
        setNotRevealedURI(_initNotRevealedURI);

        // Mint 30 Ape Pixel Gang for the team & giveaway
        for (uint256 i = 0; i < 30; i++) {
            tokenCounter = tokenCounter + 1;
            _safeMint(msg.sender, tokenCounter);
        }
    }

    // Helper to check if the start block has passed
    // Return true if the start block has passed, false otherwise
    function mintingStarted() public view returns (bool) {
        return block.number >= startBlock;
    }

    // Mint Function
    function mint(uint256 _num) public payable {
        require(
            mintingStarted(),
            "It is not time to mint the collectible yet !"
        );
        require(tokenCounter < MAX_QTY, "All collectible have been minted !");
        require(
            _num > 0 && _num <= 10,
            "You can mint no fewer than 1, and no more than 10 collectible at a time"
        );
        require(
            tokenCounter + _num <= MAX_QTY,
            "I'm afraid you've failed to mint too many collectible"
        );
        require(
            msg.value >= price * _num,
            "Ether value sent is not sufficient"
        );

        for (uint256 i = 0; i < _num; i++) {
            tokenCounter = tokenCounter + 1;
            _safeMint(msg.sender, tokenCounter);
        }
    }

    // Mint Function - accept APECOIN as payment
    function mintWithApecoin(uint256 _num) public {
        require(
            mintingStarted(),
            "It is not time to mint the collectible yet !"
        );
        require(tokenCounter < MAX_QTY, "All collectible have been minted !");
        require(
            _num > 0 && _num <= 10,
            "You can mint no fewer than 1, and no more than 10 collectible at a time"
        );
        require(
            tokenCounter + _num <= MAX_QTY,
            "I'm afraid you've failed to mint too many collectible"
        );

        IERC20(apecoin).safeTransferFrom(
            msg.sender,
            address(this),
            apecoinPrice * _num
        );

        for (uint256 i = 0; i < _num; i++) {
            tokenCounter = tokenCounter + 1;
            _safeMint(msg.sender, tokenCounter);
        }
    }

    // Returns the Token URI of a given _tokenId
    // Will return the hidden URI if the reveal did not happen yet
    function tokenURI(uint256 _tokenId)
        public
        view
        override(ERC721)
        returns (string memory)
    {
        require(_tokenId <= tokenCounter, "Token Not Minted");
        if (revealed == false) {
            return notRevealedURI;
        }
        string memory currentBaseURI = _baseURI();
        return
            bytes(currentBaseURI).length > 0
                ? string(
                    abi.encodePacked(
                        currentBaseURI,
                        _tokenId.toString(),
                        ".json"
                    )
                )
                : "";
    }

    // Return the current total supply
    function totalSupply() public view override returns (uint256) {
        return tokenCounter;
    }

    // Return an array containing the token ID of owned by _owner
    function tokensOfOwner(address _owner)
        external
        view
        returns (uint256[] memory)
    {
        uint256 tokenCount = balanceOf(_owner);
        if (tokenCount == 0) {
            // Return an empty array
            return new uint256[](0);
        } else {
            uint256[] memory result = new uint256[](tokenCount);
            uint256 index;
            for (index = 0; index < tokenCount; index++) {
                result[index] = tokenOfOwnerByIndex(_owner, index);
            }
            return result;
        }
    }

    /*

    ONLY OWNER FUNCTIONS

    */

    // Initialize the start block (minting event date)
    function setStartBlock(uint256 _newStartBlock) public onlyOwner {
        startBlock = _newStartBlock;
    }

    // Set the Token URI (IPFS URL)
    // Can only be set once (ensure immutability of the Token URIs)
    function setBaseURI(string memory _baseTokenURI) public onlyOwner {
        require(
            bytes(baseTokenURI).length == 0,
            "Cannot re-update the base URI"
        );
        baseTokenURI = _baseTokenURI;
    }

    // Set the Unrevealed Token URI (IPFS URL)
    function setNotRevealedURI(string memory _notRevealedURI) public onlyOwner {
        notRevealedURI = _notRevealedURI;
    }

    // Withdraw proceeds from the contract
    // 20% is sent to the Bored Ape Treasury, remaining 80% split among the founders.
    function withdrawAll() public payable onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0);
        // 20% to Bored Ape Treasury
        _widthdraw(boredApeContract, (balance * 20) / 100);
        // 40% to Founder 1 address
        _widthdraw(founder1, address(this).balance / 2);
        // 40% to Founder 2 address
        _widthdraw(founder2, address(this).balance);
        forwardERC20(apecoin);
    }

    // ERC20 recovery function
    // 20% is sent to the Bored Ape Treasury, remaining 80% split among the founders.
    function forwardERC20(address _token) public onlyOwner {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).safeTransfer(boredApeContract, (balance * 20) / 100);

        balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).safeTransfer(founder1, balance / 2);

        balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).safeTransfer(founder2, balance);
    }

    // Set the revealed boolean to true
    function reveal() public onlyOwner {
        revealed = true;
    }

    /* 

    INTERNAL FUNCTIONS

    */

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function _widthdraw(address _address, uint256 _amount) internal {
        (bool success, ) = _address.call{value: _amount}("");
        require(success, "Transfer failed.");
    }
}
