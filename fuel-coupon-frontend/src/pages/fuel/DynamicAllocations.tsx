// src/pages/fuel/DynamicAllocations.tsx
// Main Dynamic Fuel Allocation System page

import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Alert,
  message,
  Spin,
  Tooltip
} from 'antd';
import {
  CalculatorOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  SettingOutlined,
  FileTextOutlined,
  SyncOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { TabsProps } from 'antd';

// Components
import AllocationCalculator from '../../components/fuel/dynamic/AllocationCalculator';
import AllocationPreview from '../../components/fuel/dynamic/AllocationPreview';
import AllocationCommit from '../../components/fuel/dynamic/AllocationCommit';
import AllocationAnalytics from '../../components/fuel/dynamic/AllocationAnalytics';
import AllocationRulesManager from '../../components/fuel/dynamic/AllocationRulesManager';
import AllocationHistory from '../../components/fuel/dynamic/AllocationHistory';

// API
import dynamicAllocationApi from '../../api/dynamicAllocation';
import type {
  DynamicAllocation,
  AllocationPreviewResult,
  AllocationAnalytics as IAllocationAnalytics
} from '../../types/dynamicAllocation';

const { TabPane } = Tabs;

interface DashboardStats {
  totalAllocations: number;
  totalLitres: number;
  totalUSD: number;
  activeSessions: number;
}

const DynamicAllocations: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<string>('calculator');
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalAllocations: 0,
    totalLitres: 0,
    totalUSD: 0,
    activeSessions: 0
  });
  const [previewData, setPreviewData] = useState<AllocationPreviewResult[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Load dashboard statistics
  const loadStats = async () => {
    try {
      setLoading(true);
      const summary = await dynamicAllocationApi.analytics.getSummary();
      setStats({
        totalAllocations: summary.total_allocations,
        totalLitres: summary.total_litres,
        totalUSD: summary.total_usd,
        activeSessions: summary.active_sessions
      });
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      message.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  // Refresh all data
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    loadStats();
    message.success('Data refreshed successfully');
  };

  // Handle preview data from calculator
  const handlePreviewGenerated = (data: AllocationPreviewResult[]) => {
    setPreviewData(data);
    setActiveTab('preview');
  };

  // Handle successful commit
  const handleCommitSuccess = () => {
    setPreviewData([]);
    setActiveTab('analytics');
    loadStats();
  };

  // Load initial data
  useEffect(() => {
    loadStats();
  }, []);

  // Tab items configuration
  const tabItems: TabsProps['items'] = [
    {
      key: 'calculator',
      label: (
        <Space>
          <CalculatorOutlined />
          Calculator
        </Space>
      ),
      children: (
        <AllocationCalculator
          key={`calculator-${refreshKey}`}
          onPreviewGenerated={handlePreviewGenerated}
        />
      )
    },
    {
      key: 'preview',
      label: (
        <Space>
          <EyeOutlined />
          Preview
          {previewData.length > 0 && (
            <span style={{ 
              backgroundColor: '#f50',
              borderRadius: '10px',
              color: 'white',
              fontSize: '10px',
              padding: '2px 6px'
            }}>
              {previewData.length}
            </span>
          )}
        </Space>
      ),
      children: (
        <AllocationPreview
          key={`preview-${refreshKey}`}
          previewData={previewData}
          onDataChange={setPreviewData}
        />
      )
    },
    {
      key: 'commit',
      label: (
        <Space>
          <CheckCircleOutlined />
          Commit
        </Space>
      ),
      children: (
        <AllocationCommit
          key={`commit-${refreshKey}`}
          previewData={previewData}
          onCommitSuccess={handleCommitSuccess}
        />
      ),
      disabled: previewData.length === 0
    },
    {
      key: 'analytics',
      label: (
        <Space>
          <BarChartOutlined />
          Analytics
        </Space>
      ),
      children: (
        <AllocationAnalytics
          key={`analytics-${refreshKey}`}
        />
      )
    },
    {
      key: 'rules',
      label: (
        <Space>
          <SettingOutlined />
          Rules
        </Space>
      ),
      children: (
        <AllocationRulesManager
          key={`rules-${refreshKey}`}
        />
      )
    },
    {
      key: 'history',
      label: (
        <Space>
          <FileTextOutlined />
          History
        </Space>
      ),
      children: (
        <AllocationHistory
          key={`history-${refreshKey}`}
        />
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#1890ff' }}>
            Dynamic Fuel Allocation System
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>
            POZ Parliament Fuel Distribution Calculator
          </p>
        </Col>
        <Col>
          <Space>
            <Tooltip title="Refresh all data">
              <Button
                icon={<SyncOutlined />}
                onClick={handleRefresh}
                type="default"
              >
                Refresh
              </Button>
            </Tooltip>
            <Tooltip title="System information">
              <Button
                icon={<InfoCircleOutlined />}
                href="/fuel/allocations"
                type="link"
              >
                View Legacy System
              </Button>
            </Tooltip>
          </Space>
        </Col>
      </Row>

      {/* System Info Alert */}
      <Alert
        message="Dynamic Allocation System Active"
        description="Using POZ Parliament formulas: Base allocation = Distance × Engine constant × Distance factor. Engine constants: Small engines (< 2800cc) = 0.39, Medium engines (2800-3199cc) = 0.43, Large engines (≥ 3200cc) = 0.56."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
        closable
      />

      {/* Dashboard Statistics */}
      <Card 
        title="System Overview" 
        style={{ marginBottom: '24px' }}
        loading={loading}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Allocations"
              value={stats.totalAllocations}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Litres"
              value={stats.totalLitres}
              precision={2}
              suffix="L"
              prefix={<CalculatorOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Value (USD)"
              value={stats.totalUSD}
              precision={2}
              prefix="$"
              suffix="USD"
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Active Sessions"
              value={stats.activeSessions}
              prefix={<BarChartOutlined style={{ color: '#722ed1' }} />}
            />
          </Col>
        </Row>
      </Card>

      {/* Main Content Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
          items={tabItems}
          tabBarStyle={{
            marginBottom: '24px'
          }}
        />
      </Card>
    </div>
  );
};

export default DynamicAllocations;
