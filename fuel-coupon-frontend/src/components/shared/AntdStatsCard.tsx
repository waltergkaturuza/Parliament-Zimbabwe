// src/components/shared/AntdStatsCard.tsx
import React from 'react';
import { Card as AntdCard, Statistic as AntdStatistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface AntdStatsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: number;
  percentage?: number;
  isPercentage?: boolean;
  status?: 'success' | 'warning' | 'error';
  alertLevel?: 'low' | 'medium' | 'high';
  previousValue?: number;
}

const AntdStatsCard: React.FC<AntdStatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  percentage,
  isPercentage,
  status,
  alertLevel,
  previousValue,
}) => (
  <AntdCard title={title} extra={icon} style={{ borderRadius: 10 }}>
    <AntdStatistic
      value={value}
      precision={typeof value === 'number' ? 2 : undefined}
      valueStyle={
        status === 'success'
          ? { color: '#3f8600' }
          : status === 'error'
          ? { color: '#cf1322' }
          : {}
      }
      prefix={
        trend !== undefined
          ? trend > 0
            ? <ArrowUpOutlined style={{ color: '#3f8600' }} />
            : trend < 0
            ? <ArrowDownOutlined style={{ color: '#cf1322' }} />
            : null
          : null
      }
      suffix={isPercentage && '%'}
    />
    {percentage !== undefined && (
      <span style={{
        marginLeft: 8,
        color: trend !== undefined ? (trend > 0 ? '#3f8600' : trend < 0 ? '#cf1322' : 'inherit') : 'inherit'
      }}>
        {trend !== undefined ? `${Math.abs(trend)} (${percentage}%)` : ''}
      </span>
    )}
    {alertLevel && (
      <div style={{ marginTop: 8, color: alertLevel === 'high' ? 'red' : alertLevel === 'medium' ? 'orange' : 'green' }}>
        Alert: {alertLevel}
      </div>
    )}
    {previousValue !== undefined && (
      <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
        Previous: {previousValue}
      </div>
    )}
  </AntdCard>
);

export default AntdStatsCard;
