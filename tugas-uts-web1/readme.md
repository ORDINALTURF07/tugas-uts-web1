# PustakaKita - Aplikasi Pemesanan Buku Online

Tugas UTS Pemrograman Web 1. Aplikasi web pemesanan buku untuk toko online yang berfokus pada **front-end**. Tidak ada server dan database: data awal berasal dari `js/data.js`, sedangkan data yang dibuat pengguna disimpan di `localStorage` browser. Dibuat dengan HTML5, CSS3, dan JavaScript murni (tanpa framework atau library).

**Nama:** (isi nama Anda)
**NIM:** (isi NIM Anda)

---

## Daftar Isi
1. [Cara Menjalankan](#1-cara-menjalankan)
2. [Akun dan Data Uji](#2-akun-dan-data-uji)
3. [Halaman dan Fitur](#3-halaman-dan-fitur)
4. [Struktur Folder](#4-struktur-folder)
5. [Alur Data](#5-alur-data)
6. [Konsep HTML](#6-konsep-html)
7. [Konsep CSS](#7-konsep-css)
8. [Konsep JavaScript](#8-konsep-javascript)
9. [Aturan Validasi Form](#9-aturan-validasi-form)
10. [Aturan Bisnis](#10-aturan-bisnis)
11. [Masalah Umum dan Solusinya](#11-masalah-umum-dan-solusinya)
12. [Keterbatasan dan Pengembangan](#12-keterbatasan-dan-pengembangan)

---

## 1. Cara Menjalankan
1. Salin seluruh folder proyek ke komputer.
2. Letakkan gambar sampul buku di folder `img/`. Nama file harus **sama persis** dengan nilai `cover` di `data.js`, termasuk huruf besar-kecil dan ekstensinya.
3. Buka `index.html` di browser. Disarankan memakai ekstensi **Live Server** di VS Code (klik kanan `index.html`, lalu **Open with Live Server**).
4. Login memakai salah satu akun di bagian berikut.

Untuk mengembalikan semua data ke kondisi awal, buka Console browser (**F12**), jalankan `localStorage.clear()`, lalu refresh dengan **Ctrl+F5**.

## 2. Akun dan Data Uji

| Role | Email | Password |
|---|---|---|
| Admin | siti@gmail.com | siti123 |
| User | rina@gmail.com | rina123 |
| User | agus@gmail.com | agus123 |

Pengguna baru juga bisa dibuat lewat tombol **Daftar** di halaman login (role otomatis `User`).

Nomor Delivery Order untuk menguji halaman Tracking:
- `20230012`: Rina Wulandari, status Dalam Perjalanan
- `20230013`: Agus Pranoto, pengiriman sudah selesai
- Nomor DO dari pesanan yang dibuat sendiri di halaman Pemesanan

## 3. Halaman dan Fitur

| Halaman | File | Fitur |
|---|---|---|
| Login | `index.html` | Validasi email dan password, pop-up jika salah, modal **Lupa Password** dan **Daftar** |
| Dashboard | `dashboard.html` | Greeting sesuai jam lokal, empat menu utama, History Transaksi dalam modal |
| Stok / Katalog | `stok.html` | Tabel dinamis dari `dataKatalogBuku`, pencarian, tombol Pesan, tambah dan hapus stok (Admin) |
| Pemesanan | `checkout.html` | Keranjang bisa ditambah, diubah, dihapus; form pemesan dan pembayaran; ongkir otomatis; nomor DO; Laporan Pemesanan (Admin) |
| Tracking | `tracking.html` | Cari nomor DO, status dengan progress bar, detail pengiriman, riwayat perjalanan |

**Hak akses.** Role dibaca dari `dataPengguna` dan ditampilkan sebagai badge di navbar.

| Fitur | Admin | User |
|---|---|---|
| Lihat katalog, memesan, tracking, history | Ya | Ya |
| Tambah dan hapus stok | Ya | Tidak |
| Menu dan tabel Laporan Pemesanan | Ya | Tidak |

## 4. Struktur Folder
```
tugas-uts-web1/
├── index.html        # halaman login
├── dashboard.html
├── stok.html
├── checkout.html
├── tracking.html
├── css/
│   └── style.css     # seluruh tampilan
├── js/
│   ├── data.js       # data dari dosen (tidak diubah)
│   └── script.js     # seluruh logika
├── assets/
│   └── logo.png      # opsional
└── img/              # gambar sampul buku
```
Semua halaman memakai satu `script.js`. Fungsi yang dijalankan ditentukan oleh atribut `data-page` pada `<body>`. Contohnya `<body data-page="stok">` akan memanggil `initStok()`, lewat objek `inisialisasi` di akhir `script.js`.

## 5. Alur Data
1. `data.js` menyimpan data awal sebagai variabel global: `dataPengguna`, `dataKatalogBuku`, dan `dataTracking`.
2. Nama properti data dosen tidak cocok dengan kebutuhan logika (`kodeBarang`, `namaBarang`, harga berupa teks `"Rp 180.000"`). Fungsi **adapter** `katalogAwal()` menerjemahkannya (`kodeBarang` menjadi `kode`, harga menjadi angka lewat `angkaDariRupiah()`), sehingga `data.js` tidak perlu diubah.
3. Perubahan oleh pengguna disimpan di `localStorage`, jadi tetap ada setelah halaman di-refresh.
4. Setiap halaman membaca data lewat fungsi kecil seperti `muatKatalog()` dan `semuaPesanan()`. Jika sumber data berubah, cukup satu fungsi yang diganti.

**Kunci `localStorage` yang dipakai**

| Kunci | Isi |
|---|---|
| `sesi` | Pengguna yang sedang login (nama, email, role) |
| `penggunaBaru` | Akun yang didaftarkan lewat modal Daftar |
| `katalog` | Katalog buku setelah ada tambah, hapus, atau pengurangan stok |
| `keranjang` | Item pesanan yang belum dibayar |
| `pesanan` | Pesanan yang sudah dibuat, lengkap dengan nomor DO dan riwayat perjalanan |

## 6. Konsep HTML
- **Elemen semantik**: `header`, `nav`, `main`, `section`, `footer` memberi makna pada struktur halaman, bukan sekadar `div`.
- **Form yang aksesibel**: setiap `input` punya `<label for>` yang cocok dengan `id`-nya, dan `novalidate` dipakai supaya validasi memakai pesan buatan sendiri.
- **Tabel**: memakai `<thead>`, `<tbody>`, dan `<th scope="col">`, sehingga hubungan header dan data jelas bagi pembaca layar.
- **ARIA**: `aria-current="page"` menandai menu aktif, `aria-live` membuat pesan error terbaca otomatis, `role="dialog"` dan `aria-modal` dipakai pada modal.
- **Bahasa**: `<html lang="id">` agar browser dan pembaca layar memakai bahasa yang tepat.

## 7. Konsep CSS
- **Variabel CSS** di `:root` (`--primer`, `--aksen`, dan seterusnya). Seluruh tema bisa diganti dari satu blok.
- **Flexbox** untuk navbar dan baris alat. **Grid** untuk form dua kolom, kartu menu, dan langkah pengiriman.
- **Komponen yang dipakai ulang**: `.btn` dengan varian `.kuning`, `.ghost`, `.bahaya`, `.kecil`; `.kartu`; `.badge`; `.modal`.
- **Responsif**: `@media (max-width: 700px)` mengubah form dan halaman login menjadi satu kolom.
- **Aksesibilitas**: `:focus-visible` menampilkan garis fokus yang jelas saat navigasi keyboard, dan `prefers-reduced-motion` mematikan animasi bagi pengguna yang memintanya.
- **Pseudo-element** `::before` dipakai untuk titik pada langkah pengiriman, tanpa menambah elemen HTML.

## 8. Konsep JavaScript

**Fungsi utama di `script.js`**

| Fungsi | Peran |
|---|---|
| `el(tag, props, ...anak)` | Membuat elemen DOM lewat `createElement` |
| `bukaModal`, `alertBox`, `formModal` | Pop-up dan modal buatan sendiri |
| `cek(form, aturan)` | Validasi form dan menampilkan pesan error |
| `katalogAwal`, `muatKatalog` | Adapter dan pembaca katalog |
| `penggunaAktif`, `adalahAdmin` | Sesi dan pemeriksaan role |
| `sembunyikan(selector)` | Menyembunyikan bagian khusus Admin |
| `initLogin` ... `initTracking` | Satu fungsi inisialisasi untuk tiap halaman |

**Teknik yang dipakai**
- **Manipulasi DOM.** Baris tabel, keranjang, laporan, modal, toast, progress bar, dan riwayat perjalanan semuanya dibuat lewat JavaScript. Teks dari pengguna dipasang dengan `textContent`, bukan `innerHTML`, supaya aman dari injeksi HTML.
- **Event handling.** `onclick`, `onsubmit`, `oninput`, `onchange`, `onerror`, dan `keydown` untuk tombol Esc pada modal.
- **Higher-order function.** `map`, `filter`, `find`, `some`, `reduce`, dan `every` dipakai untuk mengolah array data.
- **Proteksi halaman.** Halaman selain login langsung diarahkan ke `index.html` jika belum ada sesi.
- **Role dibaca ulang.** `penggunaAktif()` selalu mencocokkan email sesi dengan `dataPengguna`, jadi role tetap benar walaupun sesi lama tidak menyimpan role.
- **Upload sampul.** File dibaca dengan `FileReader.readAsDataURL`, lalu disimpan sebagai teks di `localStorage` (maksimal 500 KB).
- **Penanganan gambar gagal.** Event `onerror` mencoba ekstensi lain (`.jpg` ke `.jpeg`). Jika tetap gagal, tampil kotak dengan huruf pertama judul.
- **Optional chaining dan nullish coalescing** (`?.` dan `??`) mencegah error saat data tidak ada.

## 9. Aturan Validasi Form

| Form | Field | Aturan |
|---|---|---|
| Login | Email | Wajib, format email valid |
| Login | Password | Wajib |
| Daftar | Nama | Minimal 3 karakter |
| Daftar | Email | Format valid dan belum terdaftar |
| Daftar | Password | Minimal 6 karakter, harus sama dengan ulangannya |
| Stok baru | Kode | Wajib dan tidak boleh sama dengan kode yang sudah ada |
| Stok baru | Edisi, Harga, Stok | Angka (edisi minimal 1, harga minimal 1000, stok minimal 0) |
| Stok baru | Sampul | Opsional, gambar maksimal 500 KB |
| Pemesanan | Nama | Minimal 3 karakter |
| Pemesanan | Telepon | 10 sampai 13 digit, diawali 0 |
| Pemesanan | Alamat | Minimal 10 karakter |
| Pemesanan | Ekspedisi, Pembayaran | Wajib dipilih |
| Tracking | Nomor DO | Wajib, dan harus ditemukan di data |

Pesan error muncul tepat di bawah kolom yang salah, kolom ditandai batas merah, dan fokus langsung pindah ke kolom pertama yang bermasalah. Setelah itu muncul alert modal sebagai pemberitahuan umum.

## 10. Aturan Bisnis
- Jumlah pesanan tidak boleh melebihi stok, dan stok berkurang otomatis setelah pesanan dibuat.
- Ongkir adalah biaya ekspedisi, dikali 2 untuk paket Express.
- Total bayar = subtotal buku + ongkir.
- Nomor DO dibuat dari tahun ditambah 4 digit acak (8 digit, sama formatnya dengan data dosen). Pesanan baru langsung bisa dilacak.
- Status pengiriman memakai lima tahap: Diproses, Dikemas, Dikirim, Dalam Perjalanan, Diterima. Pengiriman dianggap **selesai** bila riwayat terakhirnya diawali kata "Selesai".

## 11. Masalah Umum dan Solusinya

| Masalah | Penyebab dan solusi |
|---|---|
| Gambar sampul tidak tampil, Console menunjukkan 404 | Nama atau ekstensi file di `img/` tidak sama dengan `cover` di `data.js`. Samakan nama file, jangan ubah `data.js`. |
| Role masih salah setelah kode diubah | Sesi lama masih tersimpan. Klik **Keluar**, login ulang, lalu **Ctrl+F5**. |
| Data aneh atau halaman error setelah banyak percobaan | Data lama di `localStorage`. Jalankan `localStorage.clear()` di Console, lalu refresh. |
| Halaman langsung kembali ke login | Belum ada sesi. Login dulu lewat `index.html`. |
| Tabel stok kosong dan Console menampilkan error | Periksa urutan tag script di HTML: `data.js` harus dimuat **sebelum** `script.js`. |

## 12. Keterbatasan dan Pengembangan
**Keterbatasan**
- Hak akses hanya dibatasi di tampilan. Aplikasi sungguhan harus memeriksa role di server.
- Password disimpan apa adanya karena ini simulasi. Aplikasi sungguhan wajib menyimpan hash.
- `localStorage` hanya berlaku di satu browser dan satu perangkat, dengan kapasitas terbatas (itulah alasan batas ukuran sampul 500 KB).
- Fitur Lupa Password hanya simulasi dan tidak mengirim email.

**Ide pengembangan**
- Menghubungkan ke REST API atau database lewat `fetch`.
- Menyimpan password sebagai hash dan memakai token sesi dari server.
- Menambah fitur ubah data buku, ekspor laporan ke CSV, dan mode gelap.