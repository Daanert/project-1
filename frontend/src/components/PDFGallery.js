import React, { useState } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardActionArea, 
  CardMedia, 
  CardContent, 
  Typography, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Chip,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ZipIcon from '@mui/icons-material/Archive';

const PDFGallery = ({ files, onDownloadFile, onDownloadSelected, onDownloadAll }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleFileSelect = (file) => {
    const isSelected = selectedFiles.some(f => f.id === file.id);
    
    if (isSelected) {
      setSelectedFiles(selectedFiles.filter(f => f.id !== file.id));
    } else {
      setSelectedFiles([...selectedFiles, file]);
    }
  };

  const handlePreviewOpen = (e, file) => {
    e.stopPropagation(); // Prevent triggering the card click (selection)
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
  };

  const handleDownloadSelected = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      setIsDownloading(true);
      await onDownloadSelected(selectedFiles);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (files.length === 0) return;
    
    try {
      setIsDownloading(true);
      await onDownloadAll();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSingle = (file) => {
    if (onDownloadFile) {
      onDownloadFile(file);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5">
          Converted PDFs ({files.length})
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={isDownloading ? <CircularProgress size={20} /> : <DownloadIcon />}
            sx={{ mr: 2 }}
            disabled={selectedFiles.length === 0 || isDownloading}
            onClick={handleDownloadSelected}
          >
            Download Selected ({selectedFiles.length})
          </Button>
          <Button 
            variant="contained" 
            startIcon={isDownloading ? <CircularProgress size={20} /> : <ZipIcon />}
            onClick={handleDownloadAll}
            disabled={files.length === 0 || isDownloading}
          >
            Download All as ZIP
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {files.map((file) => {
          const isSelected = selectedFiles.some(f => f.id === file.id);
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
              <Card 
                sx={{ 
                  border: isSelected ? '2px solid' : '2px solid transparent',
                  borderColor: isSelected ? 'primary.main' : 'transparent',
                  position: 'relative'
                }}
                onClick={() => handleFileSelect(file)}
              >
                <CardActionArea>
                  <CardMedia
                    component="img"
                    height="150"
                    image={file.thumbnailUrl}
                    alt={file.name}
                  />
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      bottom: 75, 
                      left: 8, 
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      borderRadius: 1,
                      px: 1,
                      py: 0.5
                    }}
                  >
                    <Typography variant="body2">
                      {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'}
                    </Typography>
                  </Box>
                  <IconButton 
                    sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      left: 8, 
                      bgcolor: 'rgba(255,255,255,0.8)',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                      }
                    }}
                    onClick={(e) => handlePreviewOpen(e, file)}
                  >
                    <SearchIcon />
                  </IconButton>
                  <CardContent>
                    <Typography variant="body1" noWrap>
                      {file.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" noWrap>
                      {file.originalName}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handlePreviewClose}
        maxWidth="md"
        fullWidth
      >
        {previewFile && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{previewFile.name}</Typography>
              <IconButton aria-label="close" onClick={handlePreviewClose}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                <Box sx={{ flex: 2 }}>
                  <iframe
                    src={`${previewFile.previewUrl}#toolbar=0`}
                    title={previewFile.name}
                    style={{ width: '100%', height: '500px', border: 'none' }}
                  />
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Chip 
                      label={`${previewFile.pageCount} ${previewFile.pageCount === 1 ? 'page' : 'pages'}`} 
                      variant="outlined" 
                    />
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom>Metadata</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" scope="row">Original File</TableCell>
                          <TableCell>{previewFile.originalName}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Date</TableCell>
                          <TableCell>{previewFile.metadata.date}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Size</TableCell>
                          <TableCell>{previewFile.metadata.size}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Sender</TableCell>
                          <TableCell>{previewFile.metadata.sender}</TableCell>
                        </TableRow>
                        {previewFile.metadata.subject && (
                          <TableRow>
                            <TableCell component="th" scope="row">Subject</TableCell>
                            <TableCell>{previewFile.metadata.subject}</TableCell>
                          </TableRow>
                        )}
                        {previewFile.metadata.recipients && (
                          <TableRow>
                            <TableCell component="th" scope="row">Recipients</TableCell>
                            <TableCell>{previewFile.metadata.recipients}</TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell component="th" scope="row">Pages</TableCell>
                          <TableCell>{previewFile.pageCount}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button 
                startIcon={<DownloadIcon />}
                variant="contained"
                onClick={() => handleDownloadSingle(previewFile)}
              >
                Download PDF
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PDFGallery; 