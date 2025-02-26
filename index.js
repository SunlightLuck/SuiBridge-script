const { SuiClient, getFullnodeUrl } = require("@mysten/sui/client");
const { Keypair } = require("@mysten/sui/cryptography");
const { Ed25519Keypair } = require("@mysten/sui/keypairs/ed25519");
const { Transaction } = require("@mysten/sui/transactions");

const BRIDGE_PACKAGE_ID =
  "0x861482099a4faef6c63ba9f7b49fa847b3178fd00ec03019df3b2ad1bf72b037";
const BRIDGE_OBJECT_ID =
  "0xafb1d9b75532d5d1767fdc450ff70046ccc8a92a7fab411d5549b77f6b814d84";
const CDT_TOKEN_TYPE =
  "0x711d2704034eeb509104481a99a556f17b6b444c7fed7cfb223fd5567af843ad::cdt::CDT";
const USDC_TOKEN_TYPE =
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";
const POOL_ID =
  "0xb8d7d9e66a60c239e7a60110efcf8de6c705580ed924d0dde141f4a0e2c90105";
const MNENOMIC =
  "recipe horror volume source escape summer ship unaware merge dynamic immune mom";

const suiClient = new SuiClient({ url: getFullnodeUrl("mainnet") });
const signer = Ed25519Keypair.deriveKeypair(MNENOMIC);

const setFeesInDollar = async (newFeesInDollar) => {
  try {
    const tx = new Transaction();

    tx.moveCall({
      target: `${BRIDGE_PACKAGE_ID}::checkdot_bridge_v1::set_fees_in_dollar`,
      arguments: [tx.object(BRIDGE_OBJECT_ID), tx.pure.u64(newFeesInDollar)],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: signer,
      options: {
        showEffects: true,
      },
    });
    console.log("Set Fees In Dollar:", result.digest);
  } catch (err) {
    console.log(err);
  }
};

const setPaused = async (paused) => {
  try {
    const tx = new Transaction();

    tx.moveCall({
      target: `${BRIDGE_PACKAGE_ID}::checkdot_bridge_v1::set_paused`,
      arguments: [tx.object(BRIDGE_OBJECT_ID), tx.pure.bool(paused)],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: signer,
      options: {
        showEffects: true,
      },
    });
    console.log("Set Paused:", result.digest);
  } catch (err) {
    console.log(err);
  }
};

const setMinimumTransferQuantity = async (quantity) => {
  try {
    const tx = new Transaction();

    tx.moveCall({
      target: `${BRIDGE_PACKAGE_ID}::checkdot_bridge_v1::set_minimum_transfer_quantity`,
      arguments: [tx.object(BRIDGE_OBJECT_ID), tx.pure.u64(quantity)],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: signer,
      options: {
        showEffects: true,
      },
    });
    console.log("Set Minimum Transfer Quantity:", result.digest);
  } catch (err) {
    console.log(err);
  }
};

const setOwner = async (owner) => {
  try {
    const tx = new Transaction();

    tx.moveCall({
      target: `${BRIDGE_PACKAGE_ID}::checkdot_bridge_v1::set_owner`,
      arguments: [tx.object(BRIDGE_OBJECT_ID), tx.pure.address(owner)],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: signer,
      options: {
        showEffects: true,
      },
    });
    console.log("Set Owner:", result.digest);
  } catch (err) {
    console.log(err);
  }
};

const setProgram = async (program) => {
  try {
    const tx = new Transaction();

    tx.moveCall({
      target: `${BRIDGE_PACKAGE_ID}::checkdot_bridge_v1::set_program`,
      arguments: [tx.object(BRIDGE_OBJECT_ID), tx.pure.address(program)],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: signer,
      options: {
        showEffects: true,
      },
    });
    console.log("Set Program:", result.digest);
  } catch (err) {
    console.log(err);
  }
};

