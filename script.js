let dataOrganisasi = [];

async function muatDataAwal() {
    const dataLokal = localStorage.getItem('dataPinjaman');
    
    if (dataLokal) {
        dataOrganisasi = JSON.parse(dataLokal);
        muatDataTabel();
    } else {
        try {
            const respon = await fetch('data.json');
            if (!respon.ok) throw new Error('Gagal memuat JSON');
            dataOrganisasi = await respon.json();
            localStorage.setItem('dataPinjaman', JSON.stringify(dataOrganisasi));
            muatDataTabel();
        } catch (error) {
            console.error("Error file JSON:", error);
            dataOrganisasi = [];
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

// Navigasi Tab (Khusus Halaman Publik index.html)
function gantiTab(tab) {
    ['simulasi', 'monitoring'].forEach(t => {
        const konten = document.getElementById(`konten-${t}`);
        const btn = document.getElementById(`tab-${t}`);
        if(konten && btn) {
            konten.classList.add('hidden');
            btn.className = "py-2.5 px-4 font-semibold text-sm border-b-2 border-transparent text-slate-500 cursor-pointer";
        }
    });
    const kontenAktif = document.getElementById(`konten-${tab}`);
    const btnAktif = document.getElementById(`tab-${tab}`);
    if(kontenAktif && btnAktif) {
        kontenAktif.classList.remove('hidden');
        btnAktif.className = "py-2.5 px-4 font-semibold text-sm border-b-2 border-blue-600 text-blue-600 cursor-pointer";
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
        tbody.insertAdjacentHTML('beforeend', `<tr><td class="p-3 text-center font-medium">${i}</td><td class="p-3 font-semibold">${formatRupiah(angsuran)}</td></tr>`);
    }
}

// Tambah Anggota Baru (Khusus admin.html)
function tambahAnggota() {
    const nama = document.getElementById('adm-nama').value;
    const pinjaman = parseFloat(document.getElementById('adm-pinjaman').value);
    if (!nama || pinjaman < 500000) return alert("Isi nama & pinjaman minimal Rp 500.000");

    dataOrganisasi.push({ id: Date.now(), nama, pinjaman, bulanKe: 0, status: "Lancar" });
    document.getElementById('adm-nama').value = '';
    document.getElementById('adm-pinjaman').value = '';
    simpanKeStorage();
    alert("Anggota berhasil didaftarkan!");
}

// Ubah Cicilan / Status (Khusus admin.html)
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
    if (confirm("Hapus data pinjaman ini?")) {
        dataOrganisasi = dataOrganisasi.filter(item => item.id !== id);
        simpanKeStorage();
    }
}

// Distribusi Data ke Masing-Masing Tabel (Deteksi Halaman secara Otomatis)
function muatDataTabel() {
    const bMonitoring = document.getElementById('body-monitoring');
    const bAdmin = document.getElementById('body-admin');

    // Jika dibuka di index.html (Halaman Publik)
    if (bMonitoring) {
        bMonitoring.innerHTML = '';
        dataOrganisasi.forEach(item => {
            const angsuran = item.pinjaman * 0.11;
            const sisa = item.status === 'Lunas' ? 0 : (angsuran * (12 - item.bulanKe));
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
        });
    }

    // Jika dibuka di admin.html (Halaman Pengurus)
    if (bAdmin) {
        bAdmin.innerHTML = '';
        dataOrganisasi.forEach(item => {
            bAdmin.insertAdjacentHTML('beforeend', `
                <tr>
                    <td class="p-4 font-semibold text-white">${item.nama}</td>
                    <td class="p-4 text-slate-400">${formatRupiah(item.pinjaman)}</td>
                    <td class="p-4 text-center">
                        <input type="number" min="0" max="12" value="${item.bulanKe}" onchange="updateData(${item.id}, this.value, '${item.status}')" class="w-12 text-center border border-slate-700 rounded-lg bg-slate-900 text-white"> / 12
                    </td>
                    <td class="p-4">
                        <select onchange="updateData(${item.id}, ${item.bulanKe}, this.value)" class="border border-slate-700 bg-slate-900 rounded-lg p-1 text-xs text-white">
                            <option value="Lancar" ${item.status === 'Lancar' ? 'selected' : ''}>Lancar</option>
                            <option value="Telat" ${item.status === 'Telat' ? 'selected' : ''}>Telat</option>
                            <option value="Lunas" ${item.status === 'Lunas' ? 'selected' : ''}>Lunas</option>
                        </select>
                    </td>
                    <td class="p-4 text-center">
                        <button onclick="hapusAnggota(${item.id})" class="text-rose-400 hover:text-rose-600"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `);
        });
    }
}
