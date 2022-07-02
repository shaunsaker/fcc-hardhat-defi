import { ethers } from "hardhat"
import { IWeth } from "../typechain"

export const WETH_MAINNET_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
export const AMOUNT = ethers.utils.parseEther("0.02")

export async function getWeth(account: string): Promise<void> {
  const iWeth = await ethers.getContractAt<IWeth>("IWeth", WETH_MAINNET_ADDRESS, account)

  const tx = await iWeth.deposit({ value: AMOUNT })
  await tx.wait(1)

  const wethBalance = await iWeth.balanceOf(account)
  console.log(`Got ${wethBalance.toString()} WETH`)
}
