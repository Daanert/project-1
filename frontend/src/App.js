import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box, Typography, Paper } from '@mui/material';
import FileUploader from './components/FileUploader';
import PDFGallery from './components/PDFGallery';
import Header from './components/Header';

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

  const handleFilesUploaded = (files) => {
    // This is a placeholder for the actual conversion process
    setIsLoading(true);
    
    // Simulate conversion process
    setTimeout(() => {
      const converted = files.map((file, index) => ({
        id: index,
        name: file.name.replace('.msg', '.pdf'),
        originalName: file.name,
        pageCount: Math.floor(Math.random() * 10) + 1, // Random page count for demo
        thumbnailUrl: 'https://via.placeholder.com/150', // Placeholder thumbnail
        previewUrl: 'https://via.placeholder.com/600x800', // Placeholder preview
        metadata: {
          date: new Date().toLocaleDateString(),
          size: `${Math.floor(file.size / 1024)} KB`,
          sender: 'example@example.com',
        }
      }));
      
      setConvertedFiles(converted);
      setIsLoading(false);
    }, 2000);
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
              <PDFGallery files={convertedFiles} />
            </Paper>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App; 