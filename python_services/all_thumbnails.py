import sys
import base64
import fitz
import json

def get_all_thumbnails(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        thumbnails = []
        for page in doc:
            # We use a matrix to keep the file size smaller for the pipe
            pix = page.get_pixmap(matrix=fitz.Matrix(0.3, 0.3)) 
            img_data = pix.tobytes("png")
            img_str = base64.b64encode(img_data).decode('utf-8')
            thumbnails.append(f"data:image/png;base64,{img_str}")
        doc.close()
        return thumbnails 
    except Exception as e:
        # Return an object so Node knows something went wrong
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        path = sys.argv[1]
        final_list = get_all_thumbnails(path)
        # This is the ONLY thing that should be printed to the terminal
        sys.stdout.write(json.dumps(final_list))
        sys.stdout.flush()