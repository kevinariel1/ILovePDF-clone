import sys
import base64
import fitz  # This is PyMuPDF
import os

def get_thumbnail(pdf_path):
    try:
        # Open the PDF
        doc = fitz.open(pdf_path)
        page = doc.load_page(0)  # load the first page
        
        # Render page to a pixmap (image)
        pix = page.get_pixmap(matrix=fitz.Matrix(0.5, 0.5)) # 0.5 makes it a smaller thumbnail
        
        # Convert to PNG bytes
        img_data = pix.tobytes("png")
        img_str = base64.b64encode(img_data).decode()
        
        doc.close()
        return f"data:image/png;base64,{img_str}"
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(get_thumbnail(sys.argv[1]))