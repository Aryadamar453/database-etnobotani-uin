DATABASE ETNOBOTANI DIGITAL UIN JAKARTA — VERSI FINAL STATIS

ISI WEBSITE
- 450 observasi dari Excel Daftar Tanaman UIN.xlsx
- pencarian dan filter lokasi
- tampilan nama unik
- detail setiap observasi
- statistik otomatis
- responsif untuk laptop dan telepon
- siap dipasang gratis di GitHub Pages

CARA MEMBUKA
1. Extract ZIP ini.
2. Klik dua kali BUKA_WEBSITE.bat atau index.html.

MEMASUKKAN FOTO ASLI
1. Pastikan Python masih terpasang di laptop.
2. Klik IMPOR_FOTO.bat.
3. Pilih folder "Foto Tanaman" yang berisi 01_FIKES sampai 06_KAMPUS1.
4. Script memakai 3 foto per observasi, sesuai urutan Excel dan folder.
5. Tiga foto ekstra paling akhir pada 04_FAH otomatis diabaikan.
6. Buka ulang index.html. Foto asli akan muncul.

PUBLISH GRATIS KE GOOGLE / INTERNET MELALUI GITHUB PAGES
1. Buat repository publik di GitHub, misalnya database-etnobotani-uin.
2. Upload SELURUH ISI folder website ini, bukan ZIP-nya.
3. GitHub: Settings > Pages > Deploy from a branch > main > /(root) > Save.
4. Alamat gratis akan berbentuk https://USERNAME.github.io/database-etnobotani-uin/
5. Ganti USERNAME pada robots.txt dan sitemap.xml dengan nama akun GitHub Anda.
6. Tambahkan alamat website ke Google Search Console dan minta pengindeksan.

CATATAN
- Website ini adalah situs statis yang cocok untuk GitHub Pages.
- Perubahan data dilakukan dengan mengganti data/plants.js atau menghasilkan ulang dari Excel.
- Nama ilmiah ditampilkan sesuai dokumen sumber; jangan menganggapnya sebagai validasi nomenklatur final.

LOGO UIN
Logo resmi UIN Syarif Hidayatullah Jakarta sudah dipasang pada navbar, beranda, footer, favicon, dan halaman 404. File logo berada di assets/logo-uin-resmi-crop.png dan bersumber dari situs resmi UIN Jakarta.
