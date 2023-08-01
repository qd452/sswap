import { BigNumber, ethers } from "ethers";
import {
  recoverTypedSignature,
  SignTypedDataVersion,
} from "@metamask/eth-sig-util";

const DOMAIN_NAME = "SSWAP";
const DOMAIN_VERSION = "0.1.0";

export type TokenAmount = {
  token: string;
  amount: string;
};

export type Order = {
  takerTokenAmount: TokenAmount;
  taker: string;
  makerTokenAmount: TokenAmount;
  maker: string;
  nonce: number;
  deadline: number;
  chainId: number;
};

export const ORDER_TYPES = {
  TokenAmount: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
  ],
  Order: [
    { name: "takerTokenAmount", type: "TokenAmount" },
    { name: "taker", type: "address" },
    { name: "makerTokenAmount", type: "TokenAmount" },
    { name: "maker", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
    { name: "chainId", type: "uint256" },
  ],
};

export const EIP712_ORDER_TYPES = {
  EIP712Domain: [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
  ],
  ...ORDER_TYPES,
};

// console.log(EIP712_ORDER_TYPES);

export async function createOrderSignaure(
  signer: ethers.VoidSigner,
  unsignedOrder: Order,
  swapContract: string,
  chainId: number,
  name: string = DOMAIN_NAME,
  version: string = DOMAIN_VERSION
) {
  const domain = {
    name: name,
    version: version,
    chainId: chainId,
    verifyingContract: swapContract,
  };
  let signature: string = await signer._signTypedData(
    domain,
    ORDER_TYPES,
    unsignedOrder
  );
  return signature;
}

export function recoverOrderSigner(
  signature: string,
  unsignedOrder: Order,
  swapContract: string,
  chainId: number,
  name: string = DOMAIN_NAME,
  version: string = DOMAIN_VERSION
) {
  return recoverTypedSignature({
    version: SignTypedDataVersion.V4,
    signature: signature,
    data: {
      types: EIP712_ORDER_TYPES,
      domain: {
        name: name,
        version: version,
        chainId,
        verifyingContract: swapContract,
      },
      primaryType: "Order",
      message: unsignedOrder,
    },
  });
}
