import { Search, RefreshCw, Settings } from 'lucide-react';
import './TopBar.css';

function TopBar() {
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
        <button className="topbar__btn" id="btn-sync" title="Sync">
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
