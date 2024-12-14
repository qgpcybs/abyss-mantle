/*
 * The supported chains.
 * By default, there are only two chains here:
 *
 * - mudFoundry, the chain running on anvil that pnpm dev
 *   starts by default. It is similar to the viem anvil chain
 *   (see https://viem.sh/docs/clients/test.html), but with the
 *   basefee set to zero to avoid transaction fees.
 * - latticeTestnet, our public test network.
 *
 */

import {
  MUDChain,
  mudFoundry,
  redstone,
  garnet,
} from "@latticexyz/common/chains";

/*
 * See https://mud.dev/tutorials/minimal/deploy#run-the-user-interface
 * for instructions on how to add networks.
 */
export const garnetHolesky = {
  id: 17069,
  name: "Garnet Holesky",
  network: "garnet-holesky",
  summary: {
    location: "Holesky",
  },
  description: "Garnet Holesky",
  nativeCurrency: {
    decimals: 18,
    name: "Holesky Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.garnetchain.com"],
      webSocket: ["wss://rpc.garnetchain.com"],
    },
    public: {
      http: ["https://rpc.garnetchain.com"],
      webSocket: ["wss://rpc.garnetchain.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://explorer.garnetchain.com",
    },
  },
  indexerUrl: "https://indexer.mud.garnet.qry.live",
  testnet: true,
};

export const supportedChains: (MUDChain & {
  indexerUrl?: undefined | string;
})[] = [mudFoundry, redstone, garnetHolesky];
