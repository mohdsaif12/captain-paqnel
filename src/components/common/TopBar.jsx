import { Search, RefreshCw, Settings, Bell } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import './TopBar.css';

function TopBar() {
  const { createWaiterCall, refresh } = useRestaurant();

  const handleSimulateCall = async () => {
    const randomTables = ['01', '02', '03', '05', '12', 'VIP-1'];
    const randomTable = randomTables[Math.floor(Math.random() * randomTables.length)];
    const messages = ['Call Waiter', 'Water Refill Please', 'Bill / Check Requested', 'Extra Cutlery'];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    
    await createWaiterCall({
      tableNumber: randomTable,
      customerName: 'Aman VIP',
      message: randomMsg
    });
  };

  return (
    <header className="topbar" id="topbar">
      {/* Search */}
      <div className="topbar__search" id="topbar-search">
        <Search />
        <input type="text" placeholder="Search table or guest..." />
      </div>

      {/* Status */}
      <div className="topbar__status">
        <div className="topbar__status-dot" />
        <span>Status: Online</span>
      </div>

      {/* Actions */}
      <div className="topbar__actions">
        <button 
          className="topbar__btn" 
          style={{ borderColor: '#f59e0b', color: '#f59e0b' }}
          onClick={handleSimulateCall}
          title="Simulate Customer Calling Waiter"
        >
          <Bell size={16} className="animate-bounce" />
          <span>Test Call</span>
        </button>
        <button className="topbar__btn" id="btn-sync" onClick={refresh} title="Sync">
          <RefreshCw />
          <span>Sync</span>
        </button>
        <button className="topbar__btn topbar__btn--end-shift" id="btn-end-shift">
          End Shift
        </button>
        <div className="topbar__avatar" id="topbar-avatar" title="Settings">
          <Settings size={16} />
        </div>
      </div>
    </header>
  );
}

export default TopBar;

