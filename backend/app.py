from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import zipfile
import time
import threading
from werkzeug.utils import secure_filename
from comfyui_metadata import ComfyUIMetadataExtractor
from PIL import Image
import json
import hashlib
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

app = Flask(__name__)
CORS(app)

# Configuration
# Auto-detect: use /ComfyUI/output on Vast.ai, or placeholder_images locally
DEFAULT_LOCAL_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'placeholder_images')
VASTAI_COMFYUI_FOLDERS = ['/ComfyUI/output', '/workspace/ComfyUI/output']

# Smart detection: check multiple possible Vast.ai locations
COMFYUI_OUTPUT_FOLDER = None
for folder in VASTAI_COMFYUI_FOLDERS:
    if os.path.exists(folder):
        COMFYUI_OUTPUT_FOLDER = folder
        print(f"🚀 Detected Vast.ai - Using: {COMFYUI_OUTPUT_FOLDER}")
        break

# Fall back to local mode if no Vast.ai folder found
if COMFYUI_OUTPUT_FOLDER is None:
    COMFYUI_OUTPUT_FOLDER = os.environ.get('COMFYUI_OUTPUT_FOLDER', DEFAULT_LOCAL_FOLDER)
    print(f"💻 Local mode - Using: {COMFYUI_OUTPUT_FOLDER}")
THUMBNAILS_FOLDER = os.path.join(tempfile.gettempdir(), 'comfyui_gallery_thumbnails')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
THUMBNAIL_QUALITY = 80
THUMBNAIL_MAX_SIZE = (400, 400)

# Create necessary directories
os.makedirs(THUMBNAILS_FOLDER, exist_ok=True)

# Initialize metadata extractor
metadata_extractor = ComfyUIMetadataExtractor()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_thumbnail_filename(image_path):
    """Generate a unique thumbnail filename based on image path hash"""
    # Create a hash of the full path to ensure uniqueness
    path_hash = hashlib.md5(image_path.encode()).hexdigest()[:16]
    return f"{path_hash}_thumb.jpg"


def scan_comfyui_output(extract_metadata=False):
    """Recursively scan the ComfyUI output folder for images"""
    images = []

    if not os.path.exists(COMFYUI_OUTPUT_FOLDER):
        return images

    print(f"Scanning {COMFYUI_OUTPUT_FOLDER}...")

    # Walk through all subdirectories
    for root, dirs, files in os.walk(COMFYUI_OUTPUT_FOLDER):
        for filename in files:
            if allowed_file(filename):
                full_path = os.path.join(root, filename)
                try:
                    # Get image info quickly
                    with Image.open(full_path) as img:
                        width, height = img.size

                    # Generate thumbnail filename
                    thumbnail_filename = get_thumbnail_filename(full_path)
                    thumbnail_path = os.path.join(THUMBNAILS_FOLDER, thumbnail_filename)

                    # Only generate thumbnail if requested and doesn't exist
                    # This is done on-demand when thumbnail is requested
                    thumbnail_exists = os.path.exists(thumbnail_path)

                    # Get relative path for display
                    rel_path = os.path.relpath(full_path, COMFYUI_OUTPUT_FOLDER)

                    # Basic metadata (extract full metadata on-demand)
                    metadata = {
                        'positive_prompt': 'N/A',
                        'negative_prompt': 'N/A',
                        'sampler': {},
                        'loras': [],
                        'models': [],
                        'has_workflow': False,
                        'has_prompt': filename.lower().endswith('.png')
                    }

                    # Only extract metadata if explicitly requested (for lightbox view)
                    if extract_metadata and filename.lower().endswith('.png'):
                        try:
                            raw_metadata = metadata_extractor.extract_metadata(full_path)
                            metadata = metadata_extractor.format_metadata_for_display(raw_metadata)
                        except Exception as e:
                            print(f"Error extracting metadata from {filename}: {e}")

                    images.append({
                        'filename': filename,
                        'path': rel_path,
                        'full_path': full_path,
                        'size': os.path.getsize(full_path),
                        'width': width,
                        'height': height,
                        'created': os.path.getmtime(full_path),
                        'thumbnail_url': f'/api/thumbnail/{thumbnail_filename}',
                        'image_url': f'/api/image/{thumbnail_filename.replace("_thumb.jpg", "")}',
                        'metadata': metadata,
                        'thumbnail_exists': thumbnail_exists
                    })
                except Exception as e:
                    print(f"Error processing {full_path}: {e}")
                    continue

    # Sort by creation time (newest first)
    images.sort(key=lambda x: x['created'], reverse=True)
    print(f"Found {len(images)} images")
    return images


def generate_thumbnail(image_path, thumbnail_path, quality=THUMBNAIL_QUALITY):
    """Generate a thumbnail with specified quality"""
    try:
        with Image.open(image_path) as img:
            # Convert RGBA to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = background

            # Create thumbnail
            img.thumbnail(THUMBNAIL_MAX_SIZE, Image.Resampling.LANCZOS)

            # Save with specified quality
            img.save(thumbnail_path, 'JPEG', quality=quality, optimize=True)
            return True
    except Exception as e:
        print(f"Error generating thumbnail: {e}")
        return False


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200


