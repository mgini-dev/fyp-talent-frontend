import React, { useState } from 'react';
import {
    Card, Avatar, Button, Typography, Tag, Space, Tabs, Badge,
    message as antMsg, Empty, Skeleton, Tooltip, Divider, Row, Col
} from 'antd';
import {
    UserAddOutlined, TeamOutlined, CheckOutlined, CloseOutlined,
    MessageOutlined, UserOutlined, StarOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const { Title, Text } = Typography;

const talentColors = ['blue', 'purple', 'green', 'orange', 'cyan', 'gold'];

// ─── Person Card ─────────────────────────────────────────────────────────────
const PersonCard = ({ person, me, onAction }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const followMut = useMutation({
        mutationFn: () => person.is_following ? api.delete(`/follow/${person.id}`) : api.post(`/follow/${person.id}`),
        onSuccess: () => { antMsg.success(person.is_following ? 'Unfollowed' : 'Now following!'); queryClient.invalidateQueries(['discover']); }
    });

    const connectMut = useMutation({
        mutationFn: () => api.post('/connections/request', { receiver_id: person.id }),
        onSuccess: () => { antMsg.success('Connection request sent!'); queryClient.invalidateQueries(['discover']); }
    });

    const isMentor = person.roles?.some(r => r.name === 'Mentor');

    return (
        <Card
            hoverable
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', height: '100%' }}
            styles={{ body: { padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' } }}
        >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                <Avatar size={52} src={person.profile_photo_url} style={{ background: 'linear-gradient(135deg,#0892d0,#000080)', flexShrink: 0 }}>
                    {person.first_name?.[0]}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ fontSize: 15, display: 'block' }}>{person.first_name} {person.last_name}</Text>
                    <Space size={4} wrap>
                        {isMentor && <Tag icon={<SafetyCertificateOutlined />} color="gold" style={{ borderRadius: 10, fontSize: 11 }}>Mentor</Tag>}
                        {!isMentor && <Tag icon={<UserOutlined />} color="blue" style={{ borderRadius: 10, fontSize: 11 }}>Student</Tag>}
                    </Space>
                    {person.bio && <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.bio}</Text>}
                </div>
            </div>

            {/* Shared Talents */}
            {person.talents?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                    <Space wrap size={[4, 4]}>
                        {person.talents.slice(0, 3).map((t, i) => (
                            <Tag key={t.id} color={talentColors[i % talentColors.length]} style={{ borderRadius: 10, fontSize: 11 }}>{t.name}</Tag>
                        ))}
                        {person.talents.length > 3 && <Tag style={{ borderRadius: 10, fontSize: 11 }}>+{person.talents.length - 3}</Tag>}
                    </Space>
                </div>
            )}

            <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                {person.is_connected ? (
                    <Button size="small" icon={<MessageOutlined />} onClick={() => navigate('/chat')} style={{ flex: 1, borderRadius: 8 }}>
                        Message
                    </Button>
                ) : person.pending_request ? (
                    <Button size="small" disabled style={{ flex: 1, borderRadius: 8 }}>Pending...</Button>
                ) : (
                    <Button size="small" type="primary" ghost icon={<UserAddOutlined />} onClick={() => connectMut.mutate()} loading={connectMut.isPending} style={{ flex: 1, borderRadius: 8 }}>
                        Connect
                    </Button>
                )}
                <Button
                    size="small"
                    icon={person.is_following ? <CheckOutlined /> : <StarOutlined />}
                    onClick={() => followMut.mutate()}
                    loading={followMut.isPending}
                    type={person.is_following ? 'default' : 'dashed'}
                    style={{ borderRadius: 8 }}
                >
                    {person.is_following ? 'Following' : 'Follow'}
                </Button>
            </div>
        </Card>
    );
};

// ─── Pending Requests Panel ───────────────────────────────────────────────────
const PendingRequests = () => {
    const queryClient = useQueryClient();

    const { data: pending, isLoading } = useQuery({
        queryKey: ['pending-connections'],
        queryFn: async () => { const r = await api.get('/connections/pending'); return r.data.data; },
        refetchInterval: 15000,
    });

    const respondMut = useMutation({
        mutationFn: ({ id, action }) => api.post(`/connections/${id}/respond`, { action }),
        onSuccess: (_, { action }) => {
            antMsg.success(action === 'accept' ? 'Connection accepted!' : 'Request declined');
            queryClient.invalidateQueries(['pending-connections']);
            queryClient.invalidateQueries(['connections']);
        }
    });

    if (isLoading) return <Skeleton active />;
    if (!pending?.length) return (
        <Empty description="No pending requests" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map(req => (
                <Card key={req.id} size="small" style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <Space>
                            <Avatar size={40} src={req.requester?.profile_photo_url} style={{ background: '#0892d0' }}>
                                {req.requester?.first_name?.[0]}
                            </Avatar>
                            <div>
                                <Text strong>{req.requester?.first_name} {req.requester?.last_name}</Text>
                                <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                                    {req.type === 'mentor_student' ? '🎓 Mentor connection' : '👥 Peer connection'}
                                </Text>
                            </div>
                        </Space>
                        <Space>
                            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => respondMut.mutate({ id: req.id, action: 'accept' })} loading={respondMut.isPending} style={{ borderRadius: 8, background: '#52c41a', borderColor: '#52c41a' }}>
                                Accept
                            </Button>
                            <Button size="small" danger icon={<CloseOutlined />} onClick={() => respondMut.mutate({ id: req.id, action: 'reject' })} style={{ borderRadius: 8 }}>
                                Decline
                            </Button>
                        </Space>
                    </div>
                </Card>
            ))}
        </div>
    );
};

