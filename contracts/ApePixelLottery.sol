// SPDX-License-Identifier: MIT

// Ape Pixel Gang Lottery Contract
//
// Author: 0xPilou

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract ApePixelLottery is Ownable, VRFConsumerBase {
    // Block before which the draw cannot happen
    uint256 public nextDrawBlock;

    // Reward for the lucky draw winner
    uint256 public drawReward = 1 ether;

    // APG ID designing the winner (randomly generated)
    uint256 public winnerApeId;

    // Chainlink VRF fee (paid in LINK Token)
    uint256 internal fee;

    // Chainlink VRF Key Hash
    bytes32 internal keyHash;

    // Address of Ape Pixel Gang Collectible
    address public constant APE_PIXEL_GANG = 0xe1Fd27F4390DcBE165f4D60DBF821e4B9Bb02dEd;

    constructor()
        VRFConsumerBase(
            0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B,
            0x01BE23585060835E02B77ef475b0Cc51aA1e0709
        )
    {
        keyHash = 0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311;
        fee = 0.1 * 10**18; // 0.1 LINK (for Rinkeby)
    }

    /**
     * Requests random number then add 7 days to the timer (weekly lottery)
     */
    function getRandomNumber() public returns (bytes32 requestId) {
        require (block.timestamp >= nextDrawBlock, "!Timestamp");
        require(LINK.balanceOf(address(this)) >= fee, "!LINK Balance");
        nextDrawBlock += 7 days;
        return requestRandomness(keyHash, fee);
    }

    /**
     * Callback function used by VRF Coordinator
     * Modulo 10000 + 1  to get a number between 1 and 10.000
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness)
        internal
        override
    {
        winnerApeId = randomness % 10000 + 1;
    }

    /**
     * Function for the lottery winners to claim their rewards
     * Can only be call on the week preceeding the next lottery
     */
    function claimPrize() public {
        address winner = msg.sender;
        require(
            winner == IERC721(APE_PIXEL_GANG).ownerOf(winnerApeId),
            "!winner"
        );
        (bool success, ) = winner.call{value: drawReward}("");
        require(success, "!transfer");
    }

    /*
    * Initialize the lucky draw
    * The lottery will not be active before this function is called
    */
    function initLuckyDraw() public onlyOwner {
        nextDrawBlock = block.timestamp;
    }
}
