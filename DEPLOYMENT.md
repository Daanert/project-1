# ComfyUI Image Gallery - Deployment Guide

This guide explains how to deploy the ComfyUI Image Gallery on your Vast.ai instance.

## 📋 Prerequisites

Your Vast.ai instance should have:
- Python 3.8+
- Node.js 14+
- npm
- ComfyUI installed at `/workspace/ComfyUI/`

## 🚀 Quick Start (Vast.ai)

### 1. Upload Project to Vast.ai

Upload the entire project folder to `/workspace/project-1/` on your Vast.ai instance.

You can use one of these methods:
- **Jupyter Upload**: Use the Jupyter file browser to upload the folder
- **Git Clone**: Clone from your repository
- **SCP**: Copy files via SCP if you have SSH access

### 2. Run Setup Script

```bash
cd /workspace/project-1
chmod +x deploy-vastai.sh
./deploy-vastai.sh
```

This will:
- Install all Python dependencies
- Install all Node.js dependencies
- Build the React frontend
- Create startup scripts

### 3. Start the Gallery

**Option A: Local Access Only**
```bash
./start-all.sh
```
Access at: `http://localhost:3000`

**Option B: With Cloudflare Tunnel (Public Access)**
```bash
./start-all.sh tunnel
```
This will display a public URL like: `https://xxx-yyy-zzz.trycloudflare.com`

## 📁 Folder Structure

The app expects ComfyUI images at:
```
/workspace/ComfyUI/output/
```

It will recursively scan all subfolders, so images can be organized like:
```
/workspace/ComfyUI/output/
├── Qwen2/
│   ├── image1.png
│   ├── image2.png
├── FLUX/
│   ├── image3.png
└── other_folder/
    └── image4.png
```

## 🔧 Configuration

### Change ComfyUI Output Folder

Edit `backend/app.py` line 17:
```python
COMFYUI_OUTPUT_FOLDER = '/workspace/ComfyUI/output'
```

Change to your desired path.

### Change Thumbnail Quality

Edit `backend/app.py` line 20:
```python
THUMBNAIL_QUALITY = 80  # Change to 60-100
```

## 🛠️ Manual Setup (Alternative)

If the automated script doesn't work, follow these steps:

### Backend Setup
```bash
cd backend
pip3 install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
npm run build
```

### Proxy Server Setup
```bash
cd ..  # Back to project root
npm install
```

### Start Services Manually

**Terminal 1 - Backend:**
```bash
cd backend
python3 app.py
```

**Terminal 2 - Frontend Proxy:**
```bash
node proxy-server.js
```

**Terminal 3 - Tunnel (Optional):**
```bash
cloudflared tunnel --url http://localhost:3000
```

## 📊 Monitoring

### Check Logs
```bash
# Backend logs
tail -f /tmp/gallery_backend.log

# Frontend logs
tail -f /tmp/gallery_frontend.log
```

### Check if Services are Running
```bash
# Check backend (should show Python process on port 5000)
lsof -i :5000

# Check frontend proxy (should show Node process on port 3000)
lsof -i :3000
```

## 🔍 Troubleshooting

### No Images Found

1. **Check folder exists:**
   ```bash
   ls -la /workspace/ComfyUI/output
   ```

2. **Check for images:**
   ```bash
   find /workspace/ComfyUI/output -name "*.png" | wc -l
   ```

3. **Check backend logs:**
   ```bash
   tail -50 /tmp/gallery_backend.log
   ```

### Backend Not Starting

1. **Check if port is in use:**
   ```bash
   lsof -i :5000
   kill <PID>  # If needed
   ```

2. **Check Python dependencies:**
   ```bash
   python3 -c "import flask, flask_cors, PIL; print('OK')"
   ```

3. **Check error details:**
   ```bash
   cd backend
   python3 app.py  # Run in foreground to see errors
   ```

### Frontend Not Loading

1. **Check if build exists:**
   ```bash
   ls -la frontend/build
   ```

2. **Rebuild frontend:**
   ```bash
   cd frontend
   rm -rf build node_modules
   npm install
   npm run build
   ```

3. **Check proxy logs:**
   ```bash
   tail -50 /tmp/gallery_frontend.log
   ```

### Cloudflare Tunnel Issues

1. **Install cloudflared if missing:**
   ```bash
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
   chmod +x cloudflared-linux-amd64
   sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
   ```

2. **Test tunnel manually:**
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

## 🎨 Features

- **Auto-scan**: Automatically scans `/workspace/ComfyUI/output` for images
- **Metadata extraction**: Extracts prompts, sampler settings, LoRA info from PNG files
- **Responsive gallery**: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- **Lightbox viewer**: Full-screen image viewing with navigation
- **Touch gestures**: Swipe left/right on mobile/tablet
- **Keyboard shortcuts**: Arrow keys and ESC in lightbox
- **Multi-select**: Select multiple images for bulk download
- **ZIP download**: Download selected images or all images as ZIP

## 📝 API Endpoints

- `GET /api/config` - Get configuration and folder status
- `GET /api/images` - List all images with metadata
- `GET /api/thumbnail/<id>` - Get thumbnail (80% quality, max 400x400)
- `GET /api/image/<id>` - Get full-size image
- `GET /api/download/<id>` - Download single image
- `POST /api/download-selected` - Download multiple images as ZIP
- `GET /api/download-all` - Download all images as ZIP

## 🔒 Security Notes

- The tunnel provides public access to your gallery
- Anyone with the tunnel URL can view/download your images
- Use Cloudflare Access or authentication if you need to restrict access
- The tunnel URL changes each time you restart

## 📦 Updating

To update the gallery after making changes:

```bash
cd /workspace/project-1
git pull  # If using git

# Rebuild frontend if UI changed
cd frontend
npm run build
cd ..

# Restart services
pkill -f "python3 app.py"
pkill -f "node proxy-server"
./start-all.sh tunnel
```

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the logs in `/tmp/gallery_backend.log` and `/tmp/gallery_frontend.log`
3. Ensure all dependencies are installed correctly
4. Verify the ComfyUI output folder path is correct