// ─── My Connections List ──────────────────────────────────────────────────────
const MyConnections = () => {
    const navigate = useNavigate();

    const { data: connections, isLoading } = useQuery({
        queryKey: ['connections'],
        queryFn: async () => { const r = await api.get('/connections'); return r.data.data; },
    });

    if (isLoading) return <Skeleton active />;
    if (!connections?.length) return <Empty description="No connections yet. Start discovering people!" image={Empty.PRESENTED_IMAGE_SIMPLE} />;

    return (
        <Row gutter={[16, 16]}>
            {connections.map(c => (
                <Col xs={24} sm={12} lg={8} key={c.connection_id}>
                    <Card hoverable style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
                        styles={{ body: { padding: '16px' } }}>
                        <Space>
                            <Avatar size={44} src={c.user?.profile_photo_url} style={{ background: 'linear-gradient(135deg,#0892d0,#000080)' }}>
                                {c.user?.first_name?.[0]}
                            </Avatar>
                            <div>
                                <Text strong style={{ display: 'block' }}>{c.user?.first_name} {c.user?.last_name}</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>{c.type === 'mentor_student' ? '🎓 Mentor' : '👥 Peer'}</Text>
                            </div>
                        </Space>
                        <Button size="small" icon={<MessageOutlined />} block style={{ marginTop: 12, borderRadius: 8 }} onClick={() => navigate('/chat')}>
                            {c.unread > 0 ? <Badge count={c.unread} offset={[6, 0]}><span>Message</span></Badge> : 'Message'}
                        </Button>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

// ─── Main Network Page ────────────────────────────────────────────────────────
const Network = () => {
    const { user: me } = useAuth();

    const { data: discover, isLoading } = useQuery({
        queryKey: ['discover'],
        queryFn: async () => { const r = await api.get('/network/discover'); return r.data.data; },
    });

    const { data: pendingCount } = useQuery({
        queryKey: ['pending-connections'],
        queryFn: async () => { const r = await api.get('/connections/pending'); return r.data.data; },
        refetchInterval: 15000,
        select: d => d?.length || 0,
    });

    const tabItems = [
        {
            key: 'discover',
            label: '🔍 Discover',
            children: (
                <div style={{ marginTop: 16 }}>
                    {isLoading ? (
                        <Row gutter={[16, 16]}>{[1,2,3,4,5,6].map(i => <Col xs={24} sm={12} lg={8} key={i}><Card style={{ borderRadius: 16 }}><Skeleton avatar active /></Card></Col>)}</Row>
                    ) : (
                        <>
                            {discover?.recommended_mentors?.length > 0 && (
                                <>
                                    <Divider orientation="left"><Tag color="gold">🎓 Recommended Mentors</Tag></Divider>
                                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                                        {discover.recommended_mentors.map(p => (
                                            <Col xs={24} sm={12} lg={8} key={p.id}>
                                                <PersonCard person={p} me={me} />
                                            </Col>
                                        ))}
                                    </Row>
                                </>
                            )}
                            {discover?.recommended_peers?.length > 0 && (
                                <>
                                    <Divider orientation="left"><Tag color="blue">👥 Peer Students</Tag></Divider>
                                    <Row gutter={[16, 16]}>
                                        {discover.recommended_peers.map(p => (
                                            <Col xs={24} sm={12} lg={8} key={p.id}>
                                                <PersonCard person={p} me={me} />
                                            </Col>
                                        ))}
                                    </Row>
                                </>
                            )}
                            {!discover?.recommended_mentors?.length && !discover?.recommended_peers?.length && (
                                <Card style={{ borderRadius: 16, border: 'none', textAlign: 'center', padding: '48px 0' }}>
                                    <Empty description={
                                        <div>
                                            <Title level={4}>Add talents to your profile to get recommendations!</Title>
                                            <Text type="secondary">We match you with mentors and peers who share your interests.</Text>
                                        </div>
                                    } />
                                </Card>
                            )}
                        </>
                    )}
                </div>
            )
        },
        {
            key: 'connections',
            label: '🤝 My Connections',
            children: <div style={{ marginTop: 16 }}><MyConnections /></div>
        },
        {
            key: 'pending',
            label: (
                <span>
                    📬 Requests
                    {pendingCount > 0 && <Badge count={pendingCount} style={{ marginLeft: 6 }} />}
                </span>
            ),
            children: <div style={{ marginTop: 16 }}><PendingRequests /></div>
        }
    ];

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 28 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
                    <TeamOutlined style={{ color: '#0892d0', marginRight: 10 }} />
                    My Network
                </Title>
                <Text type="secondary">
                    Discover mentors and peers matched to your talent profile. Connect, follow, and grow together.
                </Text>
            </div>
            <Tabs defaultActiveKey="discover" size="large" items={tabItems} />
        </div>
    );
};

export default Network;
