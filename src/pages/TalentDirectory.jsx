import React, { useState } from 'react';
import { 
    Card, Typography, Input, Row, Col, Avatar, Tag, Space, Button, 
    Skeleton, Select, Empty, Badge, Tooltip, message as antMsg, 
    Popconfirm, Divider, Drawer, Tabs, Progress, List, Timeline
} from 'antd';
import { 
    SearchOutlined, 
    UserOutlined, 
    LinkOutlined, 
    MessageOutlined, 
    UserAddOutlined, 
    StarOutlined, 
    CheckOutlined, 
    GlobalOutlined,
    SafetyCertificateOutlined,
    DisconnectOutlined,
    MailOutlined,
    PhoneOutlined,
    FolderOpenOutlined,
    ProjectOutlined,
    CalendarOutlined,
    BulbOutlined,
    AimOutlined,
    IdcardOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const TalentDirectory = () => {
    const { user: me } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [roleFilter, setRoleFilter] = useState('All');
    const [selectedUser, setSelectedUser] = useState(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: directoryUsers, isLoading } = useQuery({
        queryKey: ['talent-directory'],
        queryFn: async () => {
            const res = await api.get('/talent-directory');
            return res.data.data;
        }
    });

    // Mutations for Connection & Following
    const connectMut = useMutation({
        mutationFn: (receiverId) => api.post('/connections/request', { receiver_id: receiverId }),
        onSuccess: (_, receiverId) => {
            antMsg.success('Connection request sent!');
            queryClient.invalidateQueries(['talent-directory']);
            // Update selected user state if drawer is open
            if (selectedUser && selectedUser.id === receiverId) {
                setSelectedUser(prev => ({ ...prev, pending_request: true }));
            }
        },
        onError: () => antMsg.error('Failed to send connection request')
    });

    const followMut = useMutation({
        mutationFn: ({ userId, isFollowing }) => 
            isFollowing ? api.delete(`/follow/${userId}`) : api.post(`/follow/${userId}`),
        onSuccess: (_, variables) => {
            antMsg.success(variables.isFollowing ? 'Unfollowed successfully' : 'Now following!');
            queryClient.invalidateQueries(['talent-directory']);
            if (selectedUser && selectedUser.id === variables.userId) {
                setSelectedUser(prev => ({ ...prev, is_following: !variables.isFollowing }));
            }
        },
        onError: () => antMsg.error('Action failed')
    });

    const disconnectMut = useMutation({
        mutationFn: (userId) => api.delete(`/connections/${userId}/disconnect`),
        onSuccess: (_, userId) => {
            antMsg.success('Disconnected successfully');
            queryClient.invalidateQueries(['talent-directory']);
            if (selectedUser && selectedUser.id === userId) {
                setSelectedUser(prev => ({ ...prev, is_connected: false }));
            }
        },
        onError: () => antMsg.error('Failed to disconnect')
    });

    if (isLoading) return (
        <div style={{ padding: '24px' }}>
            <Skeleton active paragraph={{ rows: 12 }} />
        </div>
    );

    const handleCardClick = (user) => {
        setSelectedUser(user);
        setDrawerVisible(true);
    };

    const filteredUsers = directoryUsers?.filter(usr => {
        const fullName = `${usr.first_name} ${usr.last_name}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase());
        
        const matchesCategory = categoryFilter === 'All' || usr.talents?.some(t => t.category === categoryFilter);
        
        const isMentor = usr.roles?.some(r => r.name === 'Mentor');
        const isStudent = usr.roles?.some(r => r.name === 'Student');
        
        let matchesRole = true;
        if (roleFilter === 'Mentor') matchesRole = isMentor;
        if (roleFilter === 'Student') matchesRole = isStudent;
        
        return matchesSearch && matchesCategory && matchesRole;
    });

    const getProficiencyColor = (level) => {
        switch(level) {
            case 'Expert': return 'green';
            case 'Intermediate': return 'blue';
            default: return 'orange';
        }
    };

    const getProficiencyPercent = (level) => {
        switch(level) {
            case 'Expert': return 95;
            case 'Intermediate': return 70;
            default: return 40;
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Page Header */}
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 850, letterSpacing: '-0.5px' }}>Talent Directory</Title>
                <Text type="secondary" style={{ fontSize: 14 }}>
                    Discover peer students, certified mentors, and build connections. Click on any profile to view complete portfolios and projects.
                </Text>
            </div>

            {/* Premium Filter Dashboard */}
            <Card 
                style={{ 
                    marginBottom: 32, 
                    borderRadius: 24, 
                    border: 'none', 
                    boxShadow: '0 8px 30px rgba(0,0,0,0.03)' 
                }} 
                styles={{ body: { padding: '20px' } }}
            >
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} lg={12}>
                        <Input 
                            size="large" 
                            placeholder="Search by student or mentor name..." 
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ borderRadius: 12 }}
                            allowClear
                        />
                    </Col>
                    <Col xs={12} lg={6}>
                        <Select 
                            size="large" 
                            value={categoryFilter}
                            style={{ width: '100%' }}
                            dropdownStyle={{ borderRadius: 12 }}
                            onChange={value => setCategoryFilter(value)}
                        >
                            <Option value="All">All Talent Categories</Option>
                            <Option value="Technology">Technology</Option>
                            <Option value="Creative">Creative</Option>
                            <Option value="Business">Business</Option>
                            <Option value="Leadership">Leadership</Option>
                        </Select>
                    </Col>
                    <Col xs={12} lg={6}>
                        <Select 
                            size="large" 
                            value={roleFilter}
                            style={{ width: '100%' }}
                            dropdownStyle={{ borderRadius: 12 }}
                            onChange={value => setRoleFilter(value)}
                        >
                            <Option value="All">All Roles</Option>
                            <Option value="Student">Students Only</Option>
                            <Option value="Mentor">Mentors Only</Option>
                        </Select>
                    </Col>
                </Row>
            </Card>

            {/* Talent Grid */}
            <Row gutter={[24, 24]}>
                {!filteredUsers || filteredUsers.length === 0 ? (
                    <Col span={24}>
                        <Card style={{ borderRadius: 24, border: 'none', padding: '64px 0', textAlign: 'center' }}>
                            <Empty description={<Text type="secondary" style={{ fontSize: 14 }}>No matches found for your current search criteria.</Text>} />
                        </Card>
                    </Col>
                ) : (
                    filteredUsers.map(usr => {
                        const isMentor = usr.roles?.some(r => r.name === 'Mentor');
                        
                        return (
                            <Col xs={24} sm={12} lg={8} xl={6} key={usr.id}>
                                <Card
                                    hoverable
                                    onClick={() => handleCardClick(usr)}
                                    style={{ 
                                        borderRadius: 24, 
                                        overflow: 'hidden', 
                                        height: '100%', 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        border: 'none',
                                        boxShadow: '0 6px 20px rgba(0,0,0,0.03)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                    styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 } }}
                                    className="talent-card"
                                >
                                    {/* Card Decorative Banner */}
                                    <div style={{ 
                                        height: 70, 
                                        background: isMentor 
                                            ? 'linear-gradient(135deg, #d4af37 0%, #f3e5ab 100%)' 
                                            : 'linear-gradient(135deg, #0892d0 0%, #a5f3fc 100%)',
                                        position: 'relative'
                                    }} />

                                    <div style={{ padding: '0 20px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                        {/* Avatar placed absolute overlap */}
                                        <div style={{ marginTop: -40, marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                                            <Avatar 
                                                size={80} 
                                                src={usr.profile_photo_url} 
                                                style={{ 
                                                    backgroundColor: '#ffffff', 
                                                    border: '4px solid #ffffff',
                                                    boxShadow: '0 8px 16px rgba(0,0,0,0.08)'
                                                }} 
                                                icon={<UserOutlined style={{ color: '#bfbfbf' }} />} 
                                            />
                                        </div>

                                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                            <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>
                                                {usr.first_name} {usr.last_name}
                                            </Title>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                                <Tag color={isMentor ? 'gold' : 'blue'} style={{ borderRadius: 8, fontSize: 10, border: 'none', padding: '2px 8px', fontWeight: 600 }}>
                                                    {isMentor ? 'Mentor' : 'Student'}
                                                </Tag>
                                                {usr.talents?.length > 0 && (
                                                    <Tag color="purple" style={{ borderRadius: 8, fontSize: 10, border: 'none', padding: '2px 8px', fontWeight: 600 }}>
                                                        {usr.talents[0].category}
                                                    </Tag>
                                                )}
                                            </div>

                                            <Text type="secondary" ellipsis={{ rows: 2 }} style={{ display: 'block', fontSize: 13, minHeight: 38, lineHeight: '18px' }}>
                                                {usr.bio || 'No bio bio details set yet.'}
                                            </Text>
                                        </div>

                                        {/* Skills Section */}
                                        <div style={{ flex: 1, marginBottom: 16 }}>
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                                                {usr.talents?.slice(0, 3).map(t => (
                                                    <Tag 
                                                        color={getProficiencyColor(t.pivot?.proficiency)} 
                                                        key={t.id} 
                                                        style={{ borderRadius: 6, fontSize: 10, margin: '2px 0' }}
                                                    >
                                                        {t.name}
                                                    </Tag>
                                                ))}
                                                {usr.talents?.length > 3 && (
                                                    <Tag style={{ borderRadius: 6, fontSize: 10 }}>+{usr.talents.length - 3}</Tag>
                                                )}
                                                {(!usr.talents || usr.talents.length === 0) && (
                                                    <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>No registered talents</Text>
                                                )}
                                            </div>
                                        </div>

                                        <Divider style={{ margin: '12px 0' }} />

                                        {/* Connect Actions */}
                                        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }} onClick={e => e.stopPropagation()}>
                                            {!isMentor ? (
                                                usr.is_connected ? (
                                                    <>
                                                        <Button 
                                                            type="primary" 
                                                            icon={<MessageOutlined />} 
                                                            onClick={() => navigate('/chat')} 
                                                            style={{ flex: 1, borderRadius: 12, background: '#0892d0' }}
                                                        >
                                                            Message
                                                        </Button>
                                                        <Popconfirm
                                                            title="Disconnect"
                                                            description="Are you sure you want to disconnect?"
                                                            onConfirm={() => disconnectMut.mutate(usr.id)}
                                                            okText="Yes"
                                                            cancelText="No"
                                                        >
                                                            <Button 
                                                                danger 
                                                                icon={<DisconnectOutlined />} 
                                                                style={{ borderRadius: 12 }}
                                                            />
                                                        </Popconfirm>
                                                    </>
                                                ) : usr.pending_request ? (
                                                    <Button disabled style={{ flex: 1, borderRadius: 12 }}>
                                                        Pending...
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        type="primary" 
                                                        ghost 
                                                        icon={<UserAddOutlined />} 
                                                        onClick={() => connectMut.mutate(usr.id)} 
                                                        loading={connectMut.isPending}
                                                        style={{ flex: 1, borderRadius: 12 }}
                                                    >
                                                        Connect
                                                    </Button>
                                                )
                                            ) : (
                                                <Button 
                                                    type="primary" 
                                                    icon={<MessageOutlined />} 
                                                    onClick={() => navigate('/chat')} 
                                                    style={{ flex: 1, borderRadius: 12, background: '#0892d0' }}
                                                >
                                                    Message
                                                </Button>
                                            )}

                                            <Button
                                                icon={usr.is_following ? <CheckOutlined /> : <StarOutlined />}
                                                onClick={() => followMut.mutate({ userId: usr.id, isFollowing: usr.is_following })}
                                                loading={followMut.isPending}
                                                type={usr.is_following ? 'default' : 'dashed'}
                                                style={{ borderRadius: 12 }}
                                                title={usr.is_following ? 'Unfollow' : 'Follow'}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        );
                    })
                )}
            </Row>

            {/* Profile slide-out Drawer details */}
            <Drawer
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar src={selectedUser?.profile_photo_url} icon={<UserOutlined />} />
                        <div>
                            <Text strong style={{ fontSize: 16 }}>{selectedUser?.first_name} {selectedUser?.last_name}</Text>
                            <span style={{ display: 'block', fontSize: 11, color: '#bfbfbf', fontWeight: 500 }}>
                                {selectedUser?.roles?.some(r => r.name === 'Mentor') ? '🎓 Certified Mentor' : '👥 Student'}
                            </span>
                        </div>
                    </div>
                }
                placement="right"
                width={550}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                styles={{ body: { padding: '24px 0 0 0' } }}
            >
                {selectedUser && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Summary Header */}
                        <div style={{ padding: '0 24px 20px 24px' }}>
                            <div style={{ background: '#f8fafc', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {selectedUser.bio && (
                                    <div>
                                        <Text strong style={{ fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase' }}>Biography</Text>
                                        <Paragraph style={{ margin: '4px 0 0 0', fontSize: 13, color: '#434343' }}>{selectedUser.bio}</Paragraph>
                                    </div>
                                )}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px', marginTop: 4 }}>
                                    {selectedUser.email && (
                                        <Space size={6}><MailOutlined style={{ color: '#0892d0' }} /><Text style={{ fontSize: 13 }} type="secondary">{selectedUser.email}</Text></Space>
                                    )}
                                    {selectedUser.phone && (
                                        <Space size={6}><PhoneOutlined style={{ color: '#0892d0' }} /><Text style={{ fontSize: 13 }} type="secondary">{selectedUser.phone}</Text></Space>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tabs content */}
                        <Tabs 
                            defaultActiveKey="overview" 
                            size="medium"
                            style={{ flex: 1 }}
                            tabBarStyle={{ paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}
                            items={[
                                {
                                    key: 'overview',
                                    label: <span style={{ fontSize: 13 }}><IdcardOutlined />Overview</span>,
                                    children: (
                                        <div style={{ padding: '0 24px 24px 24px', overflowY: 'auto', maxHeight: 'calc(100vh - 350px)' }}>
                                            <Title level={5} style={{ marginBottom: 12, fontWeight: 700 }}>Talent & Proficiency Map</Title>
                                            
                                            {selectedUser.talents && selectedUser.talents.length > 0 ? (
                                                <List
                                                    dataSource={selectedUser.talents}
                                                    renderItem={t => (
                                                        <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                            <div style={{ width: '100%' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                                    <Space>
                                                                        <Text strong style={{ fontSize: 14 }}>{t.name}</Text>
                                                                        <Tag color="cyan" style={{ borderRadius: 6, fontSize: 10 }}>{t.category}</Tag>
                                                                    </Space>
                                                                    <Tag color={getProficiencyColor(t.pivot?.proficiency)} style={{ borderRadius: 8, fontSize: 11 }}>
                                                                        {t.pivot?.proficiency}
                                                                    </Tag>
                                                                </div>
                                                                <Progress 
                                                                    percent={getProficiencyPercent(t.pivot?.proficiency)} 
                                                                    strokeColor={getProficiencyColor(t.pivot?.proficiency) === 'green' ? '#52c41a' : getProficiencyColor(t.pivot?.proficiency) === 'blue' ? '#0892d0' : '#fa8c16'} 
                                                                    showInfo={false} 
                                                                    size="small" 
                                                                />
                                                                {t.pivot?.portfolio_url && (
                                                                    <div style={{ marginTop: 6 }}>
                                                                        <a href={t.pivot.portfolio_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#0892d0' }}>
                                                                            <LinkOutlined /> Portfolio Link
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </List.Item>
                                                    )}
                                                />
                                            ) : (
                                                <Empty description="No skills registered on profile yet" style={{ marginTop: 24 }} />
                                            )}
                                        </div>
                                    )
                                },
                                {
                                    key: 'projects',
                                    label: <span style={{ fontSize: 13 }}><FolderOpenOutlined />Projects</span>,
                                    children: (
                                        <div style={{ padding: '0 24px 24px 24px', overflowY: 'auto', maxHeight: 'calc(100vh - 350px)' }}>
                                            {/* Projects listing */}
                                            {selectedUser.roles?.some(r => r.name === 'Mentor') ? (
                                                <>
                                                    <Title level={5} style={{ marginBottom: 16, fontWeight: 700 }}>Mentored Projects ({selectedUser.mentored_projects?.length || 0})</Title>
                                                    {selectedUser.mentored_projects && selectedUser.mentored_projects.length > 0 ? (
                                                        <Timeline mode="left">
                                                            {selectedUser.mentored_projects.map(proj => (
                                                                <Timeline.Item key={proj.id} color="green">
                                                                    <Card size="small" style={{ borderRadius: 12, border: '1px solid #f1f5f9' }}>
                                                                        <Text strong style={{ fontSize: 14 }}>{proj.title}</Text>
                                                                        <Paragraph style={{ fontSize: 12, margin: '4px 0 8px 0', color: '#64748b' }}>{proj.description}</Paragraph>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <Tag color="cyan" style={{ borderRadius: 6, fontSize: 10 }}>{proj.talent?.name || 'Talent Project'}</Tag>
                                                                            <Tag color={proj.status === 'active' ? 'blue' : proj.status === 'completed' ? 'green' : 'orange'} style={{ textTransform: 'capitalize', borderRadius: 6, fontSize: 10 }}>
                                                                                {proj.status}
                                                                            </Tag>
                                                                        </div>
                                                                    </Card>
                                                                </Timeline.Item>
                                                            ))}
                                                        </Timeline>
                                                    ) : (
                                                        <Empty description="Not supervising any active projects" />
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <Title level={5} style={{ marginBottom: 16, fontWeight: 700 }}>Launched Projects ({selectedUser.own_projects?.length || 0})</Title>
                                                    {selectedUser.own_projects && selectedUser.own_projects.length > 0 ? (
                                                        <Timeline mode="left">
                                                            {selectedUser.own_projects.map(proj => (
                                                                <Timeline.Item key={proj.id} color="blue">
                                                                    <Card size="small" style={{ borderRadius: 12, border: '1px solid #f1f5f9' }}>
                                                                        <Text strong style={{ fontSize: 14 }}>{proj.title}</Text>
                                                                        <Paragraph style={{ fontSize: 12, margin: '4px 0 8px 0', color: '#64748b' }}>{proj.description}</Paragraph>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                                                            <Space>
                                                                                {proj.mentor && <Tag color="gold" style={{ borderRadius: 6, fontSize: 10 }}>Mentor: {proj.mentor.first_name}</Tag>}
                                                                                <Tag color="cyan" style={{ borderRadius: 6, fontSize: 10 }}>{proj.talent?.name}</Tag>
                                                                            </Space>
                                                                            <Tag color={proj.status === 'active' ? 'blue' : proj.status === 'completed' ? 'green' : 'orange'} style={{ textTransform: 'capitalize', borderRadius: 6, fontSize: 10 }}>
                                                                                {proj.status}
                                                                            </Tag>
                                                                        </div>
                                                                    </Card>
                                                                </Timeline.Item>
                                                            ))}
                                                        </Timeline>
                                                    ) : (
                                                        <Empty description="No projects created yet" />
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )
                                },
                                {
                                    key: 'ecosystem',
                                    label: <span style={{ fontSize: 13 }}><BulbOutlined />Details</span>,
                                    children: (
                                        <div style={{ padding: '0 24px 24px 24px', overflowY: 'auto', maxHeight: 'calc(100vh - 350px)' }}>
                                            {selectedUser.roles?.some(r => r.name === 'Mentor') ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                    <div>
                                                        <Title level={5} style={{ margin: '0 0 6px 0', fontWeight: 700 }}><AimOutlined style={{ color: '#0892d0' }} /> Specialization Areas</Title>
                                                        <Paragraph style={{ fontSize: 13, color: '#475569' }}>
                                                            Supervising academic and commercial projects in technology domains, leading skill enhancement initiatives, and guiding student portfolios.
                                                        </Paragraph>
                                                    </div>
                                                    <Divider style={{ margin: '8px 0' }} />
                                                    <div>
                                                        <Title level={5} style={{ margin: '0 0 6px 0', fontWeight: 700 }}><SafetyCertificateOutlined style={{ color: '#faad14' }} /> Mentor Credentials</Title>
                                                        <Paragraph style={{ fontSize: 13, color: '#475569' }}>
                                                            Holds active credentials in research guidance, software architectures, project review cycles, and industrial project delivery.
                                                        </Paragraph>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                    <div>
                                                        <Title level={5} style={{ margin: '0 0 6px 0', fontWeight: 700 }}><AimOutlined style={{ color: '#0892d0' }} /> Student Learning Target</Title>
                                                        <Paragraph style={{ fontSize: 13, color: '#475569' }}>
                                                            Actively learning and building competencies, working on supervised projects, and expanding network connections.
                                                        </Paragraph>
                                                    </div>
                                                    <Divider style={{ margin: '8px 0' }} />
                                                    <div>
                                                        <Title level={5} style={{ margin: '0 0 6px 0', fontWeight: 700 }}><ProjectOutlined style={{ color: '#52c41a' }} /> Academic Track</Title>
                                                        <Paragraph style={{ fontSize: 13, color: '#475569' }}>
                                                            Participating in the UDOM Talent ecosystem. Collaborates with mentors to push code repositories, creative designs, and project updates.
                                                        </Paragraph>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                }
                            ]}
                        />

                        {/* Slide drawer Actions Footer */}
                        <div style={{ 
                            padding: '16px 24px', 
                            borderTop: '1px solid #f1f5f9', 
                            background: '#f8fafc',
                            marginTop: 'auto',
                            display: 'flex',
                            gap: 12
                        }}>
                            {!selectedUser.roles?.some(r => r.name === 'Mentor') ? (
                                selectedUser.is_connected ? (
                                    <>
                                        <Button 
                                            type="primary" 
                                            icon={<MessageOutlined />} 
                                            onClick={() => { setDrawerVisible(false); navigate('/chat'); }} 
                                            style={{ flex: 1, borderRadius: 12, height: 44, background: '#0892d0' }}
                                        >
                                            Send Message
                                        </Button>
                                        <Popconfirm
                                            title="Disconnect"
                                            description="Are you sure you want to disconnect?"
                                            onConfirm={() => disconnectMut.mutate(selectedUser.id)}
                                            okText="Yes"
                                            cancelText="No"
                                        >
                                            <Button 
                                                danger 
                                                icon={<DisconnectOutlined />} 
                                                style={{ borderRadius: 12, width: 48, height: 44 }}
                                            />
                                        </Popconfirm>
                                    </>
                                ) : selectedUser.pending_request ? (
                                    <Button disabled style={{ flex: 1, borderRadius: 12, height: 44 }}>
                                        Connection Request Pending
                                    </Button>
                                ) : (
                                    <Button 
                                        type="primary" 
                                        icon={<UserAddOutlined />} 
                                        onClick={() => connectMut.mutate(selectedUser.id)} 
                                        loading={connectMut.isPending}
                                        style={{ flex: 1, borderRadius: 12, height: 44 }}
                                    >
                                        Send Connection Request
                                    </Button>
                                )
                            ) : (
                                <Button 
                                    type="primary" 
                                    icon={<MessageOutlined />} 
                                    onClick={() => { setDrawerVisible(false); navigate('/chat'); }} 
                                    style={{ flex: 1, borderRadius: 12, height: 44, background: '#0892d0' }}
                                >
                                    Send Message
                                </Button>
                            )}

                            <Button
                                icon={selectedUser.is_following ? <CheckOutlined /> : <StarOutlined />}
                                onClick={() => followMut.mutate({ userId: selectedUser.id, isFollowing: selectedUser.is_following })}
                                loading={followMut.isPending}
                                type={selectedUser.is_following ? 'default' : 'dashed'}
                                style={{ borderRadius: 12, height: 44 }}
                            >
                                {selectedUser.is_following ? 'Following' : 'Follow User'}
                            </Button>
                        </div>
                    </div>
                )}
            </Drawer>

            {/* Custom Styles */}
            <style>{`
                .talent-card {
                    cursor: pointer;
                }
                .talent-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 30px rgba(8, 146, 208, 0.08) !important;
                }
            `}</style>
        </div>
    );
};

export default TalentDirectory;
