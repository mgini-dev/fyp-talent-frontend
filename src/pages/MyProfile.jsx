import React, { useState, useRef } from 'react';
import {
    Card, Typography, List, Button, Tag, Space, Form, Select, Input,
    message as antMsg, Skeleton, Row, Col, Avatar, Tabs, Divider,
    Upload, Progress
} from 'antd';
import {
    UserOutlined, PlusOutlined, DeleteOutlined, CheckCircleOutlined,
    LinkOutlined, CameraOutlined, LockOutlined, SaveOutlined, EditOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { Title, Text } = Typography;
const { Option } = Select;

const getProficiencyColor = (level) => {
    if (level === 'Expert') return 'green';
    if (level === 'Intermediate') return 'blue';
    return 'orange';
};

// ─── Profile Photo Section ────────────────────────────────────────────────────
const PhotoSection = ({ userData }) => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);

    const uploadMut = useMutation({
        mutationFn: async (file) => {
            const formData = new FormData();
            formData.append('photo', file);
            const r = await api.post('/profile/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return r.data;
        },
        onSuccess: (data) => {
            antMsg.success('Profile photo updated!');
            queryClient.invalidateQueries(['me']);
        },
        onError: (err) => antMsg.error(err.response?.data?.message || 'Upload failed')
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) { antMsg.error('File too large — max 3MB'); return; }
        uploadMut.mutate(file);
    };

    return (
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                    size={120}
                    src={userData?.profile_photo_url}
                    icon={<UserOutlined />}
                    style={{ background: 'linear-gradient(135deg,#0892d0,#000080)', fontSize: 48, boxShadow: '0 8px 24px rgba(8,146,208,0.3)' }}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMut.isPending}
                    style={{
                        position: 'absolute', bottom: 4, right: 4,
                        width: 34, height: 34, borderRadius: '50%',
                        background: '#0892d0', border: '2px solid #fff',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)', transition: 'all 0.2s',
                    }}
                >
                    <CameraOutlined style={{ color: '#fff', fontSize: 14 }} />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
            </div>
            {uploadMut.isPending && <Progress percent={70} status="active" showInfo={false} style={{ maxWidth: 140, margin: '8px auto 0' }} />}
            <Title level={3} style={{ margin: '16px 0 4px' }}>{userData?.first_name} {userData?.last_name}</Title>
            <Text type="secondary">{userData?.email}</Text>
            <div style={{ marginTop: 10 }}>
                {userData?.roles?.map(r => <Tag key={r.id} color="blue" style={{ borderRadius: 10 }}>{r.name}</Tag>)}
            </div>
        </div>
    );
};

// ─── Edit Profile Form ────────────────────────────────────────────────────────
const EditProfileForm = ({ userData }) => {
    const queryClient = useQueryClient();
    const [form] = Form.useForm();

    const updateMut = useMutation({
        mutationFn: (v) => api.put('/profile', v),
        onSuccess: () => { antMsg.success('Profile updated!'); queryClient.invalidateQueries(['me']); },
        onError: (e) => antMsg.error(e.response?.data?.message || 'Failed to update')
    });

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={{ first_name: userData?.first_name, last_name: userData?.last_name, phone: userData?.phone, bio: userData?.bio }}
            onFinish={updateMut.mutate}
            size="large"
        >
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
                        <Input prefix={<UserOutlined />} style={{ borderRadius: 8 }} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
                        <Input prefix={<UserOutlined />} style={{ borderRadius: 8 }} />
                    </Form.Item>
                </Col>
            </Row>
            <Form.Item name="phone" label="Phone Number">
                <Input placeholder="+255 ..." style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item name="bio" label="Professional Bio">
                <Input.TextArea rows={4} placeholder="Tell mentors and peers about yourself..." style={{ borderRadius: 8 }} maxLength={1000} showCount />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updateMut.isPending} style={{ borderRadius: 8, background: '#0892d0', width: '100%' }}>
                Save Changes
            </Button>
        </Form>
    );
};

// ─── Change Password Form ─────────────────────────────────────────────────────
const ChangePasswordForm = () => {
    const [form] = Form.useForm();

    const changeMut = useMutation({
        mutationFn: (v) => api.post('/profile/change-password', v),
        onSuccess: () => { antMsg.success('Password changed successfully!'); form.resetFields(); },
        onError: (e) => antMsg.error(e.response?.data?.message || 'Failed to change password')
    });

    return (
        <Form form={form} layout="vertical" onFinish={changeMut.mutate} size="large">
            <Form.Item name="current_password" label="Current Password" rules={[{ required: true }]}>
                <Input.Password prefix={<LockOutlined />} style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item name="password" label="New Password" rules={[{ required: true }, { min: 8, message: 'Minimum 8 characters' }]}>
                <Input.Password prefix={<LockOutlined />} style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item
                name="password_confirmation"
                label="Confirm New Password"
                dependencies={['password']}
                rules={[
                    { required: true },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) return Promise.resolve();
                            return Promise.reject(new Error('Passwords do not match!'));
                        }
                    })
                ]}
            >
                <Input.Password prefix={<LockOutlined />} style={{ borderRadius: 8 }} />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<LockOutlined />} loading={changeMut.isPending} style={{ borderRadius: 8, background: '#0892d0', width: '100%' }}>
                Change Password
            </Button>
        </Form>
    );
};

