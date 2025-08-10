// src/pages/main-center/components/BoxVerificationPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Descriptions,
  Typography,
  Space,
  Tag,
  Collapse,
  Row,
  Col,
  Divider,
  Input,
  Form,
  Checkbox,
  message,
  Alert,
  Badge,
  Tooltip,
  Steps,
  Popconfirm
} from 'antd';
import {
  EyeOutlined,
  CheckOutlined,
  EditOutlined,
  PrinterOutlined,
  FileTextOutlined,
  SecurityScanOutlined,
  BookOutlined,
  BarcodeOutlined,
  SignatureOutlined,
  AuditOutlined
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '@/api/index';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;
const { Step } = Steps;

interface CouponSerial {
  id: string;
  serialNumber: string;
  status: 'ACTIVE' | 'USED' | 'DAMAGED' | 'EXPIRED';
  position: number; // Position within the book
}

interface BookInfo {
  id: string;
  bookNumber: string;
  firstCouponId: string;
  lastCouponId: string;
  couponsPerBook: number;
  coupons: CouponSerial[];
  verified: boolean;
  verificationNotes?: string;
  verifiedBy?: string;
  verificationDate?: string;
}

interface BoxVerification {
  id: string;
  boxId: string;
  barcode: string;
  supplier: string;
  receivedDate: string;
  fuelType: 'PETROL' | 'DIESEL';
  couponAmount: 5 | 20 | 50;
  numberOfBooks: number;
  totalCoupons: number;
  firstCouponId: string;
  lastCouponId: string;
  status: 'PENDING' | 'VERIFIED' | 'SIGNED_OFF';
  books: BookInfo[];
  verificationStatus: {
    boxVerified: boolean;
    allBooksVerified: boolean;
    signedOff: boolean;
  };
  verificationNotes?: string;
  verifiedBy?: string;
  verificationDate?: string;
  signedOffBy?: string;
  signOffDate?: string;
}

const BoxVerificationPage: React.FC = () => {
  const [boxes, setBoxes] = useState<BoxVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBox, setSelectedBox] = useState<BoxVerification | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookInfo | null>(null);
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [bookDetailModalVisible, setBookDetailModalVisible] = useState(false);
  const [signOffModalVisible, setSignOffModalVisible] = useState(false);
  const [verificationForm] = Form.useForm();
  const [signOffForm] = Form.useForm();

  useEffect(() => {
    loadBoxes();
  }, []);

  const loadBoxes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/boxes/');
      const boxData = response.data.results || response.data || [];
      
      // Transform data and generate coupon serials for verification
      const transformedBoxes = boxData.map((box: any) => ({
        id: box.id,
        boxId: box.box_number || `BOX-${box.id}`,
        barcode: box.barcode || '',
        supplier: box.supplier || 'PetroTrade',
        receivedDate: box.received_date || new Date().toISOString().split('T')[0],
        fuelType: box.fuel_type || 'PETROL',
        couponAmount: box.coupon_denomination || 20,
        numberOfBooks: box.number_of_books || 0,
        totalCoupons: box.total_coupons || 0,
        firstCouponId: box.first_coupon_number || '',
        lastCouponId: box.last_coupon_number || '',
        status: box.verification_status || 'PENDING',
        books: generateBookInfo(
          box.number_of_books || 0,
          box.first_coupon_number || '',
          box.coupons_per_book || 10
        ),
        verificationStatus: {
          boxVerified: box.box_verified || false,
          allBooksVerified: box.all_books_verified || false,
          signedOff: box.signed_off || false
        },
        verificationNotes: box.verification_notes || '',
        verifiedBy: box.verified_by || '',
        verificationDate: box.verification_date || '',
        signedOffBy: box.signed_off_by || '',
        signOffDate: box.sign_off_date || ''
      }));

      setBoxes(transformedBoxes);
    } catch (error) {
      console.error('Error loading boxes:', error);
      message.error('Failed to load box data');
    } finally {
      setLoading(false);
    }
  };

  const generateBookInfo = (numberOfBooks: number, firstCouponId: string, couponsPerBook: number): BookInfo[] => {
    const books: BookInfo[] = [];
    
    if (!firstCouponId || numberOfBooks === 0) return books;

    // Extract prefix and starting number from first coupon ID
    const match = firstCouponId.match(/^([A-Z]+)(\d+)$/);
    if (!match) return books;

    const prefix = match[1];
    let currentCouponNumber = parseInt(match[2]);

    for (let bookIndex = 0; bookIndex < numberOfBooks; bookIndex++) {
      const bookFirstCouponNumber = currentCouponNumber;
      const bookLastCouponNumber = currentCouponNumber + couponsPerBook - 1;
      
      const bookFirstCouponId = `${prefix}${bookFirstCouponNumber.toString().padStart(6, '0')}`;
      const bookLastCouponId = `${prefix}${bookLastCouponNumber.toString().padStart(6, '0')}`;

      // Generate individual coupon serials for this book
      const coupons: CouponSerial[] = [];
      for (let couponIndex = 0; couponIndex < couponsPerBook; couponIndex++) {
        const couponNumber = currentCouponNumber + couponIndex;
        coupons.push({
          id: `coupon-${couponNumber}`,
          serialNumber: `${prefix}${couponNumber.toString().padStart(6, '0')}`,
          status: 'ACTIVE',
          position: couponIndex + 1
        });
      }

      books.push({
        id: `book-${bookIndex + 1}`,
        bookNumber: `Book ${bookIndex + 1}`,
        firstCouponId: bookFirstCouponId,
        lastCouponId: bookLastCouponId,
        couponsPerBook,
        coupons,
        verified: false
      });

      currentCouponNumber = bookLastCouponNumber + 1;
    }

    return books;
  };

  const handleVerifyBox = (box: BoxVerification) => {
    setSelectedBox(box);
    setVerificationModalVisible(true);
    verificationForm.setFieldsValue({
      boxId: box.boxId,
      verificationNotes: box.verificationNotes || ''
    });
  };

  const handleViewBookDetails = (book: BookInfo, box: BoxVerification) => {
    setSelectedBook(book);
    setSelectedBox(box);
    setBookDetailModalVisible(true);
  };

  const handleVerifyBook = async (bookId: string, verified: boolean, notes?: string) => {
    if (!selectedBox) return;

    try {
      // Update book verification status
      const updatedBoxes = boxes.map(box => {
        if (box.id === selectedBox.id) {
          const updatedBooks = box.books.map(book => {
            if (book.id === bookId) {
              return {
                ...book,
                verified,
                verificationNotes: notes || '',
                verifiedBy: 'Current User', // Replace with actual user
                verificationDate: new Date().toISOString()
              };
            }
            return book;
          });

          const allBooksVerified = updatedBooks.every(book => book.verified);
          
          return {
            ...box,
            books: updatedBooks,
            verificationStatus: {
              ...box.verificationStatus,
              allBooksVerified
            }
          };
        }
        return box;
      });

      setBoxes(updatedBoxes);
      message.success(`Book ${verified ? 'verified' : 'verification removed'} successfully`);
    } catch (error) {
      message.error('Failed to update book verification');
    }
  };

  const handleSignOff = (box: BoxVerification) => {
    if (!box.verificationStatus.boxVerified || !box.verificationStatus.allBooksVerified) {
      message.warning('Please verify the box and all books before signing off');
      return;
    }
    
    setSelectedBox(box);
    setSignOffModalVisible(true);
    signOffForm.setFieldsValue({
      boxId: box.boxId,
      signOffNotes: ''
    });
  };

  const columns: ColumnsType<BoxVerification> = [
    {
      title: 'Box ID',
      dataIndex: 'boxId',
      key: 'boxId',
      width: 120,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Fuel Type',
      dataIndex: 'fuelType',
      key: 'fuelType',
      width: 100,
      render: (text) => (
        <Tag color={text === 'PETROL' ? 'blue' : 'green'}>{text}</Tag>
      )
    },
    {
      title: 'Coupon Range',
      key: 'couponRange',
      width: 200,
      render: (record) => (
        <div>
          <div><Text code>{record.firstCouponId}</Text></div>
          <div style={{ fontSize: '12px', color: '#666' }}>to</div>
          <div><Text code>{record.lastCouponId}</Text></div>
        </div>
      )
    },
    {
      title: 'Books',
      dataIndex: 'numberOfBooks',
      key: 'numberOfBooks',
      width: 80,
      render: (text, record) => (
        <div className="text-center">
          <div>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.books.filter(book => book.verified).length} verified
          </div>
        </div>
      )
    },
    {
      title: 'Total Coupons',
      dataIndex: 'totalCoupons',
      key: 'totalCoupons',
      width: 100,
      render: (text) => text.toLocaleString()
    },
    {
      title: 'Verification Status',
      key: 'verificationStatus',
      width: 150,
      render: (record) => {
        const { boxVerified, allBooksVerified, signedOff } = record.verificationStatus;
        
        if (signedOff) {
          return <Badge status="success" text="Signed Off" />;
        } else if (boxVerified && allBooksVerified) {
          return <Badge status="processing" text="Ready for Sign-off" />;
        } else if (boxVerified) {
          return <Badge status="warning" text="Box Verified" />;
        } else {
          return <Badge status="error" text="Pending Verification" />;
        }
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (record) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleVerifyBox(record)}
          >
            Verify
          </Button>
          <Button
            icon={<SignatureOutlined />}
            size="small"
            type="primary"
            disabled={!record.verificationStatus.boxVerified || !record.verificationStatus.allBooksVerified}
            onClick={() => handleSignOff(record)}
          >
            Sign Off
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Title level={4}>Box & Coupon Verification</Title>
          <Text type="secondary">
            Verify each box and its books, then confirm and sign off on the coupon serials
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={boxes}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Box Verification Modal */}
      <Modal
        title={`Verify Box: ${selectedBox?.boxId}`}
        visible={verificationModalVisible}
        onCancel={() => setVerificationModalVisible(false)}
        width={1000}
        footer={[
          <Button key="cancel" onClick={() => setVerificationModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="verify"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              // Handle box verification
              message.success('Box verified successfully');
              setVerificationModalVisible(false);
            }}
          >
            Verify Box
          </Button>
        ]}
      >
        {selectedBox && (
          <div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Box ID">{selectedBox.boxId}</Descriptions.Item>
              <Descriptions.Item label="Supplier">{selectedBox.supplier}</Descriptions.Item>
              <Descriptions.Item label="Fuel Type">{selectedBox.fuelType}</Descriptions.Item>
              <Descriptions.Item label="Coupon Amount">{selectedBox.couponAmount}L</Descriptions.Item>
              <Descriptions.Item label="Number of Books">{selectedBox.numberOfBooks}</Descriptions.Item>
              <Descriptions.Item label="Total Coupons">{selectedBox.totalCoupons}</Descriptions.Item>
              <Descriptions.Item label="First Coupon" span={2}>
                <Text code>{selectedBox.firstCouponId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Last Coupon" span={2}>
                <Text code>{selectedBox.lastCouponId}</Text>
              </Descriptions.Item>
            </Descriptions>

            <Divider>Books in this Box</Divider>

            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {selectedBox.books.map((book, index) => (
                <Card
                  key={book.id}
                  size="small"
                  style={{ marginBottom: 8 }}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{book.bookNumber}</span>
                      <Space>
                        {book.verified && (
                          <Tag color="green" icon={<CheckOutlined />}>Verified</Tag>
                        )}
                        <Button
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => handleViewBookDetails(book, selectedBox)}
                        >
                          View Coupons
                        </Button>
                        <Button
                          size="small"
                          type={book.verified ? "default" : "primary"}
                          icon={<CheckOutlined />}
                          onClick={() => handleVerifyBook(book.id, !book.verified)}
                        >
                          {book.verified ? 'Unverify' : 'Verify'}
                        </Button>
                      </Space>
                    </div>
                  }
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>Coupon Range:</Text><br/>
                      <Text code>{book.firstCouponId}</Text> to <Text code>{book.lastCouponId}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>Coupons:</Text> {book.couponsPerBook}<br/>
                      <Text strong>Status:</Text> {book.verified ? 
                        <Tag color="green">Verified</Tag> : 
                        <Tag color="orange">Pending</Tag>
                      }
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Book Detail Modal */}
      <Modal
        title={`Book Details: ${selectedBook?.bookNumber}`}
        visible={bookDetailModalVisible}
        onCancel={() => setBookDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setBookDetailModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="verify"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              if (selectedBook) {
                handleVerifyBook(selectedBook.id, !selectedBook.verified);
                setBookDetailModalVisible(false);
              }
            }}
          >
            {selectedBook?.verified ? 'Unverify Book' : 'Verify Book'}
          </Button>
        ]}
      >
        {selectedBook && (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Book Number">{selectedBook.bookNumber}</Descriptions.Item>
              <Descriptions.Item label="Coupons per Book">{selectedBook.couponsPerBook}</Descriptions.Item>
              <Descriptions.Item label="First Coupon">
                <Text code>{selectedBook.firstCouponId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Last Coupon">
                <Text code>{selectedBook.lastCouponId}</Text>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>Individual Coupon Serials</Title>
            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #d9d9d9', padding: 8, borderRadius: 4 }}>
              <Row gutter={[8, 8]}>
                {selectedBook.coupons.map((coupon, index) => (
                  <Col span={8} key={coupon.id}>
                    <div style={{ 
                      padding: 4, 
                      border: '1px solid #f0f0f0', 
                      borderRadius: 4,
                      textAlign: 'center',
                      fontSize: '12px'
                    }}>
                      <div style={{ fontWeight: 'bold' }}>#{coupon.position}</div>
                      <Text code style={{ fontSize: '11px' }}>{coupon.serialNumber}</Text>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>

            {selectedBook.verified && (
              <Alert
                style={{ marginTop: 16 }}
                message="Book Verified"
                description={`Verified by ${selectedBook.verifiedBy} on ${dayjs(selectedBook.verificationDate).format('YYYY-MM-DD HH:mm')}`}
                type="success"
                showIcon
              />
            )}
          </div>
        )}
      </Modal>

      {/* Sign-off Modal */}
      <Modal
        title={`Sign Off Box: ${selectedBox?.boxId}`}
        visible={signOffModalVisible}
        onCancel={() => setSignOffModalVisible(false)}
        onOk={() => {
          signOffForm.validateFields().then(values => {
            message.success('Box signed off successfully');
            setSignOffModalVisible(false);
          });
        }}
        okText="Sign Off"
        okButtonProps={{ danger: true }}
      >
        <Alert
          message="Final Sign-off"
          description="By signing off, you confirm that all coupons have been verified and are ready for distribution. This action cannot be undone."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form form={signOffForm} layout="vertical">
          <Form.Item
            name="signOffNotes"
            label="Sign-off Notes"
            rules={[{ required: true, message: 'Please provide sign-off notes' }]}
          >
            <TextArea
              rows={4}
              placeholder="Enter any final notes or observations..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BoxVerificationPage;
