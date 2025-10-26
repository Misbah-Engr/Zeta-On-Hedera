import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import AdsPage from './pages/AdsPage';
import OrdersPage from './pages/OrdersPage';
import OrderLifecyclePage from './pages/OrderLifecyclePage';
import DisputeFlowPage from './pages/DisputeFlowPage';
import AgentProfilePage from './pages/AgentProfilePage';
import AgentRegistrationPage from './pages/AgentRegistrationPage';
import AgentStatusPage from './pages/AgentStatusPage';

const App = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/ads" replace />} />
        <Route path="/ads" element={<AdsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:orderId/lifecycle" element={<OrderLifecyclePage />} />
        <Route path="/orders/:orderId/dispute" element={<DisputeFlowPage />} />
        <Route path="/agents/register" element={<AgentRegistrationPage />} />
        <Route path="/agents/status" element={<AgentStatusPage />} />
        <Route path="/agents/:agentId" element={<AgentProfilePage />} />
      </Routes>
    </Layout>
  );
};

export default App;
