import {
  AccountId,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
  TransactionRecordQuery,
} from '@hashgraph/sdk';
import { hashconnect, pairingData } from './wallet';
import { useWalletStore } from '../state/wallet.store';
import { Buffer } from 'buffer';

const getSigner = () => {
  const { account } = useWalletStore.getState();
  if (!hashconnect || !pairingData || !account) {
    throw new Error('Wallet not connected');
  }
  const provider = hashconnect.getProvider('testnet', pairingData.topic, account);
  const signer = hashconnect.getSigner(provider);
  return signer;
};

// Helper to convert string to bytes32, right-padded with zeros
const stringToBytes32 = (str: string) => {
  const buffer = Buffer.alloc(32);
  buffer.write(str, 'utf8');
  return buffer;
};

export const createOrderIntent = async (formData: any): Promise<string> => {
  const signer = getSigner();
  const contractId = import.meta.env.VITE_CONTRACT_ORDERBOOK;
  const tokenAddress = (import.meta.env.VITE_ALLOWED_TOKEN && import.meta.env.VITE_ALLOWED_TOKEN.toUpperCase() !== 'HBAR')
    ? import.meta.env.VITE_ALLOWED_TOKEN
    : '0.0.0';
  const expiryTimestamp = Math.floor(Date.now() / 1000) + (formData.expiry * 3600);

  const tx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(2_000_000)
    .setFunction("createOrderIntent", new ContractFunctionParameters()
      .addAddress(AccountId.fromString(tokenAddress).toSolidityAddress())
      .addUint256(formData.maxTotal)
      .addBytes32(stringToBytes32(formData.originShopId))
      .addBytes32(stringToBytes32(formData.destinationRegion))
      .addBytes32(stringToBytes32(formData.commodityId))
      .addUint256(formData.quantity)
      .addUint64(expiryTimestamp)
    )
    .freezeWithSigner(signer);

  const result = await tx.executeWithSigner(signer);

  const record = await new TransactionRecordQuery()
    .setTransactionId(result.transactionId)
    .executeWithSigner(signer);

  const orderId = record.contractFunctionResult!.getUint256(0).toString();
  return orderId;
};

export const commitQuote = async (orderId: string, commit: string, ttl: number) => {
  const signer = getSigner();
  const contractId = import.meta.env.VITE_CONTRACT_ORDERBOOK;
  const tx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(100000)
    .setFunction("commitQuote", new ContractFunctionParameters()
      .addUint256(Number(orderId))
      .addBytes32(Buffer.from(commit, 'hex'))
      .addUint64(ttl)
    )
    .freezeWithSigner(signer);
  await tx.executeWithSigner(signer);
};

export const revealQuote = async (orderId: string, quoteData: any) => {
  const signer = getSigner();
  const contractId = import.meta.env.VITE_CONTRACT_ORDERBOOK;
  const tx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(200000)
    .setFunction("revealQuote", new ContractFunctionParameters()
      .addUint256(Number(orderId))
      .addUint256(quoteData.feeTotal)
      .addUint16(quoteData.holdbackBps)
      .addUint16(quoteData.microbondBps)
      .addUint32(quoteData.etaHours)
      .addBytes32(Buffer.from(quoteData.salt, 'hex'))
    )
    .freezeWithSigner(signer);
  await tx.executeWithSigner(signer);
};

export const autoSelect = async (orderId: string) => {
  const signer = getSigner();
  const contractId = import.meta.env.VITE_CONTRACT_ORDERBOOK;
  const tx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(200000)
    .setFunction("autoSelect", new ContractFunctionParameters().addUint256(Number(orderId)))
    .freezeWithSigner(signer);
  await tx.executeWithSigner(signer);
};

export const ackSelect = async (orderId: string) => {
  const signer = getSigner();
  const contractId = import.meta.env.VITE_CONTRACT_ORDERBOOK;
  const tx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(100000)
    .setFunction("ackSelect", new ContractFunctionParameters().addUint256(Number(orderId)))
    .freezeWithSigner(signer);
  await tx.executeWithSigner(signer);
};

export const userFund = async (orderId: string, amount: number) => {
  const signer = getSigner();
  const contractId = import.meta.env.VITE_CONTRACT_VAULT;
  const tx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(100000)
    .setPayableAmount(new Hbar(amount))
    .setFunction("userFund", new ContractFunctionParameters()
      .addUint256(Number(orderId))
      .addUint256(amount)
    )
    .freezeWithSigner(signer);
  await tx.executeWithSigner(signer);
};

export const submitPoD = async (orderId: string, podHashes: any, kinds: number[]) => {
  const signer = getSigner();
  const contractId = import.meta.env.VITE_CONTRACT_DISPUTES;
  const tx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(200000)
    .setFunction("submitPoD", new ContractFunctionParameters()
      .addUint256(Number(orderId))
      .addBytes32Array(Object.values(podHashes).map(h => Buffer.from(h as string, 'hex')))
      .addUint8Array(kinds)
    )
    .freezeWithSigner(signer);
  await tx.executeWithSigner(signer);
};

export const markCompleted = async (orderId: string) => {
  const signer = getSigner();
  const contractId = import.meta.env.VITE_CONTRACT_ORDERBOOK;
  const tx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(100000)
    .setFunction("markCompleted", new ContractFunctionParameters().addUint256(Number(orderId)))
    .freezeWithSigner(signer);
  await tx.executeWithSigner(signer);
};

export const openClaim = async (orderId: string, hashes: Buffer[], kinds: number[]) => {
  const signer = getSigner();
  const contractId = import.meta.env.VITE_CONTRACT_DISPUTES;
  const tx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(200000)
    .setFunction("openClaim", new ContractFunctionParameters()
      .addUint256(Number(orderId))
      .addBytes32Array(hashes)
      .addUint8Array(kinds)
    )
    .freezeWithSigner(signer);
  await tx.executeWithSigner(signer);
};

export const autoResolve = async (orderId: string) => {
  const signer = getSigner();
  const contractId = import.meta.env.VITE_CONTRACT_DISPUTES;
  const tx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(200000)
    .setFunction("autoResolve", new ContractFunctionParameters().addUint256(Number(orderId)))
    .freezeWithSigner(signer);
  await tx.executeWithSigner(signer);
};

export const bondDeposit = async (amount: number) => {
  const signer = getSigner();
  const contractId = import.meta.env.VITE_CONTRACT_AGENTS;
  const tx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(100000)
    .setPayableAmount(new Hbar(amount))
    .setFunction("depositBond", new ContractFunctionParameters())
    .freezeWithSigner(signer);
  await tx.executeWithSigner(signer);
};

export const bondWithdraw = async (amount: number) => {
  const signer = getSigner();
  const contractId = import.meta.env.VITE_CONTRACT_AGENTS;
  const tx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(100000)
    .setFunction("withdrawBond", new ContractFunctionParameters().addUint256(amount))
    .freezeWithSigner(signer);
  await tx.executeWithSigner(signer);
};
