import os
import zipfile

def create_archive(source_dir, output_zip):
    print(f"Creating ZIP archive from {source_dir} -> {output_zip}...")
    exclude_dirs = {"node_modules", "__pycache__", ".pytest_cache", ".git"}
    exclude_files = {".DS_Store"}

    total_files = 0
    total_bytes = 0

    with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                if file in exclude_files:
                    continue
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, os.path.join("ASTRACARE", rel_path))
                total_files += 1
                total_bytes += os.path.getsize(file_path)

    zip_size = os.path.getsize(output_zip)
    print(f"Archive created successfully!")
    print(f"  Total files packed: {total_files}")
    print(f"  Uncompressed size: {total_bytes / (1024*1024):.2f} MB")
    print(f"  ZIP size: {zip_size / (1024*1024):.2f} MB")

    # Verify archive
    with zipfile.ZipFile(output_zip, "r") as zipf:
        corrupt = zipf.testzip()
        if corrupt:
            raise RuntimeError(f"Corrupt file found in ZIP: {corrupt}")
        namelist = zipf.namelist()
        print(f"  Integrity check: PASSED (Verified {len(namelist)} items in archive)")

if __name__ == "__main__":
    src = r"C:\Users\dell\.gemini\antigravity\scratch\ASTRACARE"
    dst = r"C:\Users\dell\.gemini\antigravity\scratch\ASTROCARE_3D_FULL_PROJECT.zip"
    create_archive(src, dst)
