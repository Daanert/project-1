# 🎨 ComfyUI Image Gallery - Quick Start

## What You Have

A complete ComfyUI Image Gallery web application with:

✅ **Auto-scanning** of `/workspace/ComfyUI/output` folder
✅ **Responsive gallery** with thumbnails (1/2/3 columns based on device)
✅ **Lightbox viewer** with swipe gestures and keyboard navigation
✅ **Metadata display** for ComfyUI images (prompts, sampler, LoRA, models)
✅ **Multi-select** and batch download (ZIP files)
✅ **Refresh button** to rescan for new images
✅ **Cloudflare tunnel** support for public access

## 🚀 Deploy to Vast.ai in 3 Steps

### Step 1: Upload Project

In your Vast.ai Jupyter file browser (shown in your screenshot):

1. Navigate to `/workspace/`
2. Upload the entire `project-1` folder OR clone from git:
   ```bash
   cd /workspace
   git clone <your-repo-url> project-1
   ```

### Step 2: Run Setup

Open a terminal in Jupyter and run:

```bash
cd /workspace/project-1
chmod +x deploy-vastai.sh
./deploy-vastai.sh
```

This installs all dependencies and builds the frontend. Takes ~2-3 minutes.

### Step 3: Start the Gallery

**For public access with Cloudflare tunnel:**
```bash
./start-all.sh tunnel
```

The script will display a URL like:
```
https://arrangements-twice-representatives.trycloudflare.com
```

Open this URL in your browser! 🎉

**For local testing only:**
```bash
./start-all.sh
```
Access at `http://localhost:3000`

## 📱 How to Use

1. **Gallery View**:
   - Shows all images from `/workspace/ComfyUI/output`
   - Click "Refresh" to scan for new images
   - Check folder status at the top

2. **Select Images**:
   - Click checkbox on each image to select
   - Or click "Select All"

3. **View Full Image**:
   - Click on any image to open lightbox
   - Use arrow keys or swipe to navigate
   - View metadata in the panel (prompts, settings, etc.)
   - Press ESC to close

4. **Download**:
   - Click "Download Selected" for chosen images
   - Click "Download All" for everything
   - Downloads as ZIP file

## 🔍 Verifying It Works

After starting, check:

1. **Backend running**:
   ```bash
   curl http://localhost:5000/api/config
   ```
   Should show folder path and status.

2. **Images found**:
   ```bash
   curl http://localhost:5000/api/images | head -c 200
   ```
   Should show JSON with your images.

3. **Frontend accessible**:
   Open the tunnel URL or `http://localhost:3000`

## 📁 Where Are My Images?

The gallery looks in: `/workspace/ComfyUI/output/`

Based on your screenshot, you should have images in:
- `/workspace/ComfyUI/output/Qwen2/`

The scanner will find ALL images in ANY subfolder, so you can organize however you like:
```
/workspace/ComfyUI/output/
├── Qwen2/        ← Your existing images
├── FLUX/
├── SDXL/
└── experiments/
```

## 🛑 Stopping the Gallery

If you started with `./start-all.sh tunnel`:
- Press `Ctrl+C` in the terminal

If you started with `./start-all.sh`:
- Find the PIDs shown in the output
- Run: `kill <backend_pid> <proxy_pid>`

Or just restart the terminal.

## 🔧 Troubleshooting

### "No images found"

Check if folder exists and has images:
```bash
ls -la /workspace/ComfyUI/output
find /workspace/ComfyUI/output -name "*.png" | wc -l
```

### "Folder not found"

The ComfyUI output path might be different. Check where ComfyUI saves images:
```bash
find /workspace -type d -name "output" 2>/dev/null
```

Then edit `backend/app.py` line 17 with the correct path.

### Backend won't start

Check Python dependencies:
```bash
python3 -c "import flask, flask_cors, PIL; print('All OK')"
```

If missing, reinstall:
```bash
cd backend
pip3 install -r requirements.txt
```

### Frontend shows errors

Rebuild:
```bash
cd frontend
npm install
npm run build
```

### More help

See `DEPLOYMENT.md` for comprehensive troubleshooting guide.

## 📝 File Structure

```
project-1/
├── backend/
│   ├── app.py                  # Flask API server
│   ├── comfyui_metadata.py     # Metadata extractor
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.js              # Main app
│   │   ├── components/
│   │   │   ├── ImageGallery.js # Grid view
│   │   │   └── ImageLightbox.js # Full-screen viewer
│   │   └── services/
│   │       └── api.js          # API client
│   ├── public/
│   └── package.json
├── proxy-server.js             # Serves frontend + proxies API
├── deploy-vastai.sh           # Setup script
├── start-all.sh               # Startup script
├── DEPLOYMENT.md              # Full deployment guide
└── QUICK-START.md             # This file
```

## 🎯 Next Steps

1. ✅ Deploy to Vast.ai (follow steps above)
2. ✅ Start with tunnel to get public URL
3. ✅ Test the gallery with your images
4. 🔄 Click "Refresh" when ComfyUI generates new images

That's it! Enjoy your gallery! 🎨✨
