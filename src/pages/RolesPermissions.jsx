import React, { useState } from 'react';
import {
    Card, Table, Typography, Tag, Space, Button, Modal, Form, Input, Select,
    Checkbox, Divider, message, Popconfirm, Tabs, Tooltip, Badge
} from 'antd';
import {
    EditOutlined, DeleteOutlined, PlusOutlined, SaveOutlined,
    SafetyCertificateOutlined, KeyOutlined, SettingOutlined, CheckOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

const { Title, Text } = Typography;
const { Option } = Select;

// ─── MODULE COLOR MAP ────────────────────────────────────────────────────────
const moduleColor = (mod) => {
    const map = { System: 'red', General: 'blue', Talent: 'green', Mentorship: 'orange' };
    return map[mod] || 'default';
};

// ═══════════════════════════════════════════════════════════════════════
//  TAB 1 — ROLES  (list + create/edit + assign permissions)
// ═══════════════════════════════════════════════════════════════════════
const RolesTab = ({ roles, permissions, rolesLoading, queryClient }) => {
    const [roleModal, setRoleModal] = useState(false);
    const [permModal, setPermModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [checkedPerms, setCheckedPerms] = useState([]);
    const [roleForm] = Form.useForm();

    // ── mutations ────────────────────────────────────────────────────────
    const createRoleMut = useMutation({
        mutationFn: (v) => api.post('/roles', v),
        onSuccess: () => { message.success('Role created!'); queryClient.invalidateQueries(['roles']); setRoleModal(false); roleForm.resetFields(); },
        onError: (e) => message.error(e.response?.data?.message || 'Failed')
    });

    const updateRoleMut = useMutation({
        mutationFn: ({ id, v }) => api.put(`/roles/${id}`, v),
        onSuccess: () => { message.success('Role updated!'); queryClient.invalidateQueries(['roles']); setRoleModal(false); setEditingRole(null); roleForm.resetFields(); },
        onError: (e) => message.error(e.response?.data?.message || 'Failed')
    });

    const deleteRoleMut = useMutation({
        mutationFn: (id) => api.delete(`/roles/${id}`),
        onSuccess: () => { message.success('Role deleted!'); queryClient.invalidateQueries(['roles']); },
        onError: (e) => message.error(e.response?.data?.message || 'Cannot delete this role')
    });

    const assignPermsMut = useMutation({
        mutationFn: ({ roleId, permissionIds }) => api.put(`/roles/${roleId}/permissions`, { permission_ids: permissionIds }),
        onSuccess: () => { message.success('Permissions updated!'); queryClient.invalidateQueries(['roles']); setPermModal(false); },
        onError: (e) => message.error(e.response?.data?.message || 'Failed')
    });

    // ── helpers ──────────────────────────────────────────────────────────
    const openCreate = () => { setEditingRole(null); roleForm.resetFields(); setRoleModal(true); };
    const openEdit = (r) => { setEditingRole(r); roleForm.setFieldsValue(r); setRoleModal(true); };
    const openPerms = (r) => { setSelectedRole(r); setCheckedPerms(r.permissions?.map(p => p.id) || []); setPermModal(true); };
    const handleRoleSubmit = (v) => editingRole ? updateRoleMut.mutate({ id: editingRole.id, v }) : createRoleMut.mutate(v);

    // Group permissions by module for the modal
    const grouped = permissions?.reduce((acc, p) => { (acc[p.module] = acc[p.module] || []).push(p); return acc; }, {}) || {};

    const columns = [
        {
            title: 'Role', key: 'role',
            render: (_, r) => (
                <Space>
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: r.name === 'Admin' ? 'linear-gradient(135deg,#ff4d4f,#cf1322)' : r.name === 'Mentor' ? 'linear-gradient(135deg,#1890ff,#096dd9)' : 'linear-gradient(135deg,#52c41a,#237804)',
                        color: '#fff', fontSize: 14, fontWeight: 700
                    }}>
                        {r.name?.[0]}
                    </div>
                    <div>
                        <Text strong style={{ display: 'block' }}>{r.display_name || r.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{r.description}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Permissions', key: 'perms',
            render: (_, r) => (
                <Space wrap size={[4, 4]}>
                    {r.permissions?.slice(0, 4).map(p => <Tag key={p.id} color={moduleColor(p.module)} style={{ borderRadius: 4 }}>{p.display_name || p.name}</Tag>)}
                    {(r.permissions?.length || 0) > 4 && <Tag color="default">+{r.permissions.length - 4} more</Tag>}
                    {(!r.permissions || r.permissions.length === 0) && <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>None assigned</Text>}
                </Space>
            )
        },
        {
            title: 'Users', key: 'users',
            render: (_, r) => <Badge count={r.users_count || '—'} showZero style={{ backgroundColor: '#0892d0' }} />
        },
        {
            title: 'Actions', key: 'actions', width: 220,
            render: (_, r) => (
                <Space>
                    <Tooltip title="Configure Permissions">
                        <Button type="primary" ghost size="small" icon={<KeyOutlined />} onClick={() => openPerms(r)}>Permissions</Button>
                    </Tooltip>
                    <Tooltip title="Edit Role">
                        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                    </Tooltip>
                    <Popconfirm title="Delete this role?" description="All assigned users will lose this role." onConfirm={() => deleteRoleMut.mutate(r.id)} okText="Yes" cancelText="No">
                        <Button size="small" danger icon={<DeleteOutlined />} disabled={r.name === 'Admin'} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>System Roles</Title>
                    <Text type="secondary">Create and manage access roles. The Admin role is protected.</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ borderRadius: 8, height: 40, background: '#0892d0', fontWeight: 600 }}>
                    New Role
                </Button>
            </div>

            <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} styles={{ body: { padding: 0 } }}>
                <Table dataSource={roles} columns={columns} rowKey="id" loading={rolesLoading} pagination={false} />
            </Card>

            {/* Role Create / Edit Modal */}
            <Modal
                title={<Space><SafetyCertificateOutlined style={{ color: '#0892d0' }} /><span>{editingRole ? 'Edit Role' : 'Create New Role'}</span></Space>}
                open={roleModal} onCancel={() => { setRoleModal(false); setEditingRole(null); roleForm.resetFields(); }}
                onOk={() => roleForm.submit()} okText={editingRole ? 'Save Changes' : 'Create Role'}
                confirmLoading={createRoleMut.isPending || updateRoleMut.isPending}
                okButtonProps={{ icon: <SaveOutlined />, style: { borderRadius: 8, background: '#0892d0' } }}
                cancelButtonProps={{ style: { borderRadius: 8 } }}
            >
                <Form form={roleForm} layout="vertical" onFinish={handleRoleSubmit} size="large" style={{ marginTop: 16 }}>
                    <Form.Item name="name" label="Role Key (e.g. Mentor)" rules={[{ required: true }]}>
                        <Input placeholder="Unique role identifier" style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item name="display_name" label="Display Name" rules={[{ required: true }]}>
                        <Input placeholder="Human-readable label" style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={2} placeholder="What does this role do?" style={{ borderRadius: 8 }} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Assign Permissions Modal */}
            <Modal
                title={<Space><KeyOutlined style={{ color: '#0892d0' }} /><span>Assign Permissions — {selectedRole?.name}</span></Space>}
                open={permModal} onCancel={() => setPermModal(false)}
                onOk={() => assignPermsMut.mutate({ roleId: selectedRole?.id, permissionIds: checkedPerms })}
                okText="Save Access Settings" confirmLoading={assignPermsMut.isPending}
                okButtonProps={{ icon: <SaveOutlined />, style: { borderRadius: 8, background: '#0892d0' } }}
                cancelButtonProps={{ style: { borderRadius: 8 } }}
                width={700}
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
                    Toggle the permissions for <strong>{selectedRole?.name}</strong>. Changes take effect for all active sessions.
                </Text>
                <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
                    {Object.keys(grouped).map(mod => (
                        <div key={mod} style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <Tag color={moduleColor(mod)} style={{ margin: 0, fontWeight: 600, letterSpacing: 0.5 }}>{mod}</Tag>
                                <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {grouped[mod].map(p => {
                                    const isChecked = checkedPerms.includes(p.id);
                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => setCheckedPerms(prev =>
                                                prev.includes(p.id) ? prev.filter(i => i !== p.id) : [...prev, p.id]
                                            )}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                padding: '12px 16px',
                                                borderRadius: 10,
                                                border: `1px solid ${isChecked ? '#91d5ff' : '#f0f0f0'}`,
                                                background: isChecked ? '#f0faff' : '#fafafa',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                userSelect: 'none',
                                            }}
                                        >
                                            <Checkbox
                                                checked={isChecked}
                                                onClick={e => e.stopPropagation()}
                                                onChange={() => setCheckedPerms(prev =>
                                                    prev.includes(p.id) ? prev.filter(i => i !== p.id) : [...prev, p.id]
                                                )}
                                                style={{ flexShrink: 0 }}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Text strong style={{ fontSize: 14, display: 'block', lineHeight: 1.4, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                                    {p.display_name}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 12, display: 'block', lineHeight: 1.3 }}>
                                                    {p.description || <Text code style={{ fontSize: 11 }}>{p.name}</Text>}
                                                </Text>
                                            </div>
                                            {isChecked && (
                                                <div style={{
                                                    flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                                                    background: '#0892d0', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <CheckOutlined style={{ color: '#fff', fontSize: 10 }} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>

        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════
//  TAB 2 — PERMISSIONS  (list + create/edit/delete)
// ═══════════════════════════════════════════════════════════════════════
const PermissionsTab = ({ permissions, permsLoading, queryClient }) => {
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form] = Form.useForm();

    const createMut = useMutation({
        mutationFn: (v) => api.post('/permissions', v),
        onSuccess: () => { message.success('Permission created!'); queryClient.invalidateQueries(['permissions']); setModal(false); form.resetFields(); },
        onError: (e) => message.error(e.response?.data?.message || 'Failed')
    });
    const updateMut = useMutation({
        mutationFn: ({ id, v }) => api.put(`/permissions/${id}`, v),
        onSuccess: () => { message.success('Permission updated!'); queryClient.invalidateQueries(['permissions']); setModal(false); setEditing(null); form.resetFields(); },
        onError: (e) => message.error(e.response?.data?.message || 'Failed')
    });
    const deleteMut = useMutation({
        mutationFn: (id) => api.delete(`/permissions/${id}`),
        onSuccess: () => { message.success('Permission deleted!'); queryClient.invalidateQueries(['permissions']); },
        onError: (e) => message.error(e.response?.data?.message || 'Failed')
    });

    const openCreate = () => { setEditing(null); form.resetFields(); setModal(true); };
    const openEdit = (p) => { setEditing(p); form.setFieldsValue(p); setModal(true); };
    const handleSubmit = (v) => editing ? updateMut.mutate({ id: editing.id, v }) : createMut.mutate(v);

    const columns = [
        { title: 'Permission Key', dataIndex: 'name', key: 'name', render: t => <Text code>{t}</Text> },
        { title: 'Display Name', dataIndex: 'display_name', key: 'display_name', render: t => <Text strong>{t}</Text> },
        { title: 'Module', dataIndex: 'module', key: 'module', render: m => <Tag color={moduleColor(m)} style={{ borderRadius: 4 }}>{m}</Tag> },
        {
            title: 'Description', dataIndex: 'description', key: 'description',
            render: t => <Text type="secondary">{t || '—'}</Text>
        },
        {
            title: 'Actions', key: 'actions', width: 140,
            render: (_, p) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(p)} />
                    <Popconfirm title="Delete this permission?" description="It will be removed from all roles." onConfirm={() => deleteMut.mutate(p.id)} okText="Yes" cancelText="No">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Permission Registry</Title>
                    <Text type="secondary">Define granular access permissions and group them by module.</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ borderRadius: 8, height: 40, background: '#0892d0', fontWeight: 600 }}>
                    New Permission
                </Button>
            </div>

            <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} styles={{ body: { padding: 0 } }}>
                <Table dataSource={permissions} columns={columns} rowKey="id" loading={permsLoading} pagination={{ pageSize: 10 }} />
            </Card>

            <Modal
                title={<Space><KeyOutlined style={{ color: '#0892d0' }} /><span>{editing ? 'Edit Permission' : 'Create Permission'}</span></Space>}
                open={modal} onCancel={() => { setModal(false); setEditing(null); form.resetFields(); }}
                onOk={() => form.submit()} okText={editing ? 'Save Changes' : 'Create Permission'}
                confirmLoading={createMut.isPending || updateMut.isPending}
                okButtonProps={{ icon: <SaveOutlined />, style: { borderRadius: 8, background: '#0892d0' } }}
                cancelButtonProps={{ style: { borderRadius: 8 } }}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} size="large" style={{ marginTop: 16 }}>
                    <Form.Item name="name" label="Permission Key (snake_case)" rules={[{ required: true, message: 'Required' }]}>
                        <Input placeholder="e.g. view_reports" style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item name="display_name" label="Display Name" rules={[{ required: true, message: 'Required' }]}>
                        <Input placeholder="e.g. View Reports" style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item name="module" label="Module Group" rules={[{ required: true, message: 'Required' }]}>
                        <Select placeholder="Select module..." dropdownStyle={{ borderRadius: 8 }}>
                            <Option value="System">System</Option>
                            <Option value="General">General</Option>
                            <Option value="Talent">Talent</Option>
                            <Option value="Mentorship">Mentorship</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={2} placeholder="What does this permission allow?" style={{ borderRadius: 8 }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════
const RolesPermissions = () => {
    const queryClient = useQueryClient();

    const { data: roles, isLoading: rolesLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: async () => { const r = await api.get('/roles'); return r.data.data; }
    });

    const { data: permissions, isLoading: permsLoading } = useQuery({
        queryKey: ['permissions'],
        queryFn: async () => { const r = await api.get('/permissions'); return r.data.data; }
    });

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Access Control Center</Title>
                <Text type="secondary">
                    Manage roles, define granular permissions, and configure exactly who can access what within UDOM Talent Hub.
                </Text>
            </div>

            <Tabs
                defaultActiveKey="roles"
                type="line"
                size="large"
                items={[
                    {
                        key: 'roles',
                        label: <span><SafetyCertificateOutlined /> Roles Management</span>,
                        children: <RolesTab roles={roles} permissions={permissions} rolesLoading={rolesLoading} queryClient={queryClient} />
                    },
                    {
                        key: 'permissions',
                        label: <span><KeyOutlined /> Permissions Registry</span>,
                        children: <PermissionsTab permissions={permissions} permsLoading={permsLoading} queryClient={queryClient} />
                    }
                ]}
            />
        </div>
    );
};

export default RolesPermissions;
