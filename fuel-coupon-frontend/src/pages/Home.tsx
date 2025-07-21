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
  Divider
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
  UserAddOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import ParliamentLogo from '@/components/ParliamentLogo';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

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

  const stats = [
    { title: "Active Users", value: 1250, prefix: <UserOutlined />, color: "#1890ff" },
    { title: "Sub-Centers", value: 25, prefix: <BankOutlined />, color: "#52c41a" },
    { title: "Distributed Coupons", value: 15420, prefix: <CarOutlined />, color: "#faad14" },
    { title: "Success Rate", value: 99.8, suffix: "%", prefix: <TrophyOutlined />, color: "#722ed1" }
  ];

  const recentActivity = [
    {
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      title: "System Update Completed",
      description: "Latest security patches installed successfully",
      time: "2 hours ago"
    },
    {
      icon: <TeamOutlined style={{ color: '#1890ff' }} />,
      title: "New Sub-Center Added",
      description: "Chitungwiza East sub-center is now operational",
      time: "1 day ago"
    },
    {
      icon: <BarChartOutlined style={{ color: '#faad14' }} />,
      title: "Monthly Report Generated",
      description: "June 2025 distribution report available",
      time: "3 days ago"
    },
    {
      icon: <SafetyCertificateOutlined style={{ color: '#722ed1' }} />,
      title: "Security Audit Passed",
      description: "Annual security compliance review completed",
      time: "1 week ago"
    }
  ];

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
            onClick={() => navigate('/login')}
            size="large"
          >
            Login
          </Button>
          <Button 
            type="primary" 
            icon={<UserAddOutlined />}
            onClick={() => navigate('/register')}
            size="large"
          >
            Register
          </Button>
        </Space>
      </Header>

      <Content>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <Row gutter={[32, 32]} align="middle">
              <Col xs={24} lg={12}>
                <motion.div {...fadeInUp}>
                  <Badge.Ribbon text="Government Official" color="gold">
                    <div className="mb-6">
                      <Title level={1} className="mb-4 text-gray-800">
                        Modern Fuel Coupon
                        <br />
                        <span className="text-blue-600">Management System</span>
                      </Title>
                      <Paragraph className="text-xl text-gray-600 mb-6">
                        Streamline parliamentary fuel distribution with cutting-edge 
                        digital solutions. Secure, transparent, and efficient management 
                        for the modern government.
                      </Paragraph>
                      <Space size="large" className="mb-8">
                        <Button 
                          type="primary" 
                          size="large" 
                          icon={<RocketOutlined />}
                          onClick={() => navigate('/login')}
                          className="px-8 py-6 h-auto"
                        >
                          Get Started
                        </Button>
                        <Button 
                          size="large" 
                          icon={<BarChartOutlined />}
                          className="px-8 py-6 h-auto"
                        >
                          View Demo
                        </Button>
                      </Space>
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
                {stats.map((stat, index) => (
                  <Col xs={12} lg={6} key={index}>
                    <motion.div variants={fadeInUp}>
                      <Card className="text-center shadow-lg hover:shadow-xl transition-shadow">
                        <Statistic
                          title={stat.title}
                          value={stat.value}
                          prefix={stat.prefix}
                          suffix={stat.suffix}
                          valueStyle={{ color: stat.color, fontSize: '2rem' }}
                        />
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
                    <Timeline
                      items={recentActivity.map((activity, index) => ({
                        key: index,
                        dot: activity.icon,
                        children: (
                          <>
                            <div className="mb-1">
                              <Text strong>{activity.title}</Text>
                            </div>
                            <div className="mb-1">
                              <Text type="secondary">{activity.description}</Text>
                            </div>
                            <Text type="secondary" className="text-sm">
                              {activity.time}
                            </Text>
                          </>
                        )
                      }))}
                    />
                  </Card>
                </motion.div>
              </Col>
              
              <Col xs={24} lg={12}>
                <motion.div {...fadeInUp}>
                  <Card className="h-full shadow-lg">
                    <Title level={3} className="mb-6 flex items-center gap-2">
                      <BarChartOutlined className="text-green-500" />
                      System Health
                    </Title>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <Text>Server Performance</Text>
                          <Text strong>95%</Text>
                        </div>
                        <Progress 
                          percent={95} 
                          strokeColor="#52c41a"
                          showInfo={false}
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <Text>Database Health</Text>
                          <Text strong>98%</Text>
                        </div>
                        <Progress 
                          percent={98} 
                          strokeColor="#1890ff"
                          showInfo={false}
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <Text>Security Score</Text>
                          <Text strong>99%</Text>
                        </div>
                        <Progress 
                          percent={99} 
                          strokeColor="#722ed1"
                          showInfo={false}
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <Text>User Satisfaction</Text>
                          <Text strong>97%</Text>
                        </div>
                        <Progress 
                          percent={97} 
                          strokeColor="#faad14"
                          showInfo={false}
                        />
                      </div>
                    </div>
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
                  onClick={() => navigate('/register')}
                  className="px-8 py-6 h-auto"
                >
                  Create Account
                </Button>
                <Button 
                  size="large"
                  className="bg-white text-blue-600 border-white hover:bg-gray-100 px-8 py-6 h-auto"
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate('/login')}
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
    </Layout>
  );
};

export default Home;
