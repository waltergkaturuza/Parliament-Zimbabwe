// src/components/CouponCalculations.tsx
// Shared calculations display component
import React from 'react';
import {
  Card,
  Descriptions,
  Typography,
  Tag,
  Space,
  Statistic,
  Row,
  Col
} from 'antd';
import { DollarOutlined, CalculatorOutlined } from '@ant-design/icons';
import { calculateLastCouponId, calculateMonetaryValues } from '../utils/couponCalculations';

const { Title, Text } = Typography;

interface CouponCalculationsProps {
  firstCouponId?: string;
  totalCoupons?: number;
  fuelType?: string;
  couponAmount?: number;
  pricePerLitre?: number;
  numberOfBooks?: number;
}

export const CouponCalculations: React.FC<CouponCalculationsProps> = ({
  firstCouponId,
  totalCoupons,
  fuelType,
  couponAmount,
  pricePerLitre,
  numberOfBooks
}) => {
  const lastCouponId = firstCouponId && totalCoupons 
    ? calculateLastCouponId(firstCouponId, totalCoupons)
    : 'Not calculated';

  const monetaryValues = fuelType && couponAmount && totalCoupons && pricePerLitre
    ? calculateMonetaryValues(fuelType, couponAmount, totalCoupons, pricePerLitre)
    : null;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>🧮 Coupon Calculations</Title>
        <Text type="secondary">
          Auto-calculated values based on your inputs
        </Text>
      </div>

      {/* Coupon Range Calculations */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Title level={5} style={{ marginBottom: 16 }}>
          <Space>
            <CalculatorOutlined />
            Coupon Range Calculations
          </Space>
        </Title>
        
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card size="small" style={{ backgroundColor: '#f0f9ff' }}>
              <Statistic
                title="First Coupon Number"
                value={firstCouponId || 'Not set'}
                valueStyle={{ color: '#1890ff', fontFamily: 'monospace' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" style={{ backgroundColor: '#f0f9ff' }}>
              <Statistic
                title="Last Coupon Number (Calculated)"
                value={lastCouponId}
                valueStyle={{ color: '#1890ff', fontFamily: 'monospace' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={8}>
            <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
              <Statistic
                title="Total Coupons"
                value={totalCoupons || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
              <Statistic
                title="Number of Books"
                value={numberOfBooks || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
              <Statistic
                title="Coupons per Book (Avg)"
                value={numberOfBooks && totalCoupons ? Math.round(totalCoupons / numberOfBooks) : 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {firstCouponId && totalCoupons && (
          <Card size="small" style={{ marginTop: 16, backgroundColor: '#fff7e6' }}>
            <Text strong>Calculation Formula: </Text>
            <Text code>
              Last Number = First Number + Total Coupons - 1
            </Text>
            <br />
            <Text type="secondary">
              Example: {firstCouponId} + {totalCoupons} - 1 = {lastCouponId}
            </Text>
          </Card>
        )}
      </Card>

      {/* Monetary Calculations */}
      {monetaryValues && (
        <Card style={{ marginBottom: 16 }} size="small">
          <Title level={5} style={{ marginBottom: 16 }}>
            <Space>
              <DollarOutlined />
              Monetary Value Calculations
            </Space>
          </Title>
          
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card size="small" style={{ backgroundColor: '#fff2e8' }}>
                <Statistic
                  title="Total Litres"
                  value={monetaryValues.totalLitres}
                  suffix="L"
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ backgroundColor: '#fff2e8' }}>
                <Statistic
                  title="Value (USD)"
                  value={monetaryValues.monetaryValueUSD}
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ backgroundColor: '#fff2e8' }}>
                <Statistic
                  title="Value (ZWG)"
                  value={monetaryValues.monetaryValueZWG}
                  prefix="ZWG "
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          <Card size="small" style={{ marginTop: 16, backgroundColor: '#f9f0ff' }}>
            <Text strong>Calculation Details: </Text>
            <br />
            <Text>Total Litres = {totalCoupons} coupons × {couponAmount}L = {monetaryValues.totalLitres}L</Text>
            <br />
            <Text>USD Value = {monetaryValues.totalLitres}L × ${pricePerLitre}/L = ${monetaryValues.monetaryValueUSD}</Text>
            <br />
            <Text>ZWG Value = ${monetaryValues.monetaryValueUSD} × 25,000 = ZWG {monetaryValues.monetaryValueZWG.toLocaleString()}</Text>
          </Card>
        </Card>
      )}

      {/* Summary Information */}
      <Card size="small">
        <Title level={5}>📋 Summary</Title>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Fuel Type">
            {fuelType ? <Tag color={fuelType === 'PETROL' ? 'blue' : 'green'}>{fuelType}</Tag> : 'Not specified'}
          </Descriptions.Item>
          <Descriptions.Item label="Coupon Denomination">
            {couponAmount ? `${couponAmount}L` : 'Not specified'}
          </Descriptions.Item>
          <Descriptions.Item label="Price per Litre">
            {pricePerLitre ? `$${pricePerLitre}` : 'Not specified'}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {firstCouponId && totalCoupons && monetaryValues ? (
              <Tag color="green">Calculations Complete</Tag>
            ) : (
              <Tag color="orange">Incomplete Data</Tag>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};