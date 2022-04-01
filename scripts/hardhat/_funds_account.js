/*
npx hardhat run --network localhost scripts/hardhat/_funds_account.js
*/

async function main() {


    const APEabi = require("../../test/abi/ERC20.json");
    const APE = "0x4d224452801ACEd8B2F0aebE155379bb5D594381";

    const provider = new ethers.providers.JsonRpcProvider();

    ape = new ethers.Contract(APE, APEabi, provider);


    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: ["0x565363b706Ee0dDCF3380F7CE50e8Da4c9C1e465"],
    });
    whaleAPE = await ethers.getSigner("0x565363b706Ee0dDCF3380F7CE50e8Da4c9C1e465");

    
    [user, user2, user3, _] = await ethers.getSigners();

   const apeDecimals = await ape.decimals();
   const amount = 500;
   const weiAmount = ethers.utils.parseUnits(amount.toString(), apeDecimals);
   await ape.connect(whaleAPE).transfer(user.address, weiAmount);
   await ape.connect(whaleAPE).transfer(user2.address, weiAmount);
   await ape.connect(whaleAPE).transfer(user3.address, weiAmount);

    console.log("--------------------------------------------------------------------")
    console.log("%d APE sent to %s.", amount, user.address);
    console.log("%d APE sent to %s.", amount, user2.address);
    console.log("%d APE sent to %s.", amount, user3.address);
    console.log("--------------------------------------------------------------------")

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });