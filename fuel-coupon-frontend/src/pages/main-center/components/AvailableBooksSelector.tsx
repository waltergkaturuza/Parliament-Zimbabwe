// src/pages/main-center/components/AvailableBooksSelector.tsx
import React, { useMemo } from 'react';
import { Transfer, Tag, Space, Tooltip, Card, Statistic } from 'antd';
import { BookOutlined, DollarCircleOutlined, FileTextOutlined } from '@ant-design/icons';

interface AvailableBook {
  key: string;
  bookId: string;
  boxId: string;
  fuelType: 'PETROL' | 'DIESEL';
  couponAmount: 5 | 20;
  firstCouponId: string;
  lastCouponId: string;
  numberOfCoupons: number;
  value: number;
  pricePerLitre: number;
  status: string;
  serialRange: string;
  bookNumber?: number;
  isVerified: boolean;
  verifiedAt?: string;
  createdAt?: string;
  isGenerated?: boolean;
}

interface AvailableBooksSelectorProps {
  availableBooks: AvailableBook[];
  selectedBooks: string[];
  onSelectionChange: (targetKeys: string[]) => void;
  loading?: boolean;
}

// Memoized books selector component
const AvailableBooksSelector: React.FC<AvailableBooksSelectorProps> = React.memo(({ 
  availableBooks, 
  selectedBooks, 
  onSelectionChange,
  loading = false
}) => {
  // Memoize statistics calculation
  const stats = useMemo(() => {
    const selectedBooksData = availableBooks.filter(book => selectedBooks.includes(book.key));
    return {
      totalBooks: availableBooks.length,
      selectedBooks: selectedBooks.length,
      totalCoupons: selectedBooksData.reduce((sum, book) => sum + book.numberOfCoupons, 0),
      totalValue: selectedBooksData.reduce((sum, book) => sum + book.value, 0),
      petrolBooks: selectedBooksData.filter(book => book.fuelType === 'PETROL').length,
      dieselBooks: selectedBooksData.filter(book => book.fuelType === 'DIESEL').length,
    };
  }, [availableBooks, selectedBooks]);

  // Memoize render functions to prevent re-creation on each render
  const renderItem = useMemo(() => (item: AvailableBook) => {
    const customLabel = (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <BookOutlined />
          <span style={{ fontWeight: 'bold' }}>{item.bookId}</span>
          <Tag color={item.fuelType === 'PETROL' ? 'blue' : 'orange'}>
            {item.fuelType}
          </Tag>
          <Tag color="green">{item.couponAmount}L</Tag>
        </Space>
        <Space>
          <Tag color="purple">{item.numberOfCoupons} coupons</Tag>
          <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
            ${item.value.toLocaleString()}
          </span>
        </Space>
      </div>
    );

    return {
      label: customLabel,
      value: item.serialRange,
    };
  }, []);

  // Memoize filter function
  const filterOption = useMemo(() => (inputValue: string, item: AvailableBook) => {
    const searchText = inputValue.toLowerCase();
    return (
      item.bookId.toLowerCase().includes(searchText) ||
      item.fuelType.toLowerCase().includes(searchText) ||
      item.boxId.toLowerCase().includes(searchText) ||
      item.serialRange.toLowerCase().includes(searchText)
    );
  }, []);

  return (
    <div>
      {/* Selection Statistics */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <Statistic 
            title="Available Books" 
            value={stats.totalBooks} 
            prefix={<BookOutlined />} 
          />
          <Statistic 
            title="Selected Books" 
            value={stats.selectedBooks} 
            prefix={<FileTextOutlined />} 
          />
          <Statistic 
            title="Total Coupons" 
            value={stats.totalCoupons} 
            formatter={(value) => (value as number).toLocaleString()}
          />
          <Statistic 
            title="Total Value" 
            value={stats.totalValue} 
            prefix={<DollarCircleOutlined />}
            formatter={(value) => `$${(value as number).toLocaleString()}`}
          />
        </div>
        {stats.selectedBooks > 0 && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Space>
              <Tag color="blue">Petrol: {stats.petrolBooks}</Tag>
              <Tag color="orange">Diesel: {stats.dieselBooks}</Tag>
            </Space>
          </div>
        )}
      </Card>

      {/* Books Transfer Component */}
      <Transfer
        dataSource={availableBooks}
        targetKeys={selectedBooks}
        onChange={(targetKeys) => onSelectionChange(targetKeys.map(String))}
        render={renderItem}
        filterOption={filterOption}
        titles={['Available Books', 'Selected Books']}
        showSearch
        listStyle={{
          width: '45%',
          height: 400,
        }}
        operations={['Select', 'Remove']}
        locale={{
          itemUnit: 'book',
          itemsUnit: 'books',
          searchPlaceholder: 'Search books...',
          notFoundContent: 'No books found',
        }}
      />
    </div>
  );
});

AvailableBooksSelector.displayName = 'AvailableBooksSelector';

export default AvailableBooksSelector;