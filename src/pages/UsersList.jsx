import React, { useState, useMemo } from 'react';
import {
    Card, Table, Typography, Tag, Space, Button, Select, message, Popconfirm,
    Avatar, Modal, Form, Input, Row, Col, Drawer, Descriptions, Divider, Badge, Tooltip
} from 'antd';
import {
    UserOutlined, StopOutlined, CheckCircleOutlined, UserAddOutlined, SaveOutlined,
    SearchOutlined, FilterOutlined, EditOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

const { Title, Text } = Typography;
const { Option } = Select;

const roleColor = (name) => {
    const map = { Admin: 'red', Mentor: 'blue', Student: 'green' };
    return map[name] || 'default';
};

const UsersList = () => {
    const queryClient = useQueryClient();

    // ── UI state ──────────────────────────────────────────────────────────────
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [drawerUser, setDrawerUser] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [form] = Form.useForm();

    // ── data fetching ─────────────────────────────────────────────────────────
    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => { const r = await api.get('/users'); return r.data.data; }
    });

    const { data: roles } = useQuery({
        queryKey: ['roles'],
        queryFn: async () => { const r = await api.get('/roles'); return r.data.data; }
    });

    // ── client-side filtering ────────────────────────────────────────────────
    const filteredUsers = useMemo(() => {
        return (users || []).filter(u => {
            const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
            const matchSearch = !searchText ||
                fullName.includes(searchText.toLowerCase()) ||
                u.email.toLowerCase().includes(searchText.toLowerCase());
            const matchRole = roleFilter === 'All' || u.roles?.[0]?.name === roleFilter;
            const matchStatus = statusFilter === 'All' || u.status === statusFilter;
            return matchSearch && matchRole && matchStatus;
        });
    }, [users, searchText, roleFilter, statusFilter]);

    // ── mutations ─────────────────────────────────────────────────────────────
    const updateStatusMut = useMutation({
        mutationFn: ({ id, status }) => api.put(`/users/${id}/status`, { status }),
        onSuccess: () => { message.success('Status updated!'); queryClient.invalidateQueries(['users']); },
        onError: (e) => message.error(e.response?.data?.message || 'Failed')
    });

    const assignRoleMut = useMutation({
        mutationFn: ({ id, role_id }) => api.put(`/users/${id}/role`, { role_id }),
        onSuccess: () => { message.success('Role updated!'); queryClient.invalidateQueries(['users']); },
        onError: (e) => message.error(e.response?.data?.message || 'Failed')
    });

    const createUserMut = useMutation({
        mutationFn: (values) => api.post('/users', values),
        onSuccess: () => {
            message.success('User registered successfully!');
            queryClient.invalidateQueries(['users']);
            setIsCreateModalOpen(false);
            form.resetFields();
        },
        onError: (e) => message.error(e.response?.data?.message || 'Registration failed')
    });

    // ── table columns ─────────────────────────────────────────────────────────
    const columns = [
        {
            title: 'User',
            key: 'user',
            render: (_, u) => (
                <Space>
                    <Avatar size={40} src={u.profile_photo_url} icon={<UserOutlined />}
                        style={{ background: 'linear-gradient(135deg,#0892d0,#000080)', flexShrink: 0 }} />
                    <div>
                        <Text strong style={{ display: 'block', lineHeight: 1.4 }}>{u.first_name} {u.last_name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{u.email}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Role',
            key: 'role',
            width: 130,
            render: (_, u) => {
                const currentRole = u.roles?.[0];
                return currentRole
                    ? <Tag color={roleColor(currentRole.name)} style={{ padding: '3px 10px', fontWeight: 600, borderRadius: 20 }}>{currentRole.name}</Tag>
                    : <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>No role</Text>;
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: (status) => (
                <Badge
                    status={status === 'active' ? 'success' : 'error'}
                    text={<Text style={{ fontSize: 13, fontWeight: 500 }}>{status ? status.charAt(0).toUpperCase() + status.slice(1) : '—'}</Text>}
                />
            )
        },
        {
            title: 'Talents',
            key: 'talents',
            render: (_, u) => (
                <Space wrap size={[4, 4]}>
                    {u.talents?.slice(0, 2).map(t => <Tag key={t.id} color="purple">{t.name}</Tag>)}
                    {(u.talents?.length || 0) > 2 && <Tag>+{u.talents.length - 2}</Tag>}
                    {(!u.talents || u.talents.length === 0) && <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>None</Text>}
                </Space>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 190,
            render: (_, u) => (
                <Space>
                    <Tooltip title="Edit User">
                        <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => setDrawerUser(u)}>Edit</Button>
                    </Tooltip>
                    {u.status === 'active' ? (
                        <Popconfirm title="Suspend this user?" onConfirm={() => updateStatusMut.mutate({ id: u.id, status: 'suspended' })} okText="Yes" cancelText="No">
                            <Tooltip title="Suspend Account">
                                <Button size="small" danger icon={<StopOutlined />}>Suspend</Button>
                            </Tooltip>
                        </Popconfirm>
                    ) : (
                        <Popconfirm title="Activate this user?" onConfirm={() => updateStatusMut.mutate({ id: u.id, status: 'active' })} okText="Yes" cancelText="No">
                            <Tooltip title="Activate Account">
                                <Button size="small" icon={<CheckCircleOutlined />} style={{ color: '#52c41a', borderColor: '#52c41a' }}>Activate</Button>
                            </Tooltip>
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800 }}>User Management</Title>
                    <Text type="secondary">
                        Register, manage roles, and control access for all <strong>{users?.length || 0}</strong> system users.
                    </Text>
                </div>
                <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={() => setIsCreateModalOpen(true)}
                    style={{ borderRadius: 8, height: 40, background: '#0892d0', fontWeight: 600 }}
                >
                    Add User / Mentor
                </Button>
            </div>

            {/* ── Filters ────────────────────────────────────────────────── */}
            <Card style={{ borderRadius: 16, border: 'none', marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <Space wrap size="middle">
                    <Input
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Search by name or email..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 260, borderRadius: 8 }}
                        allowClear
                    />
                    <Select value={roleFilter} onChange={setRoleFilter} style={{ width: 160 }} prefix={<FilterOutlined />}>
                        <Option value="All">All Roles</Option>
                        {roles?.map(r => <Option key={r.id} value={r.name}>{r.name}</Option>)}
                    </Select>
                    <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 160 }}>
                        <Option value="All">All Statuses</Option>
                        <Option value="active">Active</Option>
                        <Option value="suspended">Suspended</Option>
                    </Select>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Showing <strong>{filteredUsers.length}</strong> of <strong>{users?.length || 0}</strong> users
                    </Text>
                </Space>
            </Card>

            {/* ── Table ──────────────────────────────────────────────────── */}
            <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} styles={{ body: { padding: 0 } }}>
                <Table
                    dataSource={filteredUsers}
                    columns={columns}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total ${t} users` }}
                />
            </Card>

            {/* ── Create User Modal ───────────────────────────────────────── */}
            <Modal
                title={<Space style={{ fontWeight: 700, fontSize: 18 }}><UserAddOutlined style={{ color: '#0892d0' }} /><span>Register User / Mentor</span></Space>}
                open={isCreateModalOpen}
                onCancel={() => { setIsCreateModalOpen(false); form.resetFields(); }}
                onOk={() => form.submit()}
                okText="Register User"
                confirmLoading={createUserMut.isPending}
                okButtonProps={{ icon: <SaveOutlined />, style: { borderRadius: 8, background: '#0892d0' } }}
                cancelButtonProps={{ style: { borderRadius: 8 } }}
                width={560}
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
                    Manually register a student, expert mentor, or admin. Account will be active immediately.
                </Text>
                <Form form={form} layout="vertical" onFinish={(v) => createUserMut.mutate(v)} size="large">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
                                <Input placeholder="John" style={{ borderRadius: 8 }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
                                <Input placeholder="Doe" style={{ borderRadius: 8 }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                        <Input placeholder="name@udom.ac.tz" style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item name="password" label="Initial Password" rules={[{ required: true }, { min: 8, message: 'Min 8 characters' }]}>
                        <Input.Password placeholder="••••••••" style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item name="role_id" label="System Role" rules={[{ required: true, message: 'Please assign a role!' }]}>
                        <Select placeholder="Select role..." dropdownStyle={{ borderRadius: 8 }}>
                            {roles?.map(r => (
                                <Option key={r.id} value={r.id}>
                                    <Space>
                                        <Tag color={roleColor(r.name)} style={{ margin: 0 }}>{r.name}</Tag>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{r.description}</Text>
                                    </Space>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="bio" label="Professional Bio">
                        <Input.TextArea rows={3} placeholder="Professional qualifications or brief summary..." style={{ borderRadius: 8 }} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* ── User Profile Drawer ──────────────────────────────────────── */}
            <Drawer
                title={
                    <Space>
                        <Avatar size={40} src={drawerUser?.profile_photo_url} icon={<UserOutlined />}
                            style={{ background: 'linear-gradient(135deg,#0892d0,#000080)' }} />
                        <div>
                            <Text strong style={{ display: 'block', fontSize: 16 }}>{drawerUser?.first_name} {drawerUser?.last_name}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>{drawerUser?.email}</Text>
                        </div>
                    </Space>
                }
                open={!!drawerUser}
                onClose={() => setDrawerUser(null)}
                width={440}
                extra={
                    <Tag color={drawerUser?.status === 'active' ? 'success' : 'error'} style={{ fontWeight: 600 }}>
                        {drawerUser?.status?.toUpperCase()}
                    </Tag>
                }
            >
                <Divider orientation="left" style={{ fontSize: 12, color: '#8c8c8c' }}>IDENTITY</Divider>
                <Descriptions column={1} size="small" styles={{ label: { fontWeight: 600, width: 120 } }}>
                    <Descriptions.Item label="Full Name">{drawerUser?.first_name} {drawerUser?.last_name}</Descriptions.Item>
                    <Descriptions.Item label="Email">{drawerUser?.email}</Descriptions.Item>
                    <Descriptions.Item label="Phone">{drawerUser?.phone || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Member Since">{drawerUser?.created_at ? new Date(drawerUser.created_at).toLocaleDateString() : '—'}</Descriptions.Item>
                </Descriptions>

                <Divider orientation="left" style={{ fontSize: 12, color: '#8c8c8c', marginTop: 24 }}>ROLE ASSIGNMENT</Divider>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Select
                        defaultValue={drawerUser?.roles?.[0]?.id}
                        key={drawerUser?.id}
                        style={{ flex: 1 }}
                        placeholder="Assign a role..."
                        loading={assignRoleMut.isPending}
                        onChange={(val) => assignRoleMut.mutate(
                            { id: drawerUser.id, role_id: val },
                            { onSuccess: () => setDrawerUser(prev => ({ ...prev, roles: roles?.filter(r => r.id === val) || [] })) }
                        )}
                        dropdownStyle={{ borderRadius: 8 }}
                    >
                        {roles?.map(r => (
                            <Option key={r.id} value={r.id}>
                                <Space>
                                    <Tag color={roleColor(r.name)} style={{ margin: 0 }}>{r.name}</Tag>
                                    <Text type="secondary" style={{ fontSize: 12 }}>{r.description}</Text>
                                </Space>
                            </Option>
                        ))}
                    </Select>
                </div>
                <Text type="secondary" style={{ fontSize: 11, marginTop: 6, display: 'block' }}>Changing the role takes effect immediately.</Text>

                {drawerUser?.bio && (
                    <>
                        <Divider orientation="left" style={{ fontSize: 12, color: '#8c8c8c', marginTop: 24 }}>BIO</Divider>
                        <Text type="secondary">{drawerUser.bio}</Text>
                    </>
                )}

                <Divider orientation="left" style={{ fontSize: 12, color: '#8c8c8c', marginTop: 24 }}>TALENTS</Divider>
                <Space wrap size={[6, 6]}>
                    {drawerUser?.talents?.map(t => <Tag key={t.id} color="purple">{t.name}</Tag>)}
                    {(!drawerUser?.talents || drawerUser.talents.length === 0) && <Text type="secondary" style={{ fontStyle: 'italic' }}>No talents registered yet.</Text>}
                </Space>

                <Divider style={{ marginTop: 32 }} />
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    {drawerUser?.status === 'active' ? (
                        <Popconfirm title="Suspend this user?" onConfirm={() => { updateStatusMut.mutate({ id: drawerUser.id, status: 'suspended' }); setDrawerUser(null); }} okText="Yes">
                            <Button danger icon={<StopOutlined />}>Suspend Account</Button>
                        </Popconfirm>
                    ) : (
                        <Popconfirm title="Activate this user?" onConfirm={() => { updateStatusMut.mutate({ id: drawerUser.id, status: 'active' }); setDrawerUser(null); }} okText="Yes">
                            <Button icon={<CheckCircleOutlined />} style={{ color: '#52c41a', borderColor: '#52c41a' }}>Activate Account</Button>
                        </Popconfirm>
                    )}
                </Space>
            </Drawer>
        </div>
    );
};

export default UsersList;
