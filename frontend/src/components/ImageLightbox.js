import React, { useEffect, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import axios from 'axios';
import {
  Dialog,
  Box,
  IconButton,
  Typography,
  Paper,
  Divider,
  Chip,
  Stack,
  useMediaQuery,
  useTheme,
  Collapse,
  Button,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Close,
  ArrowBackIos,
  ArrowForwardIos,
  Download,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';

const ImageLightbox = ({ images, currentIndex, onClose, onIndexChange }) => {
  const [index, setIndex] = useState(currentIndex);
  const [metadataExpanded, setMetadataExpanded] = useState(true);
  const [fullMetadata, setFullMetadata] = useState(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const currentImage = images[index];
  const hasNext = index < images.length - 1;
  const hasPrev = index > 0;

  useEffect(() => {
    setIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    onIndexChange(index);
  }, [index, onIndexChange]);

  // Fetch full metadata when image changes
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!currentImage.filename.toLowerCase().endsWith('.png')) {
        setFullMetadata(null);
        return;
      }

      setLoadingMetadata(true);
      try {
        const response = await axios.get(`/api/metadata/${currentImage.filename}`);
        setFullMetadata(response.data);
      } catch (error) {
        console.error('Error fetching metadata:', error);
        setFullMetadata(null);
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [currentImage.filename]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && hasPrev) {
        handlePrev();
      } else if (e.key === 'ArrowRight' && hasNext) {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index, hasNext, hasPrev]);

  const handleNext = () => {
    if (hasNext) {
      setIndex(index + 1);
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
      setIndex(index - 1);
    }
  };

  const handleDownload = () => {
    const url = `/api/download/${currentImage.filename}`;
    window.open(url, '_blank');
  };

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => hasNext && handleNext(),
    onSwipedRight: () => hasPrev && handlePrev(),
    preventScrollOnSwipe: true,
    trackMouse: false,
  });

  const metadata = fullMetadata || {};
  const sampler = metadata.sampler || {};

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.92)',
          width: isMobile ? '100%' : '75vw',
          height: isMobile ? '100%' : '90vh',
          m: 0,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          height: '100%',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            },
          }}
        >
          <Close />
        </IconButton>

        {/* Image Container */}
        <Box
          {...swipeHandlers}
          onClick={(e) => {
            // Close on background click (not on image)
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            minHeight: isMobile ? '50vh' : '100%',
          }}
        >
          {/* Previous Button */}
          {hasPrev && !isSmallMobile && (
            <IconButton
              onClick={handlePrev}
              sx={{
                position: 'absolute',
                left: 16,
                zIndex: 5,
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                },
              }}
            >
              <ArrowBackIos sx={{ ml: 0.5 }} />
            </IconButton>
          )}

          {/* Image */}
          <Box
            component="img"
            src={currentImage.image_url}
            alt={currentImage.filename}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              userSelect: 'none',
            }}
          />

          {/* Next Button */}
          {hasNext && !isSmallMobile && (
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 16,
                zIndex: 5,
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                },
              }}
            >
              <ArrowForwardIos />
            </IconButton>
          )}

          {/* Mobile Navigation Buttons */}
          {isSmallMobile && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 2,
                zIndex: 5,
              }}
            >
              <IconButton
                onClick={handlePrev}
                disabled={!hasPrev}
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  },
                  '&.Mui-disabled': {
                    color: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                <ArrowBackIos sx={{ ml: 0.5 }} />
              </IconButton>

              <IconButton
                onClick={handleNext}
                disabled={!hasNext}
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  },
                  '&.Mui-disabled': {
                    color: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                <ArrowForwardIos />
              </IconButton>
            </Box>
          )}

          {/* Image Counter */}
          <Typography
            variant="body2"
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              px: 2,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            {index + 1} / {images.length}
          </Typography>
        </Box>

        {/* Metadata Panel */}
        <Paper
          sx={{
            width: isMobile ? '100%' : 420,
            maxHeight: isMobile ? '50vh' : '100%',
            overflowY: 'auto',
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
            color: theme.palette.mode === 'dark' ? 'white' : 'black',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Box sx={{ p: 2, position: 'sticky', top: 0, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5', zIndex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
                Image Details
              </Typography>
              {isMobile && (
                <IconButton
                  size="small"
                  onClick={() => setMetadataExpanded(!metadataExpanded)}
                  sx={{ color: theme.palette.mode === 'dark' ? 'white' : 'black' }}
                >
                  {metadataExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              )}
            </Box>

            <Button
              variant="contained"
              size="small"
              fullWidth
              onClick={handleDownload}
              startIcon={<Download />}
            >
              Download Image
            </Button>
          </Box>

          <Collapse in={metadataExpanded || !isMobile}>
            <Box sx={{ p: 2, pt: 0 }}>
              {/* File Info */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom fontWeight={600}>
                  FILE INFORMATION
                </Typography>
                <Typography variant="body2" noWrap title={currentImage.filename} sx={{ mb: 0.5 }}>
                  {currentImage.filename}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip label={`${currentImage.width} × ${currentImage.height}`} size="small" variant="outlined" />
                  <Chip label={`${Math.round(currentImage.size / 1024 / 1024 * 100) / 100} MB`} size="small" variant="outlined" />
                </Stack>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Loading Metadata */}
              {loadingMetadata && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CircularProgress size={30} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loading metadata...
                  </Typography>
                </Box>
              )}

              {/* ComfyUI Metadata */}
              {!loadingMetadata && metadata.has_prompt && (
                <>
                  {/* Generation Parameters */}
                  {(sampler.seed || sampler.steps || sampler.cfg || sampler.sampler_name) && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom fontWeight={600}>
                        GENERATION PARAMETERS
                      </Typography>
                      <Grid container spacing={1}>
                        {sampler.seed && (
                          <Grid item xs={6}>
                            <Paper sx={{ p: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">Seed</Typography>
                              <Typography variant="body2" fontWeight={500}>{sampler.seed}</Typography>
                            </Paper>
                          </Grid>
                        )}
                        {sampler.steps && (
                          <Grid item xs={6}>
                            <Paper sx={{ p: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">Steps</Typography>
                              <Typography variant="body2" fontWeight={500}>{sampler.steps}</Typography>
                            </Paper>
                          </Grid>
                        )}
                        {sampler.cfg && (
                          <Grid item xs={6}>
                            <Paper sx={{ p: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">CFG Scale</Typography>
                              <Typography variant="body2" fontWeight={500}>{sampler.cfg}</Typography>
                            </Paper>
                          </Grid>
                        )}
                        {sampler.sampler_name && (
                          <Grid item xs={6}>
                            <Paper sx={{ p: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">Sampler</Typography>
                              <Typography variant="body2" fontWeight={500}>{sampler.sampler_name}</Typography>
                            </Paper>
                          </Grid>
                        )}
                        {sampler.scheduler && (
                          <Grid item xs={6}>
                            <Paper sx={{ p: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">Scheduler</Typography>
                              <Typography variant="body2" fontWeight={500}>{sampler.scheduler}</Typography>
                            </Paper>
                          </Grid>
                        )}
                        {sampler.denoise && (
                          <Grid item xs={6}>
                            <Paper sx={{ p: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">Denoise</Typography>
                              <Typography variant="body2" fontWeight={500}>{sampler.denoise}</Typography>
                            </Paper>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  )}

                  {/* Models */}
                  {metadata.models && metadata.models.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom fontWeight={600}>
                        MODEL
                      </Typography>
                      {metadata.models.map((model, idx) => (
                        <Chip key={idx} label={model} size="small" sx={{ mr: 0.5, mb: 0.5 }} color="primary" variant="outlined" />
                      ))}
                    </Box>
                  )}

                  {/* LoRAs */}
                  {metadata.loras && metadata.loras.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom fontWeight={600}>
                        LORAS
                      </Typography>
                      <Stack spacing={1}>
                        {metadata.loras.map((lora, idx) => (
                          <Paper key={idx} sx={{ p: 1, bgcolor: 'action.hover' }}>
                            <Typography variant="body2" fontWeight={500}>{lora.name}</Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                              {lora.strength_model !== null && (
                                <Chip label={`Model: ${lora.strength_model}`} size="small" variant="outlined" />
                              )}
                              {lora.strength_clip !== null && (
                                <Chip label={`CLIP: ${lora.strength_clip}`} size="small" variant="outlined" />
                              )}
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Positive Prompt */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom fontWeight={600}>
                      POSITIVE PROMPT
                    </Typography>
                    <Paper
                      sx={{
                        p: 1.5,
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        maxHeight: 150,
                        overflowY: 'auto',
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {metadata.positive_prompt || 'N/A'}
                      </Typography>
                    </Paper>
                  </Box>

                  {/* Negative Prompt */}
                  {metadata.negative_prompt && metadata.negative_prompt !== 'N/A' && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="error.main" gutterBottom fontWeight={600}>
                        NEGATIVE PROMPT
                      </Typography>
                      <Paper
                        sx={{
                          p: 1.5,
                          backgroundColor: 'rgba(244, 67, 54, 0.1)',
                          border: '1px solid rgba(244, 67, 54, 0.3)',
                          maxHeight: 150,
                          overflowY: 'auto',
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {metadata.negative_prompt}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </>
              )}

              {/* No Metadata */}
              {!loadingMetadata && !metadata.has_prompt && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No ComfyUI metadata found in this image
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </Paper>
      </Box>
    </Dialog>
  );
};

export default ImageLightbox;
