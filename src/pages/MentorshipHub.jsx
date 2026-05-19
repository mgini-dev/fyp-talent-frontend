import React, { useState } from 'react';
import { 
    Card, Typography, List, Button, Tag, Space, Form, Input, 
    Modal, message, Skeleton, Row, Col, Avatar, Tabs, Divider, 
    Empty, Popconfirm, Tooltip 
} from 'antd';
import { 
    UserOutlined, 
    TeamOutlined, 
    SendOutlined, 
    MessageOutlined, 
    CheckOutlined, 
    CloseOutlined, 
    SafetyCertificateOutlined,
    CalendarOutlined,
    BookOutlined,
    BulbOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const MentorshipHub = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMentor, setSelectedMentor] = useState(null);

    // Fetch my mentorship relationships & requests
    const { data: myMentorships, isLoading: isMentorshipsLoading } = useQuery({
        queryKey: ['mentorships'],
        queryFn: async () => {
            const res = await api.get('/mentorships/me');
            return res.data.data;
        }
    });

    // Fetch available mentors (for students/non-mentor roles)
    const { data: mentors, isLoading: isMentorsLoading } = useQuery({
        queryKey: ['mentors'],
        queryFn: async () => {
            const res = await api.get('/mentors');
            return res.data.data;
        },
        enabled: !user?.roles?.some(r => r.name === 'Mentor') // Exclude if already mentor
    });

    const requestMutation = useMutation({
        mutationFn: async (values) => {
            const res = await api.post('/mentorships/request', values);
            return res.data;
        },
        onSuccess: () => {
            message.success('Mentorship request sent successfully!');
            queryClient.invalidateQueries(['mentorships']);
            setIsModalOpen(false);
            form.resetFields();
        },
        onError: (err) => {
            message.error(err.response?.data?.message || 'Failed to send request');
        }
    });

    const respondMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            const res = await api.post(`/mentorships/${id}/respond`, { status });
            return res.data;
        },
        onSuccess: (_, variables) => {
            message.success(variables.status === 'active' ? 'Mentorship request accepted!' : 'Mentorship request declined');
            queryClient.invalidateQueries(['mentorships']);
        },
        onError: () => message.error('Failed to update status')
    });

    const handleRequest = (mentor) => {
        setSelectedMentor(mentor);
        form.setFieldsValue({ mentor_id: mentor.id });
        setIsModalOpen(true);
    };

    const onFinish = (values) => {
        requestMutation.mutate(values);
    };

    if (isMentorshipsLoading || isMentorsLoading) return (
        <div style={{ padding: 24 }}>
            <Skeleton active paragraph={{ rows: 12 }} />
        </div>
    );

    const isMentor = user?.roles?.some(r => r.name === 'Mentor' || r.name === 'Admin');

    const activeMentees = myMentorships?.as_mentor?.filter(m => m.status === 'active') || [];
    const activeMentors = myMentorships?.as_mentee?.filter(m => m.status === 'active') || [];
    
    const pendingMentees = myMentorships?.as_mentor?.filter(m => m.status === 'pending') || [];
    const pendingMentors = myMentorships?.as_mentee?.filter(m => m.status === 'pending') || [];

    // Renders active relationships (Students see mentors, Mentors see students)
    const renderActiveCircles = () => {
        const listData = isMentor ? activeMentees : activeMentors;
        
        return (
            <Row gutter={[20, 20]}>
                {listData.length === 0 ? (
                    <Col span={24}>
                        <Card style={{ borderRadius: 16, border: 'none', padding: '40px 0', textAlign: 'center' }}>
                            <Empty description={<Text type="secondary">No active mentorship connections.</Text>} />
                        </Card>
                    </Col>
                ) : (
                    listData.map(item => {
                        const targetUser = isMentor ? item.mentee : item.mentor;
                        return (
                            <Col xs={24} md={12} key={item.id}>
                                <Card 
                                    style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}
                                    styles={{ body: { padding: 20 } }}
                                >
                                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                        <Avatar 
                                            size={54} 
                                            src={targetUser?.profile_photo_url} 
                                            style={{ backgroundColor: '#e6f7ff', color: '#0892d0', flexShrink: 0 }}
                                            icon={<UserOutlined />} 
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text strong style={{ fontSize: 16 }}>{targetUser?.first_name} {targetUser?.last_name}</Text>
                                                <Tag color="green" style={{ borderRadius: 8 }}>Active</Tag>
                                            </div>
                                            <Text type="secondary" ellipsis={{ rows: 2 }} style={{ display: 'block', fontSize: 13, margin: '4px 0 8px' }}>
                                                {targetUser?.bio || (isMentor ? 'Student Mentee' : 'Professional Mentor')}
                                            </Text>
                                            
                                            {item.goals && (
                                                <div style={{ background: '#f9f9f9', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>
                                                    <Text strong style={{ fontSize: 11, color: '#8c8c8c', display: 'block', textTransform: 'uppercase' }}>Goals</Text>
                                                    <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 12, margin: 0, color: '#434343' }}>
                                                        {item.goals}
                                                    </Paragraph>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                                <Space style={{ fontSize: 12, color: '#8c8c8c' }}>
                                                    <CalendarOutlined />
                                                    <span>Started: {item.start_date ? new Date(item.start_date).toLocaleDateString() : 'N/A'}</span>
                                                </Space>
                                                <Button 
                                                    type="primary" 
                                                    size="small" 
                                                    icon={<MessageOutlined />} 
                                                    onClick={() => navigate('/chat')}
                                                    style={{ borderRadius: 8, background: '#0892d0' }}
                                                >
                                                    Chat
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        );
                    })
                )}
            </Row>
        );
    };

    // Renders incoming requests (for Mentors) and outgoing requests (for Students)
    const renderRequestsConsole = () => {
        return (
            <Row gutter={[24, 24]}>
                {isMentor && (
                    <Col xs={24} lg={12}>
                        <Card 
                            title={<Space><BulbOutlined style={{ color: '#faad14' }} /><span>Incoming Mentorship Requests</span></Space>}
                            style={{ borderRadius: 16, border: 'none', height: '100%', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}
                        >
                            <List
                                itemLayout="horizontal"
                                dataSource={pendingMentees}
                                locale={{ emptyText: "No pending requests from mentees." }}
                                renderItem={item => (
                                    <List.Item
                                        style={{ padding: '16px 0' }}
                                        actions={[
                                            <Space key="actions">
                                                <Popconfirm
                                                    title="Accept Request"
                                                    description="Do you want to accept this mentee?"
                                                    onConfirm={() => respondMutation.mutate({ id: item.id, status: 'active' })}
                                                    okText="Yes"
                                                    cancelText="No"
                                                >
                                                    <Button type="primary" size="small" icon={<CheckOutlined />} style={{ borderRadius: 8, background: '#52c41a', borderColor: '#52c41a' }}>
                                                        Accept
                                                    </Button>
                                                </Popconfirm>
                                                <Popconfirm
                                                    title="Reject Request"
                                                    description="Decline mentorship request?"
                                                    onConfirm={() => respondMutation.mutate({ id: item.id, status: 'rejected' })}
                                                    okText="Yes"
                                                    cancelText="No"
                                                >
                                                    <Button danger size="small" icon={<CloseOutlined />} style={{ borderRadius: 8 }}>
                                                        Decline
                                                    </Button>
                                                </Popconfirm>
                                            </Space>
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={<Avatar src={item.mentee?.profile_photo_url} icon={<UserOutlined />} />}
                                            title={<Text strong>{item.mentee?.first_name} {item.mentee?.last_name}</Text>}
                                            description={
                                                <div>
                                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{item.mentee?.bio || 'Student'}</Text>
                                                    <div style={{ background: '#f5f5f5', padding: '6px 10px', borderRadius: 6, fontSize: 12, color: '#595959' }}>
                                                        <strong>Goals:</strong> {item.goals}
                                                    </div>
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>
                )}

                <Col xs={24} lg={isMentor ? 12 : 24}>
                    <Card 
                        title={<Space><SendOutlined style={{ color: '#0892d0' }} /><span>Sent Requests (Pending Response)</span></Space>}
                        style={{ borderRadius: 16, border: 'none', height: '100%', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}
                    >
                        <List
                            itemLayout="horizontal"
                            dataSource={pendingMentors}
                            locale={{ emptyText: "No outgoing requests." }}
                            renderItem={item => (
                                <List.Item style={{ padding: '16px 0' }}>
                                    <List.Item.Meta
                                        avatar={<Avatar src={item.mentor?.profile_photo_url} icon={<UserOutlined />} />}
                                        title={
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text strong>{item.mentor?.first_name} {item.mentor?.last_name}</Text>
                                                <Tag color="orange" style={{ borderRadius: 8 }}>Pending Review</Tag>
                                            </div>
                                        }
                                        description={
                                            <div>
                                                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{item.mentor?.bio || 'Mentor'}</Text>
                                                <div style={{ background: '#f5f5f5', padding: '6px 10px', borderRadius: 6, fontSize: 12, color: '#595959' }}>
                                                    <strong>My Goals:</strong> {item.goals}
                                                </div>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>
        );
    };

    // Renders explore mentors tab (only visible for students)
    const renderExploreMentors = () => {
        return (
            <Row gutter={[20, 20]}>
                {!mentors || mentors.length === 0 ? (
                    <Col span={24}>
                        <Card style={{ borderRadius: 16, border: 'none', padding: '40px 0', textAlign: 'center' }}>
                            <Empty description={<Text type="secondary">No mentors available at this time.</Text>} />
                        </Card>
                    </Col>
                ) : (
                    mentors.map(mentor => (
                        <Col xs={24} md={12} lg={8} key={mentor.id}>
                            <Card 
                                hoverable
                                style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', height: '100%', display: 'flex', flexDirection: 'column' }}
                                styles={{ body: { padding: 20, flex: 1, display: 'flex', flexDirection: 'column' } }}
                            >
                                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                                    <Avatar 
                                        size={48} 
                                        src={mentor.profile_photo_url} 
                                        style={{ backgroundColor: '#fffbe6', color: '#faad14', border: '1px solid #ffe58f' }}
                                        icon={<SafetyCertificateOutlined />} 
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <Text strong style={{ fontSize: 15, display: 'block' }}>{mentor.first_name} {mentor.last_name}</Text>
                                        <Text type="secondary" ellipsis style={{ fontSize: 12, display: 'block' }}>{mentor.bio || 'Professional Mentor'}</Text>
                                    </div>
                                </div>

                                <div style={{ flex: 1, marginBottom: 16 }}>
                                    <Text strong style={{ fontSize: 11, textTransform: 'uppercase', color: '#8c8c8c', display: 'block', marginBottom: 6 }}>
                                        Expertise Areas
                                    </Text>
                                    <Space size={[0, 4]} wrap>
                                        {mentor.talents && mentor.talents.length > 0 ? (
                                            mentor.talents.map(t => (
                                                <Tag color="orange" key={t.id} style={{ borderRadius: 8, fontSize: 11 }}>
                                                    {t.name}
                                                </Tag>
                                            ))
                                        ) : (
                                            <Text type="secondary" style={{ fontSize: 12 }}>General Mentorship</Text>
                                        )}
                                    </Space>
                                </div>

                                <Button 
                                    type="primary" 
                                    icon={<SendOutlined />} 
                                    block 
                                    onClick={() => handleRequest(mentor)}
                                    style={{ borderRadius: 10, background: '#0892d0', marginTop: 'auto' }}
                                >
                                    Request Mentorship
                                </Button>
                            </Card>
                        </Col>
                    ))
                )}
            </Row>
        );
    };

    const tabItems = [
        {
            key: 'active',
            label: <Space><TeamOutlined /><span>Active Circles</span></Space>,
            children: <div style={{ marginTop: 16 }}>{renderActiveCircles()}</div>
        },
        {
            key: 'requests',
            label: <Space><BulbOutlined /><span>Requests Console</span></Space>,
            children: <div style={{ marginTop: 16 }}>{renderRequestsConsole()}</div>
        }
    ];

    if (!isMentor) {
        tabItems.push({
            key: 'explore',
            label: <Space><SafetyCertificateOutlined /><span>Find a Mentor</span></Space>,
            children: <div style={{ marginTop: 16 }}>{renderExploreMentors()}</div>
        });
    }

    return (
        <div style={{ padding: '24px', maxWidth: 1300, margin: '0 auto' }}>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Mentorship Hub</Title>
                <Text type="secondary">
                    {isMentor 
                        ? 'Govern your learning circles, respond to student proposals, and guide them in their talent growth.'
                        : 'Connect with expert mentors, seek feedback on projects, and manage your learning milestones.'
                    }
                </Text>
            </div>

            <Tabs defaultActiveKey="active" size="large" items={tabItems} />

            <Modal
                title={`Request Mentorship from ${selectedMentor?.first_name}`}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                style={{ borderRadius: 16 }}
            >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, background: '#fafafa', padding: 12, borderRadius: 12 }}>
                    <Avatar src={selectedMentor?.profile_photo_url} icon={<UserOutlined />} />
                    <div>
                        <Text strong style={{ display: 'block' }}>{selectedMentor?.first_name} {selectedMentor?.last_name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{selectedMentor?.bio || 'Mentor'}</Text>
                    </div>
                </div>

                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="mentor_id" hidden>
                        <Input />
                    </Form.Item>
                    <Form.Item 
                        name="goals" 
                        label="What are your goals or expectations for this mentorship?" 
                        rules={[{ required: true, message: 'Please describe your expectations or objectives' }]}
                    >
                        <TextArea rows={4} placeholder="E.g., I want help learning React, building my portfolio project, and seeking internships." style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button type="primary" htmlType="submit" loading={requestMutation.isPending} block style={{ borderRadius: 10, background: '#0892d0' }}>
                            Send Request
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default MentorshipHub;
