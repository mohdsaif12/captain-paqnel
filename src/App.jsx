import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/common/Sidebar';
import TopBar from './components/common/TopBar';
import TableDashboard from './pages/TableDashboard';
import TableManagement from './pages/TableManagement';
import WaitingList from './pages/WaitingList';
import MenuCatalog from './pages/MenuCatalog';
import NotificationToast from './components/common/NotificationToast';
import CustomerSimulator from './components/common/CustomerSimulator';
import { RestaurantProvider } from './context/RestaurantContext';
import { useRestaurant } from './context/useRestaurant';
import './App.css';

function MainAppLayout() {
  const { showCustomerSim, setShowCustomerSim } = useRestaurant();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <TopBar />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<TableDashboard />} />
            <Route path="/table-management" element={<TableManagement />} />
            <Route path="/waiting-list" element={<WaitingList />} />
            <Route path="/menu" element={<MenuCatalog />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <NotificationToast />
      {showCustomerSim && <CustomerSimulator onClose={() => setShowCustomerSim(false)} />}
    </div>
  );
}

function App() {
  return (
    <RestaurantProvider>
      <MainAppLayout />
    </RestaurantProvider>
  );
}

export default App;

