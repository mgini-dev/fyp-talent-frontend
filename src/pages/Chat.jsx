import React, { useState, useEffect, useRef } from 'react';
import { Layout, List, Avatar, Typography, Input, Button, Space, Badge, Empty, Spin, Divider } from 'antd';
import { SendOutlined, MessageOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const { Sider, Content } = Layout;
const { Text, Title } = Typography;

// ─── Chat Bubble ─────────────────────────────────────────────────────────────
const Bubble = ({ msg, isMe }) => (
    <div style={{
        display: 'flex',
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        marginBottom: 10,
    }}>
        {!isMe && (
            <Avatar size={32} src={msg.sender?.profile_photo_url} style={{ background: '#0892d0', flexShrink: 0, marginRight: 8, alignSelf: 'flex-end' }}>
                {msg.sender?.first_name?.[0]}
            </Avatar>
        )}
        <div style={{
            maxWidth: '68%',
            padding: '10px 16px',
            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isMe ? 'linear-gradient(135deg,#0892d0,#000080)' : '#f0f0f0',
            color: isMe ? '#fff' : '#1a1a1a',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
            <Text style={{ fontSize: 14, color: isMe ? '#fff' : '#1a1a1a', display: 'block', lineHeight: 1.5 }}>
                {msg.content}
            </Text>
            <Text style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.7)' : '#aaa', display: 'block', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
                {msg.created_at ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }) : ''}
                {isMe && msg.read_at && ' ✓✓'}
            </Text>
        </div>
    </div>
);

// ─── Message Thread ───────────────────────────────────────────────────────────
const MessageThread = ({ connectionId, me }) => {
    const bottomRef = useRef(null);
    const [text, setText] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['messages', connectionId],
        queryFn: async () => { const r = await api.get(`/conversations/${connectionId}/messages`); return r.data.data; },
        refetchInterval: 5000,
        enabled: !!connectionId,
    });

    const messages = data?.data || [];

    const sendMut = useMutation({
        mutationFn: (content) => api.post(`/conversations/${connectionId}/messages`, { content }),
        onSuccess: () => {
            setText('');
        },
        onError: () => {}
    });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const handleSend = () => {
        if (!text.trim()) return;
        sendMut.mutate(text);
    };

    if (!connectionId) return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#8c8c8c' }}>
            <MessageOutlined style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }} />
            <Text type="secondary">Select a conversation to start chatting</Text>
        </div>
    );

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px' }}>
                {isLoading ? <Spin /> : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: 48 }}>
                        <Text type="secondary">No messages yet. Say hello! 👋</Text>
                    </div>
                ) : (
                    messages.map(msg => <Bubble key={msg.id} msg={msg} isMe={msg.sender_id === me?.id} />)
                )}
                <div ref={bottomRef} />
            </div>
            <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #f0f0f0' }}>
                <Input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onPressEnter={handleSend}
                    placeholder="Type a message... (Enter to send)"
                    size="large"
                    style={{ borderRadius: 24 }}
                    suffix={
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<SendOutlined />}
                            onClick={handleSend}
                            loading={sendMut.isPending}
                            disabled={!text.trim()}
                            style={{ background: '#0892d0' }}
                        />
                    }
                />
            </div>
        </div>
    );
};

// ─── Main Chat Page ───────────────────────────────────────────────────────────
const Chat = () => {
    const { user: me } = useAuth();
    const [selectedConnId, setSelectedConnId] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isMobileDetail, setIsMobileDetail] = useState(false);

    const { data: conversations, isLoading } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => { const r = await api.get('/conversations'); return r.data.data; },
        refetchInterval: 5000,
    });

    const selectConv = (conv) => {
        setSelectedConnId(conv.connection_id);
        setSelectedUser(conv.other_user);
        setIsMobileDetail(true);
    };

    return (
        <div style={{ height: 'calc(100vh - 120px)', display: 'flex', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 30px rgba(0,0,0,0.08)', background: '#fff' }}>
            {/* Conversation list */}
            <div style={{
                width: 320, flexShrink: 0, borderRight: '1px solid #f0f0f0',
                display: isMobileDetail ? 'none' : 'flex', flexDirection: 'column',
                '@media (min-width: 768px)': { display: 'flex' }
            }}>
                <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #f0f0f0' }}>
                    <Title level={4} style={{ margin: 0 }}>
                        <MessageOutlined style={{ color: '#0892d0', marginRight: 8 }} />Messages
                    </Title>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {isLoading ? <div style={{ padding: 20 }}><Spin /></div> :
                        !conversations?.length ? (
                            <div style={{ padding: 24, textAlign: 'center' }}>
                                <Empty description="No conversations yet. Connect with someone to start chatting!" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <div
                                    key={conv.connection_id}
                                    onClick={() => selectConv(conv)}
                                    style={{
                                        padding: '14px 20px',
                                        cursor: 'pointer',
                                        background: selectedConnId === conv.connection_id ? '#f0faff' : 'transparent',
                                        borderLeft: selectedConnId === conv.connection_id ? '3px solid #0892d0' : '3px solid transparent',
                                        transition: 'all 0.2s',
                                        borderBottom: '1px solid #f8f8f8',
                                    }}
                                >
                                    <Space>
                                        <Badge count={conv.unread} size="small" offset={[-4, 4]}>
                                            <Avatar size={44} src={conv.other_user?.profile_photo_url} style={{ background: 'linear-gradient(135deg,#0892d0,#000080)' }}>
                                                {conv.other_user?.first_name?.[0]}
                                            </Avatar>
                                        </Badge>
                                        <div style={{ minWidth: 0 }}>
                                            <Text strong style={{ display: 'block', fontSize: 14 }}>
                                                {conv.other_user?.first_name} {conv.other_user?.last_name}
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 12, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                                                {conv.last_message?.content || 'No messages yet'}
                                            </Text>
                                        </div>
                                    </Space>
                                </div>
                            ))
                        )
                    }
                </div>
            </div>

            {/* Thread panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {selectedConnId && (
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => { setIsMobileDetail(false); }} style={{ display: isMobileDetail ? 'inline-flex' : 'none' }} />
                        <Avatar size={40} src={selectedUser?.profile_photo_url} style={{ background: '#0892d0' }}>{selectedUser?.first_name?.[0]}</Avatar>
                        <div>
                            <Text strong style={{ display: 'block' }}>{selectedUser?.first_name} {selectedUser?.last_name}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>Connected</Text>
                        </div>
                    </div>
                )}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <MessageThread connectionId={selectedConnId} me={me} />
                </div>
            </div>
        </div>
    );
};

export default Chat;
