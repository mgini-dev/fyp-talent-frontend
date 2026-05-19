import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import MyProfile from './pages/MyProfile';
import MentorshipHub from './pages/MentorshipHub';
import TalentDirectory from './pages/TalentDirectory';
import UsersList from './pages/UsersList';
import RolesPermissions from './pages/RolesPermissions';
import LookupTalents from './pages/LookupTalents';
import Feed from './pages/Feed';
import Network from './pages/Network';
import Chat from './pages/Chat';
import Projects from './pages/Projects';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

const ThemedApp = () => {
  const { isDark } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#0892d0',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          borderRadius: 8,
          ...(isDark && {
            colorBgBase: '#0f1117',
            colorBgContainer: '#1a1d27',
            colorBgElevated: '#1e2130',
            colorBgLayout: '#0f1117',
            colorText: '#e2e8f0',
            colorTextSecondary: '#94a3b8',
            colorBorder: '#2d3748',
            colorBorderSecondary: '#1e2d3d',
          })
        },
        components: isDark ? {
          Table: { headerBg: '#1a1d27', rowHoverBg: '#1e2130' },
          Card:  { background: '#1a1d27' },
          Modal: { contentBg: '#1a1d27', headerBg: '#1a1d27' },
          Drawer: { colorBgElevated: '#1a1d27' },
          Menu: { darkItemBg: 'transparent', darkSubMenuItemBg: 'transparent' }
        } : {}
      }}
    >
      <AuthProvider>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout />}>
              {/* Core */}
              <Route index      element={<Dashboard />} />
              <Route path="profile"    element={<MyProfile />} />
              <Route path="mentorship" element={<MentorshipHub />} />

              {/* Social Platform */}
              <Route path="feed"    element={<Feed />} />
              <Route path="network" element={<Network />} />
              <Route path="chat"    element={<Chat />} />
              <Route path="projects" element={<Projects />} />

              {/* Admin / Management */}
              <Route path="talents"          element={<TalentDirectory />} />
              <Route path="users"            element={<UsersList />} />
              <Route path="roles"            element={<RolesPermissions />} />
              <Route path="lookups/talents"  element={<LookupTalents />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </ConfigProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

export default App;
