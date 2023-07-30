import { BigNumber } from "ethers";

export type TokenAmount = {
  token: string;
  amount: BigNumber;
};

export type Order = {
  takerTokenAmount: TokenAmount;
  taker: string;
  makerTokenAmount: TokenAmount;
  maker: string;
  nonce: BigNumber;
  deadline: number;
  chainId: number;
};
