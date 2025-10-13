import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomeWelcome from '../views/HomeWelcome';
import HomeOrders from '../views/HomeOrders';
import OrderCreate from '../views/OrderCreate';
import QuotesCompare from '../views/QuotesCompare';
import OrderDetails from '../views/OrderDetails';
import AgentDashboard from '../views/AgentDashboard';
import AgentBond from '../views/AgentBond';
import SettingsSecurity from '../views/SettingsSecurity';
import HelpSupport from '../views/HelpSupport';
import { useSessionStore } from '../state/session.store';
import React from 'react';

const Root: React.FC = () => {
  const { isSigned } = useSessionStore();
  return isSigned ? <HomeOrders /> : <HomeWelcome />;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
  },
  {
    path: '/order/new',
    element: <OrderCreate />,
  },
  {
    path: '/order/:id',
    element: <OrderDetails />,
  },
  {
    path: '/quotes/:id',
    element: <QuotesCompare />,
  },
  {
    path: '/agent',
    element: <AgentDashboard />,
  },
  {
    path: '/agent/bond',
    element: <AgentBond />,
  },
  {
    path: '/settings',
    element: <SettingsSecurity />,
  },
  {
    path: '/help',
    element: <HelpSupport />,
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
