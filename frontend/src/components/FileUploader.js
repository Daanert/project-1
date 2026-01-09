import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Paper,
  IconButton
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';

const FileUploader = ({ onFilesUploaded, isLoading }) => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    setError(null);

    // Filter for image files
    const imageFiles = acceptedFiles.filter(
      file => {
        const extension = file.name.toLowerCase().split('.').pop();
        return ['png', 'jpg', 'jpeg', 'webp'].includes(extension);
      }
    );

    if (imageFiles.length < acceptedFiles.length) {
      setError('Only PNG, JPG, JPEG, and WEBP files are accepted. Some files were filtered out.');
    }

    if (imageFiles.length === 0) {
      setError('Please upload at least one image file (PNG, JPG, JPEG, or WEBP).');
      return;
    }

    setFiles(prevFiles => [...prevFiles, ...imageFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp']
    }
  });

  const handleUpload = () => {
    if (files.length > 0) {
      onFilesUploaded(files);
      setFiles([]);
    } else {
      setError('Please select at least one image first.');
    }
  };

  const handleRemoveFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          border: '3px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.400',
          borderRadius: 2,
          bgcolor: isDragActive ? 'rgba(25, 118, 210, 0.08)' : 'background.paper',
          textAlign: 'center',
          cursor: 'pointer',
          mb: 3,
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'rgba(25, 118, 210, 0.04)',
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Upload ComfyUI Images
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>
          Drag & drop your images here, or click to select
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Supports PNG (with ComfyUI metadata), JPG, JPEG, and WEBP
        </Typography>
      </Paper>

      {files.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Selected Images ({files.length})
          </Typography>

          <List sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
            {files.map((file, index) => (
              <ListItem
                key={index}
                sx={{
                  bgcolor: 'background.paper',
                  mb: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleRemoveFile(index)}
                    disabled={isLoading}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  <ImageIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={formatFileSize(file.size)}
                />
              </ListItem>
            ))}
          </List>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleUpload}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : <CloudUploadIcon />}
              sx={{ px: 4, py: 1.5 }}
            >
              {isLoading ? 'Uploading...' : `Upload ${files.length} Image${files.length !== 1 ? 's' : ''}`}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default FileUploader;
