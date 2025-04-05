# Outlook MSG to PDF Converter

A web application that converts Microsoft Outlook .msg files into PDF format, preserving attachments and additional content.

## Features

- Upload multiple .msg files via drag-and-drop or file picker
- Convert .msg files to PDF format including attachments
- View thumbnails with page count and preview functionality
- Interactive PDF preview with metadata display
- Select and download individual PDFs or all files as a ZIP archive

## Technical Stack

### Frontend
- Modern JavaScript framework (React/Angular/Vue)
- Interactive UI with drag-and-drop functionality
- PDF.js for preview rendering
- File selection and download management

### Backend
- Python with Flask/Django
- RESTful API design
- MSG to PDF conversion engine
- Temporary file storage and management

## Project Structure

```
/
├── frontend/           # Frontend application code
│   ├── public/         # Static assets
│   └── src/            # Source code
│       ├── components/ # UI components
│       ├── services/   # API services
│       └── styles/     # CSS/SCSS files
│
├── backend/            # Backend application code
│   ├── api/            # API endpoints
│   ├── conversion/     # MSG to PDF conversion logic
│   ├── storage/        # File storage handlers
│   └── tests/          # Backend tests
│
└── docs/               # Documentation
```

## Getting Started

Instructions for setting up the development environment, installing dependencies, and running the application will be added soon.

## Contributing

Guidelines for contributing to this project will be provided.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 