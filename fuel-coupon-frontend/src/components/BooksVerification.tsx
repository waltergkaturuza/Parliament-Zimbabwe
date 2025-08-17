// src/components/BooksVerification.tsx
// Extracted from BoxReceiptManagement step 3
import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Checkbox,
  Button,
  Typography,
  Space,
  Tag,
  Alert,
  message
} from 'antd';
import { CheckOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { type BookInfo } from '../utils/couponCalculations';

const { Title, Text } = Typography;

interface BooksVerificationProps {
  books: BookInfo[];
  form: any;
  couponAmount?: number;
}

export const BooksVerification: React.FC<BooksVerificationProps> = ({
  books,
  form,
  couponAmount = 0
}) => {
  const [verifiedBooks, setVerifiedBooks] = useState<number[]>([]);
  const [allBooksSelected, setAllBooksSelected] = useState(false);

  // Update allBooksSelected when verifiedBooks changes
  useEffect(() => {
    if (books.length > 0) {
      setAllBooksSelected(verifiedBooks.length === books.length);
    }
  }, [verifiedBooks, books.length]);

  const handleSelectAllBooks = () => {
    const allBookNumbers = Array.from({ length: books.length }, (_, i) => i + 1);
    
    if (allBooksSelected) {
      setVerifiedBooks([]);
      setAllBooksSelected(false);
    } else {
      setVerifiedBooks(allBookNumbers);
      setAllBooksSelected(true);
    }
  };

  const handleBookVerificationChange = (bookNumber: number, checked: boolean) => {
    if (checked) {
      setVerifiedBooks(prev => [...prev, bookNumber]);
    } else {
      setVerifiedBooks(prev => prev.filter(num => num !== bookNumber));
    }
  };

  const selectAllVerification = () => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every((checkbox: any) => checkbox.checked);
    checkboxes.forEach((checkbox: any) => {
      checkbox.checked = !allChecked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>✅ Books Verification</Title>
        <Text type="secondary">
          Verify coupon sequences, book integrity, and complete the verification checklist.
        </Text>
      </div>

      <Alert
        message="Verification Required"
        description="Complete the verification checklist and verify all generated books before proceeding."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Verification Checklist */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Form.Item
          label={
            <Space>
              <span>Verification Checklist</span>
              <Button 
                size="small" 
                type="link" 
                onClick={selectAllVerification}
              >
                Select All
              </Button>
            </Space>
          }
        >
          <Checkbox.Group style={{ width: '100%' }}>
            <Row>
              <Col span={24} style={{ marginBottom: 8 }}>
                <Checkbox value="first_coupon">
                  First coupon ID verified: <Text code>{form.getFieldValue('firstCouponId')}</Text>
                </Checkbox>
              </Col>
              <Col span={24} style={{ marginBottom: 8 }}>
                <Checkbox value="last_coupon">
                  Last coupon ID verified: <Text code>{form.getFieldValue('lastCouponId')}</Text>
                </Checkbox>
              </Col>
              <Col span={24} style={{ marginBottom: 8 }}>
                <Checkbox value="coupon_count">
                  Total coupon count matches: {form.getFieldValue('totalCoupons')} coupons
                </Checkbox>
              </Col>
              <Col span={24} style={{ marginBottom: 8 }}>
                <Checkbox value="book_integrity">
                  All {form.getFieldValue('numberOfBooks')} books are intact and properly bound
                </Checkbox>
              </Col>
              <Col span={24} style={{ marginBottom: 8 }}>
                <Checkbox value="barcode_scan">
                  Box barcode scanned successfully: <Text code>{form.getFieldValue('barcode')}</Text>
                </Checkbox>
              </Col>
              <Col span={24} style={{ marginBottom: 8 }}>
                <Checkbox value="no_damage">
                  No visible damage to coupons or books
                </Checkbox>
              </Col>
            </Row>
          </Checkbox.Group>
        </Form.Item>
      </Card>

      {/* Generated Books Verification */}
      <Card style={{ marginBottom: 16 }} size="small">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>📚 Books Verification ({books.length})</Title>
          <Space>
            <Button 
              size="small" 
              type={allBooksSelected ? "primary" : "default"}
              onClick={handleSelectAllBooks}
              icon={allBooksSelected ? <CheckOutlined /> : undefined}
            >
              {allBooksSelected ? 'Deselect All' : 'Select All'} Books
            </Button>
            <Text type="secondary">
              {verifiedBooks.length} / {books.length} verified
            </Text>
          </Space>
        </div>
        
        <Row gutter={[16, 16]}>
          {books.map((book, index) => {
            const bookNumber = index + 1;
            const isVerified = verifiedBooks.includes(bookNumber);
            return (
              <Col span={12} key={bookNumber}>
                <Card 
                  size="small" 
                  style={{ 
                    border: isVerified ? '2px solid #52c41a' : '1px solid #d9d9d9',
                    backgroundColor: isVerified ? '#f6ffed' : '#fff',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleBookVerificationChange(bookNumber, !isVerified)}
                  extra={
                    <Checkbox
                      checked={isVerified}
                      onChange={(e) => handleBookVerificationChange(bookNumber, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong>📖 Book {bookNumber}</Text>
                      {isVerified && <Tag color="green" icon={<CheckOutlined />}>VERIFIED</Tag>}
                    </div>
                    <Text type="secondary">First: <Text code>{book.firstCouponId}</Text></Text>
                    <Text type="secondary">Last: <Text code>{book.lastCouponId}</Text></Text>
                    <Text type="secondary">Coupons: <Tag color="blue">{book.numberOfCoupons}</Tag></Text>
                    <Text type="secondary">Value: <Tag color="orange">{book.numberOfCoupons * couponAmount} L</Tag></Text>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
        
        {verifiedBooks.length === books.length && books.length > 0 && (
          <Alert
            type="success"
            message="All Books Verified!"
            description={`Successfully verified all ${books.length} books. Ready for dispatch and processing.`}
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
        
        {books.length === 0 && (
          <Alert
            message="No books generated yet"
            description="Use the Intelligent Generator to create books first, then return here for verification."
            type="info"
            showIcon
          />
        )}
      </Card>

      {/* Print/Download Options */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Title level={5}>📄 Verification Documentation</Title>
        <Space>
          <Button 
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
          >
            Print Verification Report
          </Button>
          <Button 
            icon={<DownloadOutlined />}
            type="primary"
            ghost
          >
            Download PDF Report
          </Button>
        </Space>
      </Card>
    </div>
  );
};