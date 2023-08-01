import hre, { ethers } from "hardhat";
import { expect } from "chai";
import { Signer, BigNumber, VoidSigner } from "ethers";
import MockERC20Abi from "../abis/MockERC20.json";
import { MockERC20 } from "./utils/contracts/MockERC20";
import {
  Order,
  createOrderSignaure,
  recoverOrderSigner,
  ORDER_TYPES,
  EIP712_ORDER_TYPES,
} from "./utils/order";
import { BlockchainTime } from "./utils/time";
import exp from "constants";
import { TypedDataUtils, SignTypedDataVersion } from "@metamask/eth-sig-util";
import { bufferToHex } from "@ethereumjs/util";

const ONE = "1000000000000000000";

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

  it("Domain separator", async () => {
    console.log(sswap.DOMAIN_SEPARATOR);
    expect(await sswap.domainSeparator()).to.equal(
      "0xe3aed6b844f12106bbf0a011cff592a9138f93e50e4807cdabfcdc8c087604bd"
    );
  });

  it("orderHash calculation", async () => {
    const deadline = 16907348320;

    let order: Order = {
      takerTokenAmount: { token: takerToken.address, amount: ONE },
      taker: await taker.getAddress(),
      makerTokenAmount: { token: makerToken.address, amount: ONE },
      maker: await maker.getAddress(),
      nonce: 1,
      deadline: deadline,
      chainId: chainId,
    };
    expect(await sswap.orderHash(order)).to.equal(
      "0xcb4310af266814d553a25ff440adaae0c76e6d4fade1ef1158155e24ec8f8a6c"
    );
    const orderHash = bufferToHex(
      TypedDataUtils.hashStruct(
        "Order",
        order,
        EIP712_ORDER_TYPES,
        SignTypedDataVersion.V4
      )
    );
    expect(orderHash).to.equal(
      "0xcb4310af266814d553a25ff440adaae0c76e6d4fade1ef1158155e24ec8f8a6c"
    );
  });

  it("orderHashWithDomain calculation", async () => {
    const deadline = 16907348320;

    let order: Order = {
      takerTokenAmount: { token: takerToken.address, amount: ONE },
      taker: await taker.getAddress(),
      makerTokenAmount: { token: makerToken.address, amount: ONE },
      maker: await maker.getAddress(),
      nonce: 1,
      deadline: deadline,
      chainId: chainId,
    };
    expect(await sswap.orderHashWithDomain(order)).to.equal(
      "0xbc648a976563357535d57cd7e227d4940d3f68dc3bfe1072d0472ff0276f45ae"
    );
  });

  it("create Validate Signaure (PureJS)", async () => {
    const deadline = 16907348320;

    let order: Order = {
      takerTokenAmount: {
        token: takerToken.address,
        amount: "1000000000000000000",
      },
      taker: await taker.getAddress(),
      makerTokenAmount: {
        token: makerToken.address,
        amount: "1000000000000000000",
      },
      maker: await maker.getAddress(),
      nonce: 1,
      deadline: deadline,
      chainId: chainId,
    };

    let signature = await createOrderSignaure(
      maker as VoidSigner,
      order,
      sswap.address,
      chainId
    );

    let signer = recoverOrderSigner(signature, order, sswap.address, chainId);

    expect(order.maker.toLowerCase()).to.equal(signer);
    await sswap.swap(order, signature);
  });

  it("Valid Swap", async () => {
    const deadline = 16907348320;

    let order: Order = {
      takerTokenAmount: {
        token: takerToken.address,
        amount: "1000000000000000000",
      },
      taker: await taker.getAddress(),
      makerTokenAmount: {
        token: makerToken.address,
        amount: "1000000000000000000",
      },
      maker: await maker.getAddress(),
      nonce: 1,
      deadline: deadline,
      chainId: chainId,
    };

    let signature = await createOrderSignaure(
      maker as VoidSigner,
      order,
      sswap.address,
      chainId
    );
    await sswap.swap(order, signature);
  });
});
