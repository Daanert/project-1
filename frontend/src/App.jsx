import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, RefreshCw, Folder, CheckCircle, XCircle, Download, Zap } from 'lucide-react';
import axios from 'axios';
import ImageGallery from './components/ImageGallery';
import ImageLightbox from './components/ImageLightbox';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Switch } from './components/ui/switch';
import { cn } from './lib/utils';

function App() {
  const [images, setImages] = useState([]);
  const [darkMode, setDarkMode] = useState(true); // Dark mode by default
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [autoSync, setAutoSync] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load config and images when the component mounts
  useEffect(() => {
    fetchConfig();
    fetchImages();
  }, []);

  // Auto-sync functionality - poll for new images every 5 seconds
  useEffect(() => {
    if (!autoSync) return;

    const interval = setInterval(async () => {
      setIsSyncing(true);
      try {
        const response = await axios.get('/api/images');
        if (response.data && response.data.images) {
          // Only update if the count changed or images are different
          if (response.data.images.length !== images.length) {
            setImages(response.data.images);
          }
        }
      } catch (error) {
        console.error('Error syncing images:', error);
      } finally {
        setIsSyncing(false);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [autoSync, images.length]);

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/config');
      if (response.data) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/images');
      if (response.data && response.data.images) {
        setImages(response.data.images);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchImages();
  };

  const handleDownloadAll = async () => {
    if (images.length === 0) return;

    try {
      const response = await axios.get('/api/download-all', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `all_images_${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading all images:', error);
    }
  };

  const handleImageClick = (index) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const navigateLightbox = (newIndex) => {
    setLightboxIndex(newIndex);
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-300", darkMode ? "dark" : "")}>
      {/* Header - responsive */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-3 md:px-4">
          <div className="flex items-center gap-1.5 md:gap-2">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg"
            />
            <h1 className="text-base md:text-xl font-bold">ComfyUI Gallery</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Auto-sync toggle */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <motion.div
                animate={isSyncing ? {
                  scale: [1, 1.3, 1],
                  rotate: [0, 180, 360],
                } : {}}
                transition={{
                  duration: 0.6,
                  repeat: isSyncing ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                <Zap className={cn(
                  "h-4 w-4 md:h-5 md:w-5 transition-colors",
                  autoSync ? "text-primary" : "text-muted-foreground",
                  isSyncing && "text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]"
                )} />
              </motion.div>
              <Switch
                checked={autoSync}
                onCheckedChange={setAutoSync}
                className="scale-90 md:scale-100"
              />
              <span className="text-xs font-medium hidden sm:inline">
                {autoSync ? 'Auto' : 'Manual'}
              </span>
            </div>

            {/* Dark mode toggle */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <Sun className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
                className="scale-90 md:scale-100"
              />
              <Moon className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </div>

            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 h-8 md:h-9 px-2.5 md:px-3"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 md:h-4 md:w-4", isLoading && "animate-spin")} />
              <span className="hidden sm:inline text-xs md:text-sm">
                {isLoading ? 'Scanning...' : 'Refresh'}
              </span>
            </Button>

            {/* Download all button */}
            {images.length > 0 && (
              <Button
                size="sm"
                onClick={handleDownloadAll}
                className="flex items-center gap-1.5 h-8 md:h-9 px-2.5 md:px-3"
              >
                <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden sm:inline text-xs md:text-sm">Download All</span>
              </Button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main content - responsive */}
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-4 md:mb-8"
        >
          <h2 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2 bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent pb-1">
            ComfyUI Image Gallery
          </h2>
          <p className="text-muted-foreground text-sm md:text-lg">
            View and manage your AI-generated images with metadata
          </p>
        </motion.div>

        {/* Folder status card - responsive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 md:mb-8"
        >
          <Card>
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2 min-w-0 max-w-full">
                  <Folder className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                  <span className="font-medium text-xs md:text-sm truncate">
                    {config?.comfyui_folder || 'Loading...'}
                  </span>
                </div>
                {config && (
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-xs font-medium flex-shrink-0",
                    config.folder_exists
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}>
                    {config.folder_exists ? (
                      <>
                        <CheckCircle className="h-3 w-3 md:h-3.5 md:w-3.5" />
                        <span className="hidden sm:inline">Folder found</span>
                        <span className="sm:hidden">Found</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 md:h-3.5 md:w-3.5" />
                        <span className="hidden sm:inline">Folder not found</span>
                        <span className="sm:hidden">Not found</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                {images.length > 0 && (
                  <div className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                    {images.length} {images.length === 1 ? 'image' : 'images'}
                  </div>
                )}
                {autoSync && (
                  <motion.div
                    animate={isSyncing ? {
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0 0 0 0 rgba(59, 130, 246, 0)",
                        "0 0 0 4px rgba(59, 130, 246, 0.3)",
                        "0 0 0 0 rgba(59, 130, 246, 0)"
                      ]
                    } : {}}
                    transition={{
                      duration: 1.5,
                      repeat: isSyncing ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                    className={cn(
                      "flex items-center gap-1 md:gap-1.5 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                      isSyncing
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    )}
                  >
                    <motion.div
                      animate={isSyncing ? {
                        rotate: [0, 360],
                        scale: [1, 1.2, 1]
                      } : {}}
                      transition={{
                        duration: 1,
                        repeat: isSyncing ? Infinity : 0,
                        ease: "linear"
                      }}
                    >
                      <Zap className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    </motion.div>
                    <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Auto-sync'}</span>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Gallery or loading state */}
        <AnimatePresence mode="wait">
          {isLoading && images.length === 0 ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4"
              />
              <p className="text-muted-foreground">Scanning for images...</p>
            </motion.div>
          ) : images.length > 0 ? (
            <motion.div
              key="gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ImageGallery
                images={images}
                onImageClick={handleImageClick}
                darkMode={darkMode}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Folder className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No images found</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    {config?.folder_exists === false
                      ? `Folder not found: ${config?.comfyui_folder || 'undefined'}`
                      : 'Add some images to your ComfyUI output folder and click Refresh'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}
    </div>
  );
}

export default App;
