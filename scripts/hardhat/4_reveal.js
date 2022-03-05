/*
npx hardhat run --network rinkeby scripts/rinkeby/4_reveal.js
*/

const { ethers } = require("hardhat");

async function main() {

  /* Addresses */
  const COLLECTIBLE_ADDR = "0xf5060456051b6107e3a8aB35031090272eb123A8";

  /* ABI */
  const collectible = await ethers.getContractAt("Collectible", COLLECTIBLE_ADDR);

  console.log("");
  console.log("-------------------------- REVEALING ------------------------------");
  console.log("");

  const tx = await collectible.reveal();
  await tx.wait();

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