@app.route('/api/config', methods=['GET'])
def get_config():
    """Get application configuration"""
    # Count images in folder
    image_count = 0
    if os.path.exists(COMFYUI_OUTPUT_FOLDER):
        for root, dirs, files in os.walk(COMFYUI_OUTPUT_FOLDER):
            for filename in files:
                if allowed_file(filename):
                    image_count += 1

    return jsonify({
        'comfyui_folder': COMFYUI_OUTPUT_FOLDER,
        'folder_exists': os.path.exists(COMFYUI_OUTPUT_FOLDER),
        'thumbnail_quality': THUMBNAIL_QUALITY,
        'image_count': image_count,
        'last_scan': _last_scan_time.isoformat(),
        'watching': observer is not None and observer.is_alive()
    }), 200


@app.route('/api/refresh', methods=['POST'])
def manual_refresh():
    """Manually trigger a cache refresh"""
    global _last_scan_time
    with _scan_lock:
        print(f"🔄 Manual refresh requested")
        update_image_cache()
        _last_scan_time = datetime.now()

    images = scan_comfyui_output()
    return jsonify({
        'success': True,
        'image_count': len(images),
        'last_scan': _last_scan_time.isoformat()
    }), 200


@app.route('/api/images', methods=['GET'])
def list_images():
    """List all images from ComfyUI output folder"""
    print(f"📋 Listing images from: {COMFYUI_OUTPUT_FOLDER}")
    images = scan_comfyui_output()
    print(f"✅ Returning {len(images)} images")
    return jsonify({
        'images': images,
        'count': len(images),
        'folder': COMFYUI_OUTPUT_FOLDER,
        'last_scan': _last_scan_time.isoformat()
    }), 200


# Keep image path cache for serving images
_image_path_cache = {}


def update_image_cache():
    """Update the cache mapping thumbnail IDs to full image paths"""
    global _image_path_cache
    _image_path_cache = {}

    if not os.path.exists(COMFYUI_OUTPUT_FOLDER):
        return

    for root, dirs, files in os.walk(COMFYUI_OUTPUT_FOLDER):
        for filename in files:
            if allowed_file(filename):
                full_path = os.path.join(root, filename)
                thumbnail_id = get_thumbnail_filename(full_path).replace("_thumb.jpg", "")
                _image_path_cache[thumbnail_id] = full_path


# Initialize cache on startup
update_image_cache()

# Last scan timestamp for tracking
_last_scan_time = datetime.now()
_scan_lock = threading.Lock()


class ComfyUIFolderHandler(FileSystemEventHandler):
    """Watchdog handler for monitoring ComfyUI output folder"""

    def on_created(self, event):
        """Called when a file is created"""
        if not event.is_directory and allowed_file(event.src_path):
            print(f"🆕 New image detected: {os.path.basename(event.src_path)}")
            # Update cache after a short delay (to ensure file is fully written)
            threading.Timer(2.0, self._update_cache).start()

    def on_deleted(self, event):
        """Called when a file is deleted"""
        if not event.is_directory and allowed_file(event.src_path):
            print(f"🗑️  Image deleted: {os.path.basename(event.src_path)}")
            self._update_cache()

    def on_modified(self, event):
        """Called when a file is modified"""
        if not event.is_directory and allowed_file(event.src_path):
            print(f"✏️  Image modified: {os.path.basename(event.src_path)}")
            threading.Timer(2.0, self._update_cache).start()

    def _update_cache(self):
        """Thread-safe cache update"""
        global _last_scan_time
        with _scan_lock:
            print(f"♻️  Refreshing image cache...")
            update_image_cache()
            _last_scan_time = datetime.now()
            print(f"✅ Cache refreshed at {_last_scan_time.strftime('%H:%M:%S')}")


# Start watchdog observer if ComfyUI folder exists
observer = None
if os.path.exists(COMFYUI_OUTPUT_FOLDER):
    try:
        event_handler = ComfyUIFolderHandler()
        observer = Observer()
        observer.schedule(event_handler, COMFYUI_OUTPUT_FOLDER, recursive=True)
        observer.start()
        print(f"👁️  Watching folder: {COMFYUI_OUTPUT_FOLDER}")
    except Exception as e:
        print(f"⚠️  Could not start folder monitoring: {e}")
        print("   Falling back to manual refresh mode")


@app.route('/api/thumbnail/<filename>', methods=['GET'])
def get_thumbnail(filename):
    """Return the thumbnail image, generate if doesn't exist"""
    thumbnail_path = os.path.join(THUMBNAILS_FOLDER, filename)

    # If thumbnail exists, return it
    if os.path.exists(thumbnail_path):
        return send_file(thumbnail_path, mimetype='image/jpeg')

    # Otherwise, try to generate it on-demand
    # Find the original image using the cache
    thumbnail_id = filename.replace("_thumb.jpg", "")
    update_image_cache()

    if thumbnail_id in _image_path_cache:
        image_path = _image_path_cache[thumbnail_id]
        if os.path.exists(image_path):
            # Generate thumbnail
            if generate_thumbnail(image_path, thumbnail_path):
                return send_file(thumbnail_path, mimetype='image/jpeg')

    return jsonify({'error': 'Thumbnail not found'}), 404