const deposit = async (amount) => {
  try {
    const coins = await suiClient.getCoins({
      owner: signer.toSuiAddress(),
      coinType: CDT_TOKEN_TYPE,
    });

    if (coins.data.length === 0) {
      console.log("You have no CDT tokens");
      return;
    }
    const coinObjectId = coins.data.find(
      (coin) => BigInt(coin.balance) >= BigInt(amount * 1000000)
    ).coinObjectId;
    if (!coinObjectId) {
      console.log("Can't find object id to split");
      return;
    }

    const splitTx = new Transaction();

    const [splitCoin] = splitTx.splitCoins(splitTx.object(coinObjectId), [
      splitTx.pure.u64(amount * 1000000),
    ]);

    splitTx.transferObjects(
      [splitCoin],
      splitTx.pure.address(signer.toSuiAddress())
    );

    const splitResult = await suiClient.signAndExecuteTransaction({
      signer,
      transaction: splitTx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log("CDT Split:", splitResult.digest);

    const createdCoinObjectId =
      splitResult.effects.created[0].reference.objectId;

    console.log(createdCoinObjectId);

    await suiClient.waitForTransaction({
      digest: splitResult.digest,
      timeout: 30000,
      pollInterval: 500,
    });

    const depositTx = new Transaction();

    depositTx.moveCall({
      target: `${BRIDGE_PACKAGE_ID}::checkdot_bridge_v1::deposit`,
      arguments: [
        depositTx.object(BRIDGE_OBJECT_ID),
        depositTx.object(createdCoinObjectId),
      ],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: depositTx,
      signer: signer,
      options: {
        showEffects: true,
      },
    });
    console.log("Deposit:", result.digest);
  } catch (err) {
    console.log(err);
  }
};

const withdraw = async (amount) => {
  try {
    const tx = new Transaction();

    tx.moveCall({
      target: `${BRIDGE_PACKAGE_ID}::checkdot_bridge_v1::withdraw`,
      arguments: [tx.object(BRIDGE_OBJECT_ID), tx.pure.u64(amount * 1000000)],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: signer,
      options: {
        showEffects: true,
      },
    });
    console.log("Withdraw:", result.digest);
  } catch (err) {
    console.log(err);
  }
};

const depositSui = async (amount) => {
  try {
    const splitTx = new Transaction();

    const [splitCoin] = splitTx.splitCoins(splitTx.gas, [
      splitTx.pure.u64(amount * 1000000000),
    ]);

    splitTx.transferObjects(
      [splitCoin],
      splitTx.pure.address(signer.toSuiAddress())
    );

    const splitResult = await suiClient.signAndExecuteTransaction({
      signer,
      transaction: splitTx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log("SUI Split:", splitResult.digest);

    const createdCoinObjectId =
      splitResult.effects.created[0].reference.objectId;

    console.log(createdCoinObjectId);

    await suiClient.waitForTransaction({
      digest: splitResult.digest,
      timeout: 30000,
      pollInterval: 500,
    });

    const depositTx = new Transaction();

    depositTx.moveCall({
      target: `${BRIDGE_PACKAGE_ID}::checkdot_bridge_v1::deposit_sui`,
      arguments: [
        depositTx.object(BRIDGE_OBJECT_ID),
        depositTx.object(createdCoinObjectId),
      ],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: depositTx,
      signer: signer,
      options: {
        showEffects: true,
      },
    });
    console.log("Deposit:", result.digest);
  } catch (err) {
    console.log(err);
  }
};

const withdrawSui = async (amount) => {
  try {
    const tx = new Transaction();

    tx.moveCall({
      target: `${BRIDGE_PACKAGE_ID}::checkdot_bridge_v1::withdraw_sui`,
      arguments: [
        tx.object(BRIDGE_OBJECT_ID),
        tx.pure.u64(amount * 1000000000),
      ],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: signer,
      options: {
        showEffects: true,
      },
    });
    console.log("Withdraw:", result.digest);
  } catch (err) {
    console.log(err);
  }
};

const getLastTransfers = async (count) => {
  try {
    const bridgeData = await suiClient.getObject({
      id: BRIDGE_OBJECT_ID,
      options: {
        showContent: true,
      },
    });
    const transfers = bridgeData.data.content.fields.transfers;
    return transfers
      ?.reverse()
      ?.slice(0, count)
      ?.map((transfer) => transfer.fields);
  } catch (err) {
    console.log(err);
  }
};

const initTransfer = async (fee, quantity, chain, data) => {
  try {
    const coins = await suiClient.getCoins({
      owner: signer.toSuiAddress(),
      coinType: CDT_TOKEN_TYPE,
    });

    if (coins.data.length === 0) {
      console.log("You have no CDT tokens");
      return;
    }
    const coinObjectId = coins.data.find(
      (coin) => BigInt(coin.balance) >= BigInt(quantity * 1000000)
    ).coinObjectId;
    if (!coinObjectId) {
      console.log("Can't find object id to split");
      return;
    }

    const splitCDTTx = new Transaction();

    const [splitCoin] = splitCDTTx.splitCoins(splitCDTTx.object(coinObjectId), [
      splitCDTTx.pure.u64(quantity * 1000000),
    ]);

    splitCDTTx.transferObjects(
      [splitCoin],
      splitCDTTx.pure.address(signer.toSuiAddress())
    );

    const splitCDTResult = await suiClient.signAndExecuteTransaction({
      signer,
      transaction: splitCDTTx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log("CDT Split:", splitCDTResult.digest);

    const createdCoinObjectId =
      splitCDTResult.effects.created[0].reference.objectId;

    console.log(createdCoinObjectId);

    await suiClient.waitForTransaction({
      digest: splitCDTResult.digest,
      timeout: 30000,
      pollInterval: 500,
    });

    const splitTx = new Transaction();

    const [splitSUI] = splitTx.splitCoins(splitTx.gas, [
      splitTx.pure.u64(fee * 1000000000),
    ]);

    splitTx.transferObjects(
      [splitSUI],
      splitTx.pure.address(signer.toSuiAddress())
    );

    const splitSUIResult = await suiClient.signAndExecuteTransaction({
      signer,
      transaction: splitTx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log("SUI Split:", splitSUIResult.digest);

    const createdSUIObjectId =
      splitSUIResult.effects.created[0].reference.objectId;

    console.log(createdSUIObjectId);

    await suiClient.waitForTransaction({
      digest: splitSUIResult.digest,
      timeout: 30000,
      pollInterval: 500,
    });

    const initTransferTx = new Transaction();

    initTransferTx.moveCall({
      target: `${BRIDGE_PACKAGE_ID}::checkdot_bridge_v1::init_transfer`,
      typeArguments: [USDC_TOKEN_TYPE],
      arguments: [
        initTransferTx.object(BRIDGE_OBJECT_ID),
        initTransferTx.object(POOL_ID),
        initTransferTx.object(createdSUIObjectId),
        initTransferTx.object(createdCoinObjectId),
        initTransferTx.pure.string(chain),
        initTransferTx.pure.string(data),
      ],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: initTransferTx,
      signer: signer,
      options: {
        showEffects: true,
      },
    });
    console.log("Deposit:", result.digest);
  } catch (err) {
    console.log(err);
  }
};

const addTransfersFrom = async (memory, to, amount, hash) => {
  try {
    const tx = new Transaction();

    tx.moveCall({
      target: `${BRIDGE_PACKAGE_ID}::checkdot_bridge_v1::add_transfers_from`,
      arguments: [
        tx.object(BRIDGE_OBJECT_ID),
        tx.pure.string(memory),
        tx.pure.address(to),
        tx.pure.u64(amount * 1000000),
        tx.pure.vector("u8", hash),
      ],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: signer,
      options: {
        showEffects: true,
      },
    });
    console.log("Add Transfer From:", result.digest);
  } catch (err) {
    console.log(err);
  }
};

const transferExists = async (hash) => {
  try {
    const tx = new Transaction();

    tx.moveCall({
      target: `${BRIDGE_PACKAGE_ID}::checkdot_bridge_v1::transfer_exists`,
      arguments: [tx.object(BRIDGE_OBJECT_ID), tx.pure.vector("u8", hash)],
    });
    const response = await suiClient.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: signer.toSuiAddress(),
    });
    const isExist = response.results[0].returnValues[0]?.[0]?.[0] === 1;
    return isExist
  } catch (err) {
    console.log(err);
  }
};

(async () => {
  // await setMinimumTransferQuantity(0)
  // await setFeesInDollar(1)
  //   await deposit(1)
  //   await addTransfersFrom(
  //     "TEST",
  //     "0x6c5e6d847fc18ad32670963189bd64e265255d4f533a390d421fea3948545f7b",
  //     1,
  //     Uint8Array.from([0, 1, 2, 3, 4])
  //   );
  await setOwner('0xfa800cc4e6d28d935afafe87c69a71eeb7a889cbb89d819da10efdda851f81ed')
})();
