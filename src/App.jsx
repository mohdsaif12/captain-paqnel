import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/common/Sidebar';
import TopBar from './components/common/TopBar';
import TableDashboard from './pages/TableDashboard';
import TableManagement from './pages/TableManagement';
import WaitingList from './pages/WaitingList';
import { RestaurantProvider } from './context/RestaurantContext';
import './App.css';

function App() {
  return (
    <RestaurantProvider>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <TopBar />
          <div className="app-content">
            <Routes>
              <Route path="/" element={<TableDashboard />} />
              <Route path="/table-management" element={<TableManagement />} />
              <Route path="/waiting-list" element={<WaitingList />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </RestaurantProvider>
  );
}

export default App;
