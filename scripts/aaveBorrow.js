const {getWeth, AMOUNT} = require("../scripts/getWeth")
const {getNamedAccounts} = require('hardhat')

async function main() {
    await getWeth()
    const {deployer} = await getNamedAccounts()
    const lendingPool = await getLendingPool(deployer)
    console.log(`Lending pool address: ${lendingPool.address}`)

    //deposit
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    //approve
    await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
    console.log("Depositing...")
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
    console.log("Deposited!")
    let {availableBorrowETH, totalDebtETH} = await getBorrowUserData(lendingPool, deployer) 
    //borrow
}

async function getBorrowUserData(lendingPool, account) {
    const {totalCollateralETH, totalDebtETH, availableBorrowETH} = await lendingPool.getUserAccountData(account)
    console.log(`You have ${totalCollateralETH} worth of ETH deposited`)
    console.log(`You have ${totalDebtETH} worth of ETH borrowed`)
    console.log(`You can borrow ${availableBorrowETH} worth of ETH`)
    return {availableBorrowETH, totalDebtETH}
}

async function getLendingPool(address) {
    const lendingPoolAddressProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        address
    )
    const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool()
    const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, address)
    return lendingPool
}

async function approveErc20(erc20Address, spenderAddress, amountToSpend, account) {
    const erc20Token = await ethers.getContractAt("IERC20", erc20Address, account)
    const tx = await erc20Token.approve(spenderAddress, amountToSpend) 
    await tx.wait(1)

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    })