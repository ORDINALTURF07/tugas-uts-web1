/* ==========================================================
   PustakaKita - script.js
   Daftar isi:
   1. Utilitas            5. Halaman Login
   2. Modal & alert       6. Halaman Dashboard
   3. Validasi form       7. Halaman Stok / Katalog
   4. Data, adapter, sesi 8. Halaman Checkout
   9. Halaman Tracking
   ========================================================== */

/* ---------- 1. Utilitas ---------- */
const $ = (selector, root = document) => root.querySelector(selector);

const rupiah = angka => "Rp" + Number(angka).toLocaleString("id-ID");

const simpan = (kunci, nilai) => localStorage.setItem(kunci, JSON.stringify(nilai));

const ambil = (kunci, bawaan) => {
  try {
    return JSON.parse(localStorage.getItem(kunci)) ?? bawaan;
  } catch {
    return bawaan;
  }
};

const tgl = iso => new Date(iso).toLocaleDateString("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

const hariIni = () => new Date().toISOString().slice(0, 10);

// Sembunyikan elemen (tidak dihapus dari DOM, supaya script lain tidak error)
const sembunyikan = selector => {
  const elemen = $(selector);
  if (elemen) elemen.style.display = "none";
};

// Pembuat elemen DOM: el("div", { className: "x" }, anak1, anak2)
function el(tag, props = {}, ...anak) {
  const elemen = Object.assign(document.createElement(tag), props);
  anak.forEach(a => elemen.append(a));
  return elemen;
}

function toast(pesan) {
  const t = el("div", { className: "toast", role: "status", textContent: pesan });
  document.body.append(t);
  setTimeout(() => t.remove(), 2500);
}

/* ---------- 2. Modal & alert ---------- */
function bukaModal(judul, isi, { lebar = false, error = false, split = false } = {}) {
  const overlay = el("div", { className: "overlay" });
  const modal = el("div", {
    className: "modal" + (lebar ? " lebar" : "") + (error ? " error" : "") + (split ? " split" : "")
  });
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");

  const tombolTutup = el("button", { className: "tutup", type: "button", textContent: "×" });
  tombolTutup.setAttribute("aria-label", "Tutup");

  if (split) {
    // Tampilan dua kolom seperti halaman Masuk: rak buku di kiri, form di kanan
    const kiri = el("section", {
      className: "rak",
      innerHTML: `
        <div class="punggung" aria-hidden="true">
          <span style="height:70%;background:#FF8A3D"></span><span style="height:92%;background:#1E2A78"></span>
          <span style="height:55%;background:#F4F6FB"></span><span style="height:80%;background:#C8283D"></span>
          <span style="height:100%;background:#1E2A78"></span><span style="height:62%;background:#FF8A3D"></span>
        </div>
        <h2>PustakaKita</h2>
        <p>Buat akun baru untuk mulai memesan buku, cek stok, dan lacak kiriman.</p>`
    });
    kiri.setAttribute("aria-label", "Tentang PustakaKita");
    const kanan = el("section", { className: "panel" },
      el("img", { src: "assets/logo-buku.jpeg", alt: "", className: "logo-login" }),
      el("h1", { textContent: judul }),
      isi
    );
    modal.append(kiri, kanan, tombolTutup);
  } else {
    modal.append(
      el("header", {}, el("h2", { textContent: judul }), tombolTutup),
      isi
    );
  }
  overlay.append(modal);

  const tutup = () => overlay.remove();
  tombolTutup.onclick = tutup;
  overlay.onclick = e => {
    if (e.target === overlay) tutup();
  };
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") {
      tutup();
      document.removeEventListener("keydown", esc);
    }
  });

  document.body.append(overlay);
  const fokus = $("input,select,button.btn", modal);
  if (fokus) fokus.focus();
  return tutup;
}

function alertBox(pesan, error = false, judul) {
  const tombol = el("button", { className: "btn", type: "button", textContent: "OK" });
  const tutup = bukaModal(
    judul || (error ? "Terjadi kesalahan" : "Informasi"),
    el("div", {}, el("p", { textContent: pesan }), tombol),
    { error }
  );
  tombol.onclick = tutup;
  return tutup;
}

