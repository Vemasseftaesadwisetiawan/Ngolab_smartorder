import zipfile
import xml.etree.ElementTree as ET

def extract_docx_text(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as z:
            # XML namespaces
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            # Read document.xml
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            # Find all text elements
            texts = []
            for elem in root.iter():
                # We can match tags ending with }t (which is w:t)
                if elem.tag.endswith('}t'):
                    texts.append(elem.text or '')
                elif elem.tag.endswith('}p'):
                    texts.append('\n')
            
            # Join and format
            full_text = "".join(texts)
            # Clean up empty lines or formatting issues slightly
            return full_text
    except Exception as e:
        return f"Error: {e}"

if __name__ == '__main__':
    docx_file = r"c:\Users\vemas seftaesa\NGOLAB\Template dan Panduan Laporan Pengujian PL.docx"
    text = extract_docx_text(docx_file)
    print("EXTRACTED TEXT:\n")
    print(text[:5000]) # Print first 5000 chars
    
    with open(r"c:\Users\vemas seftaesa\NGOLAB\scratch\extracted_template.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("\nText saved to scratch\\extracted_template.txt")
