// src/pages/Home.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Space,
  Carousel,
  Badge,
  Avatar,
  Timeline,
  Progress,
  Divider,
  Spin,
  message
} from 'antd';
import {
  RocketOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  TrophyOutlined,
  CarOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  BankOutlined,
  UserOutlined,
  ArrowRightOutlined,
  LoginOutlined,
  UserAddOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import ParliamentLogo from '@/components/ParliamentLogo';
import LoginModal from '@/components/LoginModal';
import RegisterModal from '@/components/RegisterModal';
import { 
  homeApiService, 
  type HomeStats, 
  type ActivityItem, 
  type SystemHealth 
} from '@/services/homeApi';
import { debugApiConfig } from '@/utils/debugApi';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  
  // State for backend data
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data from backend
  useEffect(() => {
    // Debug API configuration
    debugApiConfig();
    
    const loadHomeData = async () => {
      try {
        setLoading(true);
        
        // Load all data in parallel
        const [statsData, activityData, healthData] = await Promise.all([
          homeApiService.getStats(),
          homeApiService.getRecentActivity(),
          homeApiService.getSystemHealth()
        ]);
        
        setStats(statsData);
        setRecentActivity(activityData);
        setSystemHealth(healthData);
        
      } catch (error) {
        console.error('Error loading home data:', error);
        message.error('Failed to load some data. Using cached values.');
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  // Helper function to get icon for activity type
  const getActivityIcon = (iconType: string) => {
    const iconProps = { style: { fontSize: '16px' } };
    
    switch (iconType) {
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} {...iconProps} />;
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} {...iconProps} />;
      case 'team':
        return <TeamOutlined style={{ color: '#1890ff' }} {...iconProps} />;
      case 'bank':
        return <BankOutlined style={{ color: '#722ed1' }} {...iconProps} />;
      default:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} {...iconProps} />;
    }
  };

  const heroSlides = [
    {
      title: "Modernizing Fuel Distribution",
      subtitle: "Digital transformation for efficient parliamentary fuel coupon management",
      image: "🏛️",
      color: "#1890ff"
    },
    {
      title: "Transparent Allocation",
      subtitle: "Real-time tracking and audit trails for complete transparency",
      image: "📊",
      color: "#52c41a"
    },
    {
      title: "Secure & Reliable",
      subtitle: "Enterprise-grade security with role-based access control",
      image: "🔒",
      color: "#722ed1"
    }
  ];

  const features = [
    {
      icon: <SafetyCertificateOutlined />,
      title: "Secure Management",
      description: "Role-based access control with comprehensive audit trails",
      color: "#1890ff"
    },
    {
      icon: <CarOutlined />,
      title: "Fuel Tracking",
      description: "Real-time monitoring of fuel allocation and consumption",
      color: "#52c41a"
    },
    {
      icon: <BarChartOutlined />,
      title: "Analytics & Reports",
      description: "Advanced analytics with customizable reporting dashboard",
      color: "#faad14"
    },
    {
      icon: <TeamOutlined />,
      title: "Multi-Center Support",
      description: "Distributed management across multiple sub-centers",
      color: "#722ed1"
    },
    {
      icon: <GlobalOutlined />,
      title: "Digital Transformation",
      description: "Paperless operations with QR codes and digital coupons",
      color: "#13c2c2"
    },
    {
      icon: <TrophyOutlined />,
      title: "Best Practices",
      description: "Built following international standards and best practices",
      color: "#eb2f96"
    }
  ];

  const stats_display = [
    { 
      title: "Active Users", 
      value: stats?.active_users || 0, 
      prefix: <UserOutlined />, 
      color: "#1890ff" 
    },
    { 
      title: "Sub-Centers", 
      value: stats?.sub_centers || 0, 
      prefix: <BankOutlined />, 
      color: "#52c41a" 
    },
    { 
      title: "Distributed Coupons", 
      value: stats?.distributed_coupons || 0, 
      prefix: <CarOutlined />, 
      color: "#faad14" 
    },
    { 
      title: "Success Rate", 
      value: stats?.success_rate || 0, 
      suffix: "%", 
      prefix: <TrophyOutlined />, 
      color: "#722ed1" 
    }
  ];

  const recentActivityDisplay = recentActivity.length > 0 ? recentActivity : [];

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <Layout className="min-h-screen">
      {/* Header */}
      <Header className="bg-white shadow-sm px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ParliamentLogo size="medium" />
        </div>
        
        <Space size="middle">
          <Button 
            type="default" 
            icon={<LoginOutlined />}
            onClick={() => setLoginModalOpen(true)}
            size="large"
          >
            Login
          </Button>
          <Button 
            type="primary" 
            icon={<UserAddOutlined />}
            onClick={() => setRegisterModalOpen(true)}
            size="large"
          >
            Register
          </Button>
        </Space>
      </Header>

      <Content className="relative" style={{ margin: '0 10px' }}>
        {/* Hero Section */}
        <section 
          className="py-20 relative"
          style={{
            backgroundImage: 'url(/background.avif)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            minHeight: '80vh'
          }}
        >
          {/* Overlay for better text readability */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-40"
            style={{ zIndex: 1 }}
          />
          <div className="max-w-7xl mx-auto relative" style={{ zIndex: 2, padding: '0 10px' }}>
            <Row gutter={[32, 32]} align="middle">
              <Col xs={24} lg={12}>
                <motion.div {...fadeInUp} style={{ margin: '0 10px' }}>
                  <Badge.Ribbon text="Government Official" color="gold">
                    <div className="mb-6">
                      <Title level={1} className="mb-4 text-white">
                        Modern Fuel Coupon
                        <br />
                        <span className="text-blue-300">Management System</span>
                      </Title>
                      <Paragraph className="text-xl text-gray-200 mb-6">
                        Streamline parliamentary fuel distribution with cutting-edge 
                        digital solutions. Secure, transparent, and efficient management 
                        for the modern government.
                      </Paragraph>
                      <Space size="large" className="mb-8">
                        <Button 
                          type="primary" 
                          size="large" 
                          icon={<RocketOutlined />}
                          onClick={() => setLoginModalOpen(true)}
                          className="px-8 py-6 h-auto"
                        >
                          Get Started
                        </Button>
                      </Space>
                      
                      {/* Parliament Logo 10px below Get Started button */}
                      <div style={{ marginTop: '10px' }}>
                        <img 
                          src="/logo.webp" 
                          alt="Parliament Logo" 
                          style={{ 
                            height: '120px', 
                            width: 'auto',
                            opacity: 0.7,
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                          }}
                        />
                      </div>
                    </div>
                  </Badge.Ribbon>
                </motion.div>
              </Col>
              
              <Col xs={24} lg={12}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <Card className="shadow-2xl border-0">
                    <Carousel 
                      autoplay 
                      effect="fade"
                      afterChange={setCurrentSlide}
                      dots={false}
                    >
                      {heroSlides.map((slide, index) => (
                        <div key={index}>
                          <div className="text-center py-12">
                            <div 
                              className="text-8xl mb-6"
                              style={{ color: slide.color }}
                            >
                              {slide.image}
                            </div>
                            <Title level={3} className="mb-3">
                              {slide.title}
                            </Title>
                            <Paragraph className="text-gray-600">
                              {slide.subtitle}
                            </Paragraph>
                          </div>
                        </div>
                      ))}
                    </Carousel>
                    <div className="flex justify-center gap-2 mt-4">
                      {heroSlides.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentSlide ? 'bg-blue-500 w-6' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </Col>
            </Row>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div {...fadeInUp}>
              <div className="text-center mb-12">
                <Title level={2} className="mb-4">
                  System Performance
                </Title>
                <Paragraph className="text-lg text-gray-600">
                  Real-time statistics showcasing our system's effectiveness
                </Paragraph>
              </div>
            </motion.div>
            
            <motion.div variants={staggerContainer} animate="animate">
              <Row gutter={[32, 32]}>
                {stats_display.map((stat, index) => (
                  <Col xs={12} lg={6} key={index}>
                    <motion.div variants={fadeInUp}>
                      <Card className="text-center shadow-lg hover:shadow-xl transition-shadow">
                        {loading ? (
                          <Spin size="large" />
                        ) : (
                          <Statistic
                            title={stat.title}
                            value={stat.value}
                            prefix={stat.prefix}
                            suffix={stat.suffix}
                            valueStyle={{ color: stat.color, fontSize: '2rem' }}
                          />
                        )}
                      </Card>
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div {...fadeInUp}>
              <div className="text-center mb-12">
                <Title level={2} className="mb-4">
                  Powerful Features
                </Title>
                <Paragraph className="text-lg text-gray-600">
                  Comprehensive tools designed for modern government operations
                </Paragraph>
              </div>
            </motion.div>

            <motion.div variants={staggerContainer} animate="animate">
              <Row gutter={[32, 32]}>
                {features.map((feature, index) => (
                  <Col xs={24} md={12} lg={8} key={index}>
                    <motion.div variants={fadeInUp}>
                      <Card 
                        className="h-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                        bordered={false}
                      >
                        <div className="text-center">
                          <div 
                            className="text-4xl mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full"
                            style={{ 
                              backgroundColor: `${feature.color}15`,
                              color: feature.color 
                            }}
                          >
                            {feature.icon}
                          </div>
                          <Title level={4} className="mb-3">
                            {feature.title}
                          </Title>
                          <Paragraph className="text-gray-600">
                            {feature.description}
                          </Paragraph>
                        </div>
                      </Card>
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </motion.div>
          </div>
        </section>

        {/* Activity & Progress Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <Row gutter={[48, 48]}>
              <Col xs={24} lg={12}>
                <motion.div {...fadeInUp}>
                  <Card className="h-full shadow-lg">
                    <Title level={3} className="mb-6 flex items-center gap-2">
                      <ClockCircleOutlined className="text-blue-500" />
                      Recent Activity
                    </Title>
                    {loading ? (
                      <div className="flex justify-center items-center h-64">
                        <Spin size="large" />
                      </div>
                    ) : (
                      <Timeline
                        items={recentActivityDisplay.map((activity, index) => ({
                          key: index,
                          dot: activity.icon || getActivityIcon(activity.icon_type || 'info'),
                          children: (
                            <>
                              <div className="mb-1">
                                <Text strong>{activity.title}</Text>
                              </div>
                              <div className="mb-1">
                                <Text type="secondary">{activity.description}</Text>
                              </div>
                              <Text type="secondary" className="text-sm">
                                {activity.time_display || activity.time}
                              </Text>
                            </>
                          )
                        }))}
                      />
                    )}
                  </Card>
                </motion.div>
              </Col>
              
              <Col xs={24} lg={12}>
                <motion.div {...fadeInUp}>
                  <Card className="h-full shadow-lg">
                    <Title level={3} className="mb-6 flex items-center gap-2">
                      <BarChartOutlined className="text-green-500" />
                      System Health Dashboard
                    </Title>
                    
                    {loading ? (
                      <div className="flex justify-center items-center h-64">
                        <Spin size="large" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-6">
                        {/* Server Performance Circular Gauge */}
                        <div className="text-center">
                          <div className="relative mb-3">
                            <Progress 
                              type="circle"
                              percent={systemHealth?.server_performance || 0} 
                              size={100}
                              strokeColor={{
                                '0%': '#52c41a',
                                '100%': '#73d13d',
                              }}
                              format={(percent) => (
                                <div className="text-center">
                                  <div className="text-lg font-bold text-gray-800">{percent}%</div>
                                  <div className="text-xs text-gray-500">Server</div>
                                </div>
                              )}
                            />
                          </div>
                          <Text className="text-sm font-medium">Server Performance</Text>
                        </div>

                        {/* Database Health Circular Gauge */}
                        <div className="text-center">
                          <div className="relative mb-3">
                            <Progress 
                              type="circle"
                              percent={systemHealth?.database_health || 0} 
                              size={100}
                              strokeColor={{
                                '0%': '#1890ff',
                                '100%': '#40a9ff',
                              }}
                              format={(percent) => (
                                <div className="text-center">
                                  <div className="text-lg font-bold text-gray-800">{percent}%</div>
                                  <div className="text-xs text-gray-500">DB</div>
                                </div>
                              )}
                            />
                          </div>
                          <Text className="text-sm font-medium">Database Health</Text>
                        </div>

                        {/* Security Score Circular Gauge */}
                        <div className="text-center">
                          <div className="relative mb-3">
                            <Progress 
                              type="circle"
                              percent={systemHealth?.security_score || 0} 
                              size={100}
                              strokeColor={{
                                '0%': '#722ed1',
                                '100%': '#9254de',
                              }}
                              format={(percent) => (
                                <div className="text-center">
                                  <div className="text-lg font-bold text-gray-800">{percent}%</div>
                                  <div className="text-xs text-gray-500">Security</div>
                                </div>
                              )}
                            />
                          </div>
                          <Text className="text-sm font-medium">Security Score</Text>
                        </div>

                        {/* User Satisfaction Circular Gauge */}
                        <div className="text-center">
                          <div className="relative mb-3">
                            <Progress 
                              type="circle"
                              percent={systemHealth?.user_satisfaction || 0} 
                              size={100}
                              strokeColor={{
                                '0%': '#faad14',
                                '100%': '#ffc53d',
                              }}
                              format={(percent) => (
                                <div className="text-center">
                                  <div className="text-lg font-bold text-gray-800">{percent}%</div>
                                  <div className="text-xs text-gray-500">Users</div>
                                </div>
                              )}
                            />
                          </div>
                          <Text className="text-sm font-medium">User Satisfaction</Text>
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              </Col>
            </Row>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center px-6">
            <motion.div {...fadeInUp}>
              <Title level={2} className="text-white mb-4">
                Ready to Get Started?
              </Title>
              <Paragraph className="text-xl text-blue-100 mb-8">
                Join hundreds of government officials already using our system 
                to manage fuel distribution efficiently and transparently.
              </Paragraph>
              <Space size="large">
                <Button 
                  type="primary" 
                  size="large"
                  ghost
                  icon={<UserAddOutlined />}
                  onClick={() => setRegisterModalOpen(true)}
                  className="px-8 py-6 h-auto"
                >
                  Create Account
                </Button>
                <Button 
                  size="large"
                  className="bg-white text-blue-600 border-white hover:bg-gray-100 px-8 py-6 h-auto"
                  icon={<ArrowRightOutlined />}
                  onClick={() => setLoginModalOpen(true)}
                >
                  Sign In Now
                </Button>
              </Space>
            </motion.div>
          </div>
        </section>
      </Content>

      {/* Footer */}
      <Footer className="bg-gray-800 text-center">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <div className="text-white">
                <Title level={4} className="text-white mb-4">
                  Parliament of Zimbabwe
                </Title>
                <Paragraph className="text-gray-300">
                  Digital transformation for efficient and transparent 
                  government operations.
                </Paragraph>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-white">
                <Title level={5} className="text-white mb-4">
                  Quick Links
                </Title>
                <div className="space-y-2">
                  <div><a href="#" className="text-gray-300 hover:text-white">About Us</a></div>
                  <div><a href="#" className="text-gray-300 hover:text-white">Contact</a></div>
                  <div><a href="#" className="text-gray-300 hover:text-white">Support</a></div>
                  <div><a href="#" className="text-gray-300 hover:text-white">Documentation</a></div>
                </div>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-white">
                <Title level={5} className="text-white mb-4">
                  Contact Info
                </Title>
                <div className="space-y-2 text-gray-300">
                  <div>📍 Parliament Building, Harare</div>
                  <div>📞 +263-4-700-151</div>
                  <div>✉️ info@parliament.gov.zw</div>
                </div>
              </div>
            </Col>
          </Row>
          
          <Divider className="border-gray-600 my-8" />
          
          <Text className="text-gray-400">
            © 2025 Parliament of Zimbabwe. All rights reserved. | 
            Fuel Coupon Management System v2.0
          </Text>
        </div>
      </Footer>

      {/* Login Modal */}
      <LoginModal 
        open={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
        onSwitchToRegister={() => {
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
      />

      {/* Register Modal */}
      <RegisterModal 
        open={registerModalOpen} 
        onClose={() => setRegisterModalOpen(false)} 
        onSwitchToLogin={() => {
          setRegisterModalOpen(false);
          setLoginModalOpen(true);
        }}
      />
    </Layout>
  );
};

export default Home;
