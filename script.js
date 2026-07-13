// ================= CONFIGURASI GITHUB API =================
const CONFIG_GITHUB = {
    username: "kernelbuild-KutuMoba",       // Ganti dengan username GitHub Anda
    repo: "pinjaman",           // Ganti dengan nama repositori web Anda
    path: "data.json",                       // Tetap data.json jika file ada di folder utama
    token: "PASTE_TOKEN_GHP_ANDA_DISINI"    // Tempelkan kode token ghp_xxx dari Langkah 1
};
// ==========================================================

let dataOrganisasi = [];
let fileSha = ""; // Diperlukan GitHub untuk melacak versi file saat update

// Fungsi memuat data langsung dari data.json di GitHub (Bukan dari LocalStorage lagi)
async function muatDataAwal() {
    const url = `https://github.com{CONFIG_GITHUB.username}/${CONFIG_GITHUB.repo}/contents/${CONFIG_GITHUB.path}`;
    
    try {
        const respon = await fetch(url, {
            headers: { "Authorization": `token ${CONFIG_GITHUB.token}` }
        });
        
        if (!respon.ok) throw new Error('Gagal mengambil data dari GitHub API');
        
        const dataJson = await respon.json();
        fileSha = dataJson.sha; // Simpan tanda pengenal versi file saat ini
        
        // Dekode data base64 dari GitHub menjadi teks JSON asli
        const teksKonten = atob(dataJson.content); 
        dataOrganisasi = JSON.parse(teksKonten);
        
        muatDataTabel();
    } catch (error) {
        console.error("Error sinkronisasi GitHub:", error);
        alert("Gagal terhubung ke database GitHub. Periksa kembali konfigurasi token/username Anda.");
    }
}

