const contractAddress = "0x9b49ad0061bD10Be7365c41e107915812Ca803A5";
let user = Moralis.User.current();

const connectBtns = document.querySelectorAll(".conn-btn");

function displayData(
  screen,
  getter,
  screenArea = "innerText",
  defaultValue = "..."
) {
  if (user) {
    document.getElementById(screen)[screenArea] = getter;
    return;
  }
  document.getElementById(screen)[screenArea] = defaultValue;
}

document.addEventListener("DOMContentLoaded", async (event) => {
  if (Moralis.User.current()?.authenticated() && window.ethereum) {
    await login();
    return;
  }
});

const getContractBalance = async () => {
  const Contract = await getContract();
  try {
    let balance = await Contract.methods.getContractBalance().call();
    return ethers.utils.formatEther(balance.toString(), { commify: true });
  } catch (err) {
    console.error(err);
  }
};

async function calculatePercent(target) {
  let postion = await getTotalMaticStaked();
  return (parseFloat(postion) / parseFloat(target)) * 100;
}

const update = async () => {
  //displayData("downline-count", await getDownlineCount());
  if (Moralis.User.current()?.authenticated()) {
    displayData(
      "total-matic-staked",
      await getTotalMaticStaked(),
      "innerText",
      await getTotalMaticStaked()
    );
    displayData(
      "total-wallets",
      await getTotalWallets(),
      "innerText",
      await getTotalWallets()
    );
    displayData(
      "contract-balance",
      await getContractBalance(),
      "innerText",
      await getContractBalance()
    );
    displayData("referral-bonus", await getReferralBonus());
    let stakedMatic = await getStakedMatic();
    displayData("staked-matic", stakedMatic);
    let earnings = await getWithdrawableMatic();
    displayData("withdrawable-matic", earnings);
    displayData("withdrawn-matic", await getWithdrawnMatic());
    displayData("active-deposits", stakedMatic);
    displayData("hold-bonus", await getHoldBonus());
    displayData("your-earnings", earnings);
    Alpine.store("deposits", await getDeposits());
  }
};

async function login() {
  user = await connectWallet({
    signingMessage: "Connect with PolyFarm",
    chainId: 137,
  });
  let walletAddress = user?.get("ethAddress")
    ? truncateEthAddress(user?.get("ethAddress"))
    : "Connect";
  connectBtns.forEach((item) => (item.innerText = walletAddress));
  displayData(
    "referral",
    window.location.href + "?referrer=" + user.get("ethAddress"),
    "value"
  );
  await update();
}

async function logout() {
  await logOut();
  connectBtns.forEach((item) => (item.innerText = "Connect"));
}

/* Contract Interactions */

//getABi
const getABI = async () => {
  let response = await fetch("/assets/js/ABI.json");
  const ABI = await response.json();
  return ABI;
};

//invest
async function invest(input, planInput = 0) {
  if (!Moralis.User.current()?.authenticated()) {
    await login();
  }
  const matic = document.getElementById(input)?.value || 0;
  let plan = planInput >= 0 && planInput <= 5 ? planInput : 0;
  let url = new URL(window.location.href);
  const query = new URLSearchParams(url.search);
  const deployerAddress = "0xd2298c3b6faA9021707Ca840B5384861ce7104C9";
  const referrer = /* query.get("referrer") || */ deployerAddress;
  const Contract = await getContract();
  if (isNaN(parseFloat(matic)) || parseFloat(matic) < 1) {
    swal("Something went wrong!", `Minimum investment is: 5 MATIC`, "error");
    return;
  }
  try {
    let txn = await Contract.methods.invest(referrer, plan).send({
      value: window.web3.utils.toWei(matic, "ether"),
      from: Contract.defaultAccount,
    });
    swal("Processing Deposit", `Wait while we process your deposit`, "info");
    let verify = await verifyMinedTransaction(txn);
    if (verify) {
      swal(
        "Investment Deposited",
        `You Successfully Deposited ${matic} MATIC!`,
        "success"
      );
    }
    await update();
  } catch (err) {
    swal(
      "Something went wrong!",
      `${err.data?.message || err.message}`,
      "error"
    );
  }
}

