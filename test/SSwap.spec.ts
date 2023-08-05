import hre, { ethers } from "hardhat";
import { expect } from "chai";
import chai from "chai";
import { Signer, BigNumber, VoidSigner } from "ethers";
import MockERC20Abi from "../abis/MockERC20.json";
import { MockERC20 } from "./utils/contracts/MockERC20";
import {
  Order,
  createOrderSignaure,
  recoverOrderSigner,
  EIP712_ORDER_TYPES,
} from "./utils/order";
import { BlockchainTime } from "./utils/time";
import { TypedDataUtils, SignTypedDataVersion } from "@metamask/eth-sig-util";
import { bufferToHex } from "@ethereumjs/util";
import { solidity } from "ethereum-waffle";

chai.use(solidity);

describe("SSwap", () => {
  let sswap: any;
  let chainId: number;
  let takerToken: MockERC20;
  let makerToken: MockERC20;
  let admin: Signer;
  let maker: Signer;
  let taker: any;
  const ONE = BigNumber.from(10).pow(18);
  const TWO = ONE.mul(2);

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

  async function createDefaultOrder(
    deadline: number,
    nonce: number = 1
  ): Promise<Order> {
    return {
      takerTokenAmount: {
        token: takerToken.address,
        amount: ONE.toString(),
      },
      taker: await taker.getAddress(),
      makerTokenAmount: {
        token: makerToken.address,
        amount: TWO.toString(),
      },
      maker: await maker.getAddress(),
      nonce: nonce,
      deadline: deadline,
      chainId: chainId,
    };
  }

  describe("Signinig", async () => {
    it("Domain separator", async () => {
      console.log(sswap.DOMAIN_SEPARATOR);
      expect(await sswap.domainSeparator()).to.equal(
        "0xe3aed6b844f12106bbf0a011cff592a9138f93e50e4807cdabfcdc8c087604bd"
      );
    });

    it("orderHash calculation", async () => {
      const deadline = 16907348320;

      let order: Order = {
        takerTokenAmount: { token: takerToken.address, amount: ONE.toString() },
        taker: await taker.getAddress(),
        makerTokenAmount: { token: makerToken.address, amount: ONE.toString() },
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
        takerTokenAmount: { token: takerToken.address, amount: ONE.toString() },
        taker: await taker.getAddress(),
        makerTokenAmount: { token: makerToken.address, amount: ONE.toString() },
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
    });
  });

  describe("Signinig", async () => {
    it("Valid Swap", async () => {
      const deadline = await new BlockchainTime().secondsFromNow(24);
      const ONE = BigNumber.from(10).pow(18);
      const TWO = ONE.mul(2);

      let order = await createDefaultOrder(deadline);

      let signature = await createOrderSignaure(
        maker as VoidSigner,
        order,
        sswap.address,
        chainId
      );

      const takerTakerTokenBalBefore = await takerToken.balanceOf(
        await taker.getAddress()
      );
      const takerMakerTokenBalBefore = await makerToken.balanceOf(
        await taker.getAddress()
      );
      const makerTakerTokenBalBefore = await takerToken.balanceOf(
        await maker.getAddress()
      );
      const makerMakerTokenBalBefore = await makerToken.balanceOf(
        await maker.getAddress()
      );

      let res = await sswap.connect(taker).swap(order, signature);
      const receipt = await res.wait();
      expect(receipt.status).to.equal(1);

      const takerTakerTokenBalAfter = await takerToken.balanceOf(
        await taker.getAddress()
      );
      const takerMakerTokenBalAfter = await makerToken.balanceOf(
        await taker.getAddress()
      );
      const makerTakerTokenBalAfter = await takerToken.balanceOf(
        await maker.getAddress()
      );
      const makerMakerTokenBalAfter = await makerToken.balanceOf(
        await maker.getAddress()
      );

      const takerTakerBalDesc = takerTakerTokenBalBefore.sub(
        takerTakerTokenBalAfter
      );
      const takerMakerBalInc = takerMakerTokenBalAfter.sub(
        takerMakerTokenBalBefore
      );
      const makerMakerBalDesc = makerMakerTokenBalBefore.sub(
        makerMakerTokenBalAfter
      );
      const makerTakerBalInc = makerTakerTokenBalAfter.sub(
        makerTakerTokenBalBefore
      );

      expect(takerTakerBalDesc.toString()).to.equal(ONE.toString());
      expect(takerMakerBalInc.toString()).to.equal(TWO.toString());
      expect(makerMakerBalDesc.toString()).to.equal(TWO.toString());
      expect(makerTakerBalInc.toString()).to.equal(ONE.toString());
    });

    it("Valid Swap Emit", async () => {
      const deadline = 16907348320;

      let order = await createDefaultOrder(deadline, 2);

      let signature = await createOrderSignaure(
        maker as VoidSigner,
        order,
        sswap.address,
        chainId
      );

      await expect(sswap.connect(taker).swap(order, signature))
        .to.be.emit(sswap, "Swap")
        .withArgs(
          "0x04561d5b0ca4c80fe57f8feb0fb93619df1ea328a4118fca21defbd312fc3505",
          order.maker,
          order.taker,
          order.nonce,
          order.makerTokenAmount.token,
          order.makerTokenAmount.amount,
          order.takerTokenAmount.token,
          order.takerTokenAmount.amount
        );
    });

    it("Invalid Swap - Expire", async () => {
      const deadline = await new BlockchainTime().secondsFromNow(-12);

      let order = await createDefaultOrder(deadline, 3);

      let signature = await createOrderSignaure(
        maker as VoidSigner,
        order,
        sswap.address,
        chainId
      );

      await expect(
        sswap.connect(taker).swap(order, signature)
      ).to.be.revertedWith("OrderExpired");
    });

    it("Invalid Swap - Invalid Sender", async () => {
      const deadline = await new BlockchainTime().secondsFromNow(24);

      let order = await createDefaultOrder(deadline, 4);

      let signature = await createOrderSignaure(
        maker as VoidSigner,
        order,
        sswap.address,
        chainId
      );

      await expect(sswap.swap(order, signature)).to.be.revertedWith(
        "InvalidSender"
      );
    });

    it("Invalid Swap - Invalid Nonce", async () => {
      const deadline = await new BlockchainTime().secondsFromNow(24);

      let order = await createDefaultOrder(deadline, 20);

      let signature = await createOrderSignaure(
        maker as VoidSigner,
        order,
        sswap.address,
        chainId
      );

      await sswap.connect(taker).swap(order, signature);

      order = await createDefaultOrder(deadline, 10);
      signature = await createOrderSignaure(
        maker as VoidSigner,
        order,
        sswap.address,
        chainId
      );

      await expect(
        sswap.connect(taker).swap(order, signature)
      ).to.be.revertedWith("NonceUsed");
    });
  });
});
