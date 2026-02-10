import sys
from pypdf import PdfWriter, PdfReader

def merge_pdfs(files_with_rotation, output_path):
    writer = PdfWriter()
    try:
        for item in files_with_rotation:
            # Handle Windows paths correctly by splitting from the right
            path, rotation = item.rsplit(':', 1)
            angle = int(rotation)
            reader = PdfReader(path)
            
            # Manual loop for compatibility with older pypdf versions
            for page in reader.pages:
                if angle != 0:
                    page.rotate(angle)
                writer.add_page(page)
        
        with open(output_path, "wb") as f:
            writer.write(f)
            
    except Exception as e:
        # This will now show up in your Node terminal
        print(f"Detailed Python Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    inputs = sys.argv[1:-1]
    output = sys.argv[-1]
    merge_pdfs(inputs, output)