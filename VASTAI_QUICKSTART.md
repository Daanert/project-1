# 🚀 ComfyUI Gallery - Vast.ai Quick Start

Complete fresh-start guide for deploying the ComfyUI Gallery on Vast.ai.

## Prerequisites

Your Vast.ai instance should have:
- ✅ ComfyUI installed with images in `/ComfyUI/output/` or `/workspace/ComfyUI/output/`
- ✅ Python 3.8+ (usually pre-installed)
- ✅ Node.js and npm (install if needed)
- ✅ Git (usually pre-installed)
- ✅ Cloudflared for tunnel (install if needed)

## One-Command Deployment

### Step 1: Clone the Repository

```bash
cd /workspace
git clone https://github.com/Daanert/project-1.git comfyui-gallery
cd comfyui-gallery
```

### Step 2: Run Deployment

```bash
chmod +x deploy-vastai.sh
./deploy-vastai.sh
```

That's it! The script automatically:
- 🔍 Detects your ComfyUI output folder
- 📦 Installs Python and Node.js dependencies
- 🔧 Starts Flask backend (port 5000)
- 🎨 Starts React frontend (port 3000)
- 🌍 Creates Cloudflare tunnel for public access

### Step 3: Access Your Gallery

Look for the tunnel URL in the terminal output:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://xxxxx-xx-xx-xxx-xxx.trycloudflare.com                                             |
+--------------------------------------------------------------------------------------------+
```

Copy this URL and open it in your browser. You should see your ComfyUI images!

## Stopping Services

Press `Ctrl+C` in the terminal to stop all services safely.

Or use the stop script:
```bash
./stop-all.sh
```

**Important:** These scripts only kill gallery processes, not your entire Vast.ai instance.

## Restarting Services

To restart everything:
```bash
./stop-all.sh
./deploy-vastai.sh
```

Or if you want to run without tunnel (local only):
```bash
./stop-all.sh
./start-all.sh
```

## Checking Logs

If something goes wrong:

```bash
# Backend logs
tail -f /tmp/gallery_backend.log

# Frontend logs
tail -f /tmp/gallery_frontend.log
```

## Verifying ComfyUI Folder

Before deployment, verify your images are accessible:

```bash
# Check standard location
ls -la /ComfyUI/output

# Or alternative location
ls -la /workspace/ComfyUI/output

# Count images
find /ComfyUI/output -type f \( -name "*.png" -o -name "*.jpg" \) | wc -l
```

## Troubleshooting

### No Images Showing

**Problem:** Gallery shows "No images found" even though ComfyUI has images.

**Solution:**
1. Verify folder exists: `ls -la /ComfyUI/output`
2. Check backend detected folder in deployment output
3. Check backend logs: `tail /tmp/gallery_backend.log`
4. Restart services: `./stop-all.sh && ./deploy-vastai.sh`

### Port Already in Use

**Problem:** Backend or frontend fails to start (port 3000 or 5000 in use).

**Solution:**
```bash
# Find and kill processes on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Find and kill processes on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Then redeploy
./deploy-vastai.sh
```

### Dependencies Won't Install

**Problem:** npm install or pip install fails.

**Solution:**
```bash
# Update npm
npm install -g npm@latest

# Update pip
pip install --upgrade pip

# Clear npm cache
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
cd ..

# Try deployment again
./deploy-vastai.sh
```

### Tunnel Won't Start

**Problem:** Cloudflare tunnel fails or doesn't show URL.

**Solution:**
1. Install cloudflared if missing:
```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

2. Test tunnel manually:
```bash
cloudflared tunnel --url http://localhost:3000
```

### Instance Crashed After Stop Script

**Problem:** Vast.ai instance became unresponsive after running stop commands.

**Solution:** This should NOT happen with our safe stop scripts. If it does:
1. Use the safe scripts: `./stop-all.sh` or `./stop-gallery.sh`
2. Never use `pkill python` or `pkill node` directly
3. If instance is stuck, reboot from Vast.ai dashboard

## Quick Reference

### Deployment Commands
```bash
# Fresh deployment with tunnel
./deploy-vastai.sh

# Start without tunnel
./start-all.sh

# Start with tunnel
./start-all.sh tunnel

# Stop safely
./stop-all.sh
```

### Useful Commands
```bash
# Check running processes
ps aux | grep "python.*backend/app.py"
ps aux | grep "node.*frontend"

# View logs in real-time
tail -f /tmp/gallery_backend.log
tail -f /tmp/gallery_frontend.log

# Test backend API
curl http://localhost:5000/api/health

# Check ComfyUI images
find /ComfyUI/output -name "*.png" | head -10
```

## Advanced: Manual Control

If you need fine-grained control, start services individually:

```bash
# Backend only
cd backend
python3 app.py

# Frontend only (separate terminal)
cd frontend
PORT=3000 npm start

# Tunnel only (separate terminal)
cloudflared tunnel --url http://localhost:3000
```

## Support

For issues or questions:
- Check logs first: `/tmp/gallery_backend.log` and `/tmp/gallery_frontend.log`
- Open an issue on GitHub: https://github.com/Daanert/project-1/issues
- Include error messages and logs when reporting issues

## What's Automatic

The gallery automatically:
- ✅ Detects ComfyUI folder (no config needed)
- ✅ Generates thumbnails for images
- ✅ Extracts ComfyUI metadata from PNG files
- ✅ Supports PNG, JPG, JPEG, and WEBP formats
- ✅ Creates responsive gallery for all devices
- ✅ Enables image selection and batch downloads

Just run `./deploy-vastai.sh` and everything works!
