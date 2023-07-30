import hre, { ethers } from "hardhat";
import { expect } from "chai";
import { Signer, BigNumber } from "ethers";
import MockERC20Abi from "../abis/MockERC20.json";
import { MockERC20 } from "./utils/contracts/MockERC20";
import { Order, TokenAmount } from "./utils/order";
import { BlockchainTime } from "./utils/time";
import exp from "constants";

const ONE = BigNumber.from(10).pow(18);

describe("SSwap", () => {
  let sswap: any;
  let chainId: number;
  let takerToken: MockERC20;
  let makerToken: MockERC20;
  let admin: Signer;
  let maker: Signer;
  let taker: any;

  before(async () => {
    [admin, maker, taker] = await ethers.getSigners();

    const sswapFactory = await ethers.getContractFactory("SSwap");
    sswap = await sswapFactory.deploy(await admin.getAddress());

    chainId = hre.network.config.chainId || 1;

    const tokenFactory = await ethers.getContractFactory(
      MockERC20Abi.abi,
      MockERC20Abi.bytecode
    );
    takerToken = (await tokenFactory.deploy("TEST A", "ta", 18)) as MockERC20;

    makerToken = (await tokenFactory.deploy("TEST B", "tb", 18)) as MockERC20;

    await takerToken.mint(
      await taker.getAddress(),
      BigNumber.from(10).pow(18).mul(100)
    );
    await takerToken
      .connect(taker)
      .approve(sswap.address, ethers.constants.MaxUint256);

    await makerToken.mint(
      await maker.getAddress(),
      BigNumber.from(10).pow(18).mul(100)
    );
    await makerToken
      .connect(maker)
      .approve(sswap.address, ethers.constants.MaxUint256);
  });

  it("orderHash calculation", async () => {
    const deadline = 16907348320;

    let order: Order = {
      takerTokenAmount: { token: takerToken.address, amount: ONE },
      taker: await taker.getAddress(),
      makerTokenAmount: { token: makerToken.address, amount: ONE },
      maker: await maker.getAddress(),
      nonce: BigNumber.from(1),
      deadline: deadline,
      chainId: chainId,
    };
    expect(await sswap.orderHash(order)).to.equal(
      "0x3e5e25ff1e269e7c35726c7f718ed5f2b43b1e749f294ce81ef915f2094b0d63"
    );
  });
});
