// Inisialisasi variabel data organisasi
let dataOrganisasi = [];

// Fungsi untuk memuat data dari data.json (atau LocalStorage jika sudah ada pembaruan)
async function muatDataAwal() {
    const dataLokal = localStorage.getItem('dataPinjaman');
    
    if (dataLokal) {
        // Jika pengurus sudah pernah mengubah data di browser, gunakan data terbaru tersebut
        dataOrganisasi = JSON.parse(dataLokal);
        muatDataTabel();
    } else {
        // Jika baru pertama kali dibuka, ambil data dari file data.json
        try {
            const respon = await fetch('data.json');
            if (!respon.ok) throw new Error('Gagal mengambil file JSON');
            dataOrganisasi = await respon.parse ? await respon.parse() : await respon.json();
            
            // Simpan ke penyimpanan lokal browser agar bisa dimanipulasi
            localStorage.setItem('dataPinjaman', JSON.stringify(dataOrganisasi));
            muatDataTabel();
        } catch (error) {
            console.error("Error memuat JSON:", error);
            // Backup jika file JSON tidak sengaja terhapus/gagal dimuat
            dataOrganisasi = [{ id: 1, nama: "Sampel Sistem", pinjaman: 500000, bulanKe: 0, status: "Lancar" }];
            muatDataTabel();
        }
    }
}

function simpanKeStorage() {
    localStorage.setItem('dataPinjaman', JSON.stringify(dataOrganisasi));
    muatDataTabel();
}

function formatRupiah(angka) {
    return 'Rp ' + Math.round(angka).toLocaleString('id-ID');
}

// Logika Navigasi Tab Halaman
function gantiTab(tab) {
    ['simulasi', 'monitoring', 'admin'].forEach(t => {
        document.getElementById(`konten-${t}`).classList.add('hidden');
        document.getElementById(`tab-${t}`).className = "py-2.5 px-4 font-semibold text-sm border-b-2 border-transparent text-slate-500 cursor-pointer";
    });
    document.getElementById(`konten-${tab}`).classList.remove('hidden');
    document.getElementById(`tab-${tab}`).className = "py-2.5 px-4 font-semibold text-sm border-b-2 border-blue-600 text-blue-600 cursor-pointer" + (tab === 'admin' ? ' text-amber-600 border-amber-600' : '');
}

function bukaPanelAdmin() {
    const pin = prompt("Masukkan PIN Pengurus Organisasi:");
    if (pin === "1234") {
        gantiTab('admin');
    } else {
        alert("PIN Salah! Akses ditolak.");
    }
}

// Perhitungan Kalkulator Simulasi Mandiri
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
        tbody.insertAdjacentHTML('beforeend', `<tr><td class="p-3 text-center font-medium">${i}</td><td class="p-3 font-semibold">${formatRupiah(angsuran)}</td></tr>`);
    }
}

// Tambah Anggota Baru (Aksi Admin)
function tambahAnggota() {
    const nama = document.getElementById('adm-nama').value;
    const pinjaman = parseFloat(document.getElementById('adm-pinjaman').value);
    if (!nama || pinjaman < 500000) return alert("Data tidak valid! Isi nama dan pinjaman minimal 500 ribu.");

    dataOrganisasi.push({ id: Date.now(), nama, pinjaman, bulanKe: 0, status: "Lancar" });
    document.getElementById('adm-nama').value = '';
    document.getElementById('adm-pinjaman').value = '';
    simpanKeStorage();
    alert("Anggota baru berhasil didaftarkan!");
}

// Update Bulan & Status Cicilan (Aksi Admin)
function updateData(id, bulan, status) {
    const index = dataOrganisasi.findIndex(item => item.id === id);
    if (index !== -1) {
        let bln = parseInt(bulan);
        let stat = status;
        if (bln >= 12) { bln = 12; stat = "Lunas"; }
        dataOrganisasi[index].bulanKe = bln;
        dataOrganisasi[index].status = stat;
        simpanKeStorage();
    }
}

function hapusAnggota(id) {
    if (confirm("Hapus data pengajuan anggota ini?")) {
        dataOrganisasi = dataOrganisasi.filter(item => item.id !== id);
        simpanKeStorage();
    }
}

// Sinkronisasi Tampilan Tabel Publik & Admin
function muatDataTabel() {
    const bMonitoring = document.getElementById('body-monitoring');
    const bAdmin = document.getElementById('body-admin');
    if(!bMonitoring || !bAdmin) return;
    
    bMonitoring.innerHTML = ''; bAdmin.innerHTML = '';

    dataOrganisasi.forEach(item => {
        const angsuran = item.pinjaman * 0.11;
        const sisa = item.status === 'Lunas' ? 0 : (angsuran * (12 - item.bulanKe));

        // Render ke tabel monitoring Publik
        bMonitoring.insertAdjacentHTML('beforeend', `
            <tr>
                <td class="p-4 font-semibold text-slate-700">${item.nama}</td>
                <td class="p-4">${formatRupiah(item.pinjaman)}</td>
                <td class="p-4 font-medium">${formatRupiah(angsuran)}</td>
                <td class="p-4 text-center">${item.bulanKe} / 12</td>
                <td class="p-4 font-bold text-slate-700">${formatRupiah(sisa)}</td>
                <td class="p-4 text-center"><span class="px-2 py-1 text-xs font-bold rounded-full ${item.status === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : item.status === 'Telat' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}">${item.status}</span></td>
            </tr>
        `);

        // Render ke tabel kontrol Dashboard Pengurus
        bAdmin.insertAdjacentHTML('beforeend', `
            <tr>
                <td class="p-4 font-semibold">${item.nama}</td>
                <td class="p-4">${formatRupiah(item.pinjaman)}</td>
                <td class="p-4 text-center">
                    <input type="number" min="0" max="12" value="${item.bulanKe}" onchange="updateData(${item.id}, this.value, '${item.status}')" class="w-12 text-center border rounded-lg bg-slate-50"> / 12
                </td>
                <td class="p-4">
                    <select onchange="updateData(${item.id}, ${item.bulanKe}, this.value)" class="border rounded-lg p-1 text-xs">
                        <option value="Lancar" ${item.status === 'Lancar' ? 'selected' : ''}>Lancar</option>
                        <option value="Telat" ${item.status === 'Telat' ? 'selected' : ''}>Telat</option>
                        <option value="Lunas" ${item.status === 'Lunas' ? 'selected' : ''}>Lunas</option>
                    </select>
                </td>
                <td class="p-4 text-center">
                    <button onclick="hapusAnggota(${item.id})" class="text-rose-500 hover:text-rose-700"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `);
    });
}

// Jalankan pembacaan file JSON begitu web dimuat
window.onload = muatDataAwal;
