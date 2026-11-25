// Tema warna Cookspire: "dapur rumahan".
// Satu-satunya tempat warna didefinisikan. Jangan menulis kode hex langsung di layar.
//
// Konsep palet (komunitas masak rumahan, hangat dan akrab):
//   - Krem/tepung      -> latar halaman, terasa seperti kertas buku resep
//   - Terracotta/sambal -> warna utama (tombol, rating, aksi penting), seperti cobek & bata tanah liat
//   - Hijau pandan      -> warna pendukung (info waktu/level, tombol sekunder, keberhasilan)
//   - Cokelat kopi      -> teks utama, lebih lembut dari hitam pekat
//
// Semua pasangan teks/latar sudah dicek terhadap WCAG AA (rasio kontras >= 4.5:1 untuk teks):
//   textMuted     #7A6F68 di atas background  = 4.57
//   textSecondary #5E544E di atas background  = 6.89
//   text          #2B2523 di atas background  = 14.12
//   surface (putih) di atas primary #B8431F    = 5.44
//   surface (putih) di atas secondary #3F6B4E  = 6.13
export const colors = {
  // Latar
  background: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceAlt: '#EFE9E0',
  border: '#E6DFD5',

  // Warna utama (terracotta / sambal)
  primary: '#B8431F',
  primarySoft: '#FBEBE4',

  // Warna pendukung (hijau pandan)
  secondary: '#3F6B4E',
  secondarySoft: '#E6EFE9',

  // Teks
  text: '#2B2523',
  textSecondary: '#5E544E',
  textMuted: '#7A6F68',

  // Status
  danger: '#B3261E',
  dangerSoft: '#FBE9E7',

  overlay: 'rgba(43, 37, 35, 0.5)',
};

export default colors;
