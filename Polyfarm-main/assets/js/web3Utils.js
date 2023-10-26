const ethers = Moralis.web3Library;
const connectWallet = async (moralisOptions = null) => {
  if (!Moralis.User.current()) {
    await Moralis.Web3.authenticate({
      provider: window.ethereum ? null : "walletConnect",
      ...moralisOptions,
    })
      .then(function (user) {
        console.log("logged in user:", user);
        return user;
      })
      .catch(function (error) {
        console.log(error);
      });
  }
  return Moralis.User.current();
};

logOut = async () => {
  await Moralis.User.logOut();
  console.log("logged out");
};

/**
 * A function for connecting a contract with a web3 provider
 * @returns [Contract, provider]
 */

const contractWithProvider = async (contractAddress, ABI) => {
  if (Moralis.User.current()?.authenticated()) {
    if (!Moralis.provider) {
      window.ethereum
        ? await Moralis.enableWeb3({ chainId: 137 })
        : await Moralis.enableWeb3({
            provider: "walletconnect",
            chainId: 137,
          });
    }
    let web3Instance = new Web3(Moralis.provider);
    return [new web3Instance.eth.Contract(ABI, contractAddress), web3Instance];
  }
  return [new ethers.Contract(contractAddress, ABI), null];
};

// Captures 0x + 4 characters, then the last 4 characters.
const truncateRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/;

/**
 * Truncates an ethereum address to the format 0x0000…0000
 * @param address Full address to truncate
 * @returns Truncated address
 */
const truncateEthAddress = (address) => {
  const match = address.match(truncateRegex);
  if (!match) return address;
  return `${match[1]}…${match[2]}`;
};

const verifyMinedTransaction = async (transaction) => {
  if (transaction && transaction.blockNumber) {
    return transaction;
  }
  return false;
};
