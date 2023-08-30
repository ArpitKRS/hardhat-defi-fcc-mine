const {getWeth, AMOUNT} = require("../scripts/getWeth")
const {getNamedAccounts, ethers} = require('hardhat')

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
    const daiPrice = await getDaiPrice()
    const amuountDaiToBorrow = availableBorrowETH.toString() * 0.95 * ( 1 / daiPrice.toNumber())
    console.log(`You can borrow ${amuountDaiToBorrow} DAI`)
    const amuountDaiToBorrowWei = ethers.parseEther(amuountDaiToBorrow.toString())

    //borrow
    const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    await borrowDai(
        daiTokenAddress,
        lendingPool,
        amuountDaiToBorrowWei,
        deployer
    )
    await getBorrowUserData(lendingPool, deployer)
    await repay(amuountDaiToBorrowWei, daiTokenAddress, lendingPool, deployer)
    await getBorrowUserData(lendingPool, deployer)
}

async function repay(amount, daiAddress, lendingPool, account) {
    await approveErc20(daiAddress, lendingPool.address, amount, account)
    const repaytx = await lendingPool.repay(daiAddress, amount, 1, account)
    await repaytx.wait(1)
    console.log("You have repaid DAI!")
}

async function borrowDai(
    daiAddress,
    lendingPool,
    amuountDaiToBorrowWei,
    account
) {
    const borrowtx = await lendingPool.borrow(daiAddress, amuountDaiToBorrowWei, 1, 0, account)
    await borrowtx.wait(1)
    console.log("You have borrows DAI!")
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

async function getDaiPrice() {
    const daiEthPriceFeed = await ethers.getContractAt("AggregatorV3Interface", "0x773616E4d11A78F511299002da57A0a94577F1f4")
    const price = (await daiEthPriceFeed.latestRoundData())[1]
    console.log(`DAI/ETH price: ${price.toString()}`)
    return price
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    })