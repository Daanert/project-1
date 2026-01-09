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

app = Flask(__name__)
CORS(app)

# Configuration
IMAGES_FOLDER = os.path.join(tempfile.gettempdir(), 'comfyui_gallery_images')
THUMBNAILS_FOLDER = os.path.join(tempfile.gettempdir(), 'comfyui_gallery_thumbnails')
METADATA_FOLDER = os.path.join(tempfile.gettempdir(), 'comfyui_gallery_metadata')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
THUMBNAIL_QUALITY = 80
THUMBNAIL_MAX_SIZE = (400, 400)

# Create necessary directories
os.makedirs(IMAGES_FOLDER, exist_ok=True)
os.makedirs(THUMBNAILS_FOLDER, exist_ok=True)
os.makedirs(METADATA_FOLDER, exist_ok=True)

# Initialize metadata extractor
metadata_extractor = ComfyUIMetadataExtractor()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


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


@app.route('/api/upload', methods=['POST'])
def upload_images():
    """Upload ComfyUI generated images"""
    if 'files' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    files = request.files.getlist('files')

    if not files or files[0].filename == '':
        return jsonify({'error': 'No files selected'}), 400

    results = []
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            timestamp = str(int(time.time() * 1000))
            base_name = os.path.splitext(filename)[0]
            ext = os.path.splitext(filename)[1]
            unique_filename = f"{base_name}_{timestamp}{ext}"

            image_path = os.path.join(IMAGES_FOLDER, unique_filename)
            file.save(image_path)

            try:
                # Generate thumbnail
                thumbnail_filename = f"{os.path.splitext(unique_filename)[0]}_thumb.jpg"
                thumbnail_path = os.path.join(THUMBNAILS_FOLDER, thumbnail_filename)
                thumbnail_success = generate_thumbnail(image_path, thumbnail_path)

                # Extract metadata (only for PNG files with ComfyUI data)
                metadata = {}
                if ext.lower() == '.png':
                    metadata = metadata_extractor.extract_metadata(image_path)
                    formatted_metadata = metadata_extractor.format_metadata_for_display(metadata)

                    # Save metadata to JSON file
                    metadata_filename = f"{os.path.splitext(unique_filename)[0]}.json"
                    metadata_path = os.path.join(METADATA_FOLDER, metadata_filename)
                    with open(metadata_path, 'w') as f:
                        json.dump(formatted_metadata, f, indent=2)
                else:
                    formatted_metadata = {
                        'positive_prompt': 'N/A (Not a PNG file)',
                        'negative_prompt': 'N/A',
                        'sampler': {},
                        'loras': [],
                        'models': [],
                        'has_workflow': False,
                        'has_prompt': False
                    }

                # Get image dimensions
                with Image.open(image_path) as img:
                    width, height = img.size

                results.append({
                    'original_filename': filename,
                    'stored_filename': unique_filename,
                    'status': 'uploaded',
                    'message': 'Image uploaded successfully.',
                    'metadata': formatted_metadata,
                    'thumbnail_url': f'/api/thumbnail/{thumbnail_filename}' if thumbnail_success else None,
                    'image_url': f'/api/image/{unique_filename}',
                    'width': width,
                    'height': height,
                    'size': os.path.getsize(image_path)
                })
            except Exception as e:
                results.append({
                    'original_filename': filename,
                    'status': 'error',
                    'message': f'Error processing image: {str(e)}'
                })
        else:
            results.append({
                'original_filename': file.filename if file.filename else 'unknown',
                'status': 'error',
                'message': f'Invalid file format. Allowed formats: {", ".join(ALLOWED_EXTENSIONS)}'
            })

    return jsonify({'results': results}), 200


@app.route('/api/thumbnail/<filename>', methods=['GET'])
def get_thumbnail(filename):
    """Return the thumbnail image"""
    thumbnail_path = os.path.join(THUMBNAILS_FOLDER, filename)

    if os.path.exists(thumbnail_path):
        return send_file(thumbnail_path, mimetype='image/jpeg')
    else:
        return jsonify({'error': 'Thumbnail not found'}), 404


@app.route('/api/image/<filename>', methods=['GET'])
def get_image(filename):
    """Return the full-size image"""
    image_path = os.path.join(IMAGES_FOLDER, filename)

    if os.path.exists(image_path):
        # Determine mimetype based on file extension
        ext = os.path.splitext(filename)[1].lower()
        mimetype_map = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp'
        }
        mimetype = mimetype_map.get(ext, 'application/octet-stream')
        return send_file(image_path, mimetype=mimetype)
    else:
        return jsonify({'error': 'Image not found'}), 404


