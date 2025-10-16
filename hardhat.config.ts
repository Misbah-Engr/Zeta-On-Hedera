import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";
import "@openzeppelin/hardhat-upgrades";


dotenv.config();

const config = {
  solidity: { version: "0.8.24", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    hardhat: {
      forking: {
        url: "https://testnet.hashio.io/api",
      },
    },
    hedera_testnet: {
      url: process.env.HEDERA_RPC_URL || "https://testnet.hashio.io/api",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 180000,
    },
  },
  // Enables Sourcify submission so HashScan can pick it up
  sourcify: { enabled: true,
              apiUrl: "https://server-verify.hashscan.io",
              browserUrl: "https://repository-verify.hashscan.io"
   },

};
export default config;
