import React, { useState } from 'react';
import { Card, Table, Typography, Tag, Space, Button, Input, Select, Modal, Form, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, TagsOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

const { Title, Text } = Typography;
const { Option } = Select;

const LookupTalents = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTalent, setEditingTalent] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    const { data: talents, isLoading } = useQuery({
        queryKey: ['talents'],
        queryFn: async () => {
            const res = await api.get('/talents');
            return res.data.data;
        }
    });

    const createTalentMutation = useMutation({
        mutationFn: async (values) => {
            const res = await api.post('/talents/manage', values);
            return res.data;
        },
        onSuccess: () => {
            message.success('Talent lookup created successfully!');
            queryClient.invalidateQueries(['talents']);
            setIsModalOpen(false);
            form.resetFields();
        },
        onError: (err) => {
            message.error(err.response?.data?.message || 'Failed to create talent lookup');
        }
    });

    const updateTalentMutation = useMutation({
        mutationFn: async ({ id, values }) => {
            const res = await api.put(`/talents/manage/${id}`, values);
            return res.data;
        },
        onSuccess: () => {
            message.success('Talent lookup updated successfully!');
            queryClient.invalidateQueries(['talents']);
            setIsModalOpen(false);
            setEditingTalent(null);
            form.resetFields();
        },
        onError: (err) => {
            message.error(err.response?.data?.message || 'Failed to update talent lookup');
        }
    });

    const deleteTalentMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/talents/manage/${id}`);
            return res.data;
        },
        onSuccess: () => {
            message.success('Talent lookup deleted successfully!');
            queryClient.invalidateQueries(['talents']);
        },
        onError: (err) => {
            message.error(err.response?.data?.message || 'Failed to delete talent lookup');
        }
    });

    const handleAdd = () => {
        setEditingTalent(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (record) => {
        setEditingTalent(record);
        form.setFieldsValue(record);
        setIsModalOpen(true);
    };

    const handleSubmit = (values) => {
        if (editingTalent) {
            updateTalentMutation.mutate({ id: editingTalent.id, values });
        } else {
            createTalentMutation.mutate(values);
        }
    };

    const filteredTalents = talents?.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchText.toLowerCase()) ||
                              t.category.toLowerCase().includes(searchText.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
        return matchesSearch && matchesCategory;
    }) || [];

    const categories = ['All', ...new Set(talents?.map(t => t.category) || [])];

    const categoryColor = (cat) => {
        const map = { Technology: 'blue', Creative: 'orange', Business: 'gold', Engineering: 'cyan', Arts: 'purple' };
        return map[cat] || 'green';
    };

    const columns = [
        {
            title: 'Talent Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => (
                <Space>
                    <TagsOutlined style={{ color: '#0892d0' }} />
                    <Text strong>{text}</Text>
                </Space>
            )
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (category) => (
                <Tag color={categoryColor(category)} style={{ borderRadius: 4, fontWeight: 500 }}>
                    {category}
                </Tag>
            )
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (text) => <Text type="secondary">{text || 'No description provided.'}</Text>
        },
        {
            title: 'Actions',
            key: 'actions',
            width: '180px',
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: '#1890ff' }} />}
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete Talent Lookup"
                        description="Are you sure? This will remove this option for all users."
                        onConfirm={() => deleteTalentMutation.mutate(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button danger type="text" icon={<DeleteOutlined />}>Delete</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Talent Lookups</Title>
                    <Text type="secondary">
                        Define dynamic talent categories and skill options that students use to build their profiles.
                    </Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                    style={{ borderRadius: 8, height: 40, background: '#0892d0', fontWeight: 600 }}
                >
                    Add Talent Lookup
                </Button>
            </div>

            {/* Filters */}
            <Card style={{ borderRadius: 16, border: 'none', marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <Space wrap size="middle">
                    <Input
                        placeholder="Search by name or category..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 260, borderRadius: 8 }}
                        allowClear
                    />
                    <Select
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        style={{ width: 200 }}
                        dropdownStyle={{ borderRadius: 8 }}
                    >
                        {categories.map(cat => (
                            <Option key={cat} value={cat}>{cat}</Option>
                        ))}
                    </Select>
                </Space>
            </Card>

            <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} styles={{ body: { padding: 0 } }}>
                <Table
                    dataSource={filteredTalents}
                    columns={columns}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={
                    <Space style={{ fontSize: 18, fontWeight: 700 }}>
                        <TagsOutlined style={{ color: '#0892d0' }} />
                        <span>{editingTalent ? 'Edit Talent Lookup' : 'Create Talent Lookup'}</span>
                    </Space>
                }
                open={isModalOpen}
                onCancel={() => { setIsModalOpen(false); setEditingTalent(null); form.resetFields(); }}
                okText={editingTalent ? 'Save Changes' : 'Create Talent'}
                cancelText="Cancel"
                onOk={() => form.submit()}
                confirmLoading={createTalentMutation.isPending || updateTalentMutation.isPending}
                okButtonProps={{ icon: <SaveOutlined />, style: { borderRadius: 8, background: '#0892d0' } }}
                cancelButtonProps={{ style: { borderRadius: 8 } }}
            >
                <div style={{ margin: '8px 0 20px' }}>
                    <Text type="secondary">
                        These definitions will appear as selectable options on student talent profiles.
                    </Text>
                </div>

                <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
                    <Form.Item
                        name="name"
                        label="Talent Name"
                        rules={[{ required: true, message: 'Please input the talent name!' }]}
                    >
                        <Input placeholder="e.g. Full-Stack Development" style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Form.Item
                        name="category"
                        label="Category"
                        rules={[{ required: true, message: 'Please select a category!' }]}
                    >
                        <Select placeholder="Select a category..." style={{ borderRadius: 8 }} dropdownStyle={{ borderRadius: 8 }}>
                            <Option value="Technology">Technology</Option>
                            <Option value="Creative">Creative</Option>
                            <Option value="Business">Business</Option>
                            <Option value="Engineering">Engineering</Option>
                            <Option value="Arts">Arts</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="description" label="Description">
                        <Input.TextArea
                            placeholder="Brief explanation of what this talent covers..."
                            rows={3}
                            style={{ borderRadius: 8 }}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default LookupTalents;
