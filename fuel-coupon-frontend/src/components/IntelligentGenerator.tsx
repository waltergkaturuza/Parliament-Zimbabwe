// src/components/IntelligentGenerator.tsx
// Extracted from BoxReceiptManagement step 2
import React, { useState } from 'react';
import {
  Card,
  Radio,
  Row,
  Col,
  Form,
  Input,
  InputNumber,
  Button,
  Typography,
  Space,
  Alert,
  Tag,
  message
} from 'antd';
import { BarcodeOutlined } from '@ant-design/icons';
import { generateBooksFromMode, type BookInfo } from '../utils/couponCalculations';

const { Title, Text } = Typography;

interface SmartCalculationMode {
  mode: 'books-and-coupons' | 'first-and-last' | 'full-range';
  label: string;
  description: string;
}

const calculationModes: SmartCalculationMode[] = [
  {
    mode: 'books-and-coupons',
    label: 'Books & Coupons per Book',
    description: 'Specify number of books and coupons per book'
  },
  {
    mode: 'first-and-last',
    label: 'First & Last Coupon Range',
    description: 'Use first and last coupon IDs to calculate books'
  },
  {
    mode: 'full-range',
    label: 'Auto-Optimize Range',
    description: 'Automatically distribute coupons across books optimally'
  }
];

interface IntelligentGeneratorProps {
  onGenerate: (books: BookInfo[]) => void;
  form: any;
}

export const IntelligentGenerator: React.FC<IntelligentGeneratorProps> = ({
  onGenerate,
  form
}) => {
  const [calculationMode, setCalculationMode] = useState<SmartCalculationMode['mode']>('books-and-coupons');
  const [generatedBooks, setGeneratedBooks] = useState<BookInfo[]>([]);

  const canGenerate = () => {
    const values = form.getFieldsValue();
    
    switch (calculationMode) {
      case 'books-and-coupons':
        return values.firstCouponId && values.numberOfBooks && values.couponsPerBook;
      case 'first-and-last':
        return values.firstCouponId && values.lastCouponId && values.numberOfBooks;
      case 'full-range':
        return values.firstCouponId && values.lastCouponId && values.numberOfBooks;
      default:
        return false;
    }
  };

  const handleGenerateBooks = () => {
    try {
      const values = form.getFieldsValue();
      
      const books = generateBooksFromMode(calculationMode, {
        numberOfBooks: values.numberOfBooks,
        couponsPerBook: values.couponsPerBook,
        firstCouponId: values.firstCouponId,
        lastCouponId: values.lastCouponId,
      });
      
      if (books.length === 0) {
        message.error('Unable to generate books with the provided parameters');
        return;
      }
      
      setGeneratedBooks(books);
      onGenerate(books);
      
      // Update total coupons
      const totalCalculatedCoupons = books.reduce((sum, book) => sum + book.numberOfCoupons, 0);
      form.setFieldValue('totalCoupons', totalCalculatedCoupons);
      
      message.success(`Generated ${books.length} books successfully!`);
    } catch (error) {
      console.error('Error generating books:', error);
      message.error('Failed to generate books');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>🤖 Intelligent Book Generator</Title>
        <Text type="secondary">
          Choose your preferred calculation method. The system will automatically generate all book details.
        </Text>
      </div>

      {/* Smart Calculation Mode Selection */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Title level={5}>🔧 Generation Mode</Title>
        <Radio.Group 
          value={calculationMode} 
          onChange={(e) => setCalculationMode(e.target.value)}
          style={{ width: '100%' }}
        >
          <Row gutter={[16, 16]}>
            {calculationModes.map((mode) => (
              <Col span={8} key={mode.mode}>
                <Radio.Button 
                  value={mode.mode} 
                  style={{ width: '100%', height: 'auto', padding: '8px 12px' }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{mode.label}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {mode.description}
                    </div>
                  </div>
                </Radio.Button>
              </Col>
            ))}
          </Row>
        </Radio.Group>
      </Card>

      {/* Smart Input Fields based on calculation mode */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Title level={5}>📊 Generation Parameters</Title>
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              label="First Coupon ID"
              name="firstCouponId"
              rules={[{ required: true, message: 'Enter first coupon ID' }]}
            >
              <Input 
                placeholder="PU00GH355101"
                style={{ fontFamily: 'monospace', fontSize: '14px' }}
              />
            </Form.Item>
          </Col>

          {(calculationMode === 'first-and-last' || calculationMode === 'full-range') && (
            <Col span={8}>
              <Form.Item
                label="Last Coupon ID"
                name="lastCouponId"
                rules={[{ required: true, message: 'Enter last coupon ID' }]}
              >
                <Input 
                  placeholder="PU00GH357500"
                  style={{ fontFamily: 'monospace', fontSize: '14px' }}
                />
              </Form.Item>
            </Col>
          )}

          <Col span={8}>
            <Form.Item
              label="Number of Books"
              name="numberOfBooks"
              rules={[{ required: true, message: 'Enter number of books' }]}
            >
              <InputNumber
                min={1}
                max={50}
                style={{ width: '100%' }}
                placeholder="1-50 books"
              />
            </Form.Item>
          </Col>

          {calculationMode === 'books-and-coupons' && (
            <Col span={8}>
              <Form.Item
                label="Coupons per Book"
                name="couponsPerBook"
                rules={[{ required: true, message: 'Enter coupons per book' }]}
              >
                <InputNumber
                  min={1}
                  max={100}
                  style={{ width: '100%' }}
                  placeholder="1-100 coupons"
                />
              </Form.Item>
            </Col>
          )}
        </Row>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button 
            type="primary" 
            icon={<BarcodeOutlined />}
            onClick={handleGenerateBooks}
            disabled={!canGenerate()}
          >
            Generate Books Intelligently
          </Button>
        </div>
      </Card>

      {/* Generated Books Preview */}
      {generatedBooks.length > 0 && (
        <Card style={{ marginBottom: 16 }} size="small">
          <Title level={5}>📚 Generated Books Preview ({generatedBooks.length} books)</Title>
          <Row gutter={[16, 16]}>
            {generatedBooks.slice(0, 6).map((book, index) => (
              <Col span={12} key={index}>
                <Card size="small" style={{ backgroundColor: '#f9f9f9' }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>📖 {book.bookId}</Text>
                    <Text type="secondary">First: <Text code>{book.firstCouponId}</Text></Text>
                    <Text type="secondary">Last: <Text code>{book.lastCouponId}</Text></Text>
                    <Text type="secondary">Coupons: <Tag color="blue">{book.numberOfCoupons}</Tag></Text>
                  </Space>
                </Card>
              </Col>
            ))}
            {generatedBooks.length > 6 && (
              <Col span={24}>
                <Text type="secondary">
                  ... and {generatedBooks.length - 6} more books
                </Text>
              </Col>
            )}
          </Row>
        </Card>
      )}
    </div>
  );
};