//withdraw
const withdraw = async () => {
  if (!Moralis.User.current()?.authenticated()) {
    await login();
  }
  const Contract = await getContract();
  try {
    let txn = await Contract.methods
      .withdraw()
      .send({ from: Contract.defaultAccount });
    let verify = await verifyMinedTransaction(txn);
    if (verify) {
      swal("Success!", `Withdrawal successful`, "success");
    }
    await update();
  } catch (err) {
    console.error(err);
    swal(
      "Something went wrong!",
      `${err.data?.message || err.message}`,
      "error"
    );
  }
};

//getDownlineCount
const getDownlineCount = async () => {
  const Contract = await getContract();
  try {
    let count = await Contract.methods
      .getUserDownlineCount(user.get("ethAddress"))
      .call();
    return count.toNumber();
  } catch (err) {
    console.error(err);
  }
};

//getReferralBonus
const getReferralBonus = async () => {
  const Contract = await getContract();
  try {
    let bonus = await Contract.methods
      .getUserReferralTotalBonus(user.get("ethAddress"))
      .call();
    return ethers.utils.formatEther(bonus.toString(), { commify: true });
  } catch (err) {
    console.error(err);
  }
};

//getStakedMatic
const getStakedMatic = async () => {
  const Contract = await getContract();
  try {
    let stakedMatic = await Contract.methods
      .getUserTotalDeposits(user.get("ethAddress"))
      .call();
    return ethers.utils.formatEther(stakedMatic.toString(), { commify: true });
  } catch (err) {
    console.error(err);
  }
};

//getWithdrawableMatic
const getWithdrawableMatic = async () => {
  const Contract = await getContract();
  try {
    let withdrawableMatic = await Contract.methods
      .getUserDividends(user.get("ethAddress"))
      .call();
    return ethers.utils.formatEther(withdrawableMatic.toString(), {
      commify: true,
    });
  } catch (err) {
    console.error(err);
  }
};

//getWithdrawnMatic
const getWithdrawnMatic = async () => {
  const Contract = await getContract();
  try {
    let withdrawnMatic = await Contract.methods
      .getUserWithdrawn(user.get("ethAddress"))
      .call();
    return ethers.utils.formatEther(withdrawnMatic.toString(), {
      commify: true,
    });
  } catch (err) {
    console.error(err);
  }
};

//getHoldBonus
const getHoldBonus = async () => {
  const Contract = await getContract();
  try {
    let holdBonus = await Contract.methods
      .getUserPercentRate(user.get("ethAddress"))
      .call();
    return holdBonus;
  } catch (err) {
    console.error(err);
  }
};

const getTotalMaticStaked = async () => {
  let totalStaked = (await getContractInfo())[0];
  return ethers.utils.formatEther(totalStaked.toString(), {
    commify: true,
  });
};

const getDeposits = async () => {
  const walletAddress = user.get("ethAddress");
  const Contract = await getContract();
  let numberOfDeposits = await Contract.methods
    .getUserAmountOfDeposits(walletAddress)
    .call();
  let deposits = [];
  for (var i = 0; i < numberOfDeposits; i++) {
    let deposit = await Contract.methods
      .getUserDepositInfo(walletAddress, i)
      .call();
    let amount = deposit[2];
    let profit = deposit[3];
    let start = deposit[4];
    deposits.push({
      index: i + 1,
      profit: ethers.utils.formatEther(profit.toString(), {
        commify: true,
      }),
      amount: ethers.utils.formatEther(amount.toString(), {
        commify: true,
      }),
      date: moment.unix(start).format("Do MMM, YYYY"),
    });
  }
  return deposits;
};

const getActiveDeposits = async () => {
  const Contract = await getContract();
  try {
    let activeDeposits = await Contract.methods
      .getUserAvailable(user.get("ethAddress"))
      .call();
    return ethers.utils.formatEther(activeDeposits.toString(), {
      commify: true,
    });
  } catch (err) {
    console.error(err);
  }
};

const getTotalWallets = async () => {
  let totalWallets = (await getContractInfo())[2];
  return totalWallets.toString();
};

const getContractInfo = async () => {
  const Contract = await getContract();
  try {
    let info = await Contract.methods.getContractInfo().call();
    return info;
  } catch (err) {
    console.error(err);
  }
};

const getContract = async () => {
  if (window.Contract) {
    return window.Contract;
  }
  [window.Contract, window.web3] = await contractWithProvider(
    contractAddress,
    await getABI()
  );
  if (window.web3) {
    window.Contract.defaultAccount = user.get("ethAddress");
  }
  return window.Contract;
};
