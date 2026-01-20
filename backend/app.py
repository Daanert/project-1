from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import zipfile
import time
from werkzeug.utils import secure_filename
from comfyui_metadata import ComfyUIMetadataExtractor
from PIL import Image
import json
import hashlib

app = Flask(__name__)
CORS(app)

# Configuration
COMFYUI_OUTPUT_FOLDER = '/workspace/ComfyUI/output'
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
    return jsonify({
        'comfyui_folder': COMFYUI_OUTPUT_FOLDER,
        'folder_exists': os.path.exists(COMFYUI_OUTPUT_FOLDER),
        'thumbnail_quality': THUMBNAIL_QUALITY
    }), 200


@app.route('/api/images', methods=['GET'])
def list_images():
    """List all images from ComfyUI output folder"""
    images = scan_comfyui_output()
    return jsonify({
        'images': images,
        'count': len(images),
        'folder': COMFYUI_OUTPUT_FOLDER
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
    app.run(debug=True, host='0.0.0.0', port=5000)
