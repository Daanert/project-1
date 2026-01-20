import React, { useState, useEffect, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box, Typography, Paper, Snackbar, Alert, Button, Chip, CircularProgress, IconButton } from '@mui/material';
import { Refresh, Folder, CheckCircle, Error as ErrorIcon, Brightness4, Brightness7 } from '@mui/icons-material';
import ImageGallery from './components/ImageGallery';
import Header from './components/Header';
import { getConfig, getImages, downloadSelectedFiles, downloadAllFiles } from './services/api';

function App() {
  const [images, setImages] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Create theme based on dark mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#2196f3',
          },
          secondary: {
            main: '#ff4081',
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
      }),
    [darkMode]
  );

  // Load config and images when the component mounts
  useEffect(() => {
    fetchConfig();
    fetchImages();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await getConfig();
      if (response) {
        setConfig(response);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      showAlert('Failed to load configuration.', 'error');
    }
  };

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const response = await getImages();
      if (response && response.images) {
        setImages(response.images);
        showAlert(`Loaded ${response.images.length} images from ComfyUI output folder.`, 'success');
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      showAlert('Failed to load images. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchImages();
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

          {/* Folder Status */}
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Folder color="primary" />
                  <Typography variant="body1" fontWeight={500}>
                    {config?.comfyui_folder || 'Loading...'}
                  </Typography>
                </Box>
                {config && (
                  <Chip
                    icon={config.folder_exists ? <CheckCircle /> : <ErrorIcon />}
                    label={config.folder_exists ? 'Folder found' : 'Folder not found'}
                    color={config.folder_exists ? 'success' : 'error'}
                    size="small"
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={() => setDarkMode(!darkMode)}
                  color="inherit"
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                  title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {darkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
                <Button
                  variant="contained"
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  {isLoading ? 'Scanning...' : 'Refresh'}
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Gallery */}
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
              {isLoading ? (
                <>
                  <CircularProgress />
                  <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                    Scanning for images...
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No images found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {config?.folder_exists === false
                      ? 'Folder not found: ' + (config?.comfyui_folder || 'undefined')
                      : 'Add some images to your ComfyUI output folder and click Refresh'}
                  </Typography>
                </>
              )}
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
