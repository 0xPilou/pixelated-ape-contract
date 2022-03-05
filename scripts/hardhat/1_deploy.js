/*
npx hardhat run --network localhost scripts/hardhat/1_deploy.js
*/

async function main() {

  console.log("");
  console.log("-------------------------- INITIATING DEPLOYMENT ------------------------------");
  console.log("");

  // const UNREVEALED_URI = "ipfs://QmWucA6emakynT6YbtWAeWhn7mQq7Et4P5u3JgKMSN44r8/unrevealed.json"
  // const BASE_URI = "ipfs://QmYGsQv3M26AvTsZGt9FQyFsn2qCnYkkAJyUtZJvA9G95x/"

  const UNREVEALED_URI = "ipfs://TEST_UNREVEALED/unrevealed.json"

  /* Collectible Contract Deployment */
  Contract = await ethers.getContractFactory("ApePixelGang");
  contract = await Contract.deploy(UNREVEALED_URI);

  

  console.log("APE PIXEL GANG contract deployed at address:", contract.address);
  deployer = await contract.owner()
  console.log("Deployer Address is :", deployer);

  console.log("");
  console.log("--------------------------- DEPLOYMENT COMPLETED ------------------------------");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });