from pathlib import Path
import csv, json, shutil, re, tkinter as tk
from tkinter import filedialog, messagebox

ROOT = Path(__file__).resolve().parent
INDEX = ROOT / 'data' / 'plant-index.csv'
PHOTO_ROOT = ROOT / 'assets' / 'photos'
MAP_FILE = ROOT / 'data' / 'photos.js'
EXTS={'.jpg','.jpeg','.png','.webp','.bmp'}

def key(p):
    return [int(x) if x.isdigit() else x.lower() for x in re.split(r'(\d+)',p.name)]

def main():
    app=tk.Tk(); app.withdraw()
    base=filedialog.askdirectory(title='Pilih folder Foto Tanaman yang berisi 01_FIKES sampai 06_KAMPUS1')
    if not base:return
    base=Path(base)
    rows=list(csv.DictReader(INDEX.open(encoding='utf-8-sig')))
    by_folder={}
    for r in rows:by_folder.setdefault(r['folder'],[]).append(r)
    PHOTO_ROOT.mkdir(parents=True,exist_ok=True)
    photo_map={}; report=[]
    for folder, items in by_folder.items():
        source=base/folder
        if not source.exists():raise FileNotFoundError(f'Folder tidak ditemukan: {source}')
        files=sorted([p for p in source.iterdir() if p.is_file() and p.suffix.lower() in EXTS],key=key)
        needed=len(items)*3
        if len(files)<needed:raise RuntimeError(f'{folder}: tersedia {len(files)} foto, butuh {needed}.')
        files=files[:needed] # data dan foto selaras; foto ekstra di akhir diabaikan
        for i,r in enumerate(items):
            dest=PHOTO_ROOT/f"{int(r['id']):03d}";dest.mkdir(exist_ok=True)
            paths=[]
            for j,src in enumerate(files[i*3:i*3+3],1):
                target=dest/f'{j}{src.suffix.lower()}'
                shutil.copy2(src,target)
                paths.append(target.relative_to(ROOT).as_posix())
            photo_map[str(int(r['id']))]=paths
        report.append(f'{folder}: {len(items)} tanaman / {needed} foto')
    MAP_FILE.write_text('window.PHOTO_MAP = '+json.dumps(photo_map,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    messagebox.showinfo('Selesai','Foto berhasil diimpor.\n\n'+'\n'.join(report)+'\n\nBuka ulang website.')

if __name__=='__main__':
    try:main()
    except Exception as e:
        messagebox.showerror('Gagal',str(e))