function formModal(judul, html, onSubmit, opsi = {}) {
  const form = el("form", { innerHTML: html });
  form.noValidate = true;
  const tutup = bukaModal(judul, form, opsi);
  form.querySelectorAll("[data-tutup]").forEach(b => { b.onclick = tutup; });
  form.onsubmit = e => {
    e.preventDefault();
    onSubmit(form, tutup);
  };
}

/* ---------- 3. Validasi form ----------
   aturan = { namaField: fungsi(nilai) -> pesan error atau "" } */
function cek(form, aturan) {
  let valid = true;
  for (const [nama, fn] of Object.entries(aturan)) {
    const input = form.elements[nama];
    const pesan = fn(input.value.trim());
    const tempatPesan = input.parentElement.querySelector(".err");
    if (tempatPesan) tempatPesan.textContent = pesan;
    input.classList.toggle("salah", !!pesan);
    if (pesan && valid) {
      valid = false;
      input.focus();
    }
  }
  return valid;
}

const wajib = label => v => (v ? "" : `${label} wajib diisi.`);

const emailOk = v => {
  if (!v) return "Email wajib diisi.";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Format email tidak valid.";
};

const angkaOk = (label, min = 0) => v =>
  v === "" || isNaN(v) || Number(v) < min
    ? `${label} harus berupa angka minimal ${min}.`
    : "";

/* ---------- 4. Data, adapter, dan sesi ----------
   data.js (dosen) tidak diubah. Adapter di bawah menerjemahkan
   kodeBarang/namaBarang/dst. ke format yang dipakai script ini. */
const angkaDariRupiah = h =>
  typeof h === "number" ? h : Number(String(h).replace(/\D/g, ""));

const katalogAwal = () => dataKatalogBuku.map(b => ({
  kode: b.kodeBarang,
  judul: b.namaBarang,
  edisi: b.edisi,
  kategori: b.jenisBarang,
  harga: angkaDariRupiah(b.harga),
  stok: b.stok,
  gambar: b.cover
}));

const muatKatalog = () => {
  const tersimpan = ambil("katalog", null);
  const valid = Array.isArray(tersimpan) && tersimpan.length && tersimpan.every(b => b.kode);
  return valid ? tersimpan : katalogAwal();
};

// Data tambahan yang tidak ada di data.js dosen
const STATUS_PENGIRIMAN = ["Diproses", "Dikemas", "Dikirim", "Dalam Perjalanan", "Diterima"];

const dataEkspedisi = {
  "JNE": 15000,
  "J&T Express": 18000,
  "SiCepat": 12000,
  "Pos Indonesia": 10000
};

const dataRiwayat = [
  { tanggal: "2025-07-10", nomorDO: "20230001", item: "Mikrobiologi Dasar x1", total: 200000, status: "Selesai" },
  { tanggal: "2025-08-25", nomorDO: "20230012", item: "Pengantar Ilmu Komunikasi x1", total: 180000, status: "Dalam Perjalanan" },
  { tanggal: "2025-08-25", nomorDO: "20230013", item: "Manajemen Keuangan x1", total: 220000, status: "Dikirim" }
];

const semuaPengguna = () => [...dataPengguna, ...ambil("penggunaBaru", [])];

// Role selalu dibaca ulang dari data pengguna, jadi sesi lama pun tetap benar
const penggunaAktif = () => {
  const sesi = ambil("sesi", null);
  if (!sesi) return null;
  const akun = semuaPengguna().find(p => p.email === sesi.email);
  return { ...sesi, role: akun?.role || sesi.role || "User" };
};

const semuaPesanan = () => ambil("pesanan", []);
const adalahAdmin = () => penggunaAktif()?.role === "Admin";

// Proteksi halaman: selain login, wajib sudah masuk
const halaman = document.body.dataset.page;
if (halaman !== "login" && !penggunaAktif()) {
  location.replace("index.html");
}

// Navbar: badge role + tombol keluar
const btnKeluar = $("#btnKeluar");
if (btnKeluar && penggunaAktif()) {
  btnKeluar.before(el("span", { className: "badge-role", textContent: penggunaAktif().role }));
  btnKeluar.onclick = () => {
    localStorage.removeItem("sesi");
    location.href = "index.html";
  };
}

