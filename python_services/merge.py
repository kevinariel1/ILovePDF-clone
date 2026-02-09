import sys
from pypdf import PdfWriter

def merge_pdfs(input_files, output_path):
    writer = PdfWriter()
    for pdf in input_files:
        writer.append(pdf)
    
    with open(output_path, "wb") as f:
        writer.write(f)

if __name__ == "__main__":
    # The first few args are input files, the last one is the output path
    inputs = sys.argv[1:-1]
    output = sys.argv[-1]
    merge_pdfs(inputs, output)