// ─── Main Profile Page ────────────────────────────────────────────────────────
const MyProfile = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();
    const [isAdding, setIsAdding] = useState(false);

    const { data: userData, isLoading } = useQuery({
        queryKey: ['me'],
        queryFn: async () => { const r = await api.get('/me'); return r.data.user; }
    });

    const { data: talentsData } = useQuery({
        queryKey: ['talents'],
        queryFn: async () => { const r = await api.get('/talents'); return r.data.data; }
    });

    const addTalentMut = useMutation({
        mutationFn: (v) => api.post('/talents/attach', v),
        onSuccess: () => { antMsg.success('Talent added!'); queryClient.invalidateQueries(['me']); setIsAdding(false); form.resetFields(); },
        onError: (e) => antMsg.error(e.response?.data?.message || 'Failed')
    });

    const removeTalentMut = useMutation({
        mutationFn: (id) => api.delete(`/talents/${id}`),
        onSuccess: () => { antMsg.success('Talent removed!'); queryClient.invalidateQueries(['me']); },
    });

    if (isLoading) return <div style={{ padding: 24 }}><Skeleton active avatar paragraph={{ rows: 8 }} /></div>;

    const myTalents = userData?.talents || [];

    const tabItems = [
        {
            key: 'edit',
            label: <span><EditOutlined /> Edit Profile</span>,
            children: <div style={{ padding: '16px 0' }}><EditProfileForm userData={userData} /></div>
        },
        {
            key: 'password',
            label: <span><LockOutlined /> Security</span>,
            children: <div style={{ padding: '16px 0' }}><ChangePasswordForm /></div>
        },
        {
            key: 'talents',
            label: <span><CheckCircleOutlined /> My Talents</span>,
            children: (
                <div style={{ padding: '16px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                        <Button icon={<PlusOutlined />} onClick={() => setIsAdding(!isAdding)} type={isAdding ? 'default' : 'primary'} style={{ borderRadius: 8, background: isAdding ? undefined : '#0892d0' }}>
                            {isAdding ? 'Cancel' : 'Add Talent'}
                        </Button>
                    </div>
                    {isAdding && (
                        <Card style={{ marginBottom: 20, background: '#f8fafc', borderRadius: 12, border: '1px dashed #b8d4f0' }}>
                            <Form form={form} layout="vertical" onFinish={addTalentMut.mutate}>
                                <Row gutter={16}>
                                    <Col xs={24} md={8}>
                                        <Form.Item name="talent_id" label="Talent" rules={[{ required: true }]}>
                                            <Select placeholder="Choose a talent" dropdownStyle={{ borderRadius: 8 }}>
                                                {talentsData?.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item name="proficiency" label="Proficiency" rules={[{ required: true }]}>
                                            <Select placeholder="Level" dropdownStyle={{ borderRadius: 8 }}>
                                                <Option value="Beginner">Beginner</Option>
                                                <Option value="Intermediate">Intermediate</Option>
                                                <Option value="Expert">Expert</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item name="portfolio_url" label="Portfolio URL" rules={[{ type: 'url' }]}>
                                            <Input placeholder="https://github.com/..." prefix={<LinkOutlined />} style={{ borderRadius: 8 }} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={addTalentMut.isPending} style={{ borderRadius: 8, background: '#0892d0' }}>Save Talent</Button>
                            </Form>
                        </Card>
                    )}
                    <List
                        dataSource={myTalents}
                        locale={{ emptyText: 'No talents added yet. Add skills to get matched with mentors!' }}
                        renderItem={item => (
                            <List.Item actions={[
                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeTalentMut.mutate(item.id)} loading={removeTalentMut.isPending} />
                            ]}>
                                <List.Item.Meta
                                    avatar={<Avatar style={{ background: '#e6f7ff', color: '#0892d0' }} icon={<CheckCircleOutlined />} />}
                                    title={
                                        <Space>
                                            <Text strong>{item.name}</Text>
                                            <Tag color={getProficiencyColor(item.pivot?.proficiency)}>{item.pivot?.proficiency}</Tag>
                                        </Space>
                                    }
                                    description={
                                        <Space direction="vertical" size={2}>
                                            <Text type="secondary">{item.category}</Text>
                                            {item.pivot?.portfolio_url && (
                                                <a href={item.pivot.portfolio_url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                                                    <LinkOutlined /> View Portfolio
                                                </a>
                                            )}
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </div>
            )
        }
    ];

    return (
        <div style={{ padding: '24px', maxWidth: 960, margin: '0 auto' }}>
            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Card style={{ borderRadius: 20, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
                        <PhotoSection userData={userData} />
                        <Divider />
                        <div>
                            <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Bio</Text>
                            <Text style={{ display: 'block', marginTop: 6, fontSize: 14, lineHeight: 1.7, color: '#595959' }}>
                                {userData?.bio || 'No bio yet.'}
                            </Text>
                        </div>
                        {userData?.phone && (
                            <>
                                <Divider />
                                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Phone</Text>
                                <Text style={{ display: 'block', marginTop: 4 }}>{userData.phone}</Text>
                            </>
                        )}
                    </Card>
                </Col>
                <Col xs={24} md={16}>
                    <Card style={{ borderRadius: 20, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
                        <Tabs defaultActiveKey="edit" items={tabItems} size="large" />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default MyProfile;
