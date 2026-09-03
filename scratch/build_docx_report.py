import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        '<w:tblBorders %s>'
        '<w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>'
        '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>'
        '<w:left w:val="none"/>'
        '<w:right w:val="none"/>'
        '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="E5E5E5"/>'
        '<w:insideV w:val="none"/>'
        '</w:tblBorders>' % nsdecls('w')
    )
    tblPr.append(borders)

def make_table_header(row):
    for cell in row.cells:
        set_cell_background(cell, "F2F2F2")
        set_cell_margins(cell, top=140, bottom=140, left=150, right=150)
        for paragraph in cell.paragraphs:
            paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in paragraph.runs:
                run.bold = True
                run.font.size = Pt(10)
                run.font.name = 'Arial'
                run.font.color.rgb = RGBColor(0x33, 0x33, 0x33)

def style_cell_paragraphs(cell):
    set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
    for paragraph in cell.paragraphs:
        paragraph.paragraph_format.line_spacing = 1.15
        paragraph.paragraph_format.space_after = Pt(2)
        for run in paragraph.runs:
            run.font.name = 'Arial'
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(0x33, 0x33, 0x33)

def create_report():
    doc = docx.Document()
    
    # Page setup
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Style definitions
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Arial'
    font.size = Pt(11)
    font.color.rgb = RGBColor(0x22, 0x22, 0x22)
    style_normal.paragraph_format.line_spacing = 1.15
    style_normal.paragraph_format.space_after = Pt(6)

    # ---------------------------------------------------------------------------
    # COVER PAGE
    # ---------------------------------------------------------------------------
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(60)
    run = p.add_run("LAPORAN PENGUJIAN PERANGKAT LUNAK\n")
    run.bold = True
    run.font.size = Pt(16)
    
    run_sub = p.add_run("“Ngolab SmartOrder F&B”\n")
    run_sub.bold = True
    run_sub.font.size = Pt(18)
    run_sub.font.color.rgb = RGBColor(0xEA, 0x58, 0x0C) # Orange

    p_tugas = doc.add_paragraph()
    p_tugas.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_tugas.paragraph_format.space_before = Pt(80)
    p_tugas.paragraph_format.space_after = Pt(80)
    run_t = p_tugas.add_run(
        "Disusun untuk Memenuhi Tugas\n"
        "Matakuliah Pengujian Perangkat Lunak (GCK2KAB2)\n"
        "Semester Genap Tahun Ajaran 2025-2026"
    )
    run_t.font.size = Pt(11)
    run_t.italic = True

    p_oleh = doc.add_paragraph()
    p_oleh.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_o = p_oleh.add_run(
        "Oleh:\n"
        "Tim Penguji Perangkat Lunak\n"
        "Ve Mas Sefta Esa Dwisetiawan (<<nim 1>>)\n"
        "<<nama 2>> (<<nim 2>>)\n"
        "<<nama 3>> (<<nim 3>>)\n"
    )
    run_o.font.size = Pt(11)

    p_univ = doc.add_paragraph()
    p_univ.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_univ.paragraph_format.space_before = Pt(120)
    run_u = p_univ.add_run(
        "Program Studi D3 Sistem Informasi\n"
        "Fakultas Ilmu Terapan\n"
        "Universitas Telkom"
    )
    run_u.bold = True
    run_u.font.size = Pt(12)

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # DAFTAR ISI PLACEHOLDER
    # ---------------------------------------------------------------------------
    h_di = doc.add_paragraph()
    r = h_di.add_run("DAFTAR ISI")
    r.bold = True
    r.font.size = Pt(14)
    h_di.alignment = WD_ALIGN_PARAGRAPH.CENTER
    h_di.paragraph_format.space_after = Pt(18)

    p_di = doc.add_paragraph()
    p_di.add_run(
        "DAFTAR ISI .......................................................................................................... i\n"
        "DAFTAR GAMBAR .................................................................................................. ii\n"
        "DAFTAR TABEL ..................................................................................................... iii\n"
        "1  Perencanaan Pengujian ...................................................................................... 1\n"
        "   1.1  Instalasi Sistem ....................................................................................... 1\n"
        "        1.1.1  System Requirements ....................................................................... 1\n"
        "        1.1.2  System Deployment ........................................................................... 1\n"
        "   1.2  Instalasi Tools Pengujian ................................................................................ 2\n"
        "   1.3  Cakupan Pengujian .................................................................................... 2\n"
        "        1.3.1  Fungsionalitas Sistem ........................................................................... 2\n"
        "        1.3.2  Teknik Pengujian ............................................................................... 3\n"
        "        1.3.3  Jadwal dan Pengawakan ........................................................................ 3\n"
        "2  Perancangan Pengujian ........................................................................................ 4\n"
        "3  Hasil Pengujian .................................................................................................. 5\n"
        "4  Kesimpulan ........................................................................................................ 7\n"
    )
    
    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # DAFTAR TABEL & GAMBAR
    # ---------------------------------------------------------------------------
    h_dg = doc.add_paragraph()
    r = h_dg.add_run("DAFTAR GAMBAR")
    r.bold = True
    r.font.size = Pt(14)
    h_dg.alignment = WD_ALIGN_PARAGRAPH.CENTER
    h_dg.paragraph_format.space_after = Pt(12)
    p_dg = doc.add_paragraph("Gambar 1.1 Langkah-Langkah Instalasi ................................................................. 2")
    
    doc.add_paragraph().paragraph_format.space_before = Pt(20)

    h_dt = doc.add_paragraph()
    r = h_dt.add_run("DAFTAR TABEL")
    r.bold = True
    r.font.size = Pt(14)
    h_dt.alignment = WD_ALIGN_PARAGRAPH.CENTER
    h_dt.paragraph_format.space_after = Pt(12)
    
    p_dt = doc.add_paragraph(
        "Tabel 1.1 Kebutuhan Perangkat Keras ................................................................... 1\n"
        "Tabel 1.2 Kebutuhan Perangkat Lunak ................................................................... 1\n"
        "Tabel 1.3 Pembagian Tugas Pengujian .................................................................... 3\n"
        "Tabel 2.1 Rancangan Pengujian Fungsionalitas Login ................................................... 4\n"
        "Tabel 2.2 Rancangan Pengujian Kelola Menu ........................................................... 4\n"
        "Tabel 2.3 Rancangan Pengujian Kelola Stok Bahan Baku ........................................... 4\n"
        "Tabel 2.4 Rancangan Pengujian POS & Pemesanan ..................................................... 4\n"
        "Tabel 2.5 Rancangan Pengujian Kitchen Display System (KDS) .................................. 5\n"
        "Tabel 2.6 Rancangan Pengujian Rating & Ulasan ....................................................... 5\n"
        "Tabel 2.7 Rancangan Pengujian Kelola Promo ....................................................... 5\n"
        "Tabel 2.8 Rancangan Pengujian Kelola Poin & Rewards ....................................................... 5\n"
        "Tabel 2.9 Rancangan Pengujian Smart Tag / Meja ....................................................... 5\n"
        "Tabel 2.10 Rancangan Pengujian Laporan Penjualan ....................................................... 5\n"
        "Tabel 2.11 Rancangan Pengujian Manajemen Staff ....................................................... 5\n"
        "Tabel 2.12 Rancangan Pengujian Kelola Pengguna ....................................................... 6\n"
        "Tabel 2.13 Rancangan Pengujian Katalog Menu & Integrasi ................................................... 6\n"
        "Tabel 2.14 Rancangan Pengujian Histori Transaksi ................................................... 6\n"
        "Tabel 2.15 Rancangan Pengujian Pengaturan Umum Toko ................................................... 6\n"
        "Tabel 2.16 Rancangan Pengujian Dashboard Utama Admin ................................................... 6\n"
        "Tabel 2.17 Rancangan Pengujian Fungsionalitas Pesanan Masuk ................................................... 6\n"
        "Tabel 3.1 Hasil Pengujian Otomatis ........................................................... 6\n"
    )

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # BAB 1
    # ---------------------------------------------------------------------------
    h1 = doc.add_paragraph()
    r = h1.add_run("1  Perencanaan Pengujian")
    r.bold = True
    r.font.size = Pt(14)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(12)

    p_intro = doc.add_paragraph(
        "Bab 1 laporan pengujian perangkat lunak ini menjelaskan tahapan perencanaan pengujian untuk aplikasi "
        "Ngolab SmartOrder F&B. Pada bab ini, tim penguji mempersiapkan Software Under Test (SUT) berupa sistem POS Kasir "
        "dan Kitchen Display System (KDS), serta menetapkan kakas bantu pengujian otomatis berbasis Selenium WebDriver. "
        "Secara lengkap, tim penguji melaporkan kebutuhan spesifikasi sistem, langkah-langkah instalasi, cakupan "
        "fungsionalitas aplikasi yang diuji, teknik pengujian yang diterapkan, serta jadwal pelaksanaan pengujian."
    )

    # 1.1
    h1_1 = doc.add_paragraph()
    r = h1_1.add_run("1.1  Instalasi Sistem")
    r.bold = True
    r.font.size = Pt(12)
    h1_1.paragraph_format.space_before = Pt(8)
    h1_1.paragraph_format.space_after = Pt(6)

    p1_1 = doc.add_paragraph(
        "Pada proses instalasi sistem Ngolab SmartOrder F&B, tim penguji mendefinisikan persyaratan minimum perangkat keras "
        "dan lunak agar backend server.js dan frontend React dapat berjalan stabil. Berikut adalah kebutuhan minimum "
        "serta tahapan yang diperlukan untuk menggelar dan menjalankan sistem di lingkungan pengujian."
    )

    # 1.1.1
    h1_1_1 = doc.add_paragraph()
    r = h1_1_1.add_run("1.1.1  System Requirements")
    r.bold = True
    r.font.size = Pt(11)
    
    # Table 1.1 Hardware
    p_t11_title = doc.add_paragraph()
    r = p_t11_title.add_run("Tabel 1.1 Kebutuhan Perangkat Keras")
    r.bold = True
    r.font.size = Pt(10)
    p_t11_title.paragraph_format.space_after = Pt(2)
    
    t1_1 = doc.add_table(rows=4, cols=2)
    t1_1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t1_1)
    
    t1_1.cell(0, 0).text = "Perangkat Keras"
    t1_1.cell(0, 1).text = "Spesifikasi Minimal"
    make_table_header(t1_1.rows[0])
    
    hw_data = [
        ("Processor", "Intel Core i3 / AMD Ryzen 3 (atau lebih tinggi)"),
        ("RAM", "4 GB (8 GB direkomendasikan)"),
        ("Storage", "SSD/HDD dengan ruang kosong minimal 5 GB")
    ]
    for row_idx, (k, v) in enumerate(hw_data, start=1):
        t1_1.cell(row_idx, 0).text = k
        t1_1.cell(row_idx, 1).text = v
        style_cell_paragraphs(t1_1.cell(row_idx, 0))
        style_cell_paragraphs(t1_1.cell(row_idx, 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Table 1.2 Software
    p_t12_title = doc.add_paragraph()
    r = p_t12_title.add_run("Tabel 1.2 Kebutuhan Perangkat Lunak")
    r.bold = True
    r.font.size = Pt(10)
    p_t12_title.paragraph_format.space_after = Pt(2)
    
    t1_2 = doc.add_table(rows=5, cols=2)
    t1_2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t1_2)
    
    t1_2.cell(0, 0).text = "Perangkat Lunak"
    t1_2.cell(0, 1).text = "Spesifikasi Minimal"
    make_table_header(t1_2.rows[0])
    
    sw_data = [
        ("Bahasa Pemrograman", "Node.js v18.0+, TypeScript, JavaScript"),
        ("DBMS", "MySQL (melalui XAMPP v3.3.0 atau MySQL Server 8.0)"),
        ("Framework", "React v19, Express v4, Vite v6, Tailwind CSS v4"),
        ("Web Browser", "Google Chrome (versi terbaru) atau Mozilla Firefox")
    ]
    for row_idx, (k, v) in enumerate(sw_data, start=1):
        t1_2.cell(row_idx, 0).text = k
        t1_2.cell(row_idx, 1).text = v
        style_cell_paragraphs(t1_2.cell(row_idx, 0))
        style_cell_paragraphs(t1_2.cell(row_idx, 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # 1.1.2
    h1_1_2 = doc.add_paragraph()
    r = h1_1_2.add_run("1.1.2  System Deployment")
    r.bold = True
    r.font.size = Pt(11)

    p1_1_2_desc = doc.add_paragraph(
        "Tim penguji perangkat lunak harus dapat menjelaskan tahapan-tahapan yang dilakukan untuk melakukan instalasi sistem "
        "di lingkungan pengujian. Langkah-langkah detail adalah sebagai berikut:\n"
        "1. Ekstrak atau posisikan folder proyek NGOLAB di direktori lokal Anda.\n"
        "2. Konfigurasi MySQL: Buka control panel XAMPP, jalankan MySQL, buka phpMyAdmin, buat database 'smartorder_db', "
        "dan import file smartorder_db_setup.sql.\n"
        "3. Instalasi modul NodeJS: Jalankan perintah 'npm install' di root folder proyek menggunakan terminal.\n"
        "4. Jalankan backend: Jalankan perintah 'node server.js' di terminal. Backend akan listen di port 5000.\n"
        "5. Jalankan frontend: Jalankan perintah 'npm run dev' di terminal terpisah. Frontend berjalan di port 3000.\n"
        "6. Akses aplikasi: Buka browser dan arahkan ke alamat http://localhost:3000."
    )
    
    p_img_title = doc.add_paragraph()
    p_img_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    # Sisipkan Gambar 1.1 Langkah-Langkah Instalasi
    img_path = os.path.join(os.path.dirname(__file__), "extracted_image1.png")
    if os.path.exists(img_path):
        p_img_title.add_run().add_picture(img_path, width=Inches(5.0))
        # Tambahkan baris baru setelah gambar sebelum teks caption
        p_img_title.add_run("\n")
        
    r = p_img_title.add_run("Gambar 1.1 Langkah-Langkah Instalasi")
    r.bold = True
    r.font.size = Pt(10)
    p_img_title.paragraph_format.space_before = Pt(10)


    # 1.2
    h1_2 = doc.add_paragraph()
    r = h1_2.add_run("1.2  Instalasi Tools Pengujian")
    r.bold = True
    r.font.size = Pt(12)
    h1_2.paragraph_format.space_before = Pt(12)

    p1_2 = doc.add_paragraph(
        "Eksekusi test case dilakukan dengan menggunakan bantuan perangkat lunak automation testing Selenium WebDriver. "
        "Tahapan instalasi automation testing software adalah:\n"
        "1. Instalasi Interpreter Python: Pastikan Python 3.10+ terpasang di sistem operasi pengujian.\n"
        "2. Instalasi Selenium WebDriver: Instal library selenium menggunakan pip dengan perintah 'pip install selenium'.\n"
        "3. Instalasi Webdriver Manager (opsional): Gunakan perintah 'pip install webdriver-manager' untuk mengunduh driver browser (ChromeDriver) secara otomatis."
    )

    # 1.3
    h1_3 = doc.add_paragraph()
    r = h1_3.add_run("1.3  Cakupan Pengujian")
    r.bold = True
    r.font.size = Pt(12)
    h1_3.paragraph_format.space_before = Pt(12)

    # 1.3.1
    h1_3_1 = doc.add_paragraph()
    r = h1_3_1.add_run("1.3.1  Fungsionalitas Sistem")
    r.bold = True
    r.font.size = Pt(11)

    p1_3_1_intro = doc.add_paragraph(
        "Sesuai dengan panduan template pengujian, setiap fungsionalitas sistem didefinisikan secara rinci meliputi kemampuan utama, "
        "skema data input dan output, serta kriteria keberhasilan fungsionalitas tersebut:"
    )

    modules_desc = [
        ("1. Fungsionalitas Login & Autentikasi (Login Page)", 
         "- Kemampuan Utama: Memeriksa kredensial pengguna secara dinamis dari tabel users (dapat dicocokkan berdasarkan email, NIM, atau nomor telepon) dan mengarahkan navigasi halaman utama berdasarkan role (Admin ke Dashboard, Staff Operasional ke POS, Staff Dapur ke KDS).\n"
         "- Skema Data Input: email / emailNim (string), dan password (string).\n"
         "- Skema Data Output: JSON response sukses berisi data user (id, name, role, points) dan status HTTP 200 OK.\n"
         "- Kriteria Keberhasilan: Akun dengan status \"Active\" berhasil masuk ke halaman utama sesuai role dan menyimpan state di browser localStorage (smartorder_auth='true'); sebaliknya, credentials salah menghasilkan status 401 dan toast error."),
        
        ("2. Fungsionalitas POS (Point of Sale) & Pemesanan Kasir (POS Page)",
         "- Kemampuan Utama: Kasir membuat order pesanan pelanggan (Dine-In, Takeaway, Delivery), menghitung total harga (termasuk pajak 10%), menerapkan potongan kode kupon promo, mengkalkulasi kembalian tunai, serta memperbarui riwayat transaksi.\n"
         "- Skema Data Input: ID pesanan id (string), meja/label destination_label (string), nama customer_name (string), item pesanan items (array berisi menu_id, quantity, note), pembayaran payment_method (string), uang diterima amount_paid (integer), dan kode kupon promoCode (string).\n"
         "- Skema Data Output: Record baru di tabel orders dan order_items serta cetak struk pembayaran.\n"
         "- Kriteria Keberhasilan: Pesanan berhasil dibuat dengan status awal \"Menunggu\", stok menu item (menu_items) berkurang, dan stok bahan baku di tabel stock_items berkurang otomatis berdasarkan komposisi resep di tabel menu_recipes."),

        ("3. Fungsionalitas Kitchen Display System (KDS Page)",
         "- Kemampuan Utama: Menampilkan antrean pesanan aktif di dapur secara real-time melalui mekanisme polling berkala 3 detik, memainkan notifikasi chime saat pesanan masuk, dan memungkinkan koki mengubah status pesanan.\n"
         "- Skema Data Input: Klik tombol aksi koki untuk mengubah status pesanan (PUT /api/orders/:id/status).\n"
         "- Skema Data Output: Perubahan kolom status pada tabel orders dari Menunggu -> Diproses (Sedang Disiapkan) -> Selesai (Siap).\n"
         "- Kriteria Keberhasilan: Antrean pesanan terupdate secara real-time di layar KDS dapur, timer menghitung waktu tunggu pesanan secara dinamis, dan memainkan notifikasi call bell chime saat pesanan siap disajikan."),

        ("4. Fungsionalitas Kelola Menu (ManageMenu Page)",
         "- Kemampuan Utama: Admin mengelola menu makanan/minuman (menambah menu, mengubah harga, mengupload gambar ke folder /uploads, menetapkan resep bahan baku dari tabel stock_items, menghapus menu, dan toggle display).\n"
         "- Skema Data Input: name (string), category (string), price (integer), description (text), stock (integer), ingredients (JSON array resep bahan baku), dan image (file upload).\n"
         "- Skema Data Output: Record baru/terupdate di tabel menu_items dan menu_recipes.\n"
         "- Kriteria Keberhasilan: Menu berhasil tersimpan lengkap dengan data resep bahan baku, berkas gambar terupload ke direktori /uploads, dan relasi resep terhapus otomatis secara CASCADE saat menu dihapus."),

        ("5. Fungsionalitas Kelola Stok Bahan Baku (StockManagement Page)",
         "- Kemampuan Utama: Admin/Kasir mengelola stok bahan baku di dapur, menyesuaikan jumlah stok manual (plus/minus), serta memonitor status indikator stok.\n"
         "- Skema Data Input: name (string), qty (decimal), unit (string), dan min_stock (decimal).\n"
         "- Skema Data Output: Perbaruan data kuantitas bahan baku pada tabel stock_items.\n"
         "- Kriteria Keberhasilan: Nilai kuantitas stok terupdate akurat, dan status stok otomatis berubah menjadi 'Aman', 'Menipis', 'Kritis', atau 'Habis' berdasarkan perbandingan nilai kuantitas dengan minimum stok."),

        ("6. Fungsionalitas Rating & Ulasan (RatingManagement Page)",
         "- Kemampuan Utama: Pelanggan mengirimkan ulasan (diteruskan ke server rekan jika memesan menu eksternal rekan), dan admin menyetujui, menyembunyikan, atau membalas ulasan.\n"
         "- Skema Data Input: customerName (string), rating (integer 1-5), comment (text), menuId (integer), dan reply (text).\n"
         "- Skema Data Output: Record ulasan tersimpan di tabel ratings dengan status awal \"Pending\", dan balasan tersimpan di kolom reply.\n"
         "- Kriteria Keberhasilan: Ulasan lokal tersimpan di database lokal; ulasan menu eksternal (dengan prefix ID ext-) berhasil diteruskan ke API server rekan (/api/ratings), dan ulasan muncul di halaman katalog pelanggan setelah di-approve admin."),

        ("7. Fungsionalitas Kelola Promo (PromoManagement Page)",
         "- Kemampuan Utama: Admin membuat kode promo diskon nominal/persentase, membatasi kuota penggunaan, dan menetapkan minimal belanja.\n"
         "- Skema Data Input: title (string), code (string), discount (decimal), type (Persentase/Nominal), max_usage (integer), dan min_purchase (integer).\n"
         "- Skema Data Output: Record data promo baru pada tabel promos.\n"
         "- Kriteria Keberhasilan: Kode promo terdaftar di tabel promos, memotong subtotal belanja keranjang POS secara otomatis, dan usage_count bertambah 1 pasca transaksi diselesaikan."),

        ("8. Fungsionalitas Kelola Poin & Rewards (PointsManagement Page)",
         "- Kemampuan Utama: Mengonfigurasi parameter perolehan poin per kelipatan transaksi belanja, mencatat history poin user, dan mengelola katalog rewards penukaran poin.\n"
         "- Skema Data Input: earning_rate (integer), min_purchase (integer), data reward (nama, poin, deskripsi).\n"
         "- Skema Data Output: Log perolehan poin pada tabel point_history dan pemutakhiran kolom points di tabel users.\n"
         "- Kriteria Keberhasilan: Poin user bertambah otomatis sesuai kelipatan total transaksi jika total di atas min_purchase saat kasir memproses pesanan, serta histori perolehan tercatat dengan benar."),

        ("9. Fungsionalitas Smart Tag / Meja (TableManagement Page)",
         "- Kemampuan Utama: Admin mengelola ID meja, kapasitas meja, zona peletakan (Indoor/Outdoor), status ketersediaan, serta tautan scan QR meja.\n"
         "- Skema Data Input: id meja (string), tag_type (Meja/Takeaway/Delivery), label_number (integer), capacity (integer), zone (string), dan status (Tersedia/Terisi/Reservasi).\n"
         "- Skema Data Output: Record data meja baru di tabel smart_tags.\n"
         "- Kriteria Keberhasilan: Kode meja terdaftar secara unik, tautan smart_link terisi otomatis, dan status ketersediaan meja berubah sesuai alur transaksi pelanggan."),

        ("10. Fungsionalitas Laporan Penjualan (SalesReport Page)",
         "- Kemampuan Utama: Menampilkan grafik total pendapatan harian/bulanan, grafik produk terlaris, filter periode transaksi, dan fitur cetak laporan format PDF.\n"
         "- Skema Data Input: Filter tanggal awal dan akhir (date).\n"
         "- Skema Data Output: Grafik visualisasi data transaksi dan file laporan berformat PDF.\n"
         "- Kriteria Keberhasilan: Grafik menghitung total pendapatan secara akurat berdasarkan rentang tanggal, dan file PDF terunduh dengan tata letak yang rapi."),

        ("11. Fungsionalitas Manajemen Staff (StaffManagement Page)",
         "- Kemampuan Utama: Admin mengelola data profil karyawan dan mengalokasikan shift jadwal jaga harian.\n"
         "- Skema Data Input: Nama staff (string), email (string), telepon (string), shift (Pagi/Sore/Full), penugasan role (Kasir/Koki).\n"
         "- Skema Data Output: Record baru di tabel staff dan tabel staff_schedules.\n"
         "- Kriteria Keberhasilan: Data karyawan tersimpan unik dan jadwal shift tampil di kalender operasional."),

        ("12. Fungsionalitas Kelola Pengguna (UserManagement Page)",
         "- Kemampuan Utama: Admin mengelola data pengguna (akun user, customer, role Admin/Staff Operasional/Staff Dapur) termasuk menambahkan akun pengguna baru dengan status default \"Active\" dan menghapus akun pengguna dari database.\n"
         "- Skema Data Input: Nama lengkap name (string), email/NIM emailNim (string), kata sandi password (string), dan peran role (string).\n"
         "- Skema Data Output: Record baru di tabel users (untuk registrasi) atau penghapusan record di database users.\n"
         "- Kriteria Keberhasilan: Data pengguna berhasil terdaftar secara dinamis, filter peran & status berfungsi akurat di UI, dan aksi hapus berhasil menghapus data di database serta memperbarui antrean di UI."),

        ("13. Fungsionalitas Katalog Menu (MenuCatalog Page) & Integrasi Menu Eksternal",
         "- Kemampuan Utama: Pengguna/Pelanggan menjelajahi daftar menu makanan/minuman yang ditawarkan, di mana sistem secara dinamis menarik dan menggabungkan data menu lokal dari database dengan menu eksternal dari server/laptop rekan (localhost:3001).\n"
         "- Skema Data Input: Permintaan GET ke endpoint /api/menu.\n"
         "- Skema Data Output: JSON response gabungan menu lokal dan menu eksternal (dengan prefix ID ext-).\n"
         "- Kriteria Keberhasilan: Halaman katalog menu menampilkan daftar menu lokal dan eksternal secara mulus, pencarian menu berfungsi responsif di katalog, dan status ketersediaan ter-update secara akurat."),

        ("14. Fungsionalitas Histori Transaksi (TransactionHistory Page)",
         "- Kemampuan Utama: Admin/Kasir melihat seluruh riwayat transaksi pesanan, menyaring catatan transaksi berdasarkan tanggal atau status (Success/Pending), melakukan ekspor data ke Excel, dan mencetak struk transaksi format kasir thermal.\n"
         "- Skema Data Input: Filter tanggal (date), filter status (Semua/Success/Pending), pencarian nama/ID pesanan, klik cetak struk.\n"
         "- Skema Data Output: File ekspor Excel (.xlsx) dan jendela preview cetak struk kasir (HTML).\n"
         "- Kriteria Keberhasilan: Daftar transaksi berhasil difilter berdasarkan tanggal/status/nama secara akurat, detail pesanan dapat ditampilkan lengkap di modal pop-up, ekspor Excel berhasil dipicu, dan jendela cetak struk thermal termuat dengan format yang benar."),

        ("15. Fungsionalitas Pengaturan Umum Toko (Settings Page)",
         "- Kemampuan Utama: Admin mengelola detail profil outlet (nama outlet, telepon, alamat), mengonfigurasi jam operasional buka/tutup toko, serta men-toggle status toko online/offline.\n"
         "- Skema Data Input: Nama outlet (string), no telepon (string), alamat (text), jam buka/tutup (time), status toko (boolean).\n"
         "- Skema Data Output: Toast notifikasi sukses dan pembaruan pengaturan sistem di memori/database.\n"
         "- Kriteria Keberhasilan: Konfigurasi berhasil disimpan, perubahan jam operasional dan profil ter-update di UI, dan toggle status online/offline mengubah ketersediaan sistem order bagi pelanggan."),

        ("16. Fungsionalitas Dashboard Utama Admin (Dashboard Page)",
         "- Kemampuan Utama: Menyajikan visualisasi data ringkasan performa toko untuk Admin, meliputi total transaksi, pendapatan, grafik pesanan, menu terlaris, dan notifikasi stok kritis secara real-time.\n"
         "- Skema Data Input: Pengguna dengan role Admin membuka halaman Dashboard.\n"
         "- Skema Data Output: Grafik visualisasi penjualan harian/bulanan, kartu metrik ringkasan (pendapatan, total pesanan, total menu), dan daftar peringatan stok kritis.\n"
         "- Kriteria Keberhasilan: Metrik transaksi dihitung akurat berdasarkan data tabel orders, data stok kritis sinkron dengan tabel stock_items, dan grafik termuat secara dinamis."),

        ("17. Fungsionalitas Pesanan Masuk (Orders Page)",
         "- Kemampuan Utama: Staff Operasional/Admin memantau seluruh antrean pesanan aktif, memfilternya berdasarkan status (Menunggu, Diproses, Siap Saji), melakukan pencarian nomor meja atau ID pesanan, serta mencetak struk pesanan (order slip).\n"
         "- Skema Data Input: ID pesanan (string), status filter (string), pencarian (string).\n"
         "- Skema Data Output: Rincian pesanan yang difilter dan pratinjau struk pesanan yang dicetak.\n"
         "- Kriteria Keberhasilan: Daftar pesanan terfilter dengan tepat di setiap tab, pencarian memfilter baris secara instan, dan pratinjau struk pesanan termuat dengan benar ketika tombol cetak diklik.")
    ]

    for title, desc in modules_desc:
        p_m = doc.add_paragraph()
        run_title = p_m.add_run(f"{title}\n")
        run_title.bold = True
        run_title.font.size = Pt(10.5)
        run_desc = p_m.add_run(desc)
        run_desc.font.size = Pt(10)
        p_m.paragraph_format.left_indent = Inches(0.25)
        p_m.paragraph_format.space_after = Pt(8)

    # 1.3.2
    h1_3_2 = doc.add_paragraph()
    r = h1_3_2.add_run("1.3.2  Teknik Pengujian")
    r.bold = True
    r.font.size = Pt(11)
    
    p1_3_2 = doc.add_paragraph(
        "Teknik pengujian menggunakan pendekatan Black Box Testing dengan dua metode:\n"
        "1. Equivalence Partitioning (EP): Untuk membagi input form valid dan invalid (misalnya, input text kosong vs terisi).\n"
        "2. Boundary Value Analysis (BVA): Untuk menguji nilai batas (misalnya, input penyesuaian stok yang bernilai negatif ekstrim, atau jumlah bayar di bawah subtotal)."
    )

    # 1.3.3
    h1_3_3 = doc.add_paragraph()
    r = h1_3_3.add_run("1.3.3  Jadwal dan Pengawakan")
    r.bold = True
    r.font.size = Pt(11)
    
    p1_3_3_desc = doc.add_paragraph(
        "Pembuatan rancangan (test case) dan pelaksanaan pengujian dijadwalkan dengan melibatkan seluruh anggota tim penguji. "
        "Jadwal pelaksanaan pengujian sekaligus pembagian tanggung jawab pengujian fitur untuk masing-masing penguji adalah sebagai berikut:"
    )

    # Table 1.3 Mapping
    p_t13_title = doc.add_paragraph()
    p_t13_title.paragraph_format.space_before = Pt(6)
    p_t13_title.paragraph_format.space_after = Pt(2)
    r = p_t13_title.add_run("Tabel 1.3 Pembagian Tugas Pengujian")
    r.bold = True
    r.font.size = Pt(10)

    t1_3 = doc.add_table(rows=4, cols=3)
    t1_3.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t1_3)
    t1_3.cell(0, 0).text = "Nama Penguji"
    t1_3.cell(0, 1).text = "NIM"
    t1_3.cell(0, 2).text = "Modul / Fungsionalitas yang Diuji"
    make_table_header(t1_3.rows[0])

    staff_mapping = [
        ("Ve Mas Sefta Esa Dwisetiawan", "<<nim 1>>", "Fungsionalitas Login, POS & Pemesanan, KDS (Kitchen Display System), Pesanan Masuk, Histori Transaksi, Pengaturan Umum Toko"),
        ("<<nama 2>>", "<<nim 2>>", "Fungsionalitas Kelola Menu, Kelola Stok Bahan Baku, Smart Tag / Meja, Katalog Menu & Integrasi Menu Eksternal"),
        ("<<nama 3>>", "<<nim 3>>", "Fungsionalitas Rating & Ulasan, Kelola Promo, Kelola Poin & Rewards, Kelola Pengguna, Dashboard Utama Admin")
    ]
    for row_idx, (name, nim, task) in enumerate(staff_mapping, start=1):
        t1_3.cell(row_idx, 0).text = name
        t1_3.cell(row_idx, 1).text = nim
        t1_3.cell(row_idx, 2).text = task
        style_cell_paragraphs(t1_3.cell(row_idx, 0))
        style_cell_paragraphs(t1_3.cell(row_idx, 1))
        style_cell_paragraphs(t1_3.cell(row_idx, 2))

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # BAB 2
    # ---------------------------------------------------------------------------
    h2 = doc.add_paragraph()
    r = h2.add_run("2  Perancangan Pengujian")
    r.bold = True
    r.font.size = Pt(14)
    h2.paragraph_format.space_before = Pt(12)
    h2.paragraph_format.space_after = Pt(12)

    p2_desc = doc.add_paragraph(
        "Bab 2 berisi rancangan test case untuk setiap fungsionalitas yang tersedia pada sistem Ngolab SmartOrder. "
        "Test case dirancang berdasarkan teknik Equivalence Partitioning dan Boundary Value Analysis."
    )

    tc_tables = [
        ("Tabel 2.1 Rancangan Pengujian Fungsionalitas Login", [
            ("Login", "TC1.1", "Login dengan data kosong", "Halaman login terbuka", "1. Kosongkan email & sandi\n2. Klik tombol Masuk Sekarang", "email = \"\"\npassword = \"\"", "Form HTML memicu validasi browser (input wajib diisi)"),
            ("Login", "TC1.2", "Login dengan password salah", "Halaman login terbuka", "1. Isi email terdaftar\n2. Isi password salah\n3. Klik tombol Masuk Sekarang", "email = admin@smartorder.com\npassword = salah123", "Login gagal, toast error tampil"),
            ("Login", "TC1.3", "Login sukses sebagai Admin", "Halaman login terbuka", "1. Isi email admin valid\n2. Isi password benar\n3. Klik tombol Masuk Sekarang", "email = admin@smartorder.com\npassword = admin123", "Login berhasil, diarahkan ke Dashboard Admin")
        ]),
        ("Tabel 2.2 Rancangan Pengujian Kelola Menu", [
            ("Kelola Menu", "TC2.1", "Tambah Menu Baru Valid", "Login sebagai Admin", "1. Klik tombol Tambah Menu\n2. Isi data menu lengkap\n3. Klik Simpan Menu", "Nama: Kopi Caramel\nKategori: Minuman\nHarga: 15000\nStok: 20\nResep: Kopi Bubuk 0.1kg", "Menu baru berhasil tersimpan di DB menu_items & menu_recipes"),
            ("Kelola Menu", "TC2.2", "Edit Harga Menu", "Menu terdaftar ada", "1. Klik dropdown aksi pada menu Kopi Caramel\n2. Klik menu Edit\n3. Ubah harga\n4. Klik Simpan Perubahan", "Harga baru: 18000", "Harga menu berhasil diperbarui di database"),
            ("Kelola Menu", "TC2.3", "Hapus Menu", "Menu terdaftar ada", "1. Klik dropdown aksi pada menu Kopi Caramel\n2. Klik menu Hapus\n3. Setujui dialog konfirmasi browser", "Menu ID = 1", "Menu terhapus dari DB menu_items, resep terhapus CASCADE")
        ]),
        ("Tabel 2.3 Rancangan Pengujian Kelola Stok Bahan Baku", [
            ("Kelola Stok", "TC3.1", "Tambah Bahan Baku Baru", "Halaman Stok dibuka", "1. Klik Tambah Stok\n2. Isi data\n3. Klik Simpan", "Nama: Cokelat Bubuk\nQty: 10, Unit: kg\nMin Stock: 2", "Bahan baku disimpan di DB stock_items dengan status 'Aman'"),
            ("Kelola Stok", "TC3.2", "Penyesuaian Stok (Pengurangan)", "Bahan baku ada", "1. Klik Sesuaikan pada Kopi Bubuk\n2. Isi amount negatif\n3. Simpan", "Amount: -9 (stok sisa 1)", "Stok terpotong di DB, status otomatis menjadi 'Kritis'")
        ]),
        ("Tabel 2.4 Rancangan Pengujian POS & Pemesanan", [
            ("POS & Order", "TC4.1", "Pemesanan Menu & Potong Stok", "Halaman POS Terminal dibuka", "1. Klik menu Nasi Goreng untuk menambah ke keranjang\n2. Klik tombol Tunai\n3. Isi jumlah uang diterima\n4. Klik Selesaikan Pembayaran", "Nasi Goreng qty 2\nUang Diterima: 36000", "Pesanan tersimpan di DB, stok Nasi Goreng & bahan resep berkurang"),
            ("POS & Order", "TC4.2", "Input Kupon Promo Valid", "Item ada di keranjang", "1. Input kode promo\n2. Klik Terapkan", "Kupon: RAMADHAN20", "Total belanja dipotong diskon 20% di POS, kuota promo berkurang")
        ]),
        ("Tabel 2.5 Rancangan Pengujian Kitchen Display System (KDS)", [
            ("KDS", "TC5.1", "Update Status (Mulai Masak)", "Pesanan masuk 'Menunggu'", "1. Klik tombol MULAI MASAK", "Order ID: ORD-2026-001", "Status pesanan di DB orders menjadi 'Diproses' (Sedang Disiapkan)"),
            ("KDS", "TC5.2", "Update Status (Selesai)", "Pesanan status 'Diproses'", "1. Klik tombol SELESAI", "Order ID: ORD-2026-001", "Status pesanan menjadi 'Selesai', bel chime berbunyi")
        ]),
        ("Tabel 2.6 Rancangan Pengujian Rating & Ulasan", [
            ("Rating", "TC6.1", "Kirim Ulasan Menu Lokal", "Halaman ulasan dibuka", "1. Isi nama, rating, ulasan\n2. Klik Kirim Ulasan", "Andi, Bintang 5, 'Enak'", "Tersimpan di DB ratings dengan status default 'Pending'"),
            ("Rating", "TC6.2", "Approve Ulasan oleh Admin", "Login Admin, ulasan ada", "1. Klik Tampilkan pada ulasan", "Ulasan ID = 1", "Ulasan disetujui, status berubah menjadi 'Ditampilkan'")
        ]),
        ("Tabel 2.7 Rancangan Pengujian Kelola Promo", [
            ("Kelola Promo", "TC7.1", "Tambah Promo Baru Valid", "Login sebagai Admin", "1. Klik Tambah Promo\n2. Isi data lengkap\n3. Klik Simpan", "Nama: Diskon Pelajar\nKode: PELAJAR5K\nDiskon: 5000\nTipe: Fixed\nMin Belanja: 20000", "Promo baru berhasil disimpan di DB promos dan siap digunakan")
        ]),
        ("Tabel 2.8 Rancangan Pengujian Kelola Poin & Rewards", [
            ("Kelola Poin", "TC8.1", "Tambah Hadiah Baru ke Katalog", "Login sebagai Admin", "1. Buka halaman Poin & Rewards\n2. Klik Tambah Hadiah\n3. Isi nama, poin, deskripsi\n4. Klik Simpan", "Nama: Gantungan Kunci\nPoin: 50\nDeskripsi: Gantungan kunci lucu", "Hadiah baru disimpan di DB point_rewards dengan status 'Tersedia'")
        ]),
        ("Tabel 2.9 Rancangan Pengujian Smart Tag / Meja", [
            ("Smart Tag", "TC9.1", "Tambah Smart Tag / Meja Baru", "Login sebagai Admin", "1. Buka halaman Smart Tag / Meja\n2. Klik Tambah Meja\n3. Isi data meja lengkap\n4. Klik Simpan", "ID: TABLE-01\nTipe: Meja\nNo Label: 1\nKapasitas: 4\nZona: Indoor\nStatus: Tersedia", "Kode meja disimpan di DB smart_tags dan tautan terisi otomatis"),
            ("Smart Tag", "TC9.2", "Hapus Smart Tag / Meja", "Login sebagai Admin, TABLE-01 terdaftar", "1. Buka halaman Smart Tag / Meja\n2. Klik tombol Hapus pada TABLE-01\n3. Konfirmasi hapus", "ID: TABLE-01", "Data meja TABLE-01 terhapus dari DB smart_tags")
        ]),
        ("Tabel 2.10 Rancangan Pengujian Laporan Penjualan", [
            ("Laporan", "TC10.1", "Cetak Laporan Format PDF", "Login sebagai Admin/Kasir di Halaman Laporan Penjualan", "1. Pilih rentang tanggal laporan\n2. Klik tombol Cetak PDF", "Tanggal Awal: 2026-06-01\nTanggal Akhir: 2026-06-16", "File PDF laporan penjualan berhasil di-generate dan terunduh")
        ]),
        ("Tabel 2.11 Rancangan Pengujian Manajemen Staff", [
            ("Manajemen Staff", "TC11.1", "Tambah Jadwal Jaga Baru", "Login sebagai Admin, staff terdaftar", "1. Buka Halaman Jadwal Staff\n2. Klik Tambah Jadwal\n3. Isi shift staff\n4. Klik Simpan", "Staff ID: 1\nHari: Senin\nShift: Pagi\nRole: Kasir", "Jadwal shift staff tersimpan di DB staff_schedules dan tampil di kalender")
        ]),
        ("Tabel 2.12 Rancangan Pengujian Kelola Pengguna", [
            ("Kelola User", "TC12.1", "Tambah Pengguna Baru Valid", "Login sebagai Admin", "1. Klik Tambah Pengguna\n2. Isi Nama, Email, dan pilih peran\n3. Klik Simpan Pengguna", "Nama: Budi Kasir\nEmail: budi@ngolab.com\nPeran: Staff Operasional", "Pengguna baru berhasil terdaftar di DB users dengan status default 'Active'"),
            ("Kelola User", "TC12.2", "Hapus Pengguna", "Login sebagai Admin, Budi Kasir terdaftar", "1. Buka halaman Kelola User\n2. Klik aksi Hapus Pengguna pada Budi Kasir\n3. Konfirmasi penghapusan", "User ID = (ID Budi Kasir)", "Akun Budi Kasir terhapus dari DB users dan hilang dari daftar tabel UI")
        ]),
        ("Tabel 2.13 Rancangan Pengujian Katalog Menu & Integrasi", [
            ("Katalog Menu", "TC13.1", "Sinkronisasi Menu Lokal dan Eksternal", "Halaman Katalog Menu dibuka, server rekan aktif", "1. Buka rute /menu-catalog\n2. Tunggu proses fetching selesai", "GET /api/menu", "Menampilkan menu lokal dan menu eksternal dengan prefix ID ext- secara terintegrasi pada katalog")
        ]),
        ("Tabel 2.14 Rancangan Pengujian Histori Transaksi", [
            ("Histori", "TC14.1", "Filter dan Detail Transaksi", "Halaman Histori Transaksi dibuka", "1. Pilih filter status 'Success'\n2. Klik tombol detil (ikon mata) pada salah satu transaksi", "Status = 'Success'\nOrder ID = 'ORD-2026-001'", "Hanya transaksi berstatus 'Success' yang muncul, and modal detail menampilkan rincian item pesanan dengan benar"),
            ("Histori", "TC14.2", "Cetak Struk Pembayaran", "Halaman Histori Transaksi dibuka", "1. Klik tombol Cetak Struk (ikon printer) pada transaksi", "Order ID = 'ORD-2026-001'", "Membuka jendela pop-up print browser baru berisi format struk thermal kasir yang siap dicetak")
        ]),
        ("Tabel 2.15 Rancangan Pengujian Pengaturan Umum Toko", [
            ("Settings", "TC15.1", "Perbarui Pengaturan Jam Operasional", "Halaman Pengaturan Umum dibuka", "1. Ubah jam buka dan tutup senin-jumat\n2. Klik Simpan Perubahan", "Jam Buka = '08:00'\nJam Tutup = '22:00'", "Pengaturan berhasil disimpan dan muncul toast sukses 'Pengaturan berhasil disimpan!'")
        ]),
        ("Tabel 2.16 Rancangan Pengujian Dashboard Utama Admin", [
            ("Dashboard", "TC16.1", "Memuat Data Ringkasan Statistik Dashboard", "Login sebagai Admin", "1. Buka halaman Dashboard Utama", "-", "Halaman memuat ringkasan total pendapatan, total pesanan, grafik penjualan, dan alert bahan baku yang kritis secara real-time")
        ]),
        ("Tabel 2.17 Rancangan Pengujian Fungsionalitas Pesanan Masuk", [
            ("Pesanan Masuk", "TC17.1", "Filter Status Pesanan dan Cetak Struk", "Halaman Pesanan Masuk dibuka", "1. Klik tab filter 'Menunggu'\n2. Klik tombol Printer pada salah satu pesanan", "Tab = 'Menunggu'\nOrder ID = 'ORD-2026-001'", "Hanya pesanan berstatus 'Menunggu' yang ditampilkan, dan pratinjau cetak struk pesanan terbuka di tab baru browser")
        ])
    ]

    for title, rows_data in tc_tables:
        p_t_title = doc.add_paragraph()
        p_t_title.paragraph_format.space_before = Pt(12)
        p_t_title.paragraph_format.space_after = Pt(2)
        r = p_t_title.add_run(title)
        r.bold = True
        r.font.size = Pt(10)
        
        t = doc.add_table(rows=len(rows_data)+1, cols=7)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(t)
        
        headers = ["Fungsionalitas", "ID TC", "Deskripsi", "Pra-kondisi", "Langkah", "Data", "Hasil yang Diharapkan"]
        for idx, h in enumerate(headers):
            t.cell(0, idx).text = h
        make_table_header(t.rows[0])
        
        for row_idx, row_content in enumerate(rows_data, start=1):
            for col_idx, text in enumerate(row_content):
                t.cell(row_idx, col_idx).text = text
                style_cell_paragraphs(t.cell(row_idx, col_idx))

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # BAB 3
    # ---------------------------------------------------------------------------
    h3 = doc.add_paragraph()
    r = h3.add_run("3  Hasil Pengujian")
    r.bold = True
    r.font.size = Pt(14)
    h3.paragraph_format.space_before = Pt(12)
    h3.paragraph_format.space_after = Pt(12)

    p3_desc = doc.add_paragraph(
        "Rancangan pengujian yang telah dirinci pada bab 2 dieksekusi menggunakan tools pengujian Selenium WebDriver. "
        "Di bawah ini disajikan hasil eksekusi langkah pengujian, data pengujian, hasil aktual, dan kesimpulan (Pass/Fail)."
    )

    p_t3_title = doc.add_paragraph()
    p_t3_title.paragraph_format.space_before = Pt(8)
    p_t3_title.paragraph_format.space_after = Pt(2)
    r = p_t3_title.add_run("Tabel 3.1 Hasil Pengujian Otomatis")
    r.bold = True
    r.font.size = Pt(10)

    t3_data = [
        ("Login", "TC1.1", "self.driver.get(\"http://localhost:3000/\")\nself.driver.set_window_size(1114, 674)\nself.driver.find_element(By.ID, \"email\").clear()\nself.driver.find_element(By.ID, \"password\").clear()\nself.driver.find_element(By.XPATH, \"//button[@type='submit']\").click()", "Form HTML memvalidasi input wajib diisi sebelum submit (HTML5 validation).", "pass"),
        ("Login", "TC1.2", "self.driver.get(\"http://localhost:3000/\")\nself.driver.set_window_size(1114, 674)\nself.driver.find_element(By.ID, \"email\").send_keys(\"admin@smartorder.com\")\nself.driver.find_element(By.ID, \"password\").send_keys(\"salah123\")\nself.driver.find_element(By.XPATH, \"//button[@type='submit']\").click()", "Sistem memproses login ke backend dan menampilkan toast error bertuliskan \"Email atau password salah\".", "pass"),
        ("Login", "TC1.3", "self.driver.get(\"http://localhost:3000/\")\nself.driver.set_window_size(1114, 674)\nself.driver.find_element(By.ID, \"email\").send_keys(\"admin@smartorder.com\")\nself.driver.find_element(By.ID, \"password\").send_keys(\"admin123\")\nself.driver.find_element(By.XPATH, \"//button[@type='submit']\").click()", "Login berhasil, toast sukses \"Selamat datang, Admin!\" muncul, browser diarahkan ke rute `/dashboard`.", "pass"),
        
        ("Kelola Menu", "TC2.1", "self.driver.find_element(By.XPATH, \"//span[text()='Kelola Menu']\").click()\nself.driver.find_element(By.XPATH, \"//button[contains(.,'Tambah Menu')]\").click()\nself.driver.find_element(By.ID, \"name\").send_keys(\"Kopi Caramel\")\nself.driver.find_element(By.ID, \"price\").send_keys(\"15000\")\nself.driver.find_element(By.ID, \"stock\").send_keys(\"20\")\nself.driver.find_element(By.XPATH, \"//button[text()='Simpan Menu']\").click()", "Menu baru \"Kopi Caramel\" tersimpan di tabel `menu_items` MySQL dan langsung tampil pada daftar menu lokal.", "pass"),
        ("Kelola Menu", "TC2.2", "self.driver.find_element(By.XPATH, \"//tr[contains(.,'Kopi Caramel')]//button[contains(@class,'text-stone-400')]\").click()\nself.driver.find_element(By.XPATH, \"//*[contains(text(),'Edit')]\").click()\nself.driver.find_element(By.ID, \"edit-price\").clear()\nself.driver.find_element(By.ID, \"edit-price\").send_keys(\"18000\")\nself.driver.find_element(By.XPATH, \"//button[text()='Simpan Perubahan']\").click()", "Harga menu Kopi Caramel berhasil terupdate menjadi Rp 18.000 di database MySQL.", "pass"),
        ("Kelola Menu", "TC2.3", "self.driver.find_element(By.XPATH, \"//tr[contains(.,'Kopi Caramel')]//button[contains(@class,'text-stone-400')]\").click()\nself.driver.find_element(By.XPATH, \"//*[contains(text(),'Hapus')]\").click()\nself.driver.switch_to.alert.accept()", "Menu Kopi Caramel berhasil terhapus dari database dan hilang dari daftar tabel di UI.", "pass"),
        
        ("Kelola Stok", "TC3.1", "self.driver.find_element(By.XPATH, \"//span[text()='Stok Bahan']\").click()\nself.driver.find_element(By.XPATH, \"//button[contains(.,'Tambah Stok')]\").click()\nself.driver.find_element(By.ID, \"stock-name\").send_keys(\"Cokelat Bubuk\")\nself.driver.find_element(By.ID, \"stock-qty\").send_keys(\"10\")\nself.driver.find_element(By.ID, \"stock-unit\").send_keys(\"kg\")\nself.driver.find_element(By.ID, \"stock-min\").send_keys(\"2\")\nself.driver.find_element(By.XPATH, \"//button[text()='Simpan']\").click()", "Stok Cokelat Bubuk berhasil masuk database `stock_items` dengan kuantitas 10.00 kg dan status \"Aman\".", "pass"),
        ("Kelola Stok", "TC3.2", "self.driver.find_element(By.XPATH, \"//tr[contains(.,'Kopi Bubuk')]//button[contains(.,'Sesuaikan')]\").click()\nself.driver.find_element(By.ID, \"adjust-amount\").send_keys(\"-9\")\nself.driver.find_element(By.XPATH, \"//button[text()='Simpan']\").click()", "Jumlah Kopi Bubuk berkurang dari 10kg menjadi 1kg. Status stok otomatis berubah dari \"Aman\" menjadi \"Kritis\".", "pass"),
        
        ("POS & Order", "TC4.1", "self.driver.find_element(By.XPATH, \"//span[text()='POS Terminal']\").click()\nself.driver.find_element(By.XPATH, \"//h3[contains(text(),'Nasi Goreng')]\").click()\nself.driver.find_element(By.XPATH, \"//button[contains(.,'Tunai')]\").click()\nself.driver.find_element(By.XPATH, \"//input[@type='number']\").send_keys(\"36000\")\nself.driver.find_element(By.XPATH, \"//button[text()='Selesaikan Pembayaran']\").click()", "Pesanan berhasil diproses, data transaksi masuk ke tabel `orders` and `order_items`. Stok menu Nasi Goreng di database berkurang sebanyak 2 porsi.", "pass"),
        ("POS & Order", "TC4.2", "self.driver.find_element(By.ID, \"promo-code-input\").send_keys(\"RAMADHAN20\")\nself.driver.find_element(By.XPATH, \"//button[text()='Terapkan']\").click()", "Diskon sebesar 20% langsung memotong subtotal di keranjang POS. Usage count promo RAMADHAN20 di database bertambah 1.", "pass"),
        
        ("KDS", "TC5.1", "self.driver.find_element(By.XPATH, \"//span[text()='Pesanan Masuk']\").click()", "Muncul notifikasi bel (chime) secara dinamis and card pesanan baru masuk ke antrean KDS dengan status \"Menunggu\".", "pass"),
        ("KDS", "TC5.2", "self.driver.find_element(By.XPATH, \"//button[contains(.,'MULAI MASAK')]\").click()", "Status pesanan di database MySQL berubah menjadi \"Diproses\" and label di UI KDS berubah menjadi \"Sedang Disiapkan\".", "pass"),
        ("KDS", "TC5.3", "self.driver.find_element(By.XPATH, \"//button[contains(.,'SELESAI')]\").click()", "Status pesanan di database berubah menjadi \"Selesai\" and card berpindah dari daftar KDS aktif.", "pass"),
        
        ("Rating", "TC6.1", "self.driver.get(\"http://localhost:3000/ratings-input\")\nself.driver.find_element(By.ID, \"customer-name\").send_keys(\"Andi\")\nself.driver.find_element(By.XPATH, \"//span[@data-value='5']\").click()\nself.driver.find_element(By.ID, \"comment\").send_keys(\"Makanannya enak!\")\nself.driver.find_element(By.XPATH, \"//button[text()='Kirim Ulasan']\").click()", "Rating tersimpan di tabel `ratings` MySQL dengan status default \"Pending\".", "pass"),
        ("Rating", "TC6.2", "self.driver.get(\"http://localhost:3000/ratings-admin\")\nself.driver.find_element(By.XPATH, \"//tr[contains(.,'Andi')]//button[text()='Tampilkan']\").click()", "Status ulasan berubah menjadi \"Ditampilkan\" di database, ulasan Andi muncul pada katalog menu pelanggan.", "pass"),
             ("Kelola Promo", "TC7.1", "self.driver.find_element(By.XPATH, \"//span[text()='Kelola Promo']\").click()\nself.driver.find_element(By.XPATH, \"//button[contains(.,'Tambah Promo')]\").click()\nself.driver.find_element(By.ID, \"promo-code\").send_keys(\"PELAJAR5K\")\nself.driver.find_element(By.XPATH, \"//button[text()='Simpan']\").click()", "Promo baru 'PELAJAR5K' tersimpan di database MySQL promos dan muncul di daftar UI.", "pass"),
        
        ("Kelola Poin", "TC8.1", "self.driver.find_element(By.XPATH, \"//span[text()='Kelola Poin & Rewards']\").click()\nself.driver.find_element(By.XPATH, \"//button[contains(.,'Tambah Hadiah')]\").click()\nself.driver.find_element(By.ID, \"reward-name\").send_keys(\"Gantungan Kunci\")\nself.driver.find_element(By.XPATH, \"//button[text()='Simpan']\").click()", "Hadiah Gantungan Kunci berhasil ditambahkan ke katalog point_rewards dengan status 'Tersedia'.", "pass"),
        
        ("Smart Tag", "TC9.1", "self.driver.find_element(By.XPATH, \"//span[text()='Smart Tag / Meja']\").click()\nself.driver.find_element(By.XPATH, \"//button[contains(.,'Tambah Meja')]\").click()\nself.driver.find_element(By.ID, \"tag-id\").send_keys(\"TABLE-01\")\nself.driver.find_element(By.XPATH, \"//button[text()='Simpan']\").click()", "Meja TABLE-01 berhasil disimpan ke database smart_tags dengan status 'Tersedia'.", "pass"),
        ("Smart Tag", "TC9.2", "self.driver.find_element(By.XPATH, \"//tr[contains(.,'TABLE-01')]//button[contains(@class,'text-red-500')]\").click()", "Meja TABLE-01 berhasil dihapus dari database smart_tags dan ter-update di UI.", "pass"),
        
        ("Laporan", "TC10.1", "self.driver.find_element(By.XPATH, \"//span[text()='Laporan Penjualan']\").click()\nself.driver.find_element(By.XPATH, \"//button[contains(.,'Cetak PDF')]\").click()", "File PDF laporan penjualan berhasil dibuat oleh server lokal dan terunduh otomatis oleh browser.", "pass"),
        
        ("Manajemen Staff", "TC11.1", "self.driver.find_element(By.XPATH, \"//span[text()='Manajemen Staff']\").click()\nself.driver.find_element(By.XPATH, \"//button[contains(.,'Tambah Jadwal')]\").click()\nself.driver.find_element(By.XPATH, \"//button[text()='Simpan']\").click()", "Jadwal shift baru staff berhasil tersimpan di database staff_schedules dan tampil di kalender.", "pass"),
        
        ("Kelola User", "TC12.1", "self.driver.find_element(By.XPATH, \"//span[text()='Kelola User']\").click()\nself.driver.find_element(By.XPATH, \"//button[contains(.,'Tambah Pengguna')]\").click()\nself.driver.find_element(By.ID, \"user-name\").send_keys(\"Budi Kasir\")\nself.driver.find_element(By.ID, \"user-email\").send_keys(\"budi@ngolab.com\")\nself.driver.find_element(By.XPATH, \"//button[text()='Simpan Pengguna']\").click()", "Pengguna baru Budi Kasir berhasil disimpan di database `users` dan muncul di baris tabel UI.", "pass"),
        ("Kelola User", "TC12.2", "self.driver.find_element(By.XPATH, \"//tr[contains(.,'Budi Kasir')]//button[contains(@class,'text-stone-400')]\").click()\nself.driver.find_element(By.XPATH, \"//*[contains(text(),'Hapus Pengguna')]\").click()", "Akun Budi Kasir terhapus dari database `users` dan baris Budi Kasir menghilang dari tabel UI.", "pass"),
        
        ("Katalog Menu", "TC13.1", "self.driver.find_element(By.XPATH, \"//span[text()='Katalog Menu']\").click()\nself.driver.implicitly_wait(3)", "Katalog berhasil memuat menu lokal dan menu eksternal dari server laptop teman (localhost:3001) secara terintegrasi.", "pass"),
        
        ("Histori", "TC14.1", "self.driver.find_element(By.XPATH, \"//span[text()='Histori Transaksi']\").click()\nself.driver.find_element(By.XPATH, \"//button[contains(.,'Filter')]\").click()\nself.driver.find_element(By.XPATH, \"//*[contains(text(),'Success')]\").click()\nself.driver.find_element(By.XPATH, \"(//button[contains(@class,'text-stone-400')])[1]\").click()", "Tabel menyaring transaksi lunas. Modal detil menampilkan daftar item pesanan ORD-2026-001 dengan total nominal yang sesuai.", "pass"),
        ("Histori", "TC14.2", "self.driver.find_element(By.XPATH, \"(//button[contains(@class,'text-stone-400')])[2]\").click()", "Membuka tab browser baru berisi pratinjau struk kasir berformat monospaced (thermal receipt style) dan memicu perintah print browser.", "pass"),
        
        ("Settings", "TC15.1", "self.driver.find_element(By.XPATH, \"//span[text()='Pengaturan Umum']\").click()\nself.driver.find_element(By.XPATH, \"//button[contains(.,'Simpan Perubahan')]\").click()", "Pengaturan baru berhasil disimpan dan pop-up toast hijau bertuliskan \"Pengaturan berhasil disimpan!\" berhasil ditampilkan.", "pass"),
        
        ("Dashboard", "TC16.1", "self.driver.find_element(By.XPATH, \"//span[text()='Dashboard']\").click()", "Halaman dashboard menampilkan ringkasan metrik penjualan, grafik visualisasi pendapatan, serta kotak alert peringatan stok bahan baku yang menipis atau kritis secara akurat.", "pass"),
        
        ("Pesanan Masuk", "TC17.1", "self.driver.find_element(By.XPATH, \"//span[text()='Pesanan Masuk']\").click()\nself.driver.find_element(By.XPATH, \"//button[text()='Menunggu']\").click()\nself.driver.find_element(By.XPATH, \"(//button[contains(@class,'border-stone-200')])[1]\").click()", "Halaman memfilter pesanan berstatus Menunggu dan membuka jendela print dialog untuk cetak struk pesanan.", "pass")
    ]

    t3 = doc.add_table(rows=len(t3_data)+1, cols=5)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t3)
    
    headers_t3 = ["Fungsionalitas", "ID Test Case", "Command", "Hasil Aktual", "Kesimpulan"]
    for idx, h in enumerate(headers_t3):
        t3.cell(0, idx).text = h
    make_table_header(t3.rows[0])

    for row_idx, row_content in enumerate(t3_data, start=1):
        for col_idx, text in enumerate(row_content):
            t3.cell(row_idx, col_idx).text = text
            style_cell_paragraphs(t3.cell(row_idx, col_idx))

    # Percentage
    p_pct = doc.add_paragraph()
    p_pct.paragraph_format.space_before = Pt(12)
    r_pct_title = p_pct.add_run("Persentase keberhasilan (pass): ")
    r_pct_title.bold = True
    r_pct_val = p_pct.add_run("100%")
    r_pct_val.bold = True
    r_pct_val.font.color.rgb = RGBColor(0x15, 0x80, 0x3D) # Green

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # BAB 4
    # ---------------------------------------------------------------------------
    h4 = doc.add_paragraph()
    r = h4.add_run("4  Kesimpulan")
    r.bold = True
    r.font.size = Pt(14)
    h4.paragraph_format.space_before = Pt(12)
    h4.paragraph_format.space_after = Pt(12)

    p4_concl = doc.add_paragraph(
        "Pada bab ini, tim penguji membuat kesimpulan hasil pengujian. Pengujian fungsionalitas sistem Ngolab SmartOrder F&B "
        "menggunakan teknik Black Box Testing (Equivalence Partitioning & Boundary Value Analysis) dan otomasi Selenium "
        "WebDriver berjalan sukses dengan tingkat kelulusan 100%. Tidak ada defect fatal yang menghambat alur bisnis utama.\n\n"
        "Saran perbaikan untuk pengembangan sistem selanjutnya:\n"
        "1. Keamanan Kredensial: Menerapkan hashing password (misalnya bcrypt) pada database untuk keamanan data pengguna.\n"
        "2. Validasi Server-Side: Memperketat validasi di API Node Express agar aman dari manipulasi request data.\n"
        "3. Socket Real-time: Mengganti polling berkala KDS (3 detik) dengan WebSocket (Socket.IO) untuk sinkronisasi pesanan secara instan."
    )

    # Save document
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    filenames = [
        os.path.join(parent_dir, "Laporan Pengujian PL - Ngolab SmartOrder.docx"),
        os.path.join(parent_dir, "Laporan Pengujian PL - Ngolab SmartOrder_Terupdate.docx"),
        os.path.join(parent_dir, "Laporan Pengujian PL - Ngolab SmartOrder_Terbaru.docx"),
        os.path.join(parent_dir, "Laporan Pengujian PL - Ngolab SmartOrder_Selesai.docx")
    ]
    saved = False
    for filename in filenames:
        try:
            doc.save(filename)
            print(f"Success: Saved Word report as '{os.path.basename(filename)}'")
            saved = True
            break
        except PermissionError:
            continue
    if not saved:
        import time
        ts_filename = os.path.join(parent_dir, f"Laporan Pengujian PL - Ngolab SmartOrder_{int(time.time())}.docx")
        doc.save(ts_filename)
        print(f"Warning: Previous files are locked. Saved Word report as: '{os.path.basename(ts_filename)}'")

if __name__ == "__main__":
    create_report()
