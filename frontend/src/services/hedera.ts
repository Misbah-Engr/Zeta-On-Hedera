import { useCallback, useMemo, useState, useEffect } from 'react';
import { Interface, BrowserProvider } from 'ethers';
import { useAccount, useWalletClient } from 'wagmi';
import { readContract as wagmiReadContract } from 'wagmi/actions';
import { type WalletClient } from 'viem';

export const CONTRACT_ID = '0.0.7063500'; // Zeta Order Book Contract ID
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

export async function walletClientToSigner(walletClient: WalletClient) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  const signer = await provider.getSigner(account.address);
  return signer;
}

export const useEthersSigner = ({ chainId }: { chainId?: number } = {}) => {
  const { data: walletClient } = useWalletClient({ chainId });
  const [signer, setSigner] = useState<any>(undefined);

  useEffect(() => {
    const getSigner = async () => {
      if (walletClient) {
        const s = await walletClientToSigner(walletClient as WalletClient);
        setSigner(s);
      } else {
        setSigner(undefined);
      }
    };
    getSigner();
  }, [walletClient]);

  return signer;
};

export const useContractActions = () => {
  const { address: accountId } = useAccount();
  const signer = useEthersSigner();

  const callContract = useCallback(async (params: {
    data: string;
    contractId: string;
    gas?: number;
  }): Promise<any> => {
    if (!signer || !accountId) {
      throw new Error('Wallet not connected');
    }
    
    const tx = await signer.sendTransaction({
        to: params.contractId,
        data: params.data,
        gasLimit: params.gas ?? 150_000,
    });
    return tx.wait();

  }, [accountId, signer]);

  const readContract = useCallback(async (params: {
    functionName: string;
    args?: any[];
  }) => {
    const result = await wagmiReadContract({
        address: CONTRACT_ID as `0x${string}`,
        abi: ORDERBOOK_ABI,
        functionName: params.functionName,
        args: params.args,
    });
    return result;
  }, []);

  const sendTransaction = useCallback(async (params: any) => {
    if (!signer || !accountId) {
      throw new Error('Wallet not connected');
    }
    const tx = await signer.sendTransaction(params);
    return tx.wait();
  }, [accountId, signer]);

  return {
    callContract,
    readContract,
    sendTransaction,
    accountId
  };
};