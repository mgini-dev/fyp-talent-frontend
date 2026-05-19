import React, { useState, useRef, useCallback } from 'react';
import {
    Card, Avatar, Input, Button, Typography, Tag, Space, Select,
    Divider, Empty, Spin, Tooltip, Popconfirm, message as antMessage,
    Form, Skeleton
} from 'antd';
import {
    LikeOutlined, DislikeFilled, LikeFilled, DislikeOutlined, CommentOutlined,
    SendOutlined, GlobalOutlined, TeamOutlined, DeleteOutlined,
    EditOutlined, FireOutlined, PlusOutlined, TagsOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const visibilityIcon = { public: <GlobalOutlined />, connections: <TeamOutlined />, followers: <TeamOutlined /> };
const typeColor = { post: 'blue', discussion: 'orange', announcement: 'red' };

// ─── Single Post Card ────────────────────────────────────────────────────────
const PostCard = ({ post, me }) => {
    const queryClient = useQueryClient();
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [likes, setLikes] = useState(post.likes_count || 0);
    const [dislikes, setDislikes] = useState(post.dislikes_count || 0);
    const [myReaction, setMyReaction] = useState(post.my_reaction);

    const reactMut = useMutation({
        mutationFn: (type) => api.post(`/posts/${post.id}/react`, { type }),
        onSuccess: ({ data }) => {
            setLikes(data.data.likes);
            setDislikes(data.data.dislikes);
            setMyReaction(data.data.my_reaction);
        }
    });

    const { data: comments, isLoading: commentsLoading, refetch: refetchComments } = useQuery({
        queryKey: ['comments', post.id],
        queryFn: async () => { const r = await api.get(`/posts/${post.id}/comments`); return r.data.data; },
        enabled: showComments,
    });

    const addCommentMut = useMutation({
        mutationFn: (data) => api.post(`/posts/${post.id}/comments`, data),
        onSuccess: () => { setCommentText(''); setReplyTo(null); refetchComments(); },
        onError: () => antMessage.error('Failed to add comment')
    });

    const deleteMut = useMutation({
        mutationFn: () => api.delete(`/posts/${post.id}`),
        onSuccess: () => { antMessage.success('Post deleted'); queryClient.invalidateQueries(['feed']); }
    });

    const authorName = `${post.author?.first_name} ${post.author?.last_name}`;
    const isOwner = post.user_id === me?.id;

    const handleComment = () => {
        if (!commentText.trim()) return;
        addCommentMut.mutate({ content: commentText, parent_id: replyTo?.id || null });
    };

    const toggleComments = () => {
        setShowComments(prev => !prev);
    };

    return (
        <Card
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 16 }}
            styles={{ body: { padding: '20px 24px' } }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <Space>
                    <Avatar size={44} src={post.author?.profile_photo_url} style={{ background: 'linear-gradient(135deg,#0892d0,#000080)', flexShrink: 0 }}>
                        {post.author?.first_name?.[0]}
                    </Avatar>
                    <div>
                        <Text strong style={{ display: 'block', fontSize: 15 }}>{authorName}</Text>
                        <Space size={6}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}
                            </Text>
                            <Tag color={typeColor[post.type] || 'blue'} style={{ borderRadius: 10, fontSize: 10 }}>{post.type}</Tag>
                            {post.talent && <Tag icon={<TagsOutlined />} color="purple" style={{ borderRadius: 10, fontSize: 10 }}>{post.talent.name}</Tag>}
                        </Space>
                    </div>
                </Space>
                {isOwner && (
                    <Popconfirm title="Delete this post?" onConfirm={() => deleteMut.mutate()} okText="Yes" cancelText="No">
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                )}
            </div>

            {/* Content */}
            <Paragraph style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 16, whiteSpace: 'pre-wrap' }}>
                {post.content}
            </Paragraph>

            {/* Reactions Bar */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                <Button
                    type="text" size="small"
                    icon={myReaction === 'like' ? <LikeFilled style={{ color: '#0892d0' }} /> : <LikeOutlined />}
                    onClick={() => reactMut.mutate('like')}
                    style={{ color: myReaction === 'like' ? '#0892d0' : undefined, fontWeight: 600 }}
                >
                    {likes}
                </Button>
                <Button
                    type="text" size="small"
                    icon={myReaction === 'dislike' ? <DislikeFilled style={{ color: '#ff4d4f' }} /> : <DislikeOutlined />}
                    onClick={() => reactMut.mutate('dislike')}
                    style={{ color: myReaction === 'dislike' ? '#ff4d4f' : undefined, fontWeight: 600 }}
                >
                    {dislikes}
                </Button>
                <Button
                    type="text" size="small"
                    icon={<CommentOutlined />}
                    onClick={toggleComments}
                    style={{ marginLeft: 4 }}
                >
                    {post.comments_count || 0} Comments
                </Button>
            </div>

            {/* Comments */}
            {showComments && (
                <div style={{ marginTop: 16 }}>
                    {commentsLoading ? <Spin size="small" /> : (
                        <>
                            {(comments || []).map(c => (
                                <div key={c.id} style={{ marginBottom: 12 }}>
                                    <Space align="start">
                                        <Avatar size={32} src={c.author?.profile_photo_url} style={{ background: '#0892d0', flexShrink: 0 }}>
                                            {c.author?.first_name?.[0]}
                                        </Avatar>
                                        <div>
                                            <div style={{ background: '#f5f5f5', borderRadius: 12, padding: '8px 12px', display: 'inline-block', maxWidth: '100%' }}>
                                                <Text strong style={{ fontSize: 13 }}>{c.author?.first_name} {c.author?.last_name}</Text>
                                                <Text style={{ display: 'block', fontSize: 13 }}>{c.content}</Text>
                                            </div>
                                            <div style={{ marginTop: 4 }}>
                                                <Button type="link" size="small" style={{ padding: 0, fontSize: 11, color: '#8c8c8c' }} onClick={() => setReplyTo(c)}>
                                                    Reply
                                                </Button>
                                                <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                                                    {c.created_at ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true }) : ''}
                                                </Text>
                                            </div>
                                            {c.replies?.map(r => (
                                                <div key={r.id} style={{ marginTop: 8, marginLeft: 24 }}>
                                                    <Space align="start">
                                                        <Avatar size={28} src={r.author?.profile_photo_url} style={{ background: '#52c41a', flexShrink: 0 }}>{r.author?.first_name?.[0]}</Avatar>
                                                        <div style={{ background: '#f5f5f5', borderRadius: 12, padding: '6px 12px' }}>
                                                            <Text strong style={{ fontSize: 12 }}>{r.author?.first_name} {r.author?.last_name}</Text>
                                                            <Text style={{ display: 'block', fontSize: 12 }}>{r.content}</Text>
                                                        </div>
                                                    </Space>
                                                </div>
                                            ))}
                                        </div>
                                    </Space>
                                </div>
                            ))}
                            {replyTo && (
                                <div style={{ background: '#e6f7ff', borderRadius: 8, padding: '6px 12px', marginBottom: 8, fontSize: 12 }}>
                                    Replying to <strong>{replyTo.author?.first_name}</strong>
                                    <Button type="link" size="small" onClick={() => setReplyTo(null)} style={{ padding: 0, marginLeft: 8 }}>Cancel</Button>
                                </div>
                            )}
                            <Space style={{ width: '100%' }}>
                                <Avatar size={32} src={me?.profile_photo_url} style={{ background: '#0892d0', flexShrink: 0 }}>{me?.first_name?.[0]}</Avatar>
                                <Input
                                    placeholder={replyTo ? `Reply to ${replyTo.author?.first_name}...` : 'Write a comment...'}
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    onPressEnter={handleComment}
                                    style={{ borderRadius: 20 }}
                                    suffix={
                                        <Button type="text" icon={<SendOutlined style={{ color: '#0892d0' }} />} onClick={handleComment} loading={addCommentMut.isPending} />
                                    }
                                />
                            </Space>
                        </>
                    )}
                </div>
            )}
        </Card>
    );
};

// ─── Compose Box ─────────────────────────────────────────────────────────────
const ComposeBox = ({ me, talents }) => {
    const queryClient = useQueryClient();
    const [content, setContent] = useState('');
    const [type, setType] = useState('post');
    const [visibility, setVisibility] = useState('public');
    const [talentId, setTalentId] = useState(null);

    const postMut = useMutation({
        mutationFn: (data) => api.post('/posts', data),
        onSuccess: () => {
            antMessage.success('Post published!');
            setContent('');
            setTalentId(null);
            queryClient.invalidateQueries(['feed']);
        },
        onError: () => antMessage.error('Failed to publish post')
    });

    return (
        <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 20 }}
            styles={{ body: { padding: '20px 24px' } }}>
            <Space style={{ marginBottom: 12 }}>
                <Avatar size={44} src={me?.profile_photo_url} style={{ background: 'linear-gradient(135deg,#0892d0,#000080)' }}>
                    {me?.first_name?.[0]}
                </Avatar>
                <div>
                    <Text strong>{me?.first_name} {me?.last_name}</Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Share something with your network</Text>
                </div>
            </Space>
            <TextArea
                placeholder="What's on your mind? Share knowledge, insights, or start a discussion..."
                value={content}
                onChange={e => setContent(e.target.value)}
                autoSize={{ minRows: 3, maxRows: 6 }}
                style={{ borderRadius: 12, fontSize: 14 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 8 }}>
                <Space wrap>
                    <Select value={type} onChange={setType} size="small" style={{ width: 120 }}>
                        <Option value="post">📝 Post</Option>
                        <Option value="discussion">💬 Discussion</Option>
                        <Option value="announcement">📢 Announcement</Option>
                    </Select>
                    <Select value={visibility} onChange={setVisibility} size="small" style={{ width: 130 }}>
                        <Option value="public">🌐 Public</Option>
                        <Option value="connections">👥 Connections</Option>
                        <Option value="followers">👤 Followers</Option>
                    </Select>
                    <Select value={talentId} onChange={setTalentId} size="small" style={{ width: 160 }} placeholder="Tag a talent..." allowClear>
                        {talents?.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                    </Select>
                </Space>
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => postMut.mutate({ content, type, visibility, talent_id: talentId })}
                    loading={postMut.isPending}
                    disabled={!content.trim()}
                    style={{ borderRadius: 10, background: '#0892d0', fontWeight: 600 }}
                >
                    Publish
                </Button>
            </div>
        </Card>
    );
};

