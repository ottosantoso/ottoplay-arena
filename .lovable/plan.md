# Layout responsif arena.html

## Yang akan diubah
- Menyesuaikan viewport untuk area aman iPhone, tinggi layar dinamis, dan mencegah scroll horizontal.
- Membuat tampilan arena mobile-first: satu kolom di bawah 768px, lalu panel Pengaturan sekitar 450px dan panel pertandingan fleksibel di desktop.
- Membuat header dapat turun baris dengan logo, ikon olahraga, chip, dan status tetap jelas di layar kecil.
- Menata kartu Mode rotasi dan Format permainan memakai grid adaptif minimal 140px, memastikan judul tidak keluar dan deskripsi minimal 13px.
- Memastikan input/select minimal 16px, pilihan Jenis Kelamin cukup lebar, serta seluruh tombol minimal 44px dan nyaman disentuh.
- Menyembunyikan kalimat petunjuk Mode rotasi melalui CSS tanpa menghapus elemennya.
- Mengganti teks panel kanan dan judul sinkron cloud sesuai copy yang diberikan.

## Batasan
- Hanya mengubah `public/arena.html`.
- Tidak mengubah JavaScript, logika, route, fungsi, ID, class, name, atau menghapus elemen DOM.

## Verifikasi
- Memeriksa tampilan dan scroll horizontal pada lebar 320px, 390px, 767px, 768px, desktop, dan 1920px.
- Memastikan kontrol tetap dapat digunakan dan tidak ada error baru pada halaman arena.
