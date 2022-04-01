/**
npx hardhat test test\1_ApePixelGang_test.js --network localhost
**/

const { expect } = require("chai");
const { ethers } = require("hardhat");
const truffleAssert = require('truffle-assertions');
let secret = require("../secret")

describe("Ape Pixel Gang Contract Unit Tests", function () {

    /* ABIs */
    const ERC20_ABI = require("./abi/ERC20.json");


    /* Addresses */
    const WETH_ADDR = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const APECOIN_ADDR = "0x4d224452801ACEd8B2F0aebE155379bb5D594381"
    const DEV_ADDR = "0xf1088C8a435e46f8e75EAcd62Df584D96B310866";
    const CREATOR1_ADDR = "0x4c8734D7978373DE413aD6d36bFCafB7f76F6bb1";
    const CREATOR2_ADDR = "0x2E2435DBADf4e825Ef7C83d871C0aB272EEcD438";


    /* Provider */
    const provider = new ethers.providers.JsonRpcProvider();

    // Instantiating the existing mainnet fork contracts
    weth = new ethers.Contract(WETH_ADDR, ERC20_ABI, provider);
    ape = new ethers.Contract(APECOIN_ADDR, ERC20_ABI, provider);

    const UNREVEALED_URI = "ipfs://QmWucA6emakynT6YbtWAeWhn7mQq7Et4P5u3JgKMSN44r8/unrevealed.json"
    const BASE_URI = "ipfs://QmYGsQv3M26AvTsZGt9FQyFsn2qCnYkkAJyUtZJvA9G95x/"
    const MINT_PRICE = ethers.utils.parseEther("0.05");
    const MINT_APE_PRICE = ethers.utils.parseEther("15");

    before(async function () {

        // Resetting the ETH Hardhat Mainnet Fork Network to block 6729600
        await network.provider.request({
            method: "hardhat_reset",
            params: [
                {
                    forking: {
                        jsonRpcUrl: secret.mainnetURL,
                        blockNumber: 14435100
                    },
                },
            ],
        });

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x56178a0d5F301bAf6CF3e1Cd53d9863437345Bf9"],
        });
        whaleWETH = await ethers.getSigner("0x56178a0d5F301bAf6CF3e1Cd53d9863437345Bf9");

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x565363b706Ee0dDCF3380F7CE50e8Da4c9C1e465"],
        });
        whaleAPE = await ethers.getSigner("0x565363b706Ee0dDCF3380F7CE50e8Da4c9C1e465");

        // Define the signers required for the tests
        [deployer, user, user2, _] = await ethers.getSigners();

        // Deploy Contract contract
        Contract = await ethers.getContractFactory("ApePixelGang");
        contract = await Contract.connect(deployer).deploy(UNREVEALED_URI);
        await contract.connect(deployer).setStartBlock(14435200)

        // Transfer some WETH from a whale account to the user account (for testing purpose)
        const decimals = await weth.decimals();
        const amount = 5;
        const weiAmount = ethers.utils.parseUnits(amount.toString(), decimals);
        const apeAmount = 1000;
        const weiApeAmount = ethers.utils.parseEther(apeAmount.toString());
        await weth.connect(whaleWETH).transfer(contract.address, weiAmount);
        await ape.connect(whaleAPE).transfer(user.address, weiApeAmount);
    });

    it("should not be able to mint (block number < mint starting block)", async () => {
        const options = { value: MINT_PRICE }
        await truffleAssert.reverts(
            contract.connect(user).mint(1, options),
            "It is not time to mint the collectible yet !"
        );
    });

    it("should not be able to mint with apecoin (block number < mint starting block)", async () => {
        await ape.connect(user).approve(contract.address, MINT_APE_PRICE);
        await truffleAssert.reverts(
            contract.connect(user).mintWithApecoin(1),
            "It is not time to mint the collectible yet !"
        );
    });

    it("should not be able to mint (asking more than max mint limit)", async () => {
        await contract.connect(deployer).setStartBlock(14435000)
        const options = { value: MINT_PRICE.mul(11) }
        await truffleAssert.reverts(
            contract.connect(user).mint(11, options),
            "You can mint no fewer than 1, and no more than 10 collectible at a time"
        );
    });

    it("should not be able to mint with Apecoin (asking more than max mint limit)", async () => {
        await contract.connect(deployer).setStartBlock(14435000)
        await ape.connect(user).approve(contract.address, MINT_APE_PRICE.mul(11));
        await truffleAssert.reverts(
            contract.connect(user).mintWithApecoin(11),
            "You can mint no fewer than 1, and no more than 10 collectible at a time"
        );
    });

    it("should not be able to mint (ETH amount insufficient)", async () => {
        const options = { value: ethers.utils.parseEther("0.001") }
        await truffleAssert.reverts(
            contract.connect(user).mint(1, options),
            "Ether value sent is not sufficient"
        );
    });

    it("should not be able to mint (ApeCoin balance is insufficient)", async () => {
        await ape.connect(user2).approve(contract.address, MINT_APE_PRICE);
        await truffleAssert.reverts(
            contract.connect(user2).mintWithApecoin(1)
        );
    });

    it("should be able to mint", async () => {
        const options = { value: MINT_PRICE }
        await contract.connect(user).mint(1, options);

        const userBal = await contract.balanceOf(user.address);
        const tokenCount = await contract.tokenCounter();

        expect(userBal.toString()).to.equal("1")
        expect(tokenCount.toString()).to.equal("31")
    });

    it("should be able to mint with Apecoin", async () => {
        await ape.connect(user).approve(contract.address, MINT_APE_PRICE);
        await contract.connect(user).mintWithApecoin(1);

        const userBal = await contract.balanceOf(user.address);
        const tokenCount = await contract.tokenCounter();

        expect(userBal.toString()).to.equal("2")
        expect(tokenCount.toString()).to.equal("32")
    });

    it("should return the token ID owned by the user", async () => {
        let tokenIDs = [];
        tokenIDs = await contract.tokensOfOwner(user.address);
        expect(tokenIDs[0].toString()).to.equal("31")
        expect(tokenIDs[1].toString()).to.equal("32")
    });

    it("should returns the unrevealed URI (reveal not done yet)", async () => {

        const URI = await contract.tokenURI(1);

        expect(URI).to.equal(UNREVEALED_URI)
    });

    it("should not return the URI of an unminted token (not revealed)", async () => {
        await truffleAssert.reverts(contract.tokenURI(33), "Token Not Minted");
    });

    it("should reveals the collection", async () => {

        await contract.connect(deployer).setBaseURI(BASE_URI);
        await contract.connect(deployer).reveal();

        const revealStatus = await contract.revealed();
        expect(revealStatus).to.equal(true)

        const URI = await contract.tokenURI(5);
        expect(URI).to.equal(BASE_URI + 5 + ".json")
    });

    it("should not be able to re-update the base URI (already done once)", async () => {
        await truffleAssert.reverts(
            contract.connect(deployer).setBaseURI("NEW_BASE_URI"),
            "Cannot re-update the base URI"
        );
    });

    it("should not return the URI of an unminted token (revealed)", async () => {
        await truffleAssert.reverts(
            contract.tokenURI(36),
            "Token Not Minted"
        );
    });

    it("should withdraw the funds", async () => {

        const contractBalanceBefore = await provider.getBalance(contract.address);
        const devBalanceBefore = await provider.getBalance(DEV_ADDR);
        const creator1BalanceBefore = await provider.getBalance(CREATOR1_ADDR);
        const creator2BalanceBefore = await provider.getBalance(CREATOR2_ADDR);

        const apeContractBalanceBefore = await ape.balanceOf(contract.address);
        const apeDevBalanceBefore = await ape.balanceOf(DEV_ADDR);
        const apeCreator1BalanceBefore = await ape.balanceOf(CREATOR1_ADDR);
        const apeCreator2BalanceBefore = await ape.balanceOf(CREATOR2_ADDR);

        await contract.connect(deployer).withdrawAll();

        const contractBalanceAfter = await provider.getBalance(contract.address);
        const devBalanceAfter = await provider.getBalance(DEV_ADDR);
        const creator1BalanceAfter = await provider.getBalance(CREATOR1_ADDR);
        const creator2BalanceAfter = await provider.getBalance(CREATOR2_ADDR);

        const apeContractBalanceAfter = await ape.balanceOf(contract.address);
        const apeDevBalanceAfter = await ape.balanceOf(DEV_ADDR);
        const apeCreator1BalanceAfter = await ape.balanceOf(CREATOR1_ADDR);
        const apeCreator2BalanceAfter = await ape.balanceOf(CREATOR2_ADDR);

        expect(contractBalanceBefore > contractBalanceAfter).to.equal(true)
        expect(devBalanceBefore < devBalanceAfter).to.equal(true)
        expect(creator1BalanceBefore < creator1BalanceAfter).to.equal(true)
        expect(creator2BalanceBefore < creator2BalanceAfter).to.equal(true)

        expect(apeContractBalanceBefore > apeContractBalanceAfter).to.equal(true)
        expect(apeDevBalanceBefore < apeDevBalanceAfter).to.equal(true)
        expect(apeCreator1BalanceBefore < apeCreator1BalanceAfter).to.equal(true)
        expect(apeCreator2BalanceBefore < apeCreator2BalanceAfter).to.equal(true)
    });

    it("should withdraw the WETH", async () => {

        const contractBalanceBefore = await weth.balanceOf(contract.address);
        const devBalanceBefore = await weth.balanceOf(DEV_ADDR);
        const creator1BalanceBefore = await weth.balanceOf(CREATOR1_ADDR);
        const creator2BalanceBefore = await weth.balanceOf(CREATOR2_ADDR);

        await contract.connect(deployer).forwardERC20(weth.address);

        const contractBalanceAfter = await weth.balanceOf(contract.address);
        const devBalanceAfter = await weth.balanceOf(DEV_ADDR);
        const creator1BalanceAfter = await weth.balanceOf(CREATOR1_ADDR);
        const creator2BalanceAfter = await weth.balanceOf(CREATOR2_ADDR);

        expect(contractBalanceBefore > contractBalanceAfter).to.equal(true)
        expect(devBalanceBefore < devBalanceAfter).to.equal(true)
        expect(creator1BalanceBefore < creator1BalanceAfter).to.equal(true)
        expect(creator2BalanceBefore < creator2BalanceAfter).to.equal(true)
    });

    it("should not be able to call the only owner functions (as a non-owner)", async () => {
        await truffleAssert.reverts(contract.connect(user).setStartBlock(14160498));
        await truffleAssert.reverts(contract.connect(user).setBaseURI("NewBaseURI"));
        await truffleAssert.reverts(contract.connect(user).setNotRevealedURI("NewHiddenURI"));
        await truffleAssert.reverts(contract.connect(user).withdrawAll());
        await truffleAssert.reverts(contract.connect(user).forwardERC20(weth.address));
        await truffleAssert.reverts(contract.connect(user).reveal());
    });


});