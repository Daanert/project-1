import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoAlbum } from 'react-photo-album';
import { Download, CheckSquare, Square } from 'lucide-react';
import axios from 'axios';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const ImageGallery = ({ onImageClick, darkMode }) => {
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [hoveredImage, setHoveredImage] = useState(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/images');
      setImages(response.data.images || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e, filename) => {
    e.stopPropagation();
    const newSelected = new Set(selectedImages);
    if (newSelected.has(filename)) {
      newSelected.delete(filename);
    } else {
      newSelected.add(filename);
    }
    setSelectedImages(newSelected);
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
    } else {
      setSelectedImages(new Set(images.map(img => img.filename)));
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
        className="relative group cursor-pointer"
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
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={photo.src}
            alt={photo.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              isSelected && "ring-4 ring-primary",
              "group-hover:scale-105"
            )}
            style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
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
                  className="bg-background/90 backdrop-blur-sm p-2 rounded-md hover:bg-background transition-colors"
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
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (images.length === 0) {
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
      {/* Selection toolbar */}
      <AnimatePresence>
        {selectedImages.size > 0 && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-card border rounded-lg shadow-lg p-4 flex items-center gap-4"
          >
            <span className="text-sm font-medium">
              {selectedImages.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedImages.size === images.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadSelected}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Selected
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Album */}
      <PhotoAlbum
        photos={photos}
        layout="masonry"
        targetRowHeight={300}
        spacing={16}
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
