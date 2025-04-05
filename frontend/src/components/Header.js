import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const Header = () => {
  return (
    <AppBar position="static" color="primary" elevation={4}>
      <Toolbar>
        <Box display="flex" alignItems="center">
          <PictureAsPdfIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div">
            MSG to PDF Converter
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 