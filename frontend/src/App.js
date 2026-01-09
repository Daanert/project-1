import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box, Typography, Paper, Snackbar, Alert } from '@mui/material';
import FileUploader from './components/FileUploader';
import ImageGallery from './components/ImageGallery';
import Header from './components/Header';
import { uploadFiles, getImages, downloadSelectedFiles, downloadAllFiles } from './services/api';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#ff4081',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    success: {
      main: '#4caf50',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Load existing images when the component mounts
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await getImages();
      if (response && response.images) {
        setImages(response.images);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      showAlert('Failed to load images. Please try again.', 'error');
    }
  };

  const handleFilesUploaded = async (files) => {
    setIsLoading(true);

    try {
      const response = await uploadFiles(files);

      if (response && response.results) {
        // Filter only successful uploads
        const successfulUploads = response.results.filter(
          result => result.status === 'uploaded'
        );

        if (successfulUploads.length > 0) {
          // Refresh the list of images
          await fetchImages();
          showAlert(`Successfully uploaded ${successfulUploads.length} image${successfulUploads.length !== 1 ? 's' : ''}.`, 'success');
        } else {
          showAlert('No images were uploaded successfully.', 'warning');
        }

        // Check for errors
        const errors = response.results.filter(result => result.status === 'error');
        if (errors.length > 0) {
          console.error('Upload errors:', errors);
          if (errors.length === response.results.length) {
            showAlert('Failed to upload any images. Please check file formats.', 'error');
          }
        }
      }
    } catch (error) {
      console.error('Error during upload:', error);
      showAlert('Failed to upload images. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSelected = async (filenames) => {
    if (filenames.length === 0) return;

    try {
      await downloadSelectedFiles(filenames);
      showAlert(`Downloading ${filenames.length} image${filenames.length !== 1 ? 's' : ''}...`, 'success');
    } catch (error) {
      console.error('Error downloading selected images:', error);
      showAlert('Failed to download selected images. Please try again.', 'error');
    }
  };

  const handleDownloadAll = async () => {
    if (images.length === 0) return;

    try {
      downloadAllFiles();
      showAlert(`Downloading all ${images.length} images...`, 'success');
    } catch (error) {
      console.error('Error downloading all images:', error);
      showAlert('Failed to download all images. Please try again.', 'error');
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
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h3" component="h1" gutterBottom fontWeight={700} sx={{
              background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              ComfyUI Image Gallery
            </Typography>
            <Typography variant="h6" color="text.secondary">
              View and manage your AI-generated images with metadata
            </Typography>
          </Box>

          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <FileUploader onFilesUploaded={handleFilesUploaded} isLoading={isLoading} />
          </Paper>

          {images.length > 0 ? (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mb: 3 }}>
                Gallery ({images.length} {images.length === 1 ? 'image' : 'images'})
              </Typography>
              <ImageGallery
                images={images}
                onDownloadSelected={handleDownloadSelected}
                onDownloadAll={handleDownloadAll}
              />
            </Paper>
          ) : (
            <Paper elevation={2} sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No images yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload your ComfyUI-generated images to get started
              </Typography>
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