/* ---------- 5. Halaman Login ---------- */
function initLogin() {
  const form = $("#formLogin");

  form.onsubmit = e => {
    e.preventDefault();
    if (!cek(form, { email: emailOk, password: wajib("Password") })) return;

    const emailInput = form.email.value.trim().toLowerCase();
    const user = semuaPengguna().find(p =>
      p.email.toLowerCase() === emailInput && p.password === form.password.value
    );

    if (!user) {
      return alertBox("Email/password yang anda masukkan salah", true, "Login gagal");
    }
    simpan("sesi", { nama: user.nama, email: user.email, role: user.role });
    location.href = "dashboard.html";
  };

  $("#btnLupa").onclick = () => formModal("Lupa Password", `
    <p>Masukkan email terdaftar. Kami akan mengirim tautan untuk mengatur ulang password.</p>
    <div class="field">
      <label for="fEmail">Email</label>
      <input id="fEmail" name="email" type="email" autocomplete="email">
      <span class="err"></span>
    </div>
    <button class="btn" type="submit">Kirim tautan</button>
  `, (f, tutup) => {
    if (!cek(f, { email: emailOk })) return;
    const email = f.email.value.trim();
    const terdaftar = semuaPengguna().some(p => p.email.toLowerCase() === email.toLowerCase());
    tutup();
    if (terdaftar) {
      alertBox("Tautan reset password telah dikirim ke " + email + ".");
    } else {
      alertBox("Email tidak terdaftar. Periksa kembali atau daftar akun baru.", true);
    }
  });

  $("#btnDaftar").onclick = () => formModal("Daftar", `
    <div class="field"><label for="dNama">Nama lengkap</label><input id="dNama" name="nama" autocomplete="name"><span class="err" aria-live="polite"></span></div>
    <div class="field"><label for="dEmail">Email</label><input id="dEmail" name="email" type="email" autocomplete="email"><span class="err" aria-live="polite"></span></div>
    <div class="grid2">
      <div class="field"><label for="dPass">Password</label><input id="dPass" name="password" type="password" autocomplete="new-password" placeholder="Min. 6 karakter"><span class="err" aria-live="polite"></span></div>
      <div class="field"><label for="dPass2">Ulangi password</label><input id="dPass2" name="ulang" type="password" autocomplete="new-password"><span class="err" aria-live="polite"></span></div>
    </div>
    <button class="btn blok" type="submit">Daftar</button>
    <div class="aksi">
      <span>Sudah punya akun?</span>
      <button class="link" type="button" data-tutup>Masuk</button>
    </div>
  `, (f, tutup) => {
    const valid = cek(f, {
      nama: v => (v.length < 3 ? "Nama minimal 3 karakter." : ""),
      email: v => emailOk(v) || (
        semuaPengguna().some(p => p.email.toLowerCase() === v.toLowerCase())
          ? "Email sudah terdaftar."
          : ""
      ),
      password: v => (v.length < 6 ? "Password minimal 6 karakter." : ""),
      ulang: v => (v !== f.password.value ? "Password tidak sama." : "")
    });
    if (!valid) return;

    const baru = ambil("penggunaBaru", []);
    baru.push({
      nama: f.nama.value.trim(),
      email: f.email.value.trim(),
      password: f.password.value,
      role: "User"
    });
    simpan("penggunaBaru", baru);
    tutup();
    alertBox("Akun berhasil dibuat. Silakan login dengan email tersebut.", false, "Pendaftaran berhasil");
  }, { split: true });
}

/* ---------- 6. Halaman Dashboard ---------- */
function initDashboard() {
  const jam = new Date().getHours();
  const sapa = jam < 11 ? "Selamat pagi"
    : jam < 15 ? "Selamat siang"
    : jam < 18 ? "Selamat sore"
    : "Selamat malam";

  $("#greeting").textContent = `${sapa}, ${penggunaAktif().nama}!`;
  $("#tanggal").textContent = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  // Hanya admin yang melihat menu Laporan Pemesanan
  if (!adalahAdmin()) sembunyikan("#menuLaporan");

  $("#btnHistory").onclick = () => {
    const dariPesanan = semuaPesanan().map(p => ({
      tanggal: p.tanggalKirim,
      nomorDO: p.nomorDO,
      item: p.items.map(i => `${i.judul} x${i.qty}`).join(", "),
      total: p.total,
      status: "Diproses"
    }));
    const riwayat = [...dataRiwayat, ...dariPesanan]
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

    const tbody = el("tbody");
    riwayat.forEach(r => tbody.append(el("tr", {},
      el("td", { textContent: tgl(r.tanggal) }),
      el("td", { textContent: r.nomorDO }),
      el("td", { textContent: r.item }),
      el("td", { className: "angka", textContent: rupiah(r.total) }),
      el("td", {}, el("span", { className: "badge", textContent: r.status }))
    )));

    const tabel = el("table", {},
      el("thead", {
        innerHTML: "<tr><th>Tanggal</th><th>No. DO</th><th>Item</th><th class='angka'>Total</th><th>Status</th></tr>"
      }),
      tbody
    );
    bukaModal("History Transaksi", el("div", { className: "tabel-wrap" }, tabel), { lebar: true });
  };
}

/* ---------- 7. Halaman Stok / Katalog ---------- */
function initStok() {
  // Hanya admin yang boleh menambah stok
  if (!adalahAdmin()) sembunyikan("#seksiTambah");

  let katalog = muatKatalog();
  const tbody = $("#tbodyStok");

  function badgeStok(stok) {
    const kelas = stok === 0 ? " habis" : stok <= 5 ? " tipis" : "";
    const teks = stok === 0 ? "Habis" : stok <= 5 ? `Menipis (${stok})` : stok;
    return el("span", { className: "badge" + kelas, textContent: teks });
  }

  function buatBaris(buku) {
    // Sampul: coba ekstensi lain (.jpg <-> .jpeg), kalau tetap gagal tampil huruf pertama judul
    const sampul = el("img", { className: "cover", src: buku.gambar || "", alt: "Sampul " + buku.judul });
    sampul.onerror = () => {
      if (!sampul.dataset.coba && !sampul.src.startsWith("data:")) {
        sampul.dataset.coba = "1";
        sampul.src = /\.jpg$/i.test(sampul.src)
          ? sampul.src.replace(/\.jpg$/i, ".jpeg")
          : sampul.src.replace(/\.jpeg$/i, ".jpg");
        return;
      }
      sampul.replaceWith(el("div", { className: "cover", textContent: buku.judul[0].toUpperCase() }));
    };

    const btnPesan = el("button", {
      className: "btn kecil kuning",
      type: "button",
      textContent: "Pesan",
      disabled: buku.stok === 0
    });
    btnPesan.onclick = () => {
      const keranjang = ambil("keranjang", []);
      const ada = keranjang.find(i => i.kode === buku.kode);
      if ((ada ? ada.qty : 0) + 1 > buku.stok) {
        return alertBox("Jumlah pesanan melebihi stok tersedia.", true);
      }
      if (ada) ada.qty++;
      else keranjang.push({ kode: buku.kode, qty: 1 });
      simpan("keranjang", keranjang);
      toast(`"${buku.judul}" ditambahkan ke keranjang`);
    };

    const btnHapus = el("button", { className: "btn kecil bahaya", type: "button", textContent: "Hapus" });
    btnHapus.onclick = () => {
      if (!confirm(`Hapus "${buku.judul}" dari katalog?`)) return;
      katalog = katalog.filter(b => b.kode !== buku.kode);
      simpan("katalog", katalog);
      render();
    };

    return el("tr", {},
      el("td", {}, sampul),
      el("td", { textContent: buku.kode }),
      el("td", {},
        el("strong", { textContent: buku.judul }),
        el("br"),
        el("small", { textContent: "Edisi " + buku.edisi })
      ),
      el("td", { textContent: buku.kategori }),
      el("td", { className: "angka", textContent: rupiah(buku.harga) }),
      el("td", { className: "angka" }, badgeStok(buku.stok)),
      el("td", {}, btnPesan, ...(adalahAdmin() ? [" ", btnHapus] : []))
    );
  }

  function render() {
    const kataKunci = $("#cari").value.trim().toLowerCase();
    tbody.replaceChildren();

    const hasil = katalog.filter(b =>
      (b.judul + b.kategori + b.kode).toLowerCase().includes(kataKunci)
    );
    hasil.forEach(b => tbody.append(buatBaris(b)));

    if (!hasil.length) {
      tbody.append(el("tr", {}, el("td", {
        colSpan: 7,
        textContent: "Tidak ada buku yang cocok dengan pencarian."
      })));
    }

    const totalStok = katalog.reduce((jumlah, b) => jumlah + b.stok, 0);
    $("#ringkasan").textContent = `${katalog.length} judul · ${totalStok} eksemplar tersedia`;
  }

  $("#cari").oninput = render;

  // Tambah baris stok baru (termasuk upload sampul)
  const form = $("#formStok");
  form.onsubmit = e => {
    e.preventDefault();

    const valid = cek(form, {
      kode: v => {
        if (!v) return "Kode wajib diisi.";
        return katalog.some(b => b.kode.toLowerCase() === v.toLowerCase()) ? "Kode sudah dipakai." : "";
      },
      judul: wajib("Judul"),
      edisi: angkaOk("Edisi", 1),
      kategori: wajib("Kategori"),
      harga: angkaOk("Harga", 1000),
      stok: angkaOk("Stok", 0)
    });
    if (!valid) {
      return alertBox("Periksa kembali isian form yang ditandai merah.", true, "Data belum lengkap");
    }

    const simpanBuku = gambar => {
      katalog.push({
        kode: form.kode.value.trim().toUpperCase(),
        judul: form.judul.value.trim(),
        edisi: form.edisi.value.trim(),
        kategori: form.kategori.value.trim(),
        harga: Number(form.harga.value),
        stok: Number(form.stok.value),
        gambar
      });
      simpan("katalog", katalog);
      render();
      form.reset();
      toast("Buku baru ditambahkan ke stok");
    };

    const file = form.gambar.files[0];
    if (!file) return simpanBuku("");
    if (file.size > 500 * 1024) {
      return alertBox("Ukuran gambar maksimal 500 KB.", true, "Gambar terlalu besar");
    }

    const pembaca = new FileReader();
    pembaca.onload = () => simpanBuku(pembaca.result);
    pembaca.readAsDataURL(file);
  };

  render();
}

