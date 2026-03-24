import os
import glob
import re

frontend_dir = r"c:\Users\Ahmed\Desktop\customer supplier system (1)\customer supplier system (1)\customer supplier system\customer supplier system\customer supplier system\frontend"

html_files = glob.glob(os.path.join(frontend_dir, "*.html"))

for file_path in html_files:
    if file_path.endswith("dashboard.html") or file_path.endswith("login.html") or file_path.endswith("register.html") or file_path.endswith("printinvoice.html"):
        continue
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    original_content = content

    # 1. Replace sidebar-wrapper content
    pattern_sidebar = r'<div id="sidebar-wrapper">.*?<!-- Page Content -->'
    new_sidebar = '<div id="sidebar-wrapper"></div>\n\n  <!-- Page Content -->'
    content = re.sub(pattern_sidebar, new_sidebar, content, flags=re.DOTALL)
    
    # 2. Add layout.js and script.js after auth.js
    # Ensure we don't duplicate it if we run it twice
    if '<script src="layout.js"></script>' not in content:
        pattern_auth = r'<script src="auth\.js"></script>'
        new_auth = '<script src="auth.js"></script>\n<script src="layout.js"></script>\n<script src="script.js"></script>'
        content = re.sub(pattern_auth, new_auth, content)
    
    if content != original_content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Refactored: {os.path.basename(file_path)}")

print("Done refactoring frontend HTML files.")
