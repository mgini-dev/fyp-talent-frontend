import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Card } from 'antd';
import { UserOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

const Login = () => {
    const [loading, setLoading] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();

    if (user) {
        return <Navigate to="/" replace />;
    }

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await login(values.email, values.password);
            message.success('Welcome to UDOM Talent System!');
            navigate('/');
        } catch (error) {
            message.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: '#f8fafc',
            padding: '24px',
            fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Inject CSS Animations dynamically */}
            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(2deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(1.05); }
                }
                @keyframes slide-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s ease-in-out infinite;
                }
                .animate-slide-up {
                    animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .input-hover:hover {
                    border-color: #0892d0 !important;
                }
                .login-btn {
                    background: linear-gradient(135deg, #0892d0 0%, #0369a1 100%) !important;
                    border: none !important;
                    transition: all 0.3s ease !important;
                }
                .login-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(8, 146, 208, 0.3) !important;
                }
            `}</style>

            {/* Subtle background graphics */}
            <div className="animate-pulse-slow" style={{ 
                position: 'absolute', 
                top: '-10%', 
                left: '-10%', 
                width: '40vw', 
                height: '40vw', 
                borderRadius: '50%', 
                background: 'radial-gradient(circle, rgba(8, 146, 208, 0.08) 0%, rgba(255,255,255,0) 70%)',
                zIndex: 0
            }} />
            <div className="animate-pulse-slow" style={{ 
                position: 'absolute', 
                bottom: '-10%', 
                right: '-10%', 
                width: '40vw', 
                height: '40vw', 
                borderRadius: '50%', 
                background: 'radial-gradient(circle, rgba(3, 105, 161, 0.08) 0%, rgba(255,255,255,0) 70%)',
                zIndex: 0,
                animationDelay: '2s'
            }} />

            {/* Split Screen Container */}
            <Card 
                className="animate-slide-up"
                style={{ 
                    width: '100%', 
                    maxWidth: 1000, 
                    borderRadius: 24, 
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    overflow: 'hidden',
                    background: '#ffffff',
                    zIndex: 1
                }}
                styles={{ body: { padding: 0 } }}
            >
                <div style={{ display: 'flex', minHeight: 600 }}>
                    {/* Left Panel: Partition for Brand & Motivation with UDOM Gradient (matching Register) */}
                    <div style={{ 
                        flex: 1, 
                        background: 'linear-gradient(135deg, #0892d0 0%, #000080 100%)', 
                        padding: '48px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        position: 'relative',
                        color: '#ffffff'
                    }} className="hidden-mobile">
                        {/* Decorative dynamic circles */}
                        <div style={{
                            position: 'absolute',
                            top: '10%',
                            right: '10%',
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(5px)'
                        }} className="animate-float" />
                        <div style={{
                            position: 'absolute',
                            bottom: '20%',
                            left: '10%',
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(3px)'
                        }} className="animate-float" />

                        {/* Top Quote area */}
                        <div>
                            <div style={{ 
                                display: 'inline-flex', 
                                padding: '6px 16px', 
                                borderRadius: 100, 
                                background: 'rgba(255, 255, 255, 0.15)', 
                                color: '#ffffff', 
                                fontWeight: 600, 
                                fontSize: 13,
                                marginBottom: 24,
                                backdropFilter: 'blur(5px)'
                            }}>
                                🚀 Spark Innovation
                            </div>
                        </div>

                        {/* Motivational Space */}
                        <div style={{ margin: '40px 0', zIndex: 1 }}>
                            <Title level={2} style={{ color: '#ffffff', fontWeight: 800, fontSize: 32, lineHeight: 1.2, marginBottom: 16 }}>
                                Discover Your Path, Showcase Your Genius.
                            </Title>
                            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 16, lineHeight: 1.6, maxWidth: 400 }}>
                                Connect with world-class academic mentors, build stellar profiles, and let the universe discover your unique talents at the University of Dodoma.
                            </Paragraph>
                        </div>

                        {/* Footer quotes / badges */}
                        <div style={{ zIndex: 1 }}>
                            <div style={{ display: 'flex', gap: 32 }}>
                                <div>
                                    <Title level={3} style={{ margin: 0, color: '#ffffff', fontWeight: 800 }}>100%</Title>
                                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>UDOM Proud</Text>
                                </div>
                                <div>
                                    <Title level={3} style={{ margin: 0, color: '#ffffff', fontWeight: 800 }}>Mentor</Title>
                                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Led Ecosystem</Text>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Clean Login Form with UDOM Logo & System name inside form side */}
                    <div style={{ 
                        width: '100%', 
                        maxWidth: 460, 
                        padding: '56px 48px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center',
                        margin: '0 auto'
                    }}>
                        {/* Logo and System Name inside form side */}
                        <div style={{ textAlign: 'center', marginBottom: 28 }}>
                            <img src="/udom.logo.jpg" alt="UDOM Logo" className="animate-float" style={{ width: 64, height: 64, borderRadius: '50%', marginBottom: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                            <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>UDOM Talent Hub</Title>
                            <Text style={{ color: '#64748b', fontSize: 14 }}>Please sign in to access your dashboard.</Text>
                        </div>

                        <Form
                            name="login"
                            initialValues={{ remember: true }}
                            onFinish={onFinish}
                            layout="vertical"
                            size="large"
                        >
                            <Form.Item
                                name="email"
                                rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Invalid email address' }]}
                            >
                                <Input 
                                    className="input-hover"
                                    prefix={<UserOutlined style={{ color: '#64748b', marginRight: 4 }} />} 
                                    placeholder="yourname@udom.ac.tz" 
                                    style={{ borderRadius: 10, height: 48, border: '1px solid #cbd5e1' }} 
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                rules={[{ required: true, message: 'Please input your password!' }]}
                            >
                                <Input.Password 
                                    className="input-hover"
                                    prefix={<LockOutlined style={{ color: '#64748b', marginRight: 4 }} />} 
                                    placeholder="••••••••" 
                                    style={{ borderRadius: 10, height: 48, border: '1px solid #cbd5e1' }} 
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    loading={loading} 
                                    block 
                                    className="login-btn"
                                    icon={<ArrowRightOutlined />}
                                    iconPosition="end"
                                    style={{ 
                                        borderRadius: 10, 
                                        height: 48, 
                                        fontSize: 15, 
                                        fontWeight: 600, 
                                        marginTop: 8 
                                    }}
                                >
                                    Sign In to System
                                </Button>
                            </Form.Item>
                            
                            <div style={{ textAlign: 'center', marginTop: 16 }}>
                                <Text style={{ color: '#64748b' }}>
                                    New student? <Link to="/register" style={{ color: '#0892d0', fontWeight: 600 }}>Create an account</Link>
                                </Text>
                            </div>
                        </Form>
                    </div>
                </div>
            </Card>

            {/* Mobile Layout Support CSS Helper */}
            <style>{`
                @media (max-width: 768px) {
                    .hidden-mobile {
                        display: none !important;
                    }
                }
            `}</style>

            <div style={{ position: 'absolute', bottom: 16, textAlign: 'center', width: '100%', color: '#94a3b8', fontSize: 12, zIndex: 0 }}>
                UDOM Talent Management System © {new Date().getFullYear()}
            </div>
        </div>
    );
};

export default Login;
