import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings } from 'lucide-react';

const Layout = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="layout-container">
      <aside className="sidebar glass">
        <div className="sidebar-header">
          <div className="logo-icon">TM</div>
          <h2>TalentHub</h2>
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className={`nav-item ${isActive('/')}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/employees" className={`nav-item ${isActive('/employees')}`}>
            <Users size={20} />
            <span>Employees</span>
          </Link>
          <Link to="/settings" className={`nav-item ${isActive('/settings')}`}>
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>
      </aside>
      
      <main className="main-content">
        <header className="topbar glass">
          <div className="search-bar">
            {/* Search placeholder */}
          </div>
          <div className="user-profile">
            <div className="avatar">A</div>
            <span>Admin</span>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
