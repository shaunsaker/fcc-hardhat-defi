import { getNamedAccounts } from "hardhat"
import { getWeth } from "./getWeth"

async function main() {
  await getWeth()

  const { deployer } = await getNamedAccounts()

  // Lending Pool Address Provider: 0xb53c1a33016b2dc2ff3653530bff1848a515c8c5
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
