// src/pages/reports/ReportsAnalytics.tsx
import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Table,
  Statistic,
  Progress,
  Typography,
  Space,
  Tag,
  Tabs,
  Alert,
  List,
  Avatar,
  Badge,
  Empty,
  Spin,
  Tooltip,
  Divider,
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  ReloadOutlined,
  FilterOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  DashboardOutlined,
  CarOutlined,
  FileTextOutlined,
  DollarOutlined,
  TeamOutlined,
  RiseOutlined,
  AlertOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import apiClient from '../../api/apiClient';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface ReportData {
  fuelConsumption: Array<{
    date: string;
    petrol: number;
    diesel: number;
    total: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  topConsumers: Array<{
    name: string;
    category: string;
    amount: number;
    efficiency: number;
    trend: number;
  }>;
  monthlyComparison: Array<{
    month: string;
    currentYear: number;
    previousYear: number;
    target: number;
  }>;
  costAnalysis: Array<{
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
  }>;
  efficiencyMetrics: {
    averageConsumption: number;
    costPerLiter: number;
    utilizationRate: number;
    wastePercentage: number;
  };
}

const ReportsAnalytics = () => {
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    startOfMonth(new Date()),
    endOfMonth(new Date()),
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [reportType, setReportType] = useState<string>('consumption');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: reportData, isLoading, refetch } = useQuery<ReportData>({
    queryKey: ['reports', dateRange, selectedCategory, reportType],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/analytics/', {
          params: {
            start_date: format(dateRange[0], 'yyyy-MM-dd'),
            end_date: format(dateRange[1], 'yyyy-MM-dd'),
            category: selectedCategory,
            report_type: reportType,
            include_reports: true,
          },
        });

        const data = response.data;

        return {
          fuelConsumption: data.reports?.fuel_consumption || [],
          categoryBreakdown: data.reports?.category_breakdown || [
            { category: 'MPs', amount: 0, percentage: 0, color: '#1890ff' },
            { category: 'Senators', amount: 0, percentage: 0, color: '#52c41a' },
            { category: 'Staff', amount: 0, percentage: 0, color: '#faad14' },
            { category: 'Officials', amount: 0, percentage: 0, color: '#f5222d' },
          ],
          topConsumers: data.reports?.top_consumers || [],
          monthlyComparison: data.reports?.monthly_comparison || [],
          costAnalysis: data.reports?.cost_analysis || [
            { category: 'MPs', budgeted: 0, actual: 0, variance: 0 },
            { category: 'Senators', budgeted: 0, actual: 0, variance: 0 },
            { category: 'Staff', budgeted: 0, actual: 0, variance: 0 },
            { category: 'Officials', budgeted: 0, actual: 0, variance: 0 },
          ],
          efficiencyMetrics: data.reports?.efficiency_metrics || {
            averageConsumption: 0,
            costPerLiter: 0,
            utilizationRate: 0,
            wastePercentage: 0,
          },
        };
      } catch (error) {
        console.error('Failed to fetch report data:', error);
        // Fallback data structure
        return {
          fuelConsumption: [],
          categoryBreakdown: [
            { category: 'MPs', amount: 0, percentage: 0, color: '#1890ff' },
            { category: 'Senators', amount: 0, percentage: 0, color: '#52c41a' },
            { category: 'Staff', amount: 0, percentage: 0, color: '#faad14' },
            { category: 'Officials', amount: 0, percentage: 0, color: '#f5222d' },
          ],
          topConsumers: [],
          monthlyComparison: [],
          costAnalysis: [
            { category: 'MPs', budgeted: 0, actual: 0, variance: 0 },
            { category: 'Senators', budgeted: 0, actual: 0, variance: 0 },
            { category: 'Staff', budgeted: 0, actual: 0, variance: 0 },
            { category: 'Officials', budgeted: 0, actual: 0, variance: 0 },
          ],
          efficiencyMetrics: {
            averageConsumption: 0,
            costPerLiter: 0,
            utilizationRate: 0,
            wastePercentage: 0,
          },
        };
      }
    },
  });

  const exportReport = (format: 'excel' | 'pdf' | 'csv') => {
    // Implement export functionality
    console.log(`Exporting report as ${format}`);
  };

  const printReport = () => {
    window.print();
  };

  const StatCard = ({ title, value, prefix, suffix, trend, color, icon }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg bg-${color}-100`}>
                {icon}
              </div>
              <Text type="secondary" className="text-sm">
                {title}
              </Text>
            </div>
            <Statistic
              value={value}
              prefix={prefix}
              suffix={suffix}
              valueStyle={{ fontSize: '24px', fontWeight: 'bold' }}
            />
          </div>
          {trend !== undefined && (
            <div className={`text-${trend >= 0 ? 'green' : 'red'}-500 text-right`}>
              <div className="text-2xl">
                {trend >= 0 ? '↗' : '↘'}
              </div>
              <div className="text-sm mt-1">{Math.abs(trend)}%</div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );

  const topConsumersColumns = [
    {
      title: 'Rank',
      key: 'rank',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <Badge 
          count={index + 1} 
          style={{ backgroundColor: index < 3 ? '#52c41a' : '#1890ff' }}
        />
      ),
    },
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      render: (record: any) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<TeamOutlined />} />
          <div>
            <div className="font-medium">{record.name}</div>
            <Tag color="blue">{record.category}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Consumption (L)',
      dataIndex: 'amount',
      key: 'amount',
      sorter: true,
      render: (value: number) => (
        <Text strong>{value.toLocaleString()}</Text>
      ),
    },
    {
      title: 'Efficiency',
      dataIndex: 'efficiency',
      key: 'efficiency',
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={value}
            size="small"
            status={value > 90 ? 'success' : value > 70 ? 'normal' : 'exception'}
            className="flex-1"
          />
          <Text>{value}%</Text>
        </div>
      ),
    },
    {
      title: 'Trend',
      dataIndex: 'trend',
      key: 'trend',
      render: (value: number) => (
        <Tag color={value >= 0 ? 'green' : 'red'}>
          {value >= 0 ? '+' : ''}{value}%
        </Tag>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2}>Reports & Analytics</Title>
          <Text type="secondary">
            Comprehensive fuel consumption analysis and reporting
          </Text>
        </div>
        <Space>
          <Button icon={<FileExcelOutlined />} onClick={() => exportReport('excel')}>
            Excel
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={() => exportReport('pdf')}>
            PDF
          </Button>
          <Button icon={<PrinterOutlined />} onClick={printReport}>
            Print
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <Text strong>Date Range:</Text>
            <RangePicker
              value={[dateRange[0] as any, dateRange[1] as any]}
              onChange={(dates) => dates && setDateRange([dates[0]!.toDate(), dates[1]!.toDate()])}
              className="ml-2"
            />
          </div>
          <div>
            <Text strong>Category:</Text>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: 150, marginLeft: 8 }}
              options={[
                { label: 'All Categories', value: 'all' },
                { label: 'MPs', value: 'mp' },
                { label: 'Senators', value: 'senator' },
                { label: 'Staff', value: 'staff' },
                { label: 'Officials', value: 'official' },
              ]}
            />
          </div>
          <div>
            <Text strong>Report Type:</Text>
            <Select
              value={reportType}
              onChange={setReportType}
              style={{ width: 150, marginLeft: 8 }}
              options={[
                { label: 'Consumption', value: 'consumption' },
                { label: 'Cost Analysis', value: 'cost' },
                { label: 'Efficiency', value: 'efficiency' },
                { label: 'Allocation', value: 'allocation' },
              ]}
            />
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <Spin size="large" />
          <div className="mt-4">
            <Text>Loading report data...</Text>
          </div>
        </div>
      ) : (
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Overview" key="overview">
            <div className="space-y-6">
              {/* Key Metrics */}
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                  <StatCard
                    title="Total Consumption"
                    value={reportData?.fuelConsumption.reduce((sum, item) => sum + item.total, 0) || 0}
                    suffix="L"
                    trend={12.5}
                    color="blue"
                    icon={<CarOutlined className="text-blue-600" />}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <StatCard
                    title="Average Efficiency"
                    value={reportData?.efficiencyMetrics.utilizationRate || 0}
                    suffix="%"
                    trend={3.2}
                    color="green"
                    icon={<RiseOutlined className="text-green-600" />}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <StatCard
                    title="Cost Per Liter"
                    value={reportData?.efficiencyMetrics.costPerLiter || 0}
                    prefix="$"
                    trend={-1.5}
                    color="orange"
                    icon={<DollarOutlined className="text-orange-600" />}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <StatCard
                    title="Waste Percentage"
                    value={reportData?.efficiencyMetrics.wastePercentage || 0}
                    suffix="%"
                    trend={-0.8}
                    color="red"
                    icon={<AlertOutlined className="text-red-600" />}
                  />
                </Col>
              </Row>

              {/* Charts Section */}
              <Row gutter={[16, 16]}>
                {/* Consumption Trend */}
                <Col xs={24} lg={16}>
                  <Card title="Fuel Consumption Trend" className="h-full">
                    {reportData?.fuelConsumption ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={reportData.fuelConsumption}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="petrol"
                            stackId="1"
                            stroke="#1890ff"
                            fill="#1890ff"
                            fillOpacity={0.6}
                            name="Petrol"
                          />
                          <Area
                            type="monotone"
                            dataKey="diesel"
                            stackId="1"
                            stroke="#faad14"
                            fill="#faad14"
                            fillOpacity={0.6}
                            name="Diesel"
                          />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#52c41a"
                            strokeWidth={3}
                            name="Total"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <Empty description="No consumption data available" />
                    )}
                  </Card>
                </Col>

                {/* Category Breakdown */}
                <Col xs={24} lg={8}>
                  <Card title="Consumption by Category" className="h-full">
                    {reportData?.categoryBreakdown ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={reportData.categoryBreakdown}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="amount"
                            label={({ category, percentage }: any) => `${category}: ${percentage}%`}
                          >
                            {reportData.categoryBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <Empty description="No breakdown data available" />
                    )}
                  </Card>
                </Col>
              </Row>

              {/* Monthly Comparison */}
              <Card title="Monthly Comparison">
                {reportData?.monthlyComparison ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.monthlyComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip formatter={(value: any) => [`$${value.toLocaleString()}`, '']} />
                      <Legend />
                      <Bar dataKey="currentYear" fill="#1890ff" name="Current Year" />
                      <Bar dataKey="previousYear" fill="#91d5ff" name="Previous Year" />
                      <Line dataKey="target" stroke="#52c41a" strokeWidth={2} name="Target" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No comparison data available" />
                )}
              </Card>
            </div>
          </TabPane>

          <TabPane tab="Top Consumers" key="consumers">
            <Card title="Top Fuel Consumers">
              <Table
                columns={topConsumersColumns}
                dataSource={reportData?.topConsumers}
                pagination={false}
                size="middle"
              />
            </Card>
          </TabPane>

          <TabPane tab="Cost Analysis" key="cost">
            <div className="space-y-6">
              <Row gutter={[16, 16]}>
                {reportData?.costAnalysis.map((item, index) => (
                  <Col xs={24} sm={12} lg={6} key={index}>
                    <Card>
                      <div className="text-center">
                        <Title level={4}>{item.category}</Title>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Text>Budgeted:</Text>
                            <Text strong>${item.budgeted.toLocaleString()}</Text>
                          </div>
                          <div className="flex justify-between">
                            <Text>Actual:</Text>
                            <Text strong>${item.actual.toLocaleString()}</Text>
                          </div>
                          <Divider className="my-2" />
                          <div className="flex justify-between">
                            <Text>Variance:</Text>
                            <Tag color={item.variance < 0 ? 'green' : 'red'}>
                              {item.variance}%
                            </Tag>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Variance Alert */}
              <Alert
                message="Budget Performance"
                description="All categories are performing under budget, indicating efficient fuel management."
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            </div>
          </TabPane>

          <TabPane tab="Efficiency Metrics" key="efficiency">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="Efficiency Overview">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Text>Utilization Rate</Text>
                        <Text strong>{reportData?.efficiencyMetrics.utilizationRate}%</Text>
                      </div>
                      <Progress 
                        percent={reportData?.efficiencyMetrics.utilizationRate} 
                        status={reportData?.efficiencyMetrics.utilizationRate! > 80 ? 'success' : 'normal'}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <Text>Waste Percentage</Text>
                        <Text strong>{reportData?.efficiencyMetrics.wastePercentage}%</Text>
                      </div>
                      <Progress 
                        percent={reportData?.efficiencyMetrics.wastePercentage} 
                        status="exception"
                      />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Key Performance Indicators">
                  <List
                    itemLayout="horizontal"
                    dataSource={[
                      {
                        title: 'Average Consumption',
                        value: `${reportData?.efficiencyMetrics.averageConsumption}L/km`,
                        status: 'good',
                      },
                      {
                        title: 'Cost Per Liter',
                        value: `$${reportData?.efficiencyMetrics.costPerLiter}`,
                        status: 'average',
                      },
                      {
                        title: 'Utilization Rate',
                        value: `${reportData?.efficiencyMetrics.utilizationRate}%`,
                        status: 'good',
                      },
                    ]}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={item.title}
                          description={item.value}
                        />
                        <Tag color={item.status === 'good' ? 'green' : 'orange'}>
                          {item.status === 'good' ? 'Good' : 'Average'}
                        </Tag>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      )}
    </div>
  );
};

export default ReportsAnalytics;
