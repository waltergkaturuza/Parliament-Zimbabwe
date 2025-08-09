// src/components/profile/AvatarUploadDialog.tsx
import React, { useState } from 'react';
import { Modal, Upload, Button, message, Avatar } from 'antd';
import { CameraOutlined, UserOutlined, LoadingOutlined } from '@ant-design/icons';
import { RcFile } from 'antd/es/upload';

interface AvatarUploadDialogProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (file: File) => void;
  currentAvatar?: string;
  loading?: boolean;
}

const AvatarUploadDialog: React.FC<AvatarUploadDialogProps> = ({
  visible,
  onCancel,
  onSubmit,
  currentAvatar,
  loading = false
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG files!');
      return false;
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return false;
    }

    // Create preview
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setPreview(reader.result as string);
    });
    reader.readAsDataURL(file);
    
    setSelectedFile(file);
    return false; // Prevent auto upload
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onSubmit(selectedFile);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    onCancel();
  };

  return (
    <Modal
      title="Update Profile Picture"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          disabled={!selectedFile}
          loading={loading}
          onClick={handleSubmit}
        >
          Upload Picture
        </Button>
      ]}
      width={400}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ marginBottom: 24 }}>
          <Avatar
            size={120}
            src={preview || currentAvatar}
            icon={<UserOutlined />}
            style={{ border: '4px solid #f0f0f0' }}
          />
        </div>
        
        <Upload
          beforeUpload={beforeUpload}
          showUploadList={false}
          accept="image/*"
        >
          <Button icon={loading ? <LoadingOutlined /> : <CameraOutlined />} size="large">
            {preview ? 'Change Picture' : 'Select Picture'}
          </Button>
        </Upload>
        
        <div style={{ marginTop: 16, color: '#666', fontSize: '12px' }}>
          JPG or PNG format, max 2MB
        </div>
      </div>
    </Modal>
  );
};

export default AvatarUploadDialog;