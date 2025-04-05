from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import shutil
import zipfile
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = os.path.join(tempfile.gettempdir(), 'msg_to_pdf_uploads')
CONVERTED_FOLDER = os.path.join(tempfile.gettempdir(), 'msg_to_pdf_converted')
ALLOWED_EXTENSIONS = {'msg'}

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CONVERTED_FOLDER, exist_ok=True)

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
            
            # TODO: Implement conversion logic
            # For now, just a placeholder response
            results.append({
                'original_filename': filename,
                'status': 'uploaded',
                'message': 'File uploaded successfully. Conversion pending.'
            })
        else:
            results.append({
                'original_filename': file.filename if file.filename else 'unknown',
                'status': 'error',
                'message': 'Invalid file format. Only .msg files are allowed.'
            })
    
    return jsonify({'results': results}), 200

@app.route('/api/convert/<filename>', methods=['GET'])
def convert_file(filename):
    # TODO: Implement actual conversion
    # This is a placeholder
    return jsonify({
        'original_filename': filename,
        'status': 'converted',
        'message': 'Conversion completed successfully.',
        'pdf_url': f'/api/download/{filename.rsplit(".", 1)[0]}.pdf'
    }), 200

@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    # TODO: Implement actual file download
    return jsonify({
        'status': 'error',
        'message': 'Download functionality not yet implemented.'
    }), 501

@app.route('/api/download-all', methods=['GET'])
def download_all():
    # TODO: Implement zip archive creation and download
    return jsonify({
        'status': 'error',
        'message': 'Bulk download functionality not yet implemented.'
    }), 501

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 