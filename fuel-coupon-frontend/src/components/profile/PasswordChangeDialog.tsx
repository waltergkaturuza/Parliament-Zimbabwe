// src/components/profile/PasswordChangeDialog.tsx
import React from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';

interface PasswordChangeDialogProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: { current_password: string; new_password: string }) => void;
  loading?: boolean;
}

const PasswordChangeDialog: React.FC<PasswordChangeDialogProps> = ({
  visible,
  onCancel,
  onSubmit,
  loading = false
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (values.new_password !== values.confirm_password) {
        message.error('New passwords do not match');
        return;
      }

      onSubmit({
        current_password: values.current_password,
        new_password: values.new_password
      });
      
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Change Password"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Change Password
        </Button>
      ]}
      width={400}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          label="Current Password"
          name="current_password"
          rules={[{ required: true, message: 'Please enter your current password' }]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>

        <Form.Item
          label="New Password"
          name="new_password"
          rules={[
            { required: true, message: 'Please enter a new password' },
            { min: 8, message: 'Password must be at least 8 characters' }
          ]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>

        <Form.Item
          label="Confirm New Password"
          name="confirm_password"
          rules={[{ required: true, message: 'Please confirm your new password' }]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PasswordChangeDialog;