import React from 'react';
import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tabs, Modal, Form, Input, Select, message } from 'antd';
import { useBeneficiaries } from '../../hooks/useDynamicAllocation';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';

const { TabPane } = Tabs;

const ParliamentOperationsPage: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const {
    beneficiaries,
    loading,
    error,
    pagination,
    filters,
    updatePagination,
    updateFilters
  } = useBeneficiaries();

  // Table columns configuration
  const columns = [
    {
      title: 'Name',
      dataIndex: ['user', 'name'],
      key: 'name',
      render: (_: any, record: any) => `${record.user.first_name} ${record.user.last_name}`
    },
    {
      title: 'Category',
      dataIndex: ['category', 'name'],
      key: 'category'
    },
    {
      title: 'Vehicle Registration',
      dataIndex: 'vehicle_registration',
      key: 'vehicle_registration'
    },
    {
      title: 'Monthly Entitlement',
      dataIndex: 'monthly_entitlement_litres',
      key: 'monthly_entitlement_litres',
      render: (value: number) => `${value}L`
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            type="link"
          />
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            type="link"
            danger
          />
        </Space>
      )
    }
  ];

  // Handle add/edit beneficiary
  const handleAddEdit = async (values: any) => {
    try {
      // TODO: Implement beneficiary creation/update
      message.success('Beneficiary saved successfully');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to save beneficiary');
    }
  };

  const handleEdit = (record: any) => {
    form.setFieldsValue({
      ...record,
      category: record.category?.id,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // TODO: Implement beneficiary deletion
      message.success('Beneficiary deleted successfully');
    } catch (error) {
      message.error('Failed to delete beneficiary');
    }
  };

  const items: TabsProps['items'] = [
    {
      key: 'beneficiaries',
      label: 'Beneficiaries',
      children: (
        <Card
          title="Beneficiaries Management"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                setIsModalVisible(true);
              }}
            >
              Add Beneficiary
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={beneficiaries}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              onChange: (page, pageSize) => {
                updatePagination({ page, pageSize });
              }
            }}
          />
        </Card>
      )
    }
  ];

  return (
    <div className="parliament-operations">
      <Tabs items={items} />

      {/* Add/Edit Beneficiary Modal */}
      <Modal
        title={form.getFieldValue('id') ? 'Edit Beneficiary' : 'Add Beneficiary'}
        open={isModalVisible}
        onOk={form.submit}
        onCancel={() => setIsModalVisible(false)}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddEdit}
        >
          <Form.Item
            name={['user', 'first_name']}
            label="First Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name={['user', 'last_name']}
            label="Last Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name={['category', 'id']}
            label="Category"
            rules={[{ required: true }]}
          >
            <Select>
              {/* TODO: Add category options */}
            </Select>
          </Form.Item>
          <Form.Item
            name="vehicle_registration"
            label="Vehicle Registration"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="monthly_entitlement_litres"
            label="Monthly Entitlement (Litres)"
            rules={[{ required: true }]}
          >
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ParliamentOperationsPage;