// ─── Main Feed Page ───────────────────────────────────────────────────────────
const Feed = () => {
    const { user: me } = useAuth();
    const [talentFilter, setTalentFilter] = useState(null);

    const { data: talents } = useQuery({
        queryKey: ['talents'],
        queryFn: async () => { const r = await api.get('/talents'); return r.data.data; }
    });

    const { data: feedData, isLoading, refetch } = useQuery({
        queryKey: ['feed', talentFilter],
        queryFn: async () => {
            const params = talentFilter ? `?talent_id=${talentFilter}` : '';
            const r = await api.get(`/feed${params}`);
            return r.data.data;
        },
        refetchInterval: 30000,
    });

    const posts = feedData?.data || [];

    return (
        <div style={{ padding: '24px', maxWidth: 760, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
                    <FireOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                    Your Feed
                </Title>
                <Text type="secondary">Posts from your connections and followed mentors.</Text>
            </div>

            <ComposeBox me={me} talents={talents} />

            {/* Talent filter tabs */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                <Button
                    size="small"
                    type={!talentFilter ? 'primary' : 'default'}
                    style={{ borderRadius: 20 }}
                    onClick={() => setTalentFilter(null)}
                >All</Button>
                {talents?.slice(0, 8).map(t => (
                    <Button
                        key={t.id}
                        size="small"
                        type={talentFilter === t.id ? 'primary' : 'default'}
                        style={{ borderRadius: 20 }}
                        onClick={() => setTalentFilter(t.id)}
                    >{t.name}</Button>
                ))}
            </div>

            {isLoading ? (
                [1,2,3].map(i => (
                    <Card key={i} style={{ borderRadius: 16, marginBottom: 16, border: 'none' }}>
                        <Skeleton avatar active paragraph={{ rows: 3 }} />
                    </Card>
                ))
            ) : posts.length === 0 ? (
                <Card style={{ borderRadius: 16, border: 'none', textAlign: 'center', padding: '48px 0' }}>
                    <Empty description={
                        <div>
                            <Title level={4}>Your feed is quiet 🌱</Title>
                            <Text type="secondary">Connect with mentors and peers to see their posts here.<br />Or publish your first post above!</Text>
                        </div>
                    } />
                </Card>
            ) : (
                posts.map(post => <PostCard key={post.id} post={post} me={me} />)
            )}
        </div>
    );
};

export default Feed;