// Fungsi Otomatis Commit & Push Perubahan ke data.json di GitHub
async function simpanKeGitHub() {
    const url = `https://github.com{CONFIG_GITHUB.username}/${CONFIG_GITHUB.repo}/contents/${CONFIG_GITHUB.path}`;
    
    // Siapkan teks konten JSON baru yang rapi
    const kontenBaruTeks = JSON.stringify(dataOrganisasi, null, 2);
    // Ubah teks menjadi format Base64 yang diminta oleh GitHub API
    const kontenBase64 = btoa(unescape(encodeURIComponent(kontenBaruTeks)));

    const bodyData = {
        message: "Update data.json otomatis via Halaman Admin",
        content: kontenBase64,
        sha: fileSha // Kirimkan SHA versi lama agar GitHub mengizinkan overwrite
    };

    try {
        const respon = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `token ${CONFIG_GITHUB.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bodyData)
        });

        if (!respon.ok) throw new Error('Gagal menyimpan perubahan ke GitHub');
        
        const hasil = await respon.json();
        fileSha = hasil.content.sha; // Perbarui SHA ke versi terbaru setelah sukses commit
        
        muatDataTabel();
        console.log("Database data.json berhasil diperbarui secara permanen di GitHub!");
    } catch (error) {
        console.error("Gagal push ke GitHub:", error);
        alert("Gagal menyimpan perubahan ke server GitHub!");
    }
}

function formatRupiah(angka) {
    return 'Rp ' + Math.round(angka).toLocaleString('id-ID');
}

// Navigasi Tab (Khusus Halaman Publik index.html)
function gantiTab(tab) {
    ['simulasi', 'monitoring'].forEach(t => {
        const konten = document.getElementById(`konten-${t}`);
        const btn = document.getElementById(`tab-${t}`);
        if(konten && btn) {
            konten.classList.add('hidden');
            btn.className = "tab-btn";
        }
    });
    const kontenAktif = document.getElementById(`konten-${tab}`);
    const btnAktif = document.getElementById(`tab-${tab}`);
    if(kontenAktif && btnAktif) {
        kontenAktif.classList.remove('hidden');
        btnAktif.className = "tab-btn active";
    }
}

// Simulasi Hitung Angsuran (Pola 11% / Bulan)
function hitungSimulasi() {
    const pinjaman = parseFloat(document.getElementById('simulasi-pinjaman').value);
    if (!pinjaman || pinjaman < 500000) return alert("Minimal Rp 500.000");

    const angsuran = pinjaman * 0.11;
    document.getElementById('hasil-simulasi').classList.remove('hidden');
    document.getElementById('tabel-simulasi-wrapper').classList.remove('hidden');
    document.getElementById('txt-angsuran').innerText = formatRupiah(angsuran);
    document.getElementById('txt-total').innerText = formatRupiah(angsuran * 12);

    const tbody = document.getElementById('body-simulasi');
    tbody.innerHTML = '';
    for (let i = 1; i <= 12; i++) {
        tbody.insertAdjacentHTML('beforeend', `<tr><td class="text-center" style="padding:10px;">${i}</td><td style="padding:10px; font-weight:600;">${formatRupiah(angsuran)}</td></tr>`);
    }
}

// Tambah Anggota Baru (Aksi Admin -> Langsung Sinkron GitHub)
function tambahAnggota() {
    const nama = document.getElementById('adm-nama').value;
    const pinjaman = parseFloat(document.getElementById('adm-pinjaman').value);
    if (!nama || pinjaman < 500000) return alert("Isi nama & pinjaman minimal Rp 500.000");

    dataOrganisasi.push({ id: Date.now(), nama, pinjaman, bulanKe: 0, status: "Lancar" });
    document.getElementById('adm-nama').value = '';
    document.getElementById('adm-pinjaman').value = '';
    
    simpanKeGitHub(); // Pemicu otomatis push data
    alert("Anggota berhasil didaftarkan dan disimpan ke GitHub!");
}

// Ubah Cicilan / Status (Aksi Admin -> Langsung Sinkron GitHub)
function updateData(id, bulan, status) {
    const index = dataOrganisasi.findIndex(item => item.id === id);
    if (index !== -1) {
        let bln = parseInt(bulan);
        let stat = status;
        if (bln >= 12) { bln = 12; stat = "Lunas"; }
        dataOrganisasi[index].bulanKe = bln;
        dataOrganisasi[index].status = stat;
        
        simpanKeGitHub(); // Pemicu otomatis push data
    }
}

// Hapus Anggota (Aksi Admin -> Langsung Sinkron GitHub)
function hapusAnggota(id) {
    if (confirm("Hapus data pinjaman ini secara permanen dari server GitHub?")) {
        dataOrganisasi = dataOrganisasi.filter(item => item.id !== id);
        simpanKeGitHub(); // Pemicu otomatis push data
    }
}

// Mengisi data ke tabel masing-masing halaman
function muatDataTabel() {
    const bMonitoring = document.getElementById('body-monitoring');
    const bAdmin = document.getElementById('body-admin');

    if (bMonitoring) {
        bMonitoring.innerHTML = '';
        dataOrganisasi.forEach(item => {
            const angsuran = item.pinjaman * 0.11;
            const sisa = item.status === 'Lunas' ? 0 : (angsuran * (12 - item.bulanKe));
            bMonitoring.insertAdjacentHTML('beforeend', `
                <tr>
                    <td style="padding:14px 16px; font-weight:600;">${item.nama}</td>
                    <td style="padding:14px 16px;">${formatRupiah(item.pinjaman)}</td>
                    <td style="padding:14px 16px;">${formatRupiah(angsuran)}</td>
                    <td class="text-center" style="padding:14px 16px;">${item.bulanKe} / 12</td>
                    <td style="padding:14px 16px; font-weight:700;">${formatRupiah(sisa)}</td>
                    <td class="text-center" style="padding:14px 16px;"><span class="badge ${item.status === 'Lunas' ? 'badge-lunas' : item.status === 'Telat' ? 'badge-telat' : 'badge-lancar'}">${item.status}</span></td>
                </tr>
            `);
        });
    }

    if (bAdmin) {
        bAdmin.innerHTML = '';
        dataOrganisasi.forEach(item => {
            bAdmin.insertAdjacentHTML('beforeend', `
                <tr>
                    <td style="padding:14px 16px; font-weight:600;">${item.nama}</td>
                    <td style="padding:14px 16px; color:#94a3b8;">${formatRupiah(item.pinjaman)}</td>
                    <td class="text-center" style="padding:14px 16px;">
                        <input type="number" min="0" max="12" value="${item.bulanKe}" onchange="updateData(${item.id}, this.value, '${item.status}')" class="num-input"> / 12
                    </td>
                    <td style="padding:14px 16px;">
                        <select onchange="updateData(${item.id}, ${item.bulanKe}, this.value)">
                            <option value="Lancar" ${item.status === 'Lancar' ? 'selected' : ''}>Lancar</option>
                            <option value="Telat" ${item.status === 'Telat' ? 'selected' : ''}>Telat</option>
                            <option value="Lunas" ${item.status === 'Lunas' ? 'selected' : ''}>Lunas</option>
                        </select>
                    </td>
                    <td class="text-center" style="padding:14px 16px;">
                        <button onclick="hapusAnggota(${item.id})" class="btn-del">Hapus</button>
                    </td>
                </tr>
            `);
        });
    }
}
