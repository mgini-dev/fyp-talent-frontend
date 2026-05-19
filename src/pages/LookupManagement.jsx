import React, { useState } from 'react';
import { Card, Table, Typography, Tag, Space, Button, Input, Select, Modal, Form, Popconfirm, message, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, TagsOutlined, DatabaseOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

const { Title, Text } = Typography;
const { Option } = Select;

const LookupManagement = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTalent, setEditingTalent] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Fetch all talents from lookups
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

    const handleDelete = (id) => {
        deleteTalentMutation.mutate(id);
    };

    const handleSubmit = (values) => {
        if (editingTalent) {
            updateTalentMutation.mutate({ id: editingTalent.id, values });
        } else {
            createTalentMutation.mutate(values);
        }
    };

    // Filter and search logic
    const filteredTalents = talents?.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchText.toLowerCase()) || 
                              t.category.toLowerCase().includes(searchText.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
        return matchesSearch && matchesCategory;
    }) || [];

    // Get unique categories for filter
    const categories = ['All', ...new Set(talents?.map(t => t.category) || [])];

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
                <Tag color={category === 'Technology' ? 'blue' : category === 'Creative' ? 'orange' : 'green'} style={{ borderRadius: 4, fontWeight: 500 }}>
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
            width: '150px',
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
                        title="Delete Lookup Talent"
                        description="Are you sure? This will remove this lookup option."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button 
                            danger 
                            type="text" 
                            icon={<DeleteOutlined />}
                        >
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Lookup Manager</Title>
                <Text type="secondary">Centralized console to administer ecosystem lookups, references, and taxonomies.</Text>
            </div>

            <Tabs 
                defaultActiveKey="talents"
                type="line"
                size="large"
                style={{ marginBottom: 20 }}
                items={[
                    {
                        key: 'talents',
                        label: (
                            <span>
                                <TagsOutlined />
                                Talent Categories
                            </span>
                        ),
                        children: (
                            <div style={{ marginTop: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <div>
                                        <Title level={4} style={{ margin: 0 }}>Dynamic Talents Schema</Title>
                                        <Text type="secondary">Define and modify dynamic talent lookup values for user profile indexing.</Text>
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

                                {/* Filter and Search Panel */}
                                <Card style={{ borderRadius: 16, border: 'none', marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                    <Space wrap size="middle" style={{ width: '100%' }}>
                                        <Input 
                                            placeholder="Search lookups..." 
                                            value={searchText}
                                            onChange={(e) => setSearchText(e.target.value)}
                                            style={{ width: 250, borderRadius: 8 }}
                                            allowClear
                                        />
                                        <Select 
                                            value={categoryFilter} 
                                            onChange={setCategoryFilter}
                                            style={{ width: 180 }}
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
                            </div>
                        )
                    },
                    {
                        key: 'departments',
                        label: (
                            <span>
                                <ApartmentOutlined />
                                Academic Departments
                            </span>
                        ),
                        children: (
                            <div style={{ marginTop: 24 }}>
                                <Card style={{ borderRadius: 16, border: 'none', textAlign: 'center', padding: '60px 0', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                                    <DatabaseOutlined style={{ fontSize: 64, color: '#0892d0', opacity: 0.8, marginBottom: 16 }} />
                                    <Title level={3} style={{ fontWeight: 800 }}>Ecosystem Taxonomies</Title>
                                    <Paragraph style={{ color: '#64748b', fontSize: 15, maxWidth: 500, margin: '0 auto 24px' }}>
                                        Manage university colleges, departments, and course lookup keys. This module keeps the talent indexes perfectly structured for UDOM's administrative hierarchy.
                                    </Paragraph>
                                    <Button type="primary" disabled style={{ borderRadius: 8, height: 40, fontWeight: 600 }}>
                                        Configure Department Taxonomies
                                    </Button>
                                </Card>
                            </div>
                        )
                    }
                ]}
            />

            <Modal
                title={
                    <Space style={{ fontSize: 18, fontWeight: 700 }}>
                        <TagsOutlined style={{ color: '#0892d0' }} />
                        <span>{editingTalent ? 'Edit Talent Lookup' : 'Create Talent Lookup'}</span>
                    </Space>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                okText={editingTalent ? 'Save Changes' : 'Create Talent'}
                cancelText="Cancel"
                onOk={() => form.submit()}
                confirmLoading={createTalentMutation.isPending || updateTalentMutation.isPending}
                okButtonProps={{ 
                    icon: <SaveOutlined />,
                    style: { borderRadius: 8, background: '#0892d0' } 
                }}
                cancelButtonProps={{ style: { borderRadius: 8 } }}
                style={{ borderRadius: 16 }}
            >
                <div style={{ margin: '8px 0 24px' }}>
                    <Text type="secondary">
                        Configure talent lookup parameters. These lookup definitions will show up in the students' talent registration profile lists.
                    </Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    size="large"
                >
                    <Form.Item
                        name="name"
                        label="Talent Name / Attribute Name"
                        rules={[{ required: true, message: 'Please input the talent lookup name!' }]}
                    >
                        <Input placeholder="e.g. Full-Stack Development" style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Form.Item
                        name="category"
                        label="Category / Industry Sector"
                        rules={[{ required: true, message: 'Please select or type a category!' }]}
                    >
                        <Select 
                            placeholder="Select or enter category..." 
                            style={{ borderRadius: 8 }}
                            dropdownStyle={{ borderRadius: 8 }}
                        >
                            <Option value="Technology">Technology</Option>
                            <Option value="Creative">Creative</Option>
                            <Option value="Business">Business</Option>
                            <Option value="Engineering">Engineering</Option>
                            <Option value="Arts">Arts</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <Input.TextArea placeholder="Provide a brief explanation of what this talent lookup covers..." rows={3} style={{ borderRadius: 8 }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default LookupManagement;
