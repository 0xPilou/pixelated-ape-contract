// SPDX-License-Identifier: MIT

// Ape Pixel Gang 10k NFT Project
// 
// Author: 0xPilou

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ApePixelGang is ERC721, Ownable {
    using Strings for uint256;

    uint256 public tokenCounter;
    uint256 public constant MAX_QTY = 10000;
    uint256 public price = 0.05 ether;
    uint256 public startBlock;

    address public constant boredApeContract =
        0x4c8734D7978373DE413aD6d36bFCafB7f76F6bb1;
    address public constant founder1 =
        0x2E2435DBADf4e825Ef7C83d871C0aB272EEcD438;
    address public constant founder2 =
        0xf1088C8a435e46f8e75EAcd62Df584D96B310866;

    string baseTokenURI;
    string public notRevealedURI;
    bool public revealed = false;

    event CollectibleCreated(uint256 indexed id);

    constructor(string memory _initNotRevealedURI)
        ERC721("Ape Pixel Gang", "APG")
    {
        tokenCounter = 0;
        setNotRevealedURI(_initNotRevealedURI);
    }

    // Helper to check if the start block has passed
    // Return true if the start block has passed, false otherwise
    function mintingStarted() public view returns (bool) {
        return block.number >= startBlock;
    }

    // Mint Function
    // Can mint up to 10 Bottles at once
    function mint(uint256 _num) public payable {
        require(
            mintingStarted(),
            "It is not time to mint the collectible yet !"
        );
        require(tokenCounter < MAX_QTY, "All collectible have been minted !");
        require(
            _num > 0 && _num <= 2,
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
            emit CollectibleCreated(tokenCounter);
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
    function totalSupply() public view returns (uint256) {
        return tokenCounter;
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
    }

    // ERC20 recovery function
    // 20% is sent to the Bored Ape Treasury, remaining 80% split among the founders.
    function forwardERC20(address _token) public onlyOwner {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(boredApeContract, (balance * 20) / 100);

        balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(founder1, balance / 2);

        balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(founder2, balance);
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
