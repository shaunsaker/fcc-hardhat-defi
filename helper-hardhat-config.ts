import { network } from "hardhat"

export const networkConfig: {
  [name: string]: {}
} = {
  localhost: {},
  hardhat: {},
  rinkeby: {},
}

export const developmentChains = ["hardhat", "localhost"]

export const isDevelopment = developmentChains.includes(network.name)

export const BLOCK_CONFIRMATIONS = 6
