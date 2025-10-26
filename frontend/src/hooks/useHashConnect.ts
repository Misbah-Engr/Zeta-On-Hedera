import { useHashConnectContext } from '../context/HashConnectContext';

export const useHashConnect = () => {
  const context = useHashConnectContext();
  return context;
};
