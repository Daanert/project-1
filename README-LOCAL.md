# ComfyUI Image Gallery - Local Development

Run the ComfyUI Image Gallery on your local PC with placeholder images.

## Quick Start

### Prerequisites

- **Python 3.8+** with pip
- **Node.js 14+** with npm
- **Git** (optional, for cloning)

### Automatic Setup (Recommended)

**Linux/Mac:**
```bash
chmod +x start-local.sh
./start-local.sh
```

**Windows:**
```batch
start-local.bat
```

The script will:
1. Generate 20 placeholder images with realistic ComfyUI metadata
2. Install all Python and Node.js dependencies
3. Start the Flask backend (port 5000)
4. Start the React frontend (port 3000)
5. Open your browser to http://localhost:3000

### Manual Setup

If you prefer to run each step manually:

#### 1. Generate Placeholder Images

```bash
python3 generate_placeholder_images.py
```

This creates 20 colorful placeholder images in the `placeholder_images/` folder, each with embedded ComfyUI metadata including prompts, LoRAs, and sampler parameters.

#### 2. Install Backend Dependencies

```bash
cd backend
pip3 install -r requirements.txt
```

#### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

#### 4. Start Backend

```bash
cd backend
python3 app.py
```

The backend API will run on http://localhost:5000

#### 5. Start Frontend

```bash
cd frontend
npm start
```

The frontend will run on http://localhost:3000 and open in your browser.

## Features

- **Image Gallery**: Responsive grid layout (1-8 columns based on screen size)
- **Square Thumbnails**: Optimized for ultrawide monitors
- **Lightbox Viewer**: Click any image to view full-size (60vw width)
- **Metadata Display**: View complete ComfyUI metadata:
  - Positive and negative prompts
  - KSampler parameters (seed, steps, CFG, sampler, scheduler, denoise)
  - Models/checkpoints
  - LoRAs with strengths
- **Multi-Select**: Select multiple images for batch download
- **ZIP Download**: Download selected images or all images as ZIP
- **Dark Mode**: Toggle between light and dark themes

## Using Your Own Images

To use your own ComfyUI images instead of placeholders:

1. Set the `COMFYUI_OUTPUT_FOLDER` environment variable:

**Linux/Mac:**
```bash
export COMFYUI_OUTPUT_FOLDER="/path/to/your/ComfyUI/output"
```

**Windows:**
```batch
set COMFYUI_OUTPUT_FOLDER=C:\path\to\your\ComfyUI\output
```

2. Start the backend as usual

The gallery will now display your actual ComfyUI output images.

## Troubleshooting

### Backend won't start

Check the logs:
```bash
tail -f /tmp/gallery_backend.log  # Linux/Mac
type %TEMP%\gallery_backend.log   # Windows
```

Common issues:
- Port 5000 already in use: Kill the process using port 5000
- Missing dependencies: Run `pip3 install -r backend/requirements.txt`

### Frontend won't start

Check the logs:
```bash
tail -f /tmp/gallery_frontend.log  # Linux/Mac
type %TEMP%\gallery_frontend.log   # Windows
```

Common issues:
- Port 3000 already in use: Kill the process using port 3000
- Missing dependencies: Run `npm install` in the frontend folder

### Images not showing

1. Make sure placeholder images were generated: `ls placeholder_images/`
2. Check backend is running: http://localhost:5000/api/health
3. Check browser console for errors (F12)

## Project Structure

```
.
├── backend/
│   ├── app.py                    # Flask backend API
│   ├── comfyui_metadata.py       # Metadata extraction
│   └── requirements.txt          # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImageGallery.js   # Gallery grid component
│   │   │   └── ImageLightbox.js  # Lightbox viewer
│   │   └── App.js                # Main app component
│   └── package.json              # Frontend dependencies
├── placeholder_images/           # Generated placeholder images
├── generate_placeholder_images.py # Placeholder generator script
├── start-local.sh                # Linux/Mac startup script
├── start-local.bat               # Windows startup script
└── README-LOCAL.md               # This file
```

## Stopping the Servers

**If using the startup scripts:**

Press Ctrl+C in the terminal to stop watching logs. The servers will continue running in the background.

To stop the servers:

**Linux/Mac:**
```bash
# Find the process IDs
ps aux | grep "python3 app.py"
ps aux | grep "npm start"

# Kill them
kill <PID>
```

**Windows:**
```batch
taskkill /F /IM python.exe
taskkill /F /IM node.exe
```

## Customization

### Change Number of Placeholder Images

Edit `generate_placeholder_images.py` and modify:
```python
num_images = 20  # Change this number
```

### Change Gallery Columns

Edit `frontend/src/components/ImageGallery.js` and adjust the responsive breakpoints.

### Change Lightbox Width

Edit `frontend/src/components/ImageLightbox.js` and modify:
```javascript
width: isMobile ? '100%' : '60vw',  // Change 60vw
```

## License

MIT License - feel free to use and modify as needed!
