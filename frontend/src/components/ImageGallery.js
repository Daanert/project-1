import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Checkbox,
  Box,
  Button,
  Chip,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Download,
  CloudDownload,
} from '@mui/icons-material';
import ImageLightbox from './ImageLightbox';

const ImageGallery = ({ images, onDownloadSelected, onDownloadAll }) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.down('lg'));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.down('xl'));

  // Determine grid columns based on screen size (1/2/3/4/5/6 columns)
  const gridColumns = isMobile ? 1 : isTablet ? 2 : isDesktop ? 3 : isLargeDesktop ? 4 : 6;

  const handleImageSelect = (image) => {
    setSelectedImages((prevSelected) => {
      const isSelected = prevSelected.some((img) => img.filename === image.filename);
      if (isSelected) {
        return prevSelected.filter((img) => img.filename !== image.filename);
      } else {
        return [...prevSelected, image];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages([...images]);
    }
  };

  const handleImageClick = (index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
  };

  const handleDownloadSelected = () => {
    const filenames = selectedImages.map((img) => img.filename);
    onDownloadSelected(filenames);
  };

  const isImageSelected = (image) => {
    return selectedImages.some((img) => img.filename === image.filename);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* Action Bar */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleSelectAll}
            startIcon={selectedImages.length === images.length ? <CheckCircle /> : <RadioButtonUnchecked />}
          >
            {selectedImages.length === images.length ? 'Deselect All' : 'Select All'}
          </Button>

          {selectedImages.length > 0 && (
            <Chip
              label={`${selectedImages.length} selected`}
              color="primary"
              size="small"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleDownloadSelected}
            disabled={selectedImages.length === 0}
            startIcon={<Download />}
            fullWidth={isMobile}
          >
            Download Selected
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={onDownloadAll}
            disabled={images.length === 0}
            startIcon={<CloudDownload />}
            fullWidth={isMobile}
          >
            Download All
          </Button>
        </Box>
      </Box>

      {/* Image Grid */}
      <Grid container spacing={2}>
        {images.map((image, index) => {
          const isSelected = isImageSelected(image);
          const hasMetadata = image.metadata && image.metadata.has_prompt;

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={image.filename}>
              <Card
                sx={{
                  position: 'relative',
                  cursor: 'pointer',
                  border: isSelected ? '3px solid' : '1px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                {/* Selection Checkbox Overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    zIndex: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageSelect(image);
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    icon={<RadioButtonUnchecked />}
                    checkedIcon={<CheckCircle />}
                    size="small"
                  />
                </Box>

                {/* ComfyUI Badge */}
                {hasMetadata && (
                  <Chip
                    label="ComfyUI"
                    size="small"
                    color="success"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 2,
                      fontWeight: 'bold',
                    }}
                  />
                )}

                {/* Thumbnail Image */}
                <CardMedia
                  component="img"
                  image={image.thumbnail_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'}
                  alt={image.filename}
                  onClick={() => handleImageClick(index)}
                  sx={{
                    aspectRatio: '1',
                    objectFit: 'cover',
                    backgroundColor: '#f0f0f0',
                    width: '100%',
                  }}
                />

                {/* Image Info */}
                <CardContent onClick={() => handleImageClick(index)}>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{
                      fontWeight: 500,
                      mb: 1,
                    }}
                    title={image.filename}
                  >
                    {image.filename}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip
                      label={`${image.width} × ${image.height}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={formatFileSize(image.size)}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>

                  {hasMetadata && image.metadata.models && image.metadata.models.length > 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        mt: 1,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={image.metadata.models[0]}
                    >
                      Model: {image.metadata.models[0]}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Lightbox */}
      {lightboxOpen && (
        <ImageLightbox
          images={images}
          currentIndex={currentImageIndex}
          onClose={handleCloseLightbox}
          onIndexChange={setCurrentImageIndex}
        />
      )}
    </Box>
  );
};

export default ImageGallery;
