import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, theme, Dropdown, Avatar, Space, Breadcrumb, Badge, Drawer, Grid, Card, List, Tooltip } from 'antd';
import {
  MenuFoldOutlined,
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  LogoutOutlined,
  BellOutlined,
  GroupOutlined,
  DatabaseOutlined,
  SunOutlined,
  MoonOutlined,
  MessageOutlined,
  GlobalOutlined,
  FolderOpenOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';
import './DashboardLayout.css';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const { Header, Sider, Content, Footer } = Layout;
const { useBreakpoint } = Grid;

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const r = await api.get('/notifications');
      const data = r.data.data || [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch { /* silent fail */ }
  };

  useEffect(() => {
    if (!user) return;

    // Fetch initial list
    fetchNotifications();

    // Setup fallback polling
    const interval = setInterval(fetchNotifications, 30000);

    // Initialize Laravel Echo with Pusher
    window.Pusher = Pusher;
    const token = localStorage.getItem('auth_token');
    
    let echoInstance = null;
    try {
      echoInstance = new Echo({
        broadcaster: 'pusher',
        key: 'febb62ce5bdbcfdfe508',
        cluster: 'mt1',
        forceTLS: true,
        authEndpoint: `${api.defaults.baseURL || 'http://localhost:8000/api'}/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          }
        }
      });

      echoInstance.private(`App.Models.User.${user.id}`)
        .listen('.notification.created', (eventData) => {
          // Add the new notification to the top of the list if it doesn't already exist
          setNotifications(prev => {
            if (prev.some(n => n.id === eventData.id)) return prev;
            return [eventData, ...prev];
          });
          setUnreadCount(prev => prev + 1);
        });

      window.Echo = echoInstance;
    } catch (e) {
      console.error('Echo connection failed', e);
    }

    return () => {
      clearInterval(interval);
      if (echoInstance) {
        try {
          echoInstance.leave(`App.Models.User.${user.id}`);
        } catch { /* silent fail */ }
      }
    };
  }, [user]);

  const markAllNotificationsAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* silent fail */ }
  };

  const handleNotificationClick = async (item) => {
    try {
      if (!item.is_read) {
        await api.post(`/notifications/${item.id}/read`);
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      // Navigate based on notification type
      if (item.type.includes('connection')) {
        navigate('/network');
      } else if (item.type.includes('mentorship')) {
        navigate('/mentorship');
      } else if (item.type.includes('project')) {
        navigate('/projects');
      } else if (item.type.includes('comment') || item.type.includes('reaction')) {
        navigate('/feed');
      }
    } catch { /* silent fail */ }
  };

  const getNotificationIcon = (type) => {
    if (type.includes('connection')) {
      return <TeamOutlined style={{ color: '#0892d0', fontSize: 16 }} />;
    }
    if (type.includes('mentorship')) {
      return <GroupOutlined style={{ color: '#52c41a', fontSize: 16 }} />;
    }
    if (type.includes('project')) {
      return <FolderOpenOutlined style={{ color: '#722ed1', fontSize: 16 }} />;
    }
    if (type.includes('comment') || type.includes('reaction')) {
      return <MessageOutlined style={{ color: '#fa8c16', fontSize: 16 }} />;
    }
    return <BellOutlined style={{ color: '#bfbfbf', fontSize: 16 }} />;
  };

  const handleMenuClick = async ({ key }) => {
    if (key === 'profile') {
        navigate('/profile');
    } else if (key === 'logout') {
        await logout();
        navigate('/login');
    } else {
        navigate(key);
        if (isMobile) {
            setMobileMenuVisible(false);
        }
    }
  };

  const notificationMenu = (
    <Card 
      title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Notifications</span>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllNotificationsAsRead}>Mark all read</Button>
        )}
      </div>}
      styles={{ body: { padding: 0 } }}
      style={{ width: 320, boxShadow: '0 10px 40px rgba(0,0,0,0.15)', borderRadius: 16, border: 'none' }}
    >
      <List
        size="small"
        dataSource={notifications}
        locale={{ emptyText: <div style={{ padding: '24px', textAlign: 'center', color: '#bfbfbf' }}>No new notifications</div> }}
        renderItem={item => (
          <List.Item 
            onClick={() => handleNotificationClick(item)}
            style={{ 
              padding: '12px 16px', 
              borderBottom: '1px solid #f0f0f0',
              cursor: 'pointer',
              background: item.is_read ? 'transparent' : 'rgba(8, 146, 208, 0.04)',
              transition: 'background 0.2s'
            }}
            className="notification-item-hover"
          >
            <List.Item.Meta
              avatar={<div style={{ marginTop: 4 }}>{getNotificationIcon(item.type)}</div>}
              title={
                <span style={{ fontSize: 13, fontWeight: item.is_read ? 500 : 700 }}>
                  {item.data?.title}
                </span>
              }
              description={
                <div style={{ fontSize: 12, color: item.is_read ? '#8c8c8c' : '#262626' }}>
                  {item.data?.body}
                  <div style={{ color: '#bfbfbf', fontSize: 10, marginTop: 4 }}>
                    {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );

  // Poll unread message count every 30s
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const r = await api.get('/conversations/unread');
        setUnreadMessages(r.data?.data?.unread || 0);
      } catch { /* silent fail */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const getMenuItems = () => {
    const items = [];
    
    // ── Core (all users) ──────────────────────────────────────────────────
    items.push({
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    });

    // Feed — all authenticated users
    items.push({
      key: '/feed',
      icon: <GlobalOutlined />,
      label: 'Feed',
    });

    // Network — all authenticated users
    items.push({
      key: '/network',
      icon: <WifiOutlined />,
      label: 'Network',
    });

    // Talent Directory — all authenticated users
    items.push({
      key: '/talents',
      icon: <TeamOutlined />,
      label: 'Talent Directory',
    });

    // Chat — all authenticated users, shows unread badge
    items.push({
      key: '/chat',
      icon: <MessageOutlined />,
      label: (
        <span>
          Messages
          {unreadMessages > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: '#ff4d4f', color: '#fff', borderRadius: 10, padding: '0 6px',
              fontSize: 10, fontWeight: 700, minWidth: 18, height: 16,
              marginLeft: 8, lineHeight: 1,
            }}>{unreadMessages > 99 ? '99+' : unreadMessages}</span>
          )}
        </span>
      ),
    });

    // Projects — students and mentors
    if (user?.roles?.some(r => ['Student', 'Mentor'].includes(r.name))) {
      items.push({
        key: '/projects',
        icon: <FolderOpenOutlined />,
        label: 'Projects',
      });
    }

    // Mentorship Hub
    if (hasPermission('manage_users') || hasPermission('manage_talents') || user?.roles?.some(r => r.name === 'Admin' || r.name === 'Mentor' || r.name === 'Student')) {
      items.push({
        key: 'mentorship',
        icon: <GroupOutlined />,
        label: 'Mentorship Hub',
      });
    }

    // ── Admin / Management ────────────────────────────────────────────────

    if (hasPermission('manage_users')) {
      items.push({
        key: 'user-management',
        icon: <UserOutlined />,
        label: 'User Management',
        children: [
          { key: '/users', label: 'Users List' }
        ]
      });
    }

    if (hasPermission('manage_users')) {
      items.push({
        key: 'lookup-manager',
        icon: <DatabaseOutlined />,
        label: 'Lookup Manager',
        children: [
          { key: '/lookups/talents', label: 'Talent Lookups' }
        ]
      });
    }

    if (hasPermission('manage_roles')) {
      items.push({
        key: 'access-management',
        icon: <SafetyCertificateOutlined />,
        label: 'Access Control',
        children: [
          { key: '/roles', label: 'Roles & Permissions' }
        ]
      });
    }

    return items;
  };

  const menuItems = getMenuItems();

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const breadcrumbItems = [
    {
      title: <Link to="/">Home</Link>,
      key: 'home',
    },
    ...pathSnippets.map((snippet, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      const isLast = index === pathSnippets.length - 1;
      const title = snippet.charAt(0).toUpperCase() + snippet.slice(1);
      return {
        key: url,
        title: isLast ? title : <Link to={url}>{title}</Link>,
      };
    }),
  ];

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {!isMobile ? (
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed} 
          theme="dark" 
          width={280} 
          collapsedWidth={80}
          className={`custom-sider ${isDark ? 'custom-sider-dark' : ''}`}
          style={{
            background: isDark
              ? 'linear-gradient(180deg, #1a2035 0%, #0d1117 100%)'
              : 'linear-gradient(180deg, #0892d0 0%, #000080 100%)'
          }}
        >
          <div className="logo-container">
            <img src="/udom.logo.jpg" alt="UDOM Logo" className={`logo-img-new ${collapsed ? 'collapsed' : ''}`} style={{ borderRadius: '50%' }} />
            {!collapsed && <span className="logo-text-new">{isDark ? 'UDOM Talent · Dark' : 'UDOM Talent System'}</span>}
          </div>
          <div style={{ flex: 1, overflow: 'auto', height: 'calc(100vh - 80px)' }} className="sider-menu-scroll">
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[location.pathname]}
              onClick={handleMenuClick}
              items={menuItems}
              className="custom-menu"
            />
          </div>
        </Sider>
      ) : (
        <Drawer
          title={
            <div className="logo-container" style={{ background: 'transparent', border: 'none', padding: 0, justifyContent: 'flex-start' }}>
              <img src="/udom.logo.jpg" alt="UDOM Logo" style={{ height: 32, borderRadius: '50%' }} />
              <span className="logo-text-new" style={{ color: '#ffffff', fontSize: 16, marginLeft: 8 }}>UDOM Talent System</span>
            </div>
          }
          placement="left"
          onClose={() => setMobileMenuVisible(false)}
          open={mobileMenuVisible}
          width={280}
          styles={{
            body: {
              padding: 0,
              background: isDark
                ? 'linear-gradient(180deg, #1a2035 0%, #0d1117 100%)'
                : 'linear-gradient(180deg, #0892d0 0%, #000080 100%)'
            },
            header: {
              background: isDark ? '#1a2035' : '#0892d0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff'
            }
          }}
          closeIcon={<div style={{ color: '#ffffff' }}><MenuFoldOutlined /></div>}
        >
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={handleMenuClick}
            items={menuItems}
            className="custom-menu"
            style={{ height: '100%', borderRight: 0 }}
          />
        </Drawer>
      )}
      <Layout className="site-layout" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header
          style={{
            padding: isMobile ? '0 16px' : 0,
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            zIndex: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => isMobile ? setMobileMenuVisible(true) : setCollapsed(!collapsed)}
              className={`hamburger-toggle ${(!isMobile && collapsed) || (isMobile && mobileMenuVisible) ? 'active' : ''}`}
              aria-label="Toggle Sidebar"
            >
              <span className="hamburger-line line-1"></span>
              <span className="hamburger-line line-2"></span>
              <span className="hamburger-line line-3"></span>
            </button>
            
            {!isMobile && <Breadcrumb items={breadcrumbItems} className="custom-breadcrumb-header" separator={<span style={{ color: '#0892d0' }}>/</span>} />}
          </div>

          <div style={{ paddingRight: isMobile ? 0 : '24px', display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px' }}>
            <Dropdown dropdownRender={() => notificationMenu} placement="bottomRight" trigger={['click']}>
              <Badge count={unreadCount} size="small" offset={[-4, 4]}>
                <Button 
                  type="text" 
                  icon={<BellOutlined style={{ fontSize: isMobile ? '16px' : '18px', color: isDark ? '#94a3b8' : '#595959' }} />} 
                  className="notification-btn"
                  style={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40 }}
                />
              </Badge>
            </Dropdown>

            {/* ── Dark Mode Toggle ── */}
            <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <button
                onClick={toggleTheme}
                className="theme-toggle-btn"
                aria-label="Toggle dark mode"
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(8,146,208,0.15)',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(8,146,208,0.06)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                {isDark
                  ? <SunOutlined style={{ fontSize: 16, color: '#fbbf24' }} />
                  : <MoonOutlined style={{ fontSize: 16, color: '#0892d0' }} />
                }
              </button>
            </Tooltip>
            
            <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size={isMobile ? 'small' : 'default'} style={{ backgroundColor: '#0892d0' }} src={user?.profile_photo_url} icon={<UserOutlined />} />
                {!isMobile && <span style={{ fontWeight: 500, color: isDark ? '#e2e8f0' : '#262626' }}>{user?.first_name} {user?.last_name}</span>}
              </Space>
            </Dropdown>
          </div>
        </Header>
        
        <div style={{ padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <Content
            className="custom-content"
            style={{
              margin: 0,
              flex: 1,
            }}
          >
            <Outlet />
          </Content>
        </div>

        <Footer style={{ 
          textAlign: 'center', 
          color: isDark ? '#94a3b8' : '#8c8c8c', 
          padding: '12px 0', 
          background: isDark ? '#141414' : '#ffffff', 
          borderTop: isDark ? '1px solid #303030' : '1px solid #f0f0f0',
          flexShrink: 0, 
          fontSize: isMobile ? '12px' : '14px',
          zIndex: 5
        }}>
          Udom Talent Management system ©{new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
