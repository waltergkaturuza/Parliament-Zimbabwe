import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { userProfileService, UserProfile } from '../../services/userProfileService';

interface AvatarUploadDialogProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onAvatarUpdate: (updatedProfile: UserProfile) => void;
}

const AvatarUploadDialog: React.FC<AvatarUploadDialogProps> = ({
  open,
  onClose,
  profile,
  onAvatarUpdate,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPreview(null);
      setError(null);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const updatedProfile = await userProfileService.uploadCurrentUserAvatar(selectedFile);
      onAvatarUpdate(updatedProfile);
      
      // Reset form
      setSelectedFile(null);
      setPreview(null);
      
      // Close dialog after short delay to show success
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setLoading(true);
      setError(null);

      // Send empty file to remove avatar
      const emptyFile = new File([''], 'empty.txt', { type: 'text/plain' });
      const updatedProfile = await userProfileService.uploadCurrentUserAvatar(emptyFile);
      onAvatarUpdate(updatedProfile);
      
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to remove avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedFile(null);
      setPreview(null);
      setError(null);
      onClose();
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PhotoCameraIcon />
          Update Profile Picture
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Current Avatar */}
          <Box display="flex" justifyContent="center" mb={3}>
            <Box position="relative">
              <Avatar
                src={profile?.profile_picture_url}
                sx={{ width: 120, height: 120 }}
              >
                {profile?.display_name?.charAt(0)}
              </Avatar>
              {profile?.profile_picture_url && (
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'error.dark' },
                    width: 32,
                    height: 32,
                  }}
                  onClick={handleRemoveAvatar}
                  disabled={loading}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>

          {/* File Upload Area */}
          <Paper
            sx={{
              border: 2,
              borderStyle: 'dashed',
              borderColor: dragOver ? 'primary.main' : 'grey.300',
              bgcolor: dragOver ? 'action.hover' : 'background.paper',
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
            onClick={handleBrowseClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />

            {preview ? (
              <Box>
                <Avatar
                  src={preview}
                  sx={{ width: 100, height: 100, margin: '0 auto', mb: 2 }}
                />
                <Typography variant="body2" color="textSecondary">
                  {selectedFile?.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Size: {(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            ) : (
              <Box>
                <CloudUploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Drop your image here or click to browse
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Supports: JPEG, PNG, GIF (max 5MB)
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Upload Guidelines */}
          <Box mt={2}>
            <Typography variant="caption" color="textSecondary">
              <strong>Guidelines:</strong>
              <br />
              • Use a clear, professional photo
              <br />
              • Square images work best (1:1 aspect ratio)
              <br />
              • Minimum resolution: 200x200 pixels
              <br />
              • Maximum file size: 5MB
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {selectedFile && (
          <Button
            onClick={() => {
              setSelectedFile(null);
              setPreview(null);
              setError(null);
            }}
            disabled={loading}
          >
            Clear
          </Button>
        )}
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!selectedFile || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
        >
          {loading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AvatarUploadDialog;
