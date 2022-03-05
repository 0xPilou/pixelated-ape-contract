/*
npx hardhat run --network rinkeby scripts/rinkeby/3_updateBaseURI.js
*/

const { ethers } = require("hardhat");

async function main() {

  /* Addresses */
  const COLLECTIBLE_ADDR = "0xa6e99A4ED7498b3cdDCBB61a6A607a4925Faa1B7";

  /* ABI */
  const collectible = await ethers.getContractAt("Collectible", COLLECTIBLE_ADDR);

  const BASE_URI = "ipfs://QmYGsQv3M26AvTsZGt9FQyFsn2qCnYkkAJyUtZJvA9G95x/"

  console.log("");
  console.log("-------------------------- UPDATING BASE URI ------------------------------");
  console.log("");

  const tx = await collectible.setBaseURI(BASE_URI);
  await tx.wait();

  console.log("Base URI is now set to ", BASE_URI);


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