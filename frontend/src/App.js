import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box, Typography, Paper, Snackbar, Alert } from '@mui/material';
import FileUploader from './components/FileUploader';
import PDFGallery from './components/PDFGallery';
import Header from './components/Header';
import { uploadFiles, getFiles, downloadFile, downloadSelectedFiles, downloadAllFiles } from './services/api';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Load existing files when the component mounts
  useEffect(() => {
    fetchConvertedFiles();
  }, []);

  const fetchConvertedFiles = async () => {
    try {
      const response = await getFiles();
      if (response && response.files) {
        // Transform the data to match our component expectations
        const files = response.files.map((file, index) => ({
          id: index,
          name: file.filename,
          originalName: file.original_filename,
          pageCount: file.metadata.page_count || 1,
          thumbnailUrl: file.thumbnail_url,
          previewUrl: file.pdf_url, // Use the PDF URL for preview
          downloadUrl: file.pdf_url,
          metadata: {
            date: file.metadata.date || 'Unknown',
            size: `${Math.floor(file.size / 1024)} KB`,
            sender: file.metadata.sender || 'Unknown',
            subject: file.metadata.subject || 'No Subject',
            recipients: Array.isArray(file.metadata.recipients) 
              ? file.metadata.recipients.join(', ') 
              : file.metadata.recipients || 'None'
          }
        }));
        setConvertedFiles(files);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      showAlert('Failed to load files. Please try again.', 'error');
    }
  };

  const handleFilesUploaded = async (files) => {
    setIsLoading(true);
    
    try {
      const response = await uploadFiles(files);
      
      if (response && response.results) {
        // Filter only successful conversions
        const successfulConversions = response.results.filter(
          result => result.status === 'converted'
        );
        
        if (successfulConversions.length > 0) {
          // Refresh the list of files
          await fetchConvertedFiles();
          showAlert(`Successfully converted ${successfulConversions.length} files.`, 'success');
        } else {
          showAlert('No files were converted successfully.', 'warning');
        }
        
        // Check for errors
        const errors = response.results.filter(result => result.status === 'error');
        if (errors.length > 0) {
          console.error('Conversion errors:', errors);
          if (errors.length === response.results.length) {
            showAlert('Failed to convert any files. Please check file formats.', 'error');
          }
        }
      }
    } catch (error) {
      console.error('Error during upload and conversion:', error);
      showAlert('Failed to upload and convert files. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = (file) => {
    window.open(file.downloadUrl, '_blank');
  };

  const handleDownloadSelected = async (selectedFiles) => {
    if (selectedFiles.length === 0) return;
    
    try {
      const filenames = selectedFiles.map(file => file.name);
      await downloadSelectedFiles(filenames);
    } catch (error) {
      console.error('Error downloading selected files:', error);
      showAlert('Failed to download selected files. Please try again.', 'error');
    }
  };

  const handleDownloadAll = async () => {
    if (convertedFiles.length === 0) return;
    
    try {
      downloadAllFiles();
    } catch (error) {
      console.error('Error downloading all files:', error);
      showAlert('Failed to download all files. Please try again.', 'error');
    }
  };

  const showAlert = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            MSG to PDF Converter
          </Typography>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <FileUploader onFilesUploaded={handleFilesUploaded} isLoading={isLoading} />
          </Paper>
          
          {convertedFiles.length > 0 && (
            <Paper elevation={3} sx={{ p: 3 }}>
              <PDFGallery 
                files={convertedFiles} 
                onDownloadFile={handleDownloadFile}
                onDownloadSelected={handleDownloadSelected}
                onDownloadAll={handleDownloadAll}
              />
            </Paper>
          )}
        </Box>
        
        <Snackbar 
          open={alert.open} 
          autoHideDuration={6000} 
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseAlert} 
            severity={alert.severity} 
            sx={{ width: '100%' }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App; 