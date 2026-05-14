import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Users, Bell } from 'lucide-react';
import { captainInfo } from '../../data/mockData';
import './Sidebar.css';

const navItems = [
  { path: '/', label: 'Table Dashboard', icon: LayoutDashboard },
  { path: '/waiting-list', label: 'Waiting List', icon: ClipboardList },
  { path: '/table-management', label: 'Active Customers', icon: Users },
  { path: '#notifications', label: 'Notifications', icon: Bell },
];

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar" id="sidebar">
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__brand-icon">CP</div>
        <div className="sidebar__brand-text">
          <h1>Captain Panel</h1>
          <span>Live Shift Ops</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path) && item.path !== '#notifications';

          return (
            <NavLink
              key={item.path}
              to={item.path === '#notifications' ? '#' : item.path}
              className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
              id={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              onClick={(e) => {
                if (item.path === '#notifications') e.preventDefault();
              }}
            >
              <Icon />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Captain Info */}
      <div className="sidebar__captain">
        <div className="sidebar__captain-avatar">{captainInfo.initials}</div>
        <div className="sidebar__captain-info">
          <h4>{captainInfo.name}</h4>
          <span>{captainInfo.role}</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