/* ---------- 8. Halaman Checkout / Pemesanan ---------- */
function initCheckout() {
  // Hanya admin yang melihat Laporan Pemesanan
  if (!adalahAdmin()) sembunyikan("#laporan");

  const katalog = muatKatalog();
  const cariBuku = kode => katalog.find(b => b.kode === kode);
  let keranjang = ambil("keranjang", []).filter(i => cariBuku(i.kode));

  const pilihBuku = $("#pilihBuku");
  katalog.forEach(b => pilihBuku.append(el("option", {
    value: b.kode,
    textContent: `${b.judul} (${rupiah(b.harga)})`,
    disabled: b.stok === 0
  })));

  const pilihEkspedisi = $("#ekspedisi");
  Object.entries(dataEkspedisi).forEach(([nama, biaya]) => {
    pilihEkspedisi.append(el("option", { value: nama, textContent: `${nama} (${rupiah(biaya)})` }));
  });

  const ongkir = () => {
    const dasar = dataEkspedisi[pilihEkspedisi.value] || 0;
    return dasar * ($("#jenisPaket").value === "Express" ? 2 : 1);
  };
  const subtotal = () => keranjang.reduce((jumlah, i) => jumlah + cariBuku(i.kode).harga * i.qty, 0);

  function renderKeranjang() {
    simpan("keranjang", keranjang);
    const tbody = $("#tbodyKeranjang");
    tbody.replaceChildren();

    keranjang.forEach(item => {
      const buku = cariBuku(item.kode);

      const inputQty = el("input", { type: "number", min: 1, max: buku.stok, value: item.qty });
      inputQty.setAttribute("aria-label", "Jumlah " + buku.judul);
      inputQty.style.width = "80px";
      inputQty.onchange = () => {
        const n = parseInt(inputQty.value, 10);
        if (!n || n < 1) {
          alertBox("Jumlah minimal 1.", true);
          inputQty.value = item.qty;
          return;
        }
        if (n > buku.stok) {
          alertBox(`Stok "${buku.judul}" hanya ${buku.stok}.`, true);
          inputQty.value = item.qty;
          return;
        }
        item.qty = n;
        renderKeranjang();
      };

      const btnHapus = el("button", { className: "btn kecil bahaya", type: "button", textContent: "Hapus" });
      btnHapus.onclick = () => {
        keranjang = keranjang.filter(x => x !== item);
        renderKeranjang();
      };

      tbody.append(el("tr", {},
        el("td", { textContent: buku.judul }),
        el("td", { className: "angka", textContent: rupiah(buku.harga) }),
        el("td", {}, inputQty),
        el("td", { className: "angka", textContent: rupiah(buku.harga * item.qty) }),
        el("td", {}, btnHapus)
      ));
    });

    if (!keranjang.length) {
      tbody.append(el("tr", {}, el("td", {
        colSpan: 5,
        textContent: "Keranjang masih kosong. Pilih buku di atas atau dari halaman katalog."
      })));
    }

    const biayaKirim = keranjang.length ? ongkir() : 0;
    $("#rSub").textContent = rupiah(subtotal());
    $("#rOngkir").textContent = rupiah(biayaKirim);
    $("#rTotal").textContent = rupiah(subtotal() + biayaKirim);
  }

  $("#btnTambah").onclick = () => {
    const buku = cariBuku(pilihBuku.value);
    if (!buku) return alertBox("Pilih buku terlebih dahulu.", true);

    const ada = keranjang.find(i => i.kode === buku.kode);
    if ((ada ? ada.qty : 0) + 1 > buku.stok) {
      return alertBox(`Stok "${buku.judul}" tidak mencukupi.`, true);
    }
    if (ada) ada.qty++;
    else keranjang.push({ kode: buku.kode, qty: 1 });
    renderKeranjang();
  };

  pilihEkspedisi.onchange = renderKeranjang;
  $("#jenisPaket").onchange = renderKeranjang;

  const form = $("#formPesan");
  form.onsubmit = e => {
    e.preventDefault();
    if (!keranjang.length) {
      return alertBox("Keranjang masih kosong. Tambahkan minimal satu buku.", true, "Belum ada pesanan");
    }

    const valid = cek(form, {
      nama: v => (v.length < 3 ? "Nama minimal 3 karakter." : ""),
      email: emailOk,
      telepon: v => (/^0\d{9,12}$/.test(v) ? "" : "Nomor telepon 10-13 digit dan diawali 0."),
      alamat: v => (v.length < 10 ? "Alamat minimal 10 karakter." : ""),
      ekspedisi: wajib("Ekspedisi"),
      pembayaran: wajib("Metode pembayaran")
    });
    if (!valid) {
      return alertBox("Data pemesan belum lengkap atau tidak valid. Periksa kolom yang ditandai merah.", true, "Form belum valid");
    }

    // Nomor DO 8 digit, sama formatnya dengan data dosen (contoh 20230012)
    const nomorDO = String(new Date().getFullYear()) + String(Math.floor(Math.random() * 9000) + 1000);

    const pesanan = {
      nomorDO,
      nama: form.nama.value.trim(),
      email: form.email.value.trim(),
      alamat: form.alamat.value.trim(),
      pembayaran: form.pembayaran.value,
      ekspedisi: pilihEkspedisi.value,
      paket: $("#jenisPaket").value,
      tanggalKirim: hariIni(),
      status: "Diproses",
      total: subtotal() + ongkir(),
      perjalanan: [{
        waktu: new Date().toLocaleString("id-ID"),
        keterangan: "Pesanan diterima dan sedang diproses"
      }],
      items: keranjang.map(i => ({
        kode: i.kode,
        judul: cariBuku(i.kode).judul,
        qty: i.qty
      }))
    };

    // Kurangi stok lalu simpan
    keranjang.forEach(i => {
      cariBuku(i.kode).stok -= i.qty;
    });
    simpan("katalog", katalog);
    simpan("pesanan", [...semuaPesanan(), pesanan]);

    keranjang = [];
    form.reset();
    renderKeranjang();
    renderLaporan();

    const linkTracking = el("a", {
      className: "btn kuning",
      href: "tracking.html",
      textContent: "Lacak pesanan",
      style: "display:inline-block;text-decoration:none"
    });
    bukaModal("Pesanan berhasil dibuat", el("div", {},
      el("p", {}, "Nomor Delivery Order Anda: ", el("strong", { textContent: nomorDO })),
      el("p", { textContent: `Total pembayaran ${rupiah(pesanan.total)}. Simpan nomor ini untuk melacak pengiriman.` }),
      linkTracking
    ));
  };

  function renderLaporan() {
    const tbody = $("#tbodyLaporan");
    tbody.replaceChildren();
    const pesanan = semuaPesanan();

    pesanan.forEach(p => tbody.append(el("tr", {},
      el("td", { textContent: p.nomorDO }),
      el("td", { textContent: tgl(p.tanggalKirim) }),
      el("td", { textContent: p.nama }),
      el("td", { textContent: p.items.map(i => `${i.judul} x${i.qty}`).join(", ") }),
      el("td", { className: "angka", textContent: rupiah(p.total) })
    )));

    if (!pesanan.length) {
      tbody.append(el("tr", {}, el("td", { colSpan: 5, textContent: "Belum ada pesanan pada sesi ini." })));
    }
    $("#lapTotal").textContent = rupiah(pesanan.reduce((jumlah, p) => jumlah + p.total, 0));
  }

  renderKeranjang();
  renderLaporan();
}

