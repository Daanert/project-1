import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoAlbum } from 'react-photo-album';
import { Download, CheckSquare, Square } from 'lucide-react';
import axios from 'axios';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const ImageGallery = ({ images, onImageClick, darkMode }) => {
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [hoveredImage, setHoveredImage] = useState(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);

  const handleImageSelect = (e, filename) => {
    e.stopPropagation();

    const currentIndex = images.findIndex(img => img.filename === filename);
    const newSelected = new Set(selectedImages);

    // Shift+click: select range
    if (e.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);

      // Select all images in range
      for (let i = start; i <= end; i++) {
        newSelected.add(images[i].filename);
      }

      setSelectedImages(newSelected);
      setLastSelectedIndex(currentIndex);
    }
    // Normal click: toggle single image
    else {
      if (newSelected.has(filename)) {
        newSelected.delete(filename);
        // If deselecting, clear last selected index
        setLastSelectedIndex(null);
      } else {
        newSelected.add(filename);
        setLastSelectedIndex(currentIndex);
      }
      setSelectedImages(newSelected);
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedImages.size === 0) return;

    try {
      const response = await axios.post(
        '/api/download-selected',
        { filenames: Array.from(selectedImages) },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `selected_images_${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading images:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
      setLastSelectedIndex(null);
    } else {
      setSelectedImages(new Set(images.map(img => img.filename)));
      // Set last index to the last image when selecting all
      setLastSelectedIndex(images.length - 1);
    }
  };

  // Transform images for React Photo Album
  const photos = images.map((image) => ({
    src: image.image_url,
    width: image.width,
    height: image.height,
    key: image.filename,
    title: image.filename,
    // Store original data for click handling
    _data: image
  }));

  // Custom render function for each photo
  const renderPhoto = ({ photo, wrapperStyle, renderDefaultPhoto }) => {
    const isSelected = selectedImages.has(photo.key);
    const isHovered = hoveredImage === photo.key;

    return (
      <motion.div
        style={wrapperStyle}
        className="relative group cursor-pointer overflow-hidden rounded-lg"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        onMouseEnter={() => setHoveredImage(photo.key)}
        onMouseLeave={() => setHoveredImage(null)}
        onClick={() => {
          const index = images.findIndex(img => img.filename === photo.key);
          onImageClick(index);
        }}
      >
        {/* Image */}
        <motion.img
          src={photo.src}
          alt={photo.title}
          className={cn(
            "w-full h-full object-cover",
            isSelected && "ring-4 ring-primary"
          )}
          style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />

        {/* Overlay on hover */}
        <AnimatePresence>
          {(isHovered || isSelected) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 flex items-start justify-end p-2"
            >
              <button
                onClick={(e) => handleImageSelect(e, photo.key)}
                className="bg-background/90 backdrop-blur-sm p-2 rounded-md hover:bg-background transition-colors z-10"
              >
                {isSelected ? (
                  <CheckSquare className="w-5 h-5 text-primary" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-2xl font-semibold mb-2">No images found</p>
          <p className="text-muted-foreground">
            Add some images to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Selection toolbar - responsive */}
      <AnimatePresence>
        {selectedImages.size > 0 && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 md:top-52 left-1/2 -translate-x-1/2 z-50 bg-card border rounded-lg shadow-lg p-3 md:p-4 flex flex-wrap items-center justify-center gap-2 md:gap-4 max-w-[90vw]"
          >
            <span className="text-xs md:text-sm font-medium whitespace-nowrap">
              {selectedImages.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs md:text-sm h-8 md:h-9"
            >
              {selectedImages.size === images.length ? 'Deselect' : 'Select All'}
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadSelected}
              className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm h-8 md:h-9"
            >
              <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Download Selected</span>
              <span className="sm:hidden">Download</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Album - responsive */}
      <PhotoAlbum
        photos={photos}
        layout="masonry"
        targetRowHeight={(containerWidth) => {
          if (containerWidth < 640) return 200; // Mobile
          if (containerWidth < 1024) return 250; // Tablet
          return 300; // Desktop
        }}
        spacing={(containerWidth) => {
          if (containerWidth < 640) return 8; // Mobile
          if (containerWidth < 1024) return 12; // Tablet
          return 16; // Desktop
        }}
        renderPhoto={renderPhoto}
        columns={(containerWidth) => {
          if (containerWidth < 640) return 1;
          if (containerWidth < 768) return 2;
          if (containerWidth < 1024) return 3;
          if (containerWidth < 1536) return 4;
          if (containerWidth < 2560) return 6;
          return 8;
        }}
      />
    </div>
  );
};

export default ImageGallery;
