import { ethers, getNamedAccounts } from "hardhat"
import { IWeth } from "../typechain"

const WETH_MAINNET_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const AMOUNT = ethers.utils.parseEther("0.02")

export async function getWeth() {
  const { deployer } = await getNamedAccounts()
  const iWeth = await ethers.getContractAt<IWeth>("IWeth", WETH_MAINNET_ADDRESS, deployer)

  const tx = await iWeth.deposit({ value: AMOUNT })
  await tx.wait(1)

  const wethBalance = await iWeth.balanceOf(deployer)
  console.log(`Got ${wethBalance.toString()} WETH`)
}