/* ---------- 9. Halaman Tracking ---------- */
function initTracking() {
  const form = $("#formCari");
  const hasil = $("#hasil");

  form.onsubmit = e => {
    e.preventDefault();
    hasil.hidden = true;
    if (!cek(form, { nomorDO: wajib("Nomor Delivery Order") })) return;

    const nomor = form.nomorDO.value.trim();
    // Cari di data dosen (objek dataTracking), lalu di pesanan buatan sendiri
    const data = dataTracking[nomor] || semuaPesanan().find(p => p.nomorDO === nomor);
    if (!data) {
      return alertBox(`Nomor DO "${nomor}" tidak ditemukan. Coba 20230012 atau 20230013.`, true, "Data tidak ditemukan");
    }

    // Tentukan posisi status pada progress bar
    const riwayat = data.perjalanan || [];
    const terakhir = riwayat[riwayat.length - 1];
    let posisi = STATUS_PENGIRIMAN.findIndex(s => s.toLowerCase() === String(data.status).toLowerCase());
    if (terakhir && /^selesai/i.test(terakhir.keterangan)) posisi = STATUS_PENGIRIMAN.length - 1;
    if (posisi < 0) posisi = 0;
    const persen = Math.round((posisi + 1) / STATUS_PENGIRIMAN.length * 100);

    $("#tNama").textContent = data.nama;
    $("#tStatus").textContent = STATUS_PENGIRIMAN[posisi];
    $("#tEks").textContent = data.ekspedisi;
    $("#tTgl").textContent = tgl(data.tanggalKirim);
    $("#tPaket").textContent = data.paket;
    $("#tTotal").textContent = typeof data.total === "number" ? rupiah(data.total) : data.total;

    const bar = $("#progres");
    bar.classList.toggle("selesai", posisi === STATUS_PENGIRIMAN.length - 1);
    bar.firstElementChild.style.width = persen + "%";
    bar.setAttribute("aria-valuenow", persen);

    const daftarLangkah = $("#langkah");
    daftarLangkah.replaceChildren();
    STATUS_PENGIRIMAN.forEach((status, i) => {
      daftarLangkah.append(el("li", {
        textContent: status,
        className: i < posisi ? "selesai" : i === posisi ? "aktif" : ""
      }));
    });

    // Riwayat perjalanan, terbaru di atas
    const daftarJalan = $("#perjalanan");
    daftarJalan.replaceChildren();
    [...riwayat].reverse().forEach(p => {
      daftarJalan.append(el("li", {}, el("small", { textContent: p.waktu }), p.keterangan));
    });

    hasil.hidden = false;
  };
}

/* ---------- Jalankan fungsi sesuai halaman ---------- */
const inisialisasi = {
  login: initLogin,
  dashboard: initDashboard,
  stok: initStok,
  checkout: initCheckout,
  tracking: initTracking
};
inisialisasi[halaman]?.();