from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import shutil
import zipfile
import time
from werkzeug.utils import secure_filename
from conversion.msg_to_pdf import MsgToPdfConverter
import json

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = os.path.join(tempfile.gettempdir(), 'msg_to_pdf_uploads')
CONVERTED_FOLDER = os.path.join(tempfile.gettempdir(), 'msg_to_pdf_converted')
THUMBNAIL_FOLDER = os.path.join(tempfile.gettempdir(), 'msg_to_pdf_thumbnails')
ALLOWED_EXTENSIONS = {'msg'}

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CONVERTED_FOLDER, exist_ok=True)
os.makedirs(THUMBNAIL_FOLDER, exist_ok=True)

# Initialize converter
converter = MsgToPdfConverter(temp_dir=CONVERTED_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'files' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    files = request.files.getlist('files')
    
    if not files or files[0].filename == '':
        return jsonify({'error': 'No files selected'}), 400
    
    results = []
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            
            # Start the conversion process
            try:
                # Convert the file
                pdf_path, metadata = converter.convert_msg_to_pdf(file_path)
                
                # Generate thumbnail
                thumbnail_data = converter.generate_thumbnail(pdf_path)
                
                # Save thumbnail to disk
                pdf_filename = os.path.splitext(filename)[0] + '.pdf'
                thumbnail_path = os.path.join(THUMBNAIL_FOLDER, os.path.splitext(filename)[0] + '.png')
                with open(thumbnail_path, 'wb') as f:
                    f.write(thumbnail_data)
                
                # Store metadata in a JSON file
                metadata_path = os.path.join(CONVERTED_FOLDER, os.path.splitext(filename)[0] + '.json')
                with open(metadata_path, 'w') as f:
                    json.dump(metadata, f)
                
                results.append({
                    'original_filename': filename,
                    'pdf_filename': pdf_filename,
                    'status': 'converted',
                    'message': 'File converted successfully.',
                    'metadata': metadata,
                    'thumbnail_url': f'/api/thumbnail/{os.path.splitext(filename)[0]}.png',
                    'pdf_url': f'/api/download/{pdf_filename}'
                })
            except Exception as e:
                results.append({
                    'original_filename': filename,
                    'status': 'error',
                    'message': f'Error converting file: {str(e)}'
                })
        else:
            results.append({
                'original_filename': file.filename if file.filename else 'unknown',
                'status': 'error',
                'message': 'Invalid file format. Only .msg files are allowed.'
            })
    
    return jsonify({'results': results}), 200

@app.route('/api/thumbnail/<filename>', methods=['GET'])
def get_thumbnail(filename):
    """Return the thumbnail image for a converted PDF"""
    thumbnail_path = os.path.join(THUMBNAIL_FOLDER, filename)
    
    if os.path.exists(thumbnail_path):
        return send_file(thumbnail_path, mimetype='image/png')
    else:
        return jsonify({'error': 'Thumbnail not found'}), 404

@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    """Download a converted PDF file"""
    file_path = os.path.join(CONVERTED_FOLDER, filename)
    
    if os.path.exists(file_path):
        return send_file(
            file_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    else:
        return jsonify({'error': 'File not found'}), 404

@app.route('/api/download-all', methods=['GET'])
def download_all():
    """Download all converted PDF files as a ZIP archive"""
    # Create a timestamp for the zip filename
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    zip_filename = f"converted_pdfs_{timestamp}.zip"
    zip_path = os.path.join(tempfile.gettempdir(), zip_filename)
    
    # Create ZIP file
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        # Get all PDF files in the converted folder
        for root, _, files in os.walk(CONVERTED_FOLDER):
            for file in files:
                if file.endswith('.pdf'):
                    file_path = os.path.join(root, file)
                    # Add file to ZIP archive
                    zipf.write(file_path, arcname=file)
    
    # Send the ZIP file
    return send_file(
        zip_path,
        mimetype='application/zip',
        as_attachment=True,
        download_name=zip_filename
    )

@app.route('/api/download-selected', methods=['POST'])
def download_selected():
    """Download selected PDF files as a ZIP archive"""
    # Get the list of filenames to include
    if not request.json or 'filenames' not in request.json:
        return jsonify({'error': 'No filenames provided'}), 400
    
    filenames = request.json['filenames']
    
    if not filenames:
        return jsonify({'error': 'Empty filename list'}), 400
    
    # Create a timestamp for the zip filename
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    zip_filename = f"selected_pdfs_{timestamp}.zip"
    zip_path = os.path.join(tempfile.gettempdir(), zip_filename)
    
    # Create ZIP file
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for filename in filenames:
            file_path = os.path.join(CONVERTED_FOLDER, filename)
            if os.path.exists(file_path) and file_path.endswith('.pdf'):
                # Add file to ZIP archive
                zipf.write(file_path, arcname=filename)
    
    # Send the ZIP file
    return send_file(
        zip_path,
        mimetype='application/zip',
        as_attachment=True,
        download_name=zip_filename
    )

@app.route('/api/files', methods=['GET'])
def list_files():
    """List all converted files with their metadata"""
    files = []
    
    # Get all JSON metadata files
    for filename in os.listdir(CONVERTED_FOLDER):
        if filename.endswith('.json'):
            try:
                # Read metadata
                with open(os.path.join(CONVERTED_FOLDER, filename), 'r') as f:
                    metadata = json.load(f)
                
                pdf_filename = os.path.splitext(filename)[0] + '.pdf'
                pdf_path = os.path.join(CONVERTED_FOLDER, pdf_filename)
                
                if os.path.exists(pdf_path):
                    # Get PDF file info
                    file_info = {
                        'filename': pdf_filename,
                        'original_filename': os.path.splitext(filename)[0] + '.msg',
                        'size': os.path.getsize(pdf_path),
                        'thumbnail_url': f'/api/thumbnail/{os.path.splitext(filename)[0]}.png',
                        'pdf_url': f'/api/download/{pdf_filename}',
                        'metadata': metadata
                    }
                    files.append(file_info)
            except Exception as e:
                print(f"Error processing metadata for {filename}: {e}")
    
    return jsonify({'files': files}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 