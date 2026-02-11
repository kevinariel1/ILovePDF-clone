import sys
import fitz # PyMuPDF
import os

def split_pdf(input_path, page_ranges, output_folder):
    # page_ranges will be a list of strings like "1-3", "5"
    doc = fitz.open(input_path)
    output_files = []

    try:
        for i, r in enumerate(page_ranges):
            # Convert "1-3" to 0-indexed [0, 1, 2]
            parts = r.split('-')
            start = int(parts[0]) - 1
            end = int(parts[1]) - 1 if len(parts) > 1 else start
            
            new_doc = fitz.open()
            new_doc.insert_pdf(doc, from_page=start, to_page=end)
            
            out_name = f"split_{i+1}.pdf"
            out_path = os.path.join(output_folder, out_name)
            new_doc.save(out_path)
            new_doc.close()
            output_files.append(out_path)
            
        doc.close()
        return output_files
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    # Example usage: python split.py input.pdf output_folder 1-3 5-8
    file_path = sys.argv[1]
    folder = sys.argv[2]
    ranges = sys.argv[3:]
    split_pdf(file_path, ranges, folder)