# ComfyUI Image Gallery

A modern, responsive web application for viewing and managing AI-generated images from ComfyUI with full metadata support.

## Features

### 🎨 Modern UI
- Clean, modern design with gradient accents
- Fully responsive (desktop, tablet, mobile)
- Material-UI components for consistent look and feel
- Smooth animations and transitions

### 🖼️ Gallery View
- Grid layout with high-quality thumbnails (80% JPEG quality)
- Hover effects with elevation
- Visual indicators for images with ComfyUI metadata
- Image dimensions and file size display
- Model information preview

### 🔍 Lightbox View
- Full-screen image viewer
- Keyboard navigation (arrow keys, ESC)
- Touch/swipe support for mobile and tablets
- Previous/Next navigation buttons
- Image counter (1/10, etc.)
- Click background to close

### 📊 Metadata Display
- **Positive & Negative Prompts** - Color-coded for easy distinction
- **Sampler Parameters**:
  - Seed
  - Steps
  - CFG Scale
  - Sampler Name
  - Scheduler
  - Denoise
- **Model Information** - Checkpoint/model names
- **LoRA Details**:
  - LoRA name
  - Model strength
  - CLIP strength
- **File Information**:
  - Filename
  - Dimensions
  - File size

### ✅ Selection & Download
- Multi-select images with visual feedback
- Select/Deselect all button
- Download selected images as ZIP
- Download all images as ZIP
- Individual image download

### 📱 Mobile Optimized
- Touch-friendly interface
- Swipe gestures for lightbox navigation
- Collapsible metadata panel on mobile
- Responsive grid (1 column mobile, 2 tablet, 3 desktop)

## Tech Stack

### Backend
- **Python 3.8+**
- **Flask** - Web framework
- **Pillow (PIL)** - Image processing and thumbnail generation
- **Flask-CORS** - Cross-origin support

### Frontend
- **React 18.2** - UI framework
- **Material-UI (MUI) 5** - Component library
- **react-swipeable** - Touch/swipe gestures
- **react-dropzone** - File upload
- **Axios** - HTTP client

## Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the Flask server:
```bash
python app.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Usage

1. **Upload Images**
   - Drag and drop images or click to select
   - Supports PNG (with ComfyUI metadata), JPG, JPEG, and WEBP
   - Multiple images can be uploaded at once

2. **Browse Gallery**
   - View all uploaded images in a grid layout
   - Click any image to open in lightbox
   - ComfyUI images are marked with a green badge

3. **View Image Details**
   - Click an image to open the lightbox
   - Use arrow keys or buttons to navigate
   - View complete metadata in the side panel
   - Swipe left/right on mobile/tablet

4. **Select and Download**
   - Click the checkbox on images to select
   - Use "Download Selected" to get selected images as ZIP
   - Use "Download All" to get all images as ZIP
   - Click download button in lightbox for single image

## ComfyUI Metadata

The application automatically extracts and displays ComfyUI workflow metadata from PNG images:

- **Workflow Data** - Complete workflow structure
- **Prompt Data** - Node configurations and parameters
- **KSampler Settings** - Generation parameters
- **Text Prompts** - Positive and negative prompts
- **LoRA Information** - LoRA models and strengths
- **Model Checkpoints** - Base models used

For non-PNG images or images without ComfyUI metadata, basic file information is displayed.

## API Endpoints

### Images
- `GET /api/images` - List all images with metadata
- `POST /api/upload` - Upload images
- `GET /api/image/<filename>` - Get full-size image
- `GET /api/thumbnail/<filename>` - Get thumbnail
- `GET /api/metadata/<filename>` - Get image metadata
- `DELETE /api/delete/<filename>` - Delete image

### Downloads
- `GET /api/download/<filename>` - Download single image
- `POST /api/download-selected` - Download selected images as ZIP
- `GET /api/download-all` - Download all images as ZIP

### Health
- `GET /api/health` - Health check endpoint

## Configuration

### Backend Configuration
Edit `backend/app.py`:
- `THUMBNAIL_QUALITY` - JPEG quality for thumbnails (default: 80)
- `THUMBNAIL_MAX_SIZE` - Max thumbnail dimensions (default: 400x400)
- `ALLOWED_EXTENSIONS` - Supported file formats

### Frontend Configuration
Create `.env` file in `frontend/` directory:
```
REACT_APP_API_URL=http://localhost:5000
```

## File Storage

Images and metadata are stored in temporary directories:
- `comfyui_gallery_images/` - Original images
- `comfyui_gallery_thumbnails/` - Generated thumbnails
- `comfyui_gallery_metadata/` - Extracted metadata JSON files

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development

### Project Structure
```
project-1/
├── backend/
│   ├── app.py                    # Flask application
│   ├── comfyui_metadata.py       # Metadata extractor
│   └── requirements.txt          # Python dependencies
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUploader.js   # Upload component
│   │   │   ├── ImageGallery.js   # Gallery grid
│   │   │   ├── ImageLightbox.js  # Lightbox viewer
│   │   │   └── Header.js         # App header
│   │   ├── services/
│   │   │   └── api.js            # API client
│   │   ├── App.js                # Main app component
│   │   └── index.js              # Entry point
│   └── package.json
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Credits

Built with:
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) - Amazing AI image generation tool
- [Material-UI](https://mui.com/) - React component library
- [Flask](https://flask.palletsprojects.com/) - Python web framework
- [Pillow](https://python-pillow.org/) - Python imaging library

## Support

For issues and questions, please open an issue on the GitHub repository.
