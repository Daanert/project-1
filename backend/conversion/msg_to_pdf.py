import os
import extract_msg
import tempfile
from PyPDF2 import PdfWriter, PdfReader
from PIL import Image
import io

class MsgToPdfConverter:
    """
    Class to handle conversion of .msg files to PDF format
    """
    
    def __init__(self, temp_dir=None):
        """
        Initialize the converter with a temporary directory
        
        Args:
            temp_dir (str, optional): Path to temp directory. If None, uses system temp.
        """
        self.temp_dir = temp_dir or os.path.join(tempfile.gettempdir(), 'msg_to_pdf_temp')
        os.makedirs(self.temp_dir, exist_ok=True)
    
    def convert_msg_to_pdf(self, msg_path):
        """
        Convert a .msg file to PDF
        
        Args:
            msg_path (str): Path to the .msg file
            
        Returns:
            tuple: (pdf_path, metadata)
        """
        # Extract the msg file
        msg = extract_msg.openMsg(msg_path)
        
        # Create a filename for the PDF
        filename = os.path.basename(msg_path)
        pdf_filename = os.path.splitext(filename)[0] + '.pdf'
        pdf_path = os.path.join(self.temp_dir, pdf_filename)
        
        # Create PDF
        pdf_writer = PdfWriter()
        
        # Add the email body as the first page
        body = msg.body
        
        # Create a simple text-based PDF page with the email content
        # This is a simplified approach - in a real implementation,
        # you would want to use a proper HTML/CSS to PDF converter
        # to maintain formatting
        self._add_text_page(pdf_writer, body)
        
        # Process attachments
        attachments = []
        for attachment in msg.attachments:
            attachment_info = self._process_attachment(attachment, pdf_writer)
            if attachment_info:
                attachments.append(attachment_info)
        
        # Save the PDF
        with open(pdf_path, 'wb') as f:
            pdf_writer.write(f)
        
        # Gather metadata
        metadata = {
            'subject': msg.subject,
            'sender': msg.sender,
            'date': msg.date,
            'recipients': msg.recipients,
            'cc': msg.cc,
            'attachments': attachments,
            'page_count': len(pdf_writer.pages)
        }
        
        # Close the msg file to release resources
        msg.close()
        
        return pdf_path, metadata
    
    def _add_text_page(self, pdf_writer, text):
        """
        Add a text page to the PDF
        
        Args:
            pdf_writer (PdfWriter): The PDF writer object
            text (str): Text content to add
        """
        # This is a placeholder. In a real implementation, you would use a
        # library like reportlab or wkhtmltopdf to render text to PDF.
        # For simplicity, we're creating a dummy page with some basic text.
        
        # Create a simple PDF with text using a library like reportlab
        # For now, let's just create an empty page with metadata
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        
        packet = io.BytesIO()
        c = canvas.Canvas(packet, pagesize=letter)
        
        # Split text into lines
        y_position = 750  # Start position from top
        line_height = 12
        
        # Add text lines
        for line in text.split('\n'):
            # Add more sophisticated text wrapping in a real implementation
            c.drawString(50, y_position, line[:100])  # Truncate long lines
            y_position -= line_height
            if y_position < 50:  # Start a new page if we run out of space
                c.showPage()
                y_position = 750
        
        c.save()
        
        # Get the PDF from the IO buffer
        packet.seek(0)
        new_page_pdf = PdfReader(packet)
        
        # Add pages to the main PDF
        for page in new_page_pdf.pages:
            pdf_writer.add_page(page)
    
    def _process_attachment(self, attachment, pdf_writer):
        """
        Process an attachment and add it to the PDF if possible
        
        Args:
            attachment: The attachment object from extract_msg
            pdf_writer (PdfWriter): The PDF writer object
            
        Returns:
            dict: Attachment information or None if not processed
        """
        # Get attachment info
        filename = attachment.longFilename or attachment.shortFilename
        if not filename:
            return None
        
        # Save the attachment to temp dir
        temp_attachment_path = os.path.join(self.temp_dir, filename)
        with open(temp_attachment_path, 'wb') as f:
            f.write(attachment.data)
        
        attachment_info = {
            'filename': filename,
            'size': len(attachment.data),
            'mime_type': attachment.mimetype
        }
        
        # If it's a PDF, add its pages to our PDF
        if filename.lower().endswith('.pdf'):
            try:
                pdf = PdfReader(temp_attachment_path)
                for page in pdf.pages:
                    pdf_writer.add_page(page)
                attachment_info['pages'] = len(pdf.pages)
            except Exception as e:
                print(f"Error processing PDF attachment {filename}: {e}")
        
        # If it's an image, convert and add it
        elif filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp')):
            try:
                img = Image.open(temp_attachment_path)
                # Convert image to PDF and add it
                # This is a placeholder - in a real implementation, you'd
                # create a PDF page from the image
                img_packet = io.BytesIO()
                img.save(img_packet, format='PDF')
                img_packet.seek(0)
                img_pdf = PdfReader(img_packet)
                pdf_writer.add_page(img_pdf.pages[0])
                attachment_info['pages'] = 1
            except Exception as e:
                print(f"Error processing image attachment {filename}: {e}")
        
        # For other file types, just mention them in the PDF
        # In a real implementation, you might want to add more specific handlers
        # for common file types like .docx, .xlsx, etc.
        
        return attachment_info
    
    def generate_thumbnail(self, pdf_path, page=0, size=(150, 150)):
        """
        Generate a thumbnail image for a PDF
        
        Args:
            pdf_path (str): Path to the PDF file
            page (int): Page number to use for thumbnail (0-based)
            size (tuple): Size of the thumbnail (width, height)
            
        Returns:
            bytes: Thumbnail image data in PNG format
        """
        # This is a simplified version - in a real implementation,
        # you'd use a library like pdf2image to render the PDF page
        
        # For now, just return a placeholder
        # In a real implementation, you would render the actual PDF page
        placeholder = Image.new('RGB', size, color='lightgray')
        
        # Add some text
        from PIL import ImageDraw
        draw = ImageDraw.Draw(placeholder)
        filename = os.path.basename(pdf_path)
        draw.text((10, 10), f"PDF: {filename}", fill='black')
        
        # Convert to bytes
        img_byte_arr = io.BytesIO()
        placeholder.save(img_byte_arr, format='PNG')
        return img_byte_arr.getvalue() 