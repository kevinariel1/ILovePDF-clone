import fitz
import sys
import os
import json
import zipfile

def split_pdf(input_path, output_dir, config_json, global_fuse):
    doc = fitz.open(input_path)
    config = json.loads(config_json)
    is_fused = global_fuse.lower() == 'true'
    output_files = []

    if is_fused:
        # Fuse Mode: One PDF containing ALL selected ranges
        new_doc = fitz.open()
        for item in config:
            start = item['start'] - 1
            end = item['end'] - 1
            new_doc.insert_pdf(doc, from_page=start, to_page=end)
        
        out_path = os.path.join(output_dir, "fused_result.pdf")
        new_doc.save(out_path)
        new_doc.close()
        output_files.append(out_path)
    else:
        # Split Mode: Every range or page is its own file
        for idx, item in enumerate(config):
            start = item['start'] - 1
            end = item['end'] - 1
            
            # Logic: If start and end are the same, it's one page. 
            # If different, it's a range.
            new_doc = fitz.open()
            new_doc.insert_pdf(doc, from_page=start, to_page=end)
            out_path = os.path.join(output_dir, f"range_{idx+1}.pdf")
            new_doc.save(out_path)
            new_doc.close()
            output_files.append(out_path)

    doc.close()

    # Zip if multiple files, otherwise return the PDF
    if len(output_files) > 1:
        zip_path = os.path.join(output_dir, "split_result.zip")
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for f in output_files:
                zipf.write(f, os.path.basename(f))
        return {"type": "zip", "path": zip_path}
    else:
        return {"type": "pdf", "path": output_files[0]}

if __name__ == "__main__":
    # Expecting: input.pdf, output_dir, config_json, is_fused
    result = split_pdf(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
    print(json.dumps(result))