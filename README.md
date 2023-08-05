# SSWAP

realise a Simple Swap contract

## Quick Start

```sh
yarn install
yarn compile
yarn test
```

## Dev

```sh
yarn init
yarn add --dev hardhat
npx hardhat

yarn add --dev @openzeppelin/contracts
yarn add --dev solmate
yarn add --dev ethereum-waffle
yarn add --dev ethers@5.7.2

npx hardhat compile
npx hardhat test
```

## Design Considerations

### EIP-712

for the signature validatiaon

### Nonce

Nonce must be incremental, but not necessarily to consecutive; However if it is not consecutive, it is not gas efficient.

bitmap to save gas, see [Bitmap_Example](docs/bitmap_nonce.py)