@app.route('/api/metadata/<filename>', methods=['GET'])
def get_metadata(filename):
    """Get metadata for a specific image"""
    # Remove extension and add .json
    base_filename = os.path.splitext(filename)[0]
    metadata_path = os.path.join(METADATA_FOLDER, f"{base_filename}.json")

    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        return jsonify(metadata), 200
    else:
        return jsonify({
            'positive_prompt': 'N/A',
            'negative_prompt': 'N/A',
            'sampler': {},
            'loras': [],
            'models': [],
            'has_workflow': False,
            'has_prompt': False
        }), 200


@app.route('/api/images', methods=['GET'])
def list_images():
    """List all images with their metadata"""
    images = []

    for filename in os.listdir(IMAGES_FOLDER):
        if allowed_file(filename):
            try:
                image_path = os.path.join(IMAGES_FOLDER, filename)
                base_filename = os.path.splitext(filename)[0]

                # Load metadata if exists
                metadata_path = os.path.join(METADATA_FOLDER, f"{base_filename}.json")
                if os.path.exists(metadata_path):
                    with open(metadata_path, 'r') as f:
                        metadata = json.load(f)
                else:
                    metadata = {
                        'positive_prompt': 'N/A',
                        'negative_prompt': 'N/A',
                        'sampler': {},
                        'loras': [],
                        'models': [],
                        'has_workflow': False,
                        'has_prompt': False
                    }

                # Get thumbnail filename
                thumbnail_filename = f"{base_filename}_thumb.jpg"
                thumbnail_exists = os.path.exists(os.path.join(THUMBNAILS_FOLDER, thumbnail_filename))

                # Get image info
                with Image.open(image_path) as img:
                    width, height = img.size

                image_info = {
                    'filename': filename,
                    'size': os.path.getsize(image_path),
                    'width': width,
                    'height': height,
                    'created': os.path.getmtime(image_path),
                    'thumbnail_url': f'/api/thumbnail/{thumbnail_filename}' if thumbnail_exists else None,
                    'image_url': f'/api/image/{filename}',
                    'metadata': metadata
                }
                images.append(image_info)
            except Exception as e:
                print(f"Error processing image {filename}: {e}")

    # Sort by creation time (newest first)
    images.sort(key=lambda x: x['created'], reverse=True)

    return jsonify({'images': images}), 200


@app.route('/api/download/<filename>', methods=['GET'])
def download_image(filename):
    """Download a single image"""
    image_path = os.path.join(IMAGES_FOLDER, filename)

    if os.path.exists(image_path):
        return send_file(
            image_path,
            as_attachment=True,
            download_name=filename
        )
    else:
        return jsonify({'error': 'Image not found'}), 404


@app.route('/api/download-selected', methods=['POST'])
def download_selected():
    """Download selected images as a ZIP archive"""
    if not request.json or 'filenames' not in request.json:
        return jsonify({'error': 'No filenames provided'}), 400

    filenames = request.json['filenames']

    if not filenames:
        return jsonify({'error': 'Empty filename list'}), 400

    # Create a timestamp for the zip filename
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    zip_filename = f"comfyui_images_{timestamp}.zip"
    zip_path = os.path.join(tempfile.gettempdir(), zip_filename)

    # Create ZIP file
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for filename in filenames:
            image_path = os.path.join(IMAGES_FOLDER, filename)
            if os.path.exists(image_path):
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

    # Create ZIP file
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for filename in os.listdir(IMAGES_FOLDER):
            if allowed_file(filename):
                image_path = os.path.join(IMAGES_FOLDER, filename)
                zipf.write(image_path, arcname=filename)

    # Send the ZIP file
    return send_file(
        zip_path,
        mimetype='application/zip',
        as_attachment=True,
        download_name=zip_filename
    )


@app.route('/api/delete/<filename>', methods=['DELETE'])
def delete_image(filename):
    """Delete a single image and its associated files"""
    image_path = os.path.join(IMAGES_FOLDER, filename)
    base_filename = os.path.splitext(filename)[0]

    if not os.path.exists(image_path):
        return jsonify({'error': 'Image not found'}), 404

    try:
        # Delete image
        os.remove(image_path)

        # Delete thumbnail if exists
        thumbnail_filename = f"{base_filename}_thumb.jpg"
        thumbnail_path = os.path.join(THUMBNAILS_FOLDER, thumbnail_filename)
        if os.path.exists(thumbnail_path):
            os.remove(thumbnail_path)

        # Delete metadata if exists
        metadata_path = os.path.join(METADATA_FOLDER, f"{base_filename}.json")
        if os.path.exists(metadata_path):
            os.remove(metadata_path)

        return jsonify({'message': 'Image deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Error deleting image: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
