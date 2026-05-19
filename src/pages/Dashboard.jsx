import React from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Progress, List, Avatar, Tag, Skeleton, Badge, Divider, Grid, Button } from 'antd';
import { 
  TeamOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  UserOutlined,
  GroupOutlined,
  FileTextOutlined,
  ProjectOutlined,
  ArrowUpOutlined,
  SafetyCertificateOutlined,
  TagsOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const screens = useBreakpoint();
    const isMobile = !screens.lg;

    const { data: dashboardData, isLoading } = useQuery({
      queryKey: ['dashboardStats'],
      queryFn: async () => {
        const response = await api.get('/dashboard/stats');
        return response.data;
      }
    });

    if (isLoading) return (
        <div style={{ padding: '24px' }}>
            <Skeleton active paragraph={{ rows: 10 }} />
        </div>
    );

    const role = dashboardData?.role || 'student';
    const stats = dashboardData?.data?.stats || {};
    const recentActivity = dashboardData?.data?.recent_activity || [];

    const StatCard = ({ title, value, icon, color, subtext, onClick }) => (
        <Card 
            hoverable={!!onClick}
            onClick={onClick}
            style={{ 
                borderRadius: 20, 
                border: 'none', 
                boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                overflow: 'hidden',
                background: '#fff',
                cursor: onClick ? 'pointer' : 'default',
                height: '100%'
            }}
            styles={{ body: { padding: '24px' } }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>{title}</Text>
                    <Statistic 
                        value={value} 
                        valueStyle={{ color: '#1f1f1f', fontWeight: 850, fontSize: 32 }}
                    />
                    {subtext && <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>{subtext}</Text>}
                </div>
                <div style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 12, 
                    background: `${color}10`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: color,
                    fontSize: 22
                }}>
                    {icon}
                </div>
            </div>
            <div style={{ 
                height: 4, 
                width: '30%', 
                background: color, 
                marginTop: 16, 
                borderRadius: 2,
            }} />
        </Card>
    );

    // ─── ADMIN DASHBOARD VIEW ───────────────────────────────────────────────────
    const renderAdminDashboard = () => (
        <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} lg={8}>
                <StatCard 
                    title="Total Registered Users" 
                    value={stats.total_users} 
                    icon={<TeamOutlined />} 
                    color="#0892d0"
                    subtext={`${stats.total_mentors} Mentors | ${stats.total_students} Students`}
                    onClick={() => navigate('/users')}
                />
            </Col>
            <Col xs={24} sm={12} lg={8}>
                <StatCard 
                    title="Total Projects Created" 
                    value={stats.total_projects} 
                    icon={<ProjectOutlined />} 
                    color="#52c41a"
                    subtext={`${stats.active_projects} active projects in system`}
                    onClick={() => navigate('/projects')}
                />
            </Col>
            <Col xs={24} sm={12} lg={8}>
                <StatCard 
                    title="Active Mentorship Connections" 
                    value={stats.total_connections} 
                    icon={<GroupOutlined />} 
                    color="#722ed1"
                    subtext="Successfully matched mentor-student pairings"
                    onClick={() => navigate('/mentorship')}
                />
            </Col>
            <Col xs={24} sm={12} lg={8}>
                <StatCard 
                    title="Platform Talent Profiles" 
                    value={stats.total_talents} 
                    icon={<TagsOutlined />} 
                    color="#fa8c16"
                    subtext="Skills registered in Lookup Manager"
                    onClick={() => navigate('/lookups/talents')}
                />
            </Col>
        </Row>
    );

    // ─── MENTOR DASHBOARD VIEW ──────────────────────────────────────────────────
    const renderMentorDashboard = () => (
        <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} lg={6}>
                <StatCard 
                    title="Active Students Mentored" 
                    value={stats.active_students} 
                    icon={<TeamOutlined />} 
                    color="#0892d0"
                    subtext="Direct mentorship connections"
                    onClick={() => navigate('/network')}
                />
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <StatCard 
                    title="Pending Connection Requests" 
                    value={stats.pending_requests} 
                    icon={<ClockCircleOutlined />} 
                    color="#faad14"
                    subtext="Requests awaiting your approval"
                    onClick={() => navigate('/network')}
                />
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <StatCard 
                    title="Mentored Projects" 
                    value={stats.mentored_projects} 
                    icon={<ProjectOutlined />} 
                    color="#52c41a"
                    subtext="Active student projects assigned to you"
                    onClick={() => navigate('/projects')}
                />
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <StatCard 
                    title="My Feed Posts & Discussions" 
                    value={stats.total_posts} 
                    icon={<FileTextOutlined />} 
                    color="#722ed1"
                    subtext="Contributions made to the feed"
                    onClick={() => navigate('/feed')}
                />
            </Col>
        </Row>
    );

    // ─── STUDENT DASHBOARD VIEW ─────────────────────────────────────────────────
    const renderStudentDashboard = () => (
        <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} lg={6}>
                <StatCard 
                    title="My Connected Mentors" 
                    value={stats.connected_mentors} 
                    icon={<SafetyCertificateOutlined />} 
                    color="#fa8c16"
                    subtext="Mentors guiding your learning journey"
                    onClick={() => navigate('/network')}
                />
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <StatCard 
                    title="Peer Connections" 
                    value={stats.peer_connections} 
                    icon={<TeamOutlined />} 
                    color="#0892d0"
                    subtext="Collaborative student networks"
                    onClick={() => navigate('/network')}
                />
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <StatCard 
                    title="Active Projects" 
                    value={stats.active_projects} 
                    icon={<ProjectOutlined />} 
                    color="#52c41a"
                    subtext={`Out of ${stats.total_projects || 0} total projects launched`}
                    onClick={() => navigate('/projects')}
                />
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <StatCard 
                    title="Pending Sent Requests" 
                    value={stats.pending_sent} 
                    icon={<ClockCircleOutlined />} 
                    color="#8c8c8c"
                    subtext="Sent requests awaiting response"
                    onClick={() => navigate('/network')}
                />
            </Col>
        </Row>
    );

    return (
        <div style={{ padding: '24px', maxWidth: 1600, margin: '0 auto' }}>
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>
                        Welcome back, {user?.first_name}!
                    </Title>
                    <Text type="secondary">
                        {role === 'admin' && "System administration overview and activity monitoring."}
                        {role === 'mentor' && "Guide students, manage projects, and grow your mentorship circles."}
                        {role === 'student' && "Connect with mentors, showcase your projects, and discover talents."}
                    </Text>
                </div>
                
                <Space size="middle" direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
                    <Badge 
                        status="processing" 
                        text={<Text strong style={{ color: '#0892d0', fontSize: 12 }}>TALENT NETWORK ONLINE</Text>} 
                        style={{ background: '#e6f7ff', padding: '8px 16px', borderRadius: 20, border: '1px solid #91d5ff' }}
                    />
                </Space>
            </div>

            {/* Render appropriate dashboard depending on role */}
            {role === 'admin' && renderAdminDashboard()}
            {role === 'mentor' && renderMentorDashboard()}
            {role === 'student' && renderStudentDashboard()}

            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                {/* Visual Insight Section */}
                <Col xs={24} lg={14}>
                    <Card 
                        title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} /><span>Platform Performance & Pulse</span></Space>}
                        style={{ borderRadius: 20, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}
                    >
                        <Row align="middle" justify="center" gutter={[20, 20]} style={{ padding: '20px 0' }}>
                            <Col xs={24} md={10} style={{ textAlign: 'center' }}>
                                <Progress 
                                    type="dashboard" 
                                    percent={role === 'admin' ? 88 : role === 'mentor' ? 75 : 92} 
                                    strokeColor={{
                                        '0%': '#108ee9',
                                        '100%': '#87d068',
                                    }}
                                    strokeWidth={8}
                                    width={160}
                                    format={percent => (
                                        <div className="animated-pulse">
                                            <div style={{ fontSize: 28, fontWeight: 800 }}>{percent}%</div>
                                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Engagement</div>
                                        </div>
                                    )}
                                />
                            </Col>
                            <Col xs={24} md={14}>
                                <Title level={5} style={{ marginTop: 0 }}>Interaction Analytics</Title>
                                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                                    Your profile health and interaction metrics are performing exceptionally well this week. Keep up the networking!
                                </Text>
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text style={{ fontSize: 12 }}>Profile Completeness</Text>
                                        <Text strong style={{ fontSize: 12 }}>90%</Text>
                                    </div>
                                    <Progress percent={90} status="active" strokeColor="#0892d0" size="small" showInfo={false} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text style={{ fontSize: 12 }}>Weekly Interaction Rate</Text>
                                        <Text strong style={{ fontSize: 12 }}>+18%</Text>
                                    </div>
                                    <Progress percent={78} status="active" strokeColor="#52c41a" size="small" showInfo={false} />
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Live Activity Feed */}
                <Col xs={24} lg={10}>
                    <Card 
                        title={<Space><ClockCircleOutlined style={{ color: '#0892d0' }} /><span>Live Activity Feed</span></Space>}
                        style={{ borderRadius: 20, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', height: '100%' }}
                        extra={
                            <Button type="link" size="small" onClick={() => navigate(role === 'admin' ? '/users' : '/feed')} style={{ padding: 0 }}>
                                View all <RightOutlined />
                            </Button>
                        }
                    >
                        <List
                            itemLayout="horizontal"
                            dataSource={recentActivity}
                            renderItem={(item, index) => (
                                <List.Item style={{ borderBottom: index === recentActivity.length - 1 ? 'none' : '1px solid #f5f5f5', padding: '10px 0' }}>
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar 
                                                src={item.avatar} 
                                                style={{ backgroundColor: '#e6f7ff', color: '#0892d0' }} 
                                                icon={<UserOutlined />} 
                                            />
                                        }
                                        title={<Text strong style={{ fontSize: 13 }}>{item.user}</Text>}
                                        description={
                                            <Space direction="vertical" size={0}>
                                                <Text type="secondary" style={{ fontSize: 12, color: '#434343' }}>{item.action}</Text>
                                                <Text type="secondary" style={{ fontSize: 11 }}>{item.time}</Text>
                                            </Space>
                                        }
                                    />
                                </List.Item>
                            )}
                            locale={{ emptyText: <div style={{ padding: '40px 0', textAlign: 'center' }}><Text type="secondary">No recent platform activity found.</Text></div> }}
                        />
                    </Card>
                </Col>
            </Row>

            <style>{`
                .animated-pulse {
                    animation: softPulse 2.5s infinite ease-in-out;
                }
                @keyframes softPulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.02); opacity: 0.95; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
