/*
npx hardhat run --network localhost scripts/hardhat/2_setStartBlock.js
*/

const { ethers } = require("hardhat");

async function main() {

  /* Addresses */
  const COLLECTIBLE_ADDR = "0xa6e99A4ED7498b3cdDCBB61a6A607a4925Faa1B7";

  const START_BLOCK = 14326000

  /* ABI */
  const collectible = await ethers.getContractAt("ApePixelGang", COLLECTIBLE_ADDR);

  console.log("");
  console.log("-------------------------- SETTING START BLOCK ------------------------------");
  console.log("");

  const tx = await collectible.setStartBlock(START_BLOCK);
  await tx.wait();

  console.log("Start block is now set to BLOCK #", START_BLOCK);

  console.log("");
  console.log("-----------------------------------------------------------------------------");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });