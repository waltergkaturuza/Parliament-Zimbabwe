// src/pages/analytics/UsageAnalytics.tsx
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Select, Button, Table, Typography, Spin, message, Dropdown, Menu } from 'antd';
import { BarChartOutlined, DollarOutlined, RiseOutlined, PieChartOutlined, DownloadOutlined, SyncOutlined } from '@ant-design/icons';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import analyticsApi, { UsageAnalyticsData } from '../../api/analytics';
import { generateLineChartData, generateBarChartData, generatePieChartData, formatCurrency, formatNumber, formatPercentage } from '../../utils/analytics';
import apiClient from '@/api/index';
import dayjs from 'dayjs';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTitle,
  Tooltip,
  Legend
);

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const UsageAnalytics: FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UsageAnalyticsData>({
    totalCouponsIssued: 0,
    totalCouponsUsed: 0,
    totalFuelLiters: 0,
    totalCostUSD: 0,
    usageRate: 0,
    dailyUsage: [],
    subCenterUsage: [],
    beneficiaryUsage: [],
    fuelTypeBreakdown: []
  });
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [selectedSubCenter, setSelectedSubCenter] = useState<string>('all');
  const [subCenters, setSubCenters] = useState<any[]>([]);

  useEffect(() => {
    loadSubCenters();
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, selectedSubCenter]);

  const loadSubCenters = async () => {
    try {
      const response = await apiClient.get('/subcenters/');
      const subCenterData = response.data.results || response.data;
      setSubCenters(subCenterData);
    } catch (error) {
      console.error('Error loading sub centers:', error);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const params = {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        sub_center: selectedSubCenter !== 'all' ? selectedSubCenter : undefined
      };

      // Use real analytics API
      const analyticsData = await analyticsApi.getUsageAnalytics(params);
      setData(analyticsData);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
      message.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format: 'csv' | 'pdf' | 'excel' = 'excel') => {
    try {
      const params = {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        sub_center: selectedSubCenter !== 'all' ? selectedSubCenter : undefined,
        format
      };
      
      await analyticsApi.exportAnalytics(params);
      message.success(`Analytics data exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      message.error('Failed to export analytics data');
    }
  };

  // Chart configurations using Chart.js format
  const lineChartData = generateLineChartData(data);
  const barChartData = generateBarChartData(data);
  const pieChartData = generatePieChartData(data);

  const lineChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Liters'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Coupons'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Sub Centers'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Coupons Used'
        }
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = data.fuelTypeBreakdown.reduce((sum, item) => sum + item.value, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ${context.raw} L (${percentage}%)`;
          }
        }
      }
    },
  };

  const topBeneficiariesColumns = [
    {
      title: 'Beneficiary',
      dataIndex: 'beneficiary',
      key: 'beneficiary'
    },
    {
      title: 'Coupons Used',
      dataIndex: 'coupons',
      key: 'coupons',
      render: (coupons: number) => formatNumber(coupons),
      sorter: (a: any, b: any) => a.coupons - b.coupons
    },
    {
      title: 'Fuel (L)',
      dataIndex: 'liters',
      key: 'liters',
      render: (liters: number) => formatNumber(liters),
      sorter: (a: any, b: any) => a.liters - b.liters
    },
    {
      title: 'Cost (USD)',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => formatCurrency(cost),
      sorter: (a: any, b: any) => a.cost - b.cost
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'Rockwell, serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ fontFamily: 'Rockwell, serif', fontSize: '18px', margin: 0 }}>
          Fuel Usage Analytics
        </Title>
        <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: '16px' }}>
          Comprehensive analytics and insights on fuel coupon usage
        </p>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Date Range:
              </label>
              <RangePicker
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                style={{ width: '100%' }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Sub Center:
              </label>
              <Select
                value={selectedSubCenter}
                onChange={setSelectedSubCenter}
                style={{ width: '100%' }}
              >
                <Option value="all">All Sub Centers</Option>
                {subCenters.map((center) => (
                  <Option key={center.id} value={center.id}>
                    {center.name}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <div style={{ paddingTop: '32px' }}>
              <Button
                icon={<SyncOutlined />}
                onClick={loadAnalyticsData}
                style={{ marginRight: '8px' }}
              >
                Refresh
              </Button>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'excel',
                      label: 'Export as Excel',
                      onClick: () => exportData('excel')
                    },
                    {
                      key: 'csv',
                      label: 'Export as CSV',
                      onClick: () => exportData('csv')
                    },
                    {
                      key: 'pdf',
                      label: 'Export as PDF',
                      onClick: () => exportData('pdf')
                    }
                  ]
                }}
                trigger={['click']}
              >
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                >
                  Export
                </Button>
              </Dropdown>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Coupons Issued"
              value={formatNumber(data.totalCouponsIssued)}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Coupons Used"
              value={formatNumber(data.totalCouponsUsed)}
              suffix={`/ ${formatNumber(data.totalCouponsIssued)}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Fuel (L)"
              value={formatNumber(data.totalFuelLiters)}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Cost"
              value={formatCurrency(data.totalCostUSD)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Usage Rate */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card>
            <Statistic
              title="Overall Usage Rate"
              value={formatPercentage(data.usageRate)}
              valueStyle={{ 
                color: data.usageRate >= 80 ? '#52c41a' : 
                       data.usageRate >= 60 ? '#fa8c16' : '#ff4d4f',
                fontSize: '24px'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
          <Card>
            <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', marginBottom: '16px' }}>
              Daily Fuel Usage Trend
            </Title>
            <div style={{ height: '300px' }}>
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', marginBottom: '16px' }}>
              Fuel Type Breakdown
            </Title>
            <div style={{ height: '300px' }}>
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card>
            <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', marginBottom: '16px' }}>
              Sub Center Usage
            </Title>
            <div style={{ height: '300px' }}>
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            <Title level={4} style={{ fontFamily: 'Rockwell, serif', fontSize: '16px', marginBottom: '16px' }}>
              Top Beneficiaries by Usage
            </Title>
            <Table
              columns={topBeneficiariesColumns}
              dataSource={data.beneficiaryUsage}
              pagination={false}
              size="small"
              rowKey="beneficiary"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UsageAnalytics;
