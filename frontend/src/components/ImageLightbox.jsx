import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { X, Download, ChevronLeft, ChevronRight, Loader2, Info } from 'lucide-react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '../lib/utils';

const ImageLightbox = ({ images, currentIndex, onClose, onNavigate }) => {
  const [metadata, setMetadata] = useState(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false); // Default closed on mobile
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Detect device type
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

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

  // Handle swipe gestures
  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 50;

    if (info.offset.x > swipeThreshold && currentIndex > 0) {
      handlePrevious();
    } else if (info.offset.x < -swipeThreshold && currentIndex < images.length - 1) {
      handleNext();
    }
  };

  if (!currentImage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 md:bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="flex flex-col md:flex-row h-full">
          {/* Main image area */}
          <div
            className={cn(
              "flex-1 flex items-center justify-center transition-all duration-300",
              isMobile ? "p-4" : "p-8",
              !isMobile && showMetadata && "md:mr-96"
            )}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Navigation buttons - hide on mobile and tablet, show on desktop */}
              {!isMobile && !isTablet && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/10 backdrop-blur-sm hover:bg-background/20 text-white z-10 h-12 w-12"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevious();
                    }}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/10 backdrop-blur-sm hover:bg-background/20 text-white z-10 h-12 w-12"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    disabled={currentIndex === images.length - 1}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </Button>
                </>
              )}

              {/* Image with swipe support */}
              <motion.img
                key={currentImage.filename}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                drag={isMobile || isTablet ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                src={currentImage.image_url}
                alt={currentImage.filename}
                className={cn(
                  "max-w-full object-contain rounded-lg touch-pan-y",
                  isMobile || isTablet ? "max-h-[80vh]" : "max-h-full"
                )}
                onClick={(e) => e.stopPropagation()}
              />

              {/* Top toolbar - responsive */}
              <div className={cn(
                "absolute left-0 right-0 flex items-center justify-between z-10 pointer-events-none",
                isMobile ? "top-2 px-2" : "top-4 px-4"
              )}>
                <div className={cn(
                  "bg-background/10 backdrop-blur-sm rounded-lg pointer-events-auto",
                  isMobile ? "px-3 py-1.5" : "px-4 py-2"
                )}>
                  <p className={cn("text-white font-medium", isMobile ? "text-xs" : "text-sm")}>
                    {currentIndex + 1} / {images.length}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 md:gap-2 pointer-events-auto">
                  <Button
                    variant="ghost"
                    size={isMobile ? "sm" : "icon"}
                    className={cn(
                      "bg-background/10 backdrop-blur-sm hover:bg-background/20 text-white",
                      isMobile && "h-9 w-9"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload();
                    }}
                  >
                    <Download className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
                  </Button>

                  <Button
                    variant="ghost"
                    size={isMobile ? "sm" : "icon"}
                    className={cn(
                      "bg-background/10 backdrop-blur-sm hover:bg-background/20 text-white",
                      isMobile && "h-9 w-9"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMetadata(!showMetadata);
                    }}
                  >
                    <Info className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
                  </Button>

                  <Button
                    variant="ghost"
                    size={isMobile ? "sm" : "icon"}
                    className={cn(
                      "bg-background/10 backdrop-blur-sm hover:bg-background/20 text-white",
                      isMobile && "h-9 w-9"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                  >
                    <X className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
                  </Button>
                </div>
              </div>

              {/* Bottom navigation and filename - mobile and tablet */}
              {(isMobile || isTablet) && (
                <div className="absolute bottom-2 left-0 right-0 px-2 flex items-center justify-between z-10 pointer-events-none">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-background/10 backdrop-blur-sm hover:bg-background/20 text-white h-12 w-12 pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevious();
                    }}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>

                  <div className="bg-background/10 backdrop-blur-sm rounded-lg px-3 py-1.5 max-w-[60%] pointer-events-auto">
                    <p className="text-white text-xs truncate">{currentImage.filename}</p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-background/10 backdrop-blur-sm hover:bg-background/20 text-white h-12 w-12 pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    disabled={currentIndex === images.length - 1}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </div>
              )}

              {/* Desktop filename */}
              {!isMobile && !isTablet && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/10 backdrop-blur-sm rounded-lg px-4 py-2 z-10 pointer-events-none max-w-[80%]">
                  <p className="text-white text-sm truncate">{currentImage.filename}</p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata panel - responsive */}
          <AnimatePresence>
            {showMetadata && (
              <motion.div
                initial={isMobile ? { y: "100%" } : { x: 400, opacity: 0 }}
                animate={isMobile ? { y: 0 } : { x: 0, opacity: 1 }}
                exit={isMobile ? { y: "100%" } : { x: 400, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={cn(
                  "bg-background overflow-y-auto",
                  isMobile
                    ? "fixed bottom-0 left-0 right-0 max-h-[60vh] rounded-t-3xl"
                    : "w-96 h-full border-l"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag handle for mobile */}
                {isMobile && (
                  <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
                  </div>
                )}

                <div className={cn("space-y-4", isMobile ? "p-4 pb-8" : "p-6")}>
                  <div className="flex items-center justify-between">
                    <h2 className={cn("font-bold", isMobile ? "text-xl" : "text-2xl")}>Metadata</h2>
                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMetadata(false)}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    )}
                  </div>

                  {loadingMetadata ? (
                    <div className={cn("flex items-center justify-center", isMobile ? "py-8" : "py-12")}>
                      <Loader2 className={cn("animate-spin text-primary", isMobile ? "w-6 h-6" : "w-8 h-8")} />
                    </div>
                  ) : metadata ? (
                    <>
                      {/* Positive Prompt */}
                      {metadata.positive_prompt && metadata.positive_prompt !== 'N/A' && (
                        <Card>
                          <CardHeader className={isMobile ? "p-3" : undefined}>
                            <CardTitle className={cn("font-semibold text-primary", isMobile ? "text-xs" : "text-sm")}>
                              POSITIVE PROMPT
                            </CardTitle>
                          </CardHeader>
                          <CardContent className={isMobile ? "p-3 pt-0" : undefined}>
                            <p className={cn("leading-relaxed whitespace-pre-wrap", isMobile ? "text-xs" : "text-sm")}>
                              {metadata.positive_prompt}
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Negative Prompt */}
                      {metadata.negative_prompt && metadata.negative_prompt !== 'N/A' && (
                        <Card>
                          <CardHeader className={isMobile ? "p-3" : undefined}>
                            <CardTitle className={cn("font-semibold text-destructive", isMobile ? "text-xs" : "text-sm")}>
                              NEGATIVE PROMPT
                            </CardTitle>
                          </CardHeader>
                          <CardContent className={isMobile ? "p-3 pt-0" : undefined}>
                            <p className={cn("leading-relaxed whitespace-pre-wrap", isMobile ? "text-xs" : "text-sm")}>
                              {metadata.negative_prompt}
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Generation Parameters */}
                      {metadata.sampler && Object.keys(metadata.sampler).length > 0 && (
                        <Card>
                          <CardHeader className={isMobile ? "p-3" : undefined}>
                            <CardTitle className={cn("font-semibold text-primary", isMobile ? "text-xs" : "text-sm")}>
                              GENERATION PARAMETERS
                            </CardTitle>
                          </CardHeader>
                          <CardContent className={isMobile ? "p-3 pt-0" : undefined}>
                            <div className="grid grid-cols-2 gap-2">
                              {metadata.sampler.seed && (
                                <div className={cn("bg-muted rounded-md", isMobile ? "p-1.5" : "p-2")}>
                                  <p className="text-xs text-muted-foreground">Seed</p>
                                  <p className={cn("font-medium", isMobile ? "text-xs" : "text-sm")}>{metadata.sampler.seed}</p>
                                </div>
                              )}
                              {metadata.sampler.steps && (
                                <div className={cn("bg-muted rounded-md", isMobile ? "p-1.5" : "p-2")}>
                                  <p className="text-xs text-muted-foreground">Steps</p>
                                  <p className={cn("font-medium", isMobile ? "text-xs" : "text-sm")}>{metadata.sampler.steps}</p>
                                </div>
                              )}
                              {metadata.sampler.cfg_scale && (
                                <div className={cn("bg-muted rounded-md", isMobile ? "p-1.5" : "p-2")}>
                                  <p className="text-xs text-muted-foreground">CFG Scale</p>
                                  <p className={cn("font-medium", isMobile ? "text-xs" : "text-sm")}>{metadata.sampler.cfg_scale}</p>
                                </div>
                              )}
                              {metadata.sampler.sampler_name && (
                                <div className={cn("bg-muted rounded-md", isMobile ? "p-1.5" : "p-2")}>
                                  <p className="text-xs text-muted-foreground">Sampler</p>
                                  <p className={cn("font-medium", isMobile ? "text-xs" : "text-sm")}>{metadata.sampler.sampler_name}</p>
                                </div>
                              )}
                              {metadata.sampler.scheduler && (
                                <div className={cn("bg-muted rounded-md", isMobile ? "p-1.5" : "p-2")}>
                                  <p className="text-xs text-muted-foreground">Scheduler</p>
                                  <p className={cn("font-medium", isMobile ? "text-xs" : "text-sm")}>{metadata.sampler.scheduler}</p>
                                </div>
                              )}
                              {metadata.sampler.denoise && (
                                <div className={cn("bg-muted rounded-md", isMobile ? "p-1.5" : "p-2")}>
                                  <p className="text-xs text-muted-foreground">Denoise</p>
                                  <p className={cn("font-medium", isMobile ? "text-xs" : "text-sm")}>{metadata.sampler.denoise}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Models */}
                      {metadata.models && metadata.models.length > 0 && (
                        <Card>
                          <CardHeader className={isMobile ? "p-3" : undefined}>
                            <CardTitle className={cn("font-semibold text-primary", isMobile ? "text-xs" : "text-sm")}>
                              MODELS
                            </CardTitle>
                          </CardHeader>
                          <CardContent className={isMobile ? "p-3 pt-0" : undefined}>
                            <div className="space-y-2">
                              {metadata.models.map((model, idx) => (
                                <div key={idx} className={cn("bg-muted rounded-md", isMobile ? "p-1.5" : "p-2")}>
                                  <p className={cn("font-medium", isMobile ? "text-xs" : "text-sm")}>{model}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* LoRAs */}
                      {metadata.loras && metadata.loras.length > 0 && (
                        <Card>
                          <CardHeader className={isMobile ? "p-3" : undefined}>
                            <CardTitle className={cn("font-semibold text-primary", isMobile ? "text-xs" : "text-sm")}>
                              LORAS
                            </CardTitle>
                          </CardHeader>
                          <CardContent className={isMobile ? "p-3 pt-0" : undefined}>
                            <div className="space-y-2">
                              {metadata.loras.map((lora, idx) => (
                                <div key={idx} className={cn("bg-muted rounded-md", isMobile ? "p-2" : "p-3")}>
                                  <p className={cn("font-medium mb-1.5", isMobile ? "text-xs" : "text-sm")}>{lora.name}</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {lora.strength_model !== null && (
                                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                                        Model: {lora.strength_model}
                                      </span>
                                    )}
                                    {lora.strength_clip !== null && (
                                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
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
                      <CardContent className={cn(isMobile ? "py-6" : "py-8")}>
                        <p className={cn("text-center text-muted-foreground", isMobile ? "text-sm" : undefined)}>
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
