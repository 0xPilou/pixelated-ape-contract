require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");

let secret = require("./secret")

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: {
      forking: {
        url: secret.mainnetURL
      },
      chainId: 1
    },
    mainnet: {
      url: secret.mainnetURL,
      accounts: [secret._0xLabsDeployerKey],
    },
    rinkeby: {
      url: secret.rinkebyURL,
      accounts: [secret._0xLabsDeployerKey]
    },
    polygon: {
      url: secret.polygonURL,
      accounts: [secret._0xLabsDeployerKey],
    },
    mumbai: {
      url: secret.mumbaiURL,
      accounts: [secret._0xLabsDeployerKey]
    },
  },
  etherscan: {
    apiKey: {
      mainnet: secret.etherscanApiKey,
      rinkeby: secret.etherscanApiKey,
      polygon: secret.polygonscanApiKey,
      polygonMumbai: secret.polygonscanApiKey,
    }
  },
  gasReporter: {
    currency: 'EUR',
    gasPrice: 68
  }
};
