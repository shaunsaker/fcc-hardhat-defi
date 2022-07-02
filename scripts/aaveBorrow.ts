import { BigNumber } from "ethers"
import { ethers, getNamedAccounts } from "hardhat"
import {
  AggregatorV3Interface,
  IERC20,
  ILendingPool,
  ILendingPoolAddressesProvider,
} from "../typechain"
import { AMOUNT, getWeth, WETH_MAINNET_ADDRESS } from "./getWeth"

async function getLendingPool(account: string): Promise<ILendingPool> {
  const lendingPoolAddressesProvider = await ethers.getContractAt<ILendingPoolAddressesProvider>(
    "ILendingPoolAddressesProvider",
    "0xb53c1a33016b2dc2ff3653530bff1848a515c8c5",
    account
  )
  const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool()
  const lendingPool = await ethers.getContractAt<ILendingPool>(
    "ILendingPool",
    lendingPoolAddress,
    account
  )

  return lendingPool
}

async function approveErc20(
  erc20Address: string,
  spenderAddress: string,
  amountToSpend: BigNumber,
  account: string
): Promise<void> {
  console.log("Approving...")
  const erc20Token = await ethers.getContractAt<IERC20>("IERC20", erc20Address, account)
  const tx = await erc20Token.approve(spenderAddress, amountToSpend)
  await tx.wait(1)
  console.log("Approved!")
}

async function getBorrowUserData(
  lendingPool: ILendingPool,
  account: string
): Promise<{ totalDebtETH: BigNumber; availableBorrowsETH: BigNumber }> {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account)
  console.log(`You have ${totalCollateralETH} worth of ETH deposited.`)
  console.log(`You have ${totalDebtETH} worth of ETH borrowed.`)
  console.log(`You can borrow ${availableBorrowsETH} worth of ETH.`)

  return {
    totalDebtETH,
    availableBorrowsETH,
  }
}

async function getDaiPrice(): Promise<BigNumber> {
  const daiEthPriceFeed = await ethers.getContractAt<AggregatorV3Interface>(
    "AggregatorV3Interface",
    "0x773616E4d11A78F511299002da57A0a94577F1f4"
  )
  const price = (await daiEthPriceFeed.latestRoundData())[1]
  console.log(`The DAI/ETH price is ${price.toString()}`)

  return price
}

async function borrowDai(
  daiAddress: string,
  lendingPool: ILendingPool,
  amountDaiToBorrow: BigNumber,
  account: string
): Promise<void> {
  const interestRate = 1 // stable
  const referralCode = 0
  const tx = await lendingPool.borrow(
    daiAddress,
    amountDaiToBorrow,
    interestRate,
    referralCode,
    account
  )
  await tx.wait(1)
  console.log("You've borrowed!")
}

async function repay(
  amount: BigNumber,
  daiAddress: string,
  lendingPool: ILendingPool,
  account: string
): Promise<void> {
  await approveErc20(daiAddress, lendingPool.address, amount, account)

  const interestRate = 1 // stable
  const tx = await lendingPool.repay(daiAddress, amount, interestRate, account)
  await tx.wait(1)
  console.log("Repaid!")
}

async function main(): Promise<void> {
  const { deployer } = await getNamedAccounts()
  await getWeth(deployer)
  const lendingPool = await getLendingPool(deployer)
  console.log(`LendingPool address ${lendingPool.address}`)

  // deposit
  await approveErc20(WETH_MAINNET_ADDRESS, lendingPool.address, AMOUNT, deployer)
  console.log("Depositing...")
  const referralCode = 0
  await lendingPool.deposit(WETH_MAINNET_ADDRESS, AMOUNT, deployer, referralCode)
  console.log("Deposited!")

  // borrow
  const { availableBorrowsETH } = await getBorrowUserData(lendingPool, deployer)
  const daiEthPrice = await getDaiPrice()

  // TODO: toNumber causes an overflow error but parseInt(String) works for some reason
  // 0.95 => 95% of what we can borrow
  const amountDaiToBorrow =
    parseInt(availableBorrowsETH.toString()) * 0.95 * (1 / daiEthPrice.toNumber())
  console.log(`You can borrow ${amountDaiToBorrow} DAI`)

  const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString())
  const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
  await borrowDai(daiTokenAddress, lendingPool, amountDaiToBorrowWei, deployer)
  await getBorrowUserData(lendingPool, deployer)

  // repay
  await repay(amountDaiToBorrowWei, daiTokenAddress, lendingPool, deployer)
  await getBorrowUserData(lendingPool, deployer)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
