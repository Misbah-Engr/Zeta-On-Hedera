import { useCallback } from 'react';
import { Interface } from 'ethers';
import { HashConnectTypes } from 'hashconnect';
import { useHashConnectContext } from '../context/HashConnectContext';

export const CONTRACT_ID = '0.0.0'; // replace with deployed contract id
export const MIRROR_NODE_URL = 'https://mainnet-public.mirrornode.hedera.com/api/v1';

export const ORDERBOOK_ABI = [
  'function getOrdersForAccount(address account) view returns (tuple(uint256 id, address buyer, address agent, string commodity, string origin, string destination, uint8 status, uint256 price, uint256 createdAt, uint256 updatedAt)[])',
  'function getActiveAds() view returns (tuple(address agent, string commodity, string location, uint256 price, uint256 minWeight, uint256 maxWeight, uint8 availability)[])',
  'function getAgentProfile(address agent) view returns (tuple(string handle, string bio, string avatar, string baseLocation, uint8 rating, uint256 completedDeliveries, uint256 disputedDeliveries))',
  'function getAgentAds(address agent) view returns (tuple(string commodity, string location, uint256 price, uint256 minWeight, uint256 maxWeight, uint8 availability)[])',
  'function getOrderTimeline(uint256 orderId) view returns (tuple(uint8 status, string note, uint256 at)[])',
  'function getDispute(uint256 orderId) view returns (tuple(uint8 stage, string claimant, string evidence, string resolution))'
];

export const orderbookInterface = new Interface(ORDERBOOK_ABI);

export const formatAccountId = (accountId?: string) => {
  if (!accountId) return '';
  const [shard, realm, num] = accountId.split('.');
  if (num) {
    return `${shard}.${realm}.${num}`;
  }
  return accountId;
};

export const encodeFunction = (name: string, args: unknown[] = []) =>
  orderbookInterface.encodeFunctionData(name, args);

export const decodeFunctionResult = (name: string, data: string) =>
  orderbookInterface.decodeFunctionResult(name, data);

export const useHashconnectSigner = () => {
  const { hashconnect, pairingData } = useHashConnectContext();
  const accountId = pairingData?.accountIds?.[0];
  const network = pairingData?.network ?? 'hedera';

  const callContract = useCallback(async (params: {
    data: string;
    contractId: string;
    gas?: number;
  }): Promise<HashConnectTypes.TransactionResponse> => {
    if (!hashconnect || !pairingData || !accountId) {
      throw new Error('Wallet not connected');
    }

    const provider = hashconnect.getProvider(network, pairingData.topic, accountId);
    const signer = hashconnect.getSigner(provider);
    return signer.call({
      ...params,
      gas: params.gas ?? 150_000
    });
  }, [accountId, hashconnect, network, pairingData]);

  const sendTransaction = useCallback(async (params: HashConnectTypes.TransactionBase) => {
    if (!hashconnect || !pairingData || !accountId) {
      throw new Error('Wallet not connected');
    }

    const provider = hashconnect.getProvider(network, pairingData.topic, accountId);
    const signer = hashconnect.getSigner(provider);
    return signer.sendTransaction(params);
  }, [accountId, hashconnect, network, pairingData]);

  return {
    callContract,
    sendTransaction,
    accountId
  };
};

