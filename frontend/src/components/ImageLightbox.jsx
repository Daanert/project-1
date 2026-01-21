import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { X, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '../lib/utils';

const ImageLightbox = ({ images, currentIndex, onClose, onNavigate }) => {
  const [metadata, setMetadata] = useState(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);

  const currentImage = images[currentIndex];

  useEffect(() => {
    if (!currentImage) return;

    const fetchMetadata = async () => {
      if (!currentImage.filename.toLowerCase().endsWith('.png')) {
        setMetadata(null);
        return;
      }

      setLoadingMetadata(true);
      try {
        const response = await axios.get(`/api/metadata/${currentImage.filename}`);
        setMetadata(response.data);
      } catch (error) {
        console.error('Error fetching metadata:', error);
        setMetadata(null);
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [currentImage]);

  const handleDownload = async () => {
    if (!currentImage) return;

    try {
      const response = await axios.get(
        `/api/download/${currentImage.image_url.split('/').pop()}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', currentImage.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, images.length]);

  if (!currentImage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="flex h-full">
          {/* Main image area */}
          <div
            className={cn(
              "flex-1 flex items-center justify-center p-8 transition-all duration-300",
              showMetadata ? "mr-96" : "mr-0"
            )}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Navigation buttons */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/10 backdrop-blur-sm hover:bg-background/20 text-white z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/10 backdrop-blur-sm hover:bg-background/20 text-white z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                disabled={currentIndex === images.length - 1}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>

              {/* Image */}
              <motion.img
                key={currentImage.filename}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                src={currentImage.image_url}
                alt={currentImage.filename}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Top toolbar */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
                <div className="bg-background/10 backdrop-blur-sm rounded-lg px-4 py-2 pointer-events-auto">
                  <p className="text-white text-sm font-medium">
                    {currentIndex + 1} / {images.length}
                  </p>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-background/10 backdrop-blur-sm hover:bg-background/20 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload();
                    }}
                  >
                    <Download className="w-5 h-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-background/10 backdrop-blur-sm hover:bg-background/20 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMetadata(!showMetadata);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M9 3v18" />
                    </svg>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-background/10 backdrop-blur-sm hover:bg-background/20 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Bottom filename */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/10 backdrop-blur-sm rounded-lg px-4 py-2 z-10 pointer-events-none">
                <p className="text-white text-sm">{currentImage.filename}</p>
              </div>
            </div>
          </div>

          {/* Metadata panel */}
          <AnimatePresence>
            {showMetadata && (
              <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-96 h-full overflow-y-auto bg-background border-l"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 space-y-4">
                  <h2 className="text-2xl font-bold">Metadata</h2>

                  {loadingMetadata ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : metadata ? (
                    <>
                      {/* Positive Prompt */}
                      {metadata.positive_prompt && metadata.positive_prompt !== 'N/A' && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-semibold text-primary">
                              POSITIVE PROMPT
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {metadata.positive_prompt}
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Negative Prompt */}
                      {metadata.negative_prompt && metadata.negative_prompt !== 'N/A' && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-semibold text-destructive">
                              NEGATIVE PROMPT
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {metadata.negative_prompt}
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Generation Parameters */}
                      {metadata.sampler && Object.keys(metadata.sampler).length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-semibold text-primary">
                              GENERATION PARAMETERS
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-2">
                              {metadata.sampler.seed && (
                                <div className="bg-muted rounded-md p-2">
                                  <p className="text-xs text-muted-foreground">Seed</p>
                                  <p className="text-sm font-medium">{metadata.sampler.seed}</p>
                                </div>
                              )}
                              {metadata.sampler.steps && (
                                <div className="bg-muted rounded-md p-2">
                                  <p className="text-xs text-muted-foreground">Steps</p>
                                  <p className="text-sm font-medium">{metadata.sampler.steps}</p>
                                </div>
                              )}
                              {metadata.sampler.cfg_scale && (
                                <div className="bg-muted rounded-md p-2">
                                  <p className="text-xs text-muted-foreground">CFG Scale</p>
                                  <p className="text-sm font-medium">{metadata.sampler.cfg_scale}</p>
                                </div>
                              )}
                              {metadata.sampler.sampler_name && (
                                <div className="bg-muted rounded-md p-2">
                                  <p className="text-xs text-muted-foreground">Sampler</p>
                                  <p className="text-sm font-medium">{metadata.sampler.sampler_name}</p>
                                </div>
                              )}
                              {metadata.sampler.scheduler && (
                                <div className="bg-muted rounded-md p-2">
                                  <p className="text-xs text-muted-foreground">Scheduler</p>
                                  <p className="text-sm font-medium">{metadata.sampler.scheduler}</p>
                                </div>
                              )}
                              {metadata.sampler.denoise && (
                                <div className="bg-muted rounded-md p-2">
                                  <p className="text-xs text-muted-foreground">Denoise</p>
                                  <p className="text-sm font-medium">{metadata.sampler.denoise}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Models */}
                      {metadata.models && metadata.models.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-semibold text-primary">
                              MODELS
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {metadata.models.map((model, idx) => (
                                <div key={idx} className="bg-muted rounded-md p-2">
                                  <p className="text-sm font-medium">{model}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* LoRAs */}
                      {metadata.loras && metadata.loras.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-semibold text-primary">
                              LORAS
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {metadata.loras.map((lora, idx) => (
                                <div key={idx} className="bg-muted rounded-md p-3">
                                  <p className="text-sm font-medium mb-2">{lora.name}</p>
                                  <div className="flex gap-2">
                                    {lora.strength_model !== null && (
                                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                                        Model: {lora.strength_model}
                                      </span>
                                    )}
                                    {lora.strength_clip !== null && (
                                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                                        CLIP: {lora.strength_clip}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    <Card>
                      <CardContent className="py-8">
                        <p className="text-center text-muted-foreground">
                          No metadata available
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageLightbox;
