import sys
import os
import json

def extract_text(file_path):
    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}
    
    ext = os.path.splitext(file_path)[1].lower()
    
    try:
        if ext == ".pdf":
            import fitz
            doc = fitz.open(file_path)
            pages_text = []
            for i, page in enumerate(doc):
                t = page.get_text()
                if t and t.strip():
                    pages_text.append(t.strip())
            doc.close()
            full_text = "\n\n".join(pages_text)
            return {"success": True, "text": full_text, "pages": len(pages_text)}
            
        elif ext in [".docx", ".doc"]:
            import docx
            doc = docx.Document(file_path)
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            full_text = "\n\n".join(paragraphs)
            return {"success": True, "text": full_text, "paragraphs": len(paragraphs)}
            
        elif ext in [".txt", ".md", ".text"]:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                full_text = f.read()
            return {"success": True, "text": full_text}
            
        else:
            return {"error": f"Unsupported file extension: {ext}"}
            
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)
        
    path = sys.argv[1]
    res = extract_text(path)
    print(json.dumps(res))
