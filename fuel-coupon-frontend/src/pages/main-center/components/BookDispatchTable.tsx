// src/pages/main-center/components/BookDispatchTable.tsx
import React from 'react';
import { Table, Tag, Button, Tooltip, Space } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EyeOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';

interface BookDispatch {
  id?: string | number;
  dispatchId: string;
  mainCenterDispatchNumber?: string;
  subCenterId?: string | number;
  subCenterName?: string;
  dispatchedBy: string;
  dispatchedDate?: string;
  dispatchedTime?: string;
  books?: any[];
  totalBooks?: number;
  totalCoupons?: number;
  totalLitres?: number;
  totalValueUsd?: number;
  totalValue?: number;
  totalValueZwg?: number;
  status?: string;
  trackingNumber?: string;
  notes?: string;
  receptionConfirmed?: boolean;
  receivedBy?: string;
  receivedDate?: string;
  receivedTime?: string;
}

interface BookDispatchTableProps {
  dispatches: BookDispatch[];
  loading: boolean;
  onViewDetails: (dispatch: BookDispatch) => void;
  onEditDispatch?: (dispatch: BookDispatch) => void;
}

// Memoized table component to prevent unnecessary re-renders
const BookDispatchTable: React.FC<BookDispatchTableProps> = React.memo(({ 
  dispatches, 
  loading, 
  onViewDetails, 
  onEditDispatch 
}) => {
  const columns: ColumnsType<BookDispatch> = [
    {
      title: 'Dispatch ID',
      dataIndex: 'dispatchId',
      key: 'dispatchId',
      width: 120,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {text || 'N/A'}
        </span>
      ),
    },
    {
      title: 'Sub-Center',
      dataIndex: 'subCenterName',
      key: 'subCenterName',
      width: 180,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text || 'Unknown'}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Dispatched By',
      dataIndex: 'dispatchedBy',
      key: 'dispatchedBy',
      width: 140,
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Date & Time',
      key: 'dateTime',
      width: 140,
      render: (_, record: BookDispatch) => (
        <div>
          <div style={{ fontSize: '12px' }}>{record.dispatchedDate || 'N/A'}</div>
          <div style={{ fontSize: '11px', color: '#666' }}>{record.dispatchedTime || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Books',
      dataIndex: 'totalBooks',
      key: 'totalBooks',
      width: 80,
      align: 'center',
      render: (value: number) => (
        <Tag color="blue">{value || 0}</Tag>
      ),
    },
    {
      title: 'Coupons',
      dataIndex: 'totalCoupons',
      key: 'totalCoupons',
      width: 90,
      align: 'center',
      render: (value: number) => (
        <Tag color="green">{(value || 0).toLocaleString()}</Tag>
      ),
    },
    {
      title: 'Value (USD)',
      dataIndex: 'totalValueUsd',
      key: 'totalValueUsd',
      width: 120,
      align: 'right',
      render: (value: number) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          ${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        let color = 'default';
        if (status === 'DISPATCHED') color = 'processing';
        else if (status === 'RECEIVED') color = 'success';
        else if (status === 'PENDING') color = 'warning';
        
        return <Tag color={color}>{status || 'UNKNOWN'}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record: BookDispatch) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewDetails(record)}
            />
          </Tooltip>
          {onEditDispatch && (
            <Tooltip title="Edit Dispatch">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEditDispatch(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={dispatches}
      loading={loading}
      rowKey={(record) => record.id?.toString() || record.dispatchId}
      scroll={{ x: 1200 }}
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} dispatches`,
      }}
      size="small"
    />
  );
});

BookDispatchTable.displayName = 'BookDispatchTable';

export default BookDispatchTable;