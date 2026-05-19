import React, { useState } from 'react';
import {
    Card, Button, Typography, Tag, Space, Modal, Form, Input, Select,
    Badge, Empty, Skeleton, Divider, Avatar, Timeline, message as antMsg, Popconfirm, Row, Col
} from 'antd';
import {
    PlusOutlined, SaveOutlined, FolderOpenOutlined, CheckCircleOutlined,
    ClockCircleOutlined, PauseCircleOutlined, EditOutlined, DeleteOutlined,
    MessageOutlined, SendOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const statusConfig = {
    draft:     { color: 'default',  icon: <EditOutlined />,         label: 'Draft' },
    active:    { color: 'blue',     icon: <ClockCircleOutlined />,   label: 'Active' },
    completed: { color: 'success',  icon: <CheckCircleOutlined />,   label: 'Completed' },
    paused:    { color: 'warning',  icon: <PauseCircleOutlined />,   label: 'Paused' },
};

// ─── Project Detail Drawer ────────────────────────────────────────────────────
const ProjectDetail = ({ project, me, onClose, talents }) => {
    const queryClient = useQueryClient();
    const [updateText, setUpdateText] = useState('');
    const { data: detail, isLoading } = useQuery({
        queryKey: ['project', project.id],
        queryFn: async () => { const r = await api.get(`/projects/${project.id}`); return r.data.data; },
        initialData: project,
    });

    const addUpdateMut = useMutation({
        mutationFn: (content) => api.post(`/projects/${project.id}/updates`, { content }),
        onSuccess: () => {
            setUpdateText('');
            antMsg.success('Update posted!');
            queryClient.invalidateQueries(['project', project.id]);
            queryClient.invalidateQueries(['projects']);
        }
    });

    const changeStatusMut = useMutation({
        mutationFn: (status) => api.put(`/projects/${project.id}`, { status }),
        onSuccess: () => { antMsg.success('Status updated'); queryClient.invalidateQueries(['projects', 'project']); }
    });

    const sc = statusConfig[detail?.status] || statusConfig.draft;
    const canUpdate = detail?.student_id === me?.id || detail?.mentor_id === me?.id;

    return (
        <div style={{ padding: '0 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>{detail.title}</Title>
                    <Space style={{ marginTop: 8 }} wrap>
                        <Badge status={sc.color} text={<Tag icon={sc.icon} color={sc.color} style={{ borderRadius: 8 }}>{sc.label}</Tag>} />
                        {detail.talent && <Tag color="purple">{detail.talent.name}</Tag>}
                    </Space>
                </div>
                <Select value={detail.status} onChange={(v) => changeStatusMut.mutate(v)} style={{ width: 140 }} disabled={!canUpdate}>
                    {Object.entries(statusConfig).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
                </Select>
            </div>

            <Paragraph style={{ fontSize: 15, color: '#595959', lineHeight: 1.8 }}>{detail.description}</Paragraph>

            <Divider orientation="left">Team</Divider>
            <Space>
                <div style={{ textAlign: 'center' }}>
                    <Avatar size={48} src={detail.student?.profile_photo_url} style={{ background: '#0892d0' }}>{detail.student?.first_name?.[0]}</Avatar>
                    <Text style={{ display: 'block', fontSize: 12 }}>{detail.student?.first_name}</Text>
                    <Tag color="blue" style={{ fontSize: 10 }}>Student</Tag>
                </div>
                {detail.mentor && (
                    <div style={{ textAlign: 'center', marginLeft: 16 }}>
                        <Avatar size={48} src={detail.mentor?.profile_photo_url} style={{ background: '#000080' }}>{detail.mentor?.first_name?.[0]}</Avatar>
                        <Text style={{ display: 'block', fontSize: 12 }}>{detail.mentor?.first_name}</Text>
                        <Tag color="gold" style={{ fontSize: 10 }}>Mentor</Tag>
                    </div>
                )}
            </Space>

            <Divider orientation="left">Updates & Notes</Divider>
            {canUpdate && (
                <div style={{ marginBottom: 20 }}>
                    <TextArea
                        placeholder="Post an update, milestone, or mentor guidance note..."
                        value={updateText}
                        onChange={e => setUpdateText(e.target.value)}
                        rows={3}
                        style={{ borderRadius: 12, marginBottom: 8 }}
                    />
                    <Button type="primary" icon={<SendOutlined />} onClick={() => addUpdateMut.mutate(updateText)} loading={addUpdateMut.isPending} disabled={!updateText.trim()} style={{ borderRadius: 8, background: '#0892d0' }}>
                        Post Update
                    </Button>
                </div>
            )}

            {detail.updates?.length > 0 ? (
                <Timeline
                    items={detail.updates.map(u => ({
                        color: u.user_id === detail.mentor_id ? '#000080' : '#0892d0',
                        dot: <Avatar size={28} src={u.author?.profile_photo_url} style={{ background: u.user_id === detail.mentor_id ? '#000080' : '#0892d0' }}>{u.author?.first_name?.[0]}</Avatar>,
                        children: (
                            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px' }}>
                                <Space style={{ marginBottom: 4 }}>
                                    <Text strong style={{ fontSize: 13 }}>{u.author?.first_name} {u.author?.last_name}</Text>
                                    {u.user_id === detail.mentor_id && <Tag color="gold" style={{ fontSize: 10 }}>Mentor</Tag>}
                                    <Text type="secondary" style={{ fontSize: 11 }}>{u.created_at ? formatDistanceToNow(new Date(u.created_at), { addSuffix: true }) : ''}</Text>
                                </Space>
                                <Text style={{ display: 'block', fontSize: 14 }}>{u.content}</Text>
                            </div>
                        )
                    }))}
                />
            ) : (
                <Empty description="No updates yet. Be the first to post a note!" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
        </div>
    );
};

// ─── Main Projects Page ───────────────────────────────────────────────────────
const Projects = () => {
    const { user: me } = useAuth();
    const queryClient = useQueryClient();
    const [createModal, setCreateModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [form] = Form.useForm();

    const { data: projects, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => { const r = await api.get('/projects'); return r.data.data; }
    });

    const { data: talents } = useQuery({
        queryKey: ['talents'],
        queryFn: async () => { const r = await api.get('/talents'); return r.data.data; }
    });

    const { data: mentors } = useQuery({
        queryKey: ['mentors'],
        queryFn: async () => { const r = await api.get('/mentors'); return r.data.data; }
    });

    const createMut = useMutation({
        mutationFn: (v) => api.post('/projects', v),
        onSuccess: () => {
            antMsg.success('Project created!');
            queryClient.invalidateQueries(['projects']);
            setCreateModal(false);
            form.resetFields();
        },
        onError: () => antMsg.error('Failed to create project')
    });

    const deleteMut = useMutation({
        mutationFn: (id) => api.delete(`/projects/${id}`),
        onSuccess: () => { antMsg.success('Project deleted'); queryClient.invalidateQueries(['projects']); }
    });

    const isMentor = me?.roles?.some(r => r.name === 'Mentor');

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
                        <FolderOpenOutlined style={{ color: '#0892d0', marginRight: 10 }} />
                        {isMentor ? 'Mentored Projects' : 'My Projects'}
                    </Title>
                    <Text type="secondary">
                        {isMentor ? 'Projects where students have requested your mentorship.' : 'Build, track, and grow your portfolio with mentor guidance.'}
                    </Text>
                </div>
                {!isMentor && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)} style={{ borderRadius: 8, height: 40, background: '#0892d0', fontWeight: 600 }}>
                        New Project
                    </Button>
                )}
            </div>

            {isLoading ? (
                <Row gutter={[16, 16]}>{[1,2,3].map(i => <Col xs={24} md={12} lg={8} key={i}><Card style={{ borderRadius: 16 }}><Skeleton active /></Card></Col>)}</Row>
            ) : !projects?.length ? (
                <Card style={{ borderRadius: 16, border: 'none', textAlign: 'center', padding: '64px 0' }}>
                    <Empty description={<div><Title level={4}>{isMentor ? 'No projects assigned yet.' : 'No projects yet — launch your first!'}</Title><Text type="secondary">Projects help you showcase work and get structured mentor feedback.</Text></div>} />
                </Card>
            ) : (
                <Row gutter={[16, 16]}>
                    {projects.map(p => {
                        const sc = statusConfig[p.status] || statusConfig.draft;
                        return (
                            <Col xs={24} md={12} lg={8} key={p.id}>
                                <Card
                                    hoverable
                                    style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', height: '100%', cursor: 'pointer' }}
                                    styles={{ body: { padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' } }}
                                    onClick={() => setSelectedProject(p)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <Tag icon={sc.icon} color={sc.color} style={{ borderRadius: 8 }}>{sc.label}</Tag>
                                        {p.talent && <Tag color="purple" style={{ borderRadius: 8 }}>{p.talent.name}</Tag>}
                                    </div>
                                    <Title level={4} style={{ margin: '0 0 8px', fontWeight: 700 }}>{p.title}</Title>
                                    <Paragraph type="secondary" style={{ flex: 1, fontSize: 13 }} ellipsis={{ rows: 2 }}>{p.description}</Paragraph>
                                    <Divider style={{ margin: '12px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Space>
                                            <Avatar size={28} src={p.student?.profile_photo_url} style={{ background: '#0892d0' }}>{p.student?.first_name?.[0]}</Avatar>
                                            {p.mentor && <Avatar size={28} src={p.mentor?.profile_photo_url} style={{ background: '#000080' }}>{p.mentor?.first_name?.[0]}</Avatar>}
                                        </Space>
                                        <Space>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{p.updates_count || 0} updates</Text>
                                            {!isMentor && (
                                                <Popconfirm title="Delete this project?" onConfirm={e => { e.stopPropagation(); deleteMut.mutate(p.id); }} okText="Yes">
                                                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={e => e.stopPropagation()} />
                                                </Popconfirm>
                                            )}
                                        </Space>
                                    </div>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* Project Detail Modal */}
            <Modal
                open={!!selectedProject}
                onCancel={() => setSelectedProject(null)}
                footer={null}
                width={700}
                style={{ top: 20 }}
                styles={{ body: { padding: '24px', maxHeight: '80vh', overflowY: 'auto' } }}
                title={null}
            >
                {selectedProject && (
                    <ProjectDetail project={selectedProject} me={me} talents={talents} onClose={() => setSelectedProject(null)} />
                )}
            </Modal>

            {/* Create Project Modal */}
            <Modal
                title={<Space><FolderOpenOutlined style={{ color: '#0892d0' }} /><span>Launch New Project</span></Space>}
                open={createModal}
                onCancel={() => { setCreateModal(false); form.resetFields(); }}
                onOk={() => form.submit()}
                okText="Create Project"
                confirmLoading={createMut.isPending}
                okButtonProps={{ icon: <SaveOutlined />, style: { borderRadius: 8, background: '#0892d0' } }}
                cancelButtonProps={{ style: { borderRadius: 8 } }}
                width={560}
            >
                <Form form={form} layout="vertical" onFinish={v => createMut.mutate(v)} size="large" style={{ marginTop: 12 }}>
                    <Form.Item name="title" label="Project Title" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Smart Campus App" style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item name="description" label="Description" rules={[{ required: true }]}>
                        <TextArea placeholder="What are you building? What problem does it solve?" rows={4} style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="talent_id" label="Related Talent">
                                <Select placeholder="Tag a talent..." allowClear dropdownStyle={{ borderRadius: 8 }}>
                                    {talents?.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="mentor_id" label="Request Mentor (optional)">
                                <Select placeholder="Choose a mentor..." allowClear dropdownStyle={{ borderRadius: 8 }}>
                                    {mentors?.map(m => <Option key={m.id} value={m.id}>{m.first_name} {m.last_name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
};

export default Projects;
