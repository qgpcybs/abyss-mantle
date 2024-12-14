import {
  createPublicClient,
  http,
  formatEther,
  Hex,
  Client,
  PublicClient,
  parseEther,
} from "viem";

export async function requestFaucetEth(
  address: Hex,
  client: PublicClient,
  FAUCET_URL: string
) {
  try {
    // 1. Check initial balance
    // console.log(`{Checking initial balance for... ${address}`);
    const initialBalance = await client.getBalance({
      address: address as `0x${string}`,
    });
    // console.log(`Initial balance: ${formatEther(initialBalance)} ETH`);

    const threshold = parseEther("0.01");

    if (initialBalance >= threshold) {
      // console.log(`Balance is already enough`);
      return;
    }

    // 2. Make faucet request
    // console.log("\nRequesting ETH from faucet...");
    const response = await fetch(`${FAUCET_URL}/faucet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to request ETH");
    }

    // 3. Monitor for balance change
    // console.log("\nMonitoring for balance change...");
    let attempts = 0;
    const maxAttempts = 10; // Will check for 5 minutes

    const checkBalance = async () => {
      attempts++;
      const currentBalance = await client.getBalance({
        address: address as `0x${string}`,
      });

      // console.log(`Current balance: ${formatEther(currentBalance)} ETH`);

      if (currentBalance > initialBalance) {
        // console.log("\nSuccess! Balance has increased!");
        // console.log(
        //   `Received: ${formatEther(currentBalance - initialBalance)} ETH`
        // );
        return;
      }

      if (attempts >= maxAttempts) {
        // console.log("\nTimeout: No balance change detected after 5 minutes");
        return;
      }

      // console.log(
      //   `Checking again in 10 seconds... (Attempt ${attempts}/${maxAttempts})`
      // );
      setTimeout(checkBalance, 10000);
    };

    await checkBalance();
  } catch (error) {
    console.error();
  }
}
