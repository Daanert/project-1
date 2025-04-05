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
  Paper
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';

const FileUploader = ({ onFilesUploaded, isLoading }) => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    setError(null);
    
    // Filter for .msg files
    const msgFiles = acceptedFiles.filter(
      file => file.name.toLowerCase().endsWith('.msg')
    );
    
    if (msgFiles.length < acceptedFiles.length) {
      setError('Only .msg files are accepted. Some files were filtered out.');
    }
    
    if (msgFiles.length === 0) {
      setError('Please upload at least one .msg file.');
      return;
    }
    
    setFiles(msgFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-outlook': ['.msg']
    }
  });

  const handleUpload = () => {
    if (files.length > 0) {
      onFilesUploaded(files);
    } else {
      setError('Please select at least one file first.');
    }
  };

  const handleRemoveFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.400',
          borderRadius: 2,
          bgcolor: isDragActive ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
          textAlign: 'center',
          cursor: 'pointer',
          mb: 3
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Drag & Drop .msg files here
        </Typography>
        <Typography variant="body2" color="textSecondary">
          or click to select files
        </Typography>
      </Paper>

      {files.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Selected Files ({files.length})
          </Typography>
          
          <List>
            {files.map((file, index) => (
              <ListItem 
                key={index}
                secondaryAction={
                  <Button 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => handleRemoveFile(index)}
                    disabled={isLoading}
                  >
                    <DeleteIcon />
                  </Button>
                }
              >
                <ListItemIcon>
                  <InsertDriveFileIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={file.name} 
                  secondary={`${(file.size / 1024).toFixed(2)} KB`} 
                />
              </ListItem>
            ))}
          </List>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : null}
            >
              {isLoading ? 'Converting...' : 'Convert to PDF'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default FileUploader; 