@app.route('/api/image/<image_id>', methods=['GET'])
def get_image(image_id):
    """Return the full-size image"""
    # Update cache to ensure we have latest paths
    update_image_cache()

    # Get the full path from cache
    if image_id in _image_path_cache:
        image_path = _image_path_cache[image_id]

        if os.path.exists(image_path):
            # Determine mimetype based on file extension
            ext = os.path.splitext(image_path)[1].lower()
            mimetype_map = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.webp': 'image/webp'
            }
            mimetype = mimetype_map.get(ext, 'application/octet-stream')
            return send_file(image_path, mimetype=mimetype)

    return jsonify({'error': 'Image not found'}), 404


@app.route('/api/metadata/<filename>', methods=['GET'])
def get_image_metadata(filename):
    """Get metadata for a specific image by filename"""
    update_image_cache()

    # Find the image path by filename
    image_path = None
    for cached_path in _image_path_cache.values():
        if os.path.basename(cached_path) == filename:
            image_path = cached_path
            break

    if not image_path or not os.path.exists(image_path):
        return jsonify({'error': 'Image not found'}), 404

    # Extract metadata if it's a PNG
    if filename.lower().endswith('.png'):
        try:
            raw_metadata = metadata_extractor.extract_metadata(image_path)
            metadata = metadata_extractor.format_metadata_for_display(raw_metadata)
            return jsonify(metadata), 200
        except Exception as e:
            print(f"Error extracting metadata: {e}")
            return jsonify({
                'positive_prompt': 'Error extracting metadata',
                'negative_prompt': 'N/A',
                'sampler': {},
                'loras': [],
                'models': [],
                'has_workflow': False,
                'has_prompt': False
            }), 200
    else:
        return jsonify({
            'positive_prompt': 'N/A (Not a PNG file)',
            'negative_prompt': 'N/A',
            'sampler': {},
            'loras': [],
            'models': [],
            'has_workflow': False,
            'has_prompt': False
        }), 200


@app.route('/api/download/<image_id>', methods=['GET'])
def download_image(image_id):
    """Download a single image"""
    # Update cache to ensure we have latest paths
    update_image_cache()

    # Get the full path from cache
    if image_id in _image_path_cache:
        image_path = _image_path_cache[image_id]

        if os.path.exists(image_path):
            filename = os.path.basename(image_path)
            return send_file(
                image_path,
                as_attachment=True,
                download_name=filename
            )

    return jsonify({'error': 'Image not found'}), 404


@app.route('/api/download-selected', methods=['POST'])
def download_selected():
    """Download selected images as a ZIP archive"""
    if not request.json or 'filenames' not in request.json:
        return jsonify({'error': 'No filenames provided'}), 400

    filenames = request.json['filenames']

    if not filenames:
        return jsonify({'error': 'Empty filename list'}), 400

    # Update cache
    update_image_cache()

    # Create a timestamp for the zip filename
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    zip_filename = f"comfyui_images_{timestamp}.zip"
    zip_path = os.path.join(tempfile.gettempdir(), zip_filename)

    # Create ZIP file
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for filename in filenames:
            # Try to find the image in the cache by filename
            image_path = None
            for cached_path in _image_path_cache.values():
                if os.path.basename(cached_path) == filename:
                    image_path = cached_path
                    break

            if image_path and os.path.exists(image_path):
                zipf.write(image_path, arcname=filename)

    # Send the ZIP file
    return send_file(
        zip_path,
        mimetype='application/zip',
        as_attachment=True,
        download_name=zip_filename
    )


@app.route('/api/download-all', methods=['GET'])
def download_all():
    """Download all images as a ZIP archive"""
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    zip_filename = f"comfyui_all_images_{timestamp}.zip"
    zip_path = os.path.join(tempfile.gettempdir(), zip_filename)

    # Get all images
    images = scan_comfyui_output()

    # Create ZIP file
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for image_info in images:
            full_path = image_info['full_path']
            if os.path.exists(full_path):
                # Use relative path as archive name to preserve folder structure
                arcname = image_info['path']
                zipf.write(full_path, arcname=arcname)

    # Send the ZIP file
    return send_file(
        zip_path,
        mimetype='application/zip',
        as_attachment=True,
        download_name=zip_filename
    )


if __name__ == '__main__':
    try:
        print(f"\n{'='*50}")
        print(f"🎨 ComfyUI Gallery Backend Starting")
        print(f"{'='*50}")
        print(f"📁 Folder: {COMFYUI_OUTPUT_FOLDER}")
        print(f"✅ Folder exists: {os.path.exists(COMFYUI_OUTPUT_FOLDER)}")
        print(f"👁️  Watching: {observer is not None and observer.is_alive()}")

        # Initial scan
        images = scan_comfyui_output()
        print(f"📸 Images found: {len(images)}")
        print(f"{'='*50}\n")

        app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
    finally:
        if observer:
            observer.stop()
            observer.join()
            print("👋 Watchdog stopped")
