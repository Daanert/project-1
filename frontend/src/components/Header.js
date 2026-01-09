import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

const Header = () => {
  return (
    <AppBar position="static" elevation={0} sx={{
      background: 'linear-gradient(90deg, #2196f3 0%, #21cbf3 100%)',
    }}>
      <Toolbar>
        <Box display="flex" alignItems="center">
          <PhotoLibraryIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h5" component="div" fontWeight={600}>
            ComfyUI Gallery
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
