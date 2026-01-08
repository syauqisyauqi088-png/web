// Data antrian dan gate
let queueData = {
    currentNumber: null,
    nextNumber: 1,
    queueList: [],
    gates: [
        { id: 1, name: "Gate 1", description: "Layanan Tiket Eksekutif", status: "available" },
        { id: 2, name: "Gate 2", description: "Layanan Tiket Bisnis", status: "available" },
        { id: 3, name: "Gate 3", description: "Layanan Tiket Ekonomi", status: "available" },
        { id: 4, name: "Gate 4", description: "Check-in & Boarding", status: "available" },
        { id: 5, name: "Gate 5", description: "Pengembalian Tiket", status: "available" },
        { id: 6, name: "Gate 6", description: "Layanan Disabilitas", status: "available" },
        { id: 7, name: "Gate 7", description: "Layanan Lansia & Ibu Hamil", status: "available" },
        { id: 8, name: "Gate 8", description: "Informasi Perjalanan", status: "available" },
        { id: 9, name: "Gate 9", description: "Kehilangan Barang", status: "available" },
        { id: 10, name: "Gate 10", description: "Pengaduan Pelanggan", status: "available" },
        { id: 11, name: "Gate 11", description: "Reservasi Grup", status: "available" },
        { id: 12, name: "Gate 12", description: "Layanan Asuransi", status: "available" },
        { id: 13, name: "Gate 13", description: "Antar-Jemput Barang", status: "available" },
        { id: 14, name: "Gate 14", description: "Fasilitas Stasiun", status: "available" },
        { id: 15, name: "Gate 15", description: "Layanan Darurat", status: "available" }
    ],
    lastCall: null
};

// Variabel untuk Web Speech API
let speechSynthesis = window.speechSynthesis;
let isSpeechReady = false;
let voices = [];

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log("Sistem Antrian KAI dimuat...");
    initApp();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Inisialisasi speech synthesis
    initSpeechSynthesis();
});

// Fungsi untuk inisialisasi speech synthesis
function initSpeechSynthesis() {
    // Tunggu hingga voices tersedia (terutama di Chrome)
    const loadVoices = () => {
        voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            isSpeechReady = true;
            console.log("Voices tersedia:", voices.length);
            console.log("Voice Indonesia tersedia:", voices.some(v => v.lang.includes('id')));
        }
    };
    
    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices(); // Panggil langsung jika voices sudah tersedia
}

// Fungsi inisialisasi aplikasi
function initApp() {
    console.log("Menginisialisasi aplikasi KAI...");
    
    // Setup event listeners
    document.getElementById('call-btn').addEventListener('click', callQueue);
    document.getElementById('repeat-btn').addEventListener('click', repeatLastCall);
    document.getElementById('reset-btn').addEventListener('click', resetQueue);
    document.getElementById('test-btn').addEventListener('click', testSound);
    document.getElementById('increase-btn').addEventListener('click', increaseNumber);
    document.getElementById('decrease-btn').addEventListener('click', decreaseNumber);
    document.getElementById('volume').addEventListener('input', updateVolume);
    document.getElementById('speed').addEventListener('input', updateSpeed);
    
    // Setup gate panel
    renderGatePanel();
    
    // Setup initial queue display
    updateQueueDisplay();
    updateQueueStats();
    
    // Setup volume dan speed display
    updateVolume();
    updateSpeed();
    
    // Load saved data
    loadSavedData();
    
    console.log("Aplikasi KAI siap digunakan!");
}

// Fungsi untuk memperbarui tanggal dan waktu
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('id-ID', options);
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    document.getElementById('current-date').textContent = dateStr;
    document.getElementById('current-time').textContent = timeStr;
}

// Fungsi untuk menambah nomor antrian
function increaseNumber() {
    const queueInput = document.getElementById('queue-number');
    let currentValue = parseInt(queueInput.value) || 1;
    queueInput.value = currentValue + 1;
}

// Fungsi untuk mengurangi nomor antrian
function decreaseNumber() {
    const queueInput = document.getElementById('queue-number');
    let currentValue = parseInt(queueInput.value) || 2;
    if (currentValue > 1) {
        queueInput.value = currentValue - 1;
    }
}

// Fungsi untuk memanggil antrian
function callQueue() {
    console.log("Tombol panggil antrian ditekan");
    
    const queueNumber = parseInt(document.getElementById('queue-number').value);
    const gateId = parseInt(document.getElementById('gate').value);
    
    if (isNaN(queueNumber) || queueNumber < 1) {
        alert("Nomor antrian tidak valid. Harap masukkan nomor yang benar.");
        return;
    }
    
    // Temukan gate berdasarkan ID
    const gate = queueData.gates.find(g => g.id === gateId);
    
    if (!gate) {
        alert("Gate tidak ditemukan.");
        return;
    }
    
    // Update status gate menjadi sibuk
    gate.status = "busy";
    
    // Simpan panggilan terakhir
    queueData.lastCall = {
        number: queueNumber,
        gate: gate.name,
        description: gate.description,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestamp: new Date()
    };
    
    // Update tampilan antrian
    queueData.currentNumber = queueNumber;
    
    // Tambahkan ke daftar antrian jika belum ada
    const existingQueue = queueData.queueList.find(item => item.number === queueNumber && item.gateId === gateId);
    
    if (!existingQueue) {
        queueData.queueList.push({
            number: queueNumber,
            gateId: gateId,
            gateName: gate.name,
            gateDesc: gate.description,
            called: true,
            timestamp: new Date()
        });
    } else {
        existingQueue.called = true;
        existingQueue.timestamp = new Date();
    }
    
    // Auto increment untuk nomor berikutnya
    if (queueNumber >= queueData.nextNumber) {
        queueData.nextNumber = queueNumber + 1;
    }
    
    // Update tampilan
    updateQueueDisplay();
    updateQueueStats();
    renderGatePanel();
    updateLastCallDisplay();
    
    // Mainkan suara panggilan
    playCallSound(queueNumber, gate.name);
    
    // Update nomor input untuk berikutnya
    document.getElementById('queue-number').value = queueData.nextNumber;
    
    // Simpan data ke localStorage
    saveData();
}

// Fungsi untuk mengulangi panggilan terakhir
function repeatLastCall() {
    if (queueData.lastCall) {
        console.log("Mengulangi panggilan terakhir:", queueData.lastCall);
        
        // Set nilai input
        document.getElementById('queue-number').value = queueData.lastCall.number;
        
        // Cari gate berdasarkan nama
        const gate = queueData.gates.find(g => g.name === queueData.lastCall.gate);
        if (gate) {
            document.getElementById('gate').value = gate.id;
        }
        
        // Panggil ulang
        playCallSound(queueData.lastCall.number, queueData.lastCall.gate);
    } else {
        alert("Belum ada panggilan untuk diulangi.");
    }
}

// Fungsi untuk mereset antrian
function resetQueue() {
    if (confirm("Apakah Anda yakin ingin mereset semua antrian? Tindakan ini tidak dapat dibatalkan.")) {
        queueData = {
            currentNumber: null,
            nextNumber: 1,
            queueList: [],
            gates: queueData.gates.map(gate => ({ ...gate, status: "available" })),
            lastCall: null
        };
        
        document.getElementById('queue-number').value = 1;
        document.getElementById('gate').value = 1;
        
        updateQueueDisplay();
        updateQueueStats();
        renderGatePanel();
        updateLastCallDisplay();
        
        // Simpan data ke localStorage
        saveData();
        
        alert("Antrian telah direset.");
    }
}

// Fungsi untuk menguji suara
function testSound() {
    console.log("Menguji suara...");
    playTrainAnnouncement();
}

// Fungsi untuk memperbarui tampilan antrian
function updateQueueDisplay() {
    console.log("Memperbarui tampilan antrian...");
    
    // Tampilkan antrian saat ini
    const currentNumberEl = document.getElementById('current-number');
    const currentGateEl = document.getElementById('current-gate');
    
    if (queueData.currentNumber) {
        currentNumberEl.textContent = queueData.currentNumber;
        const lastCall = queueData.lastCall;
        currentGateEl.textContent = `${lastCall.gate}`;
    } else {
        currentNumberEl.textContent = "-";
        currentGateEl.textContent = "GATE -";
    }
    
    // Tampilkan antrian berikutnya
    const nextNumberEl = document.getElementById('next-number');
    const nextGateEl = document.getElementById('next-gate');
    
    const nextQueue = queueData.queueList.find(item => !item.called);
    if (nextQueue) {
        nextNumberEl.textContent = nextQueue.number;
        nextGateEl.textContent = `${nextQueue.gateName}`;
    } else {
        nextNumberEl.textContent = queueData.nextNumber;
        nextGateEl.textContent = "GATE -";
    }
    
    // Perbarui daftar antrian
    updateQueueList();
}

// Fungsi untuk memperbarui daftar antrian
function updateQueueList() {
    const queueListContainer = document.getElementById('queue-list-container');
    
    if (queueData.queueList.length === 0) {
        queueListContainer.innerHTML = '<p class="empty-queue">Belum ada antrian</p>';
        return;
    }
    
    // Urutkan antrian berdasarkan waktu (yang terbaru di atas)
    const sortedQueue = [...queueData.queueList].sort((a, b) => b.timestamp - a.timestamp);
    
    let queueHTML = '';
    sortedQueue.forEach(item => {
        const statusClass = item.called ? 'active' : '';
        queueHTML += `
            <div class="queue-item ${statusClass}">
                <div class="queue-number">${item.number}</div>
                <div class="queue-gate">${item.gateName} - ${item.gateDesc}</div>
            </div>
        `;
    });
    
    queueListContainer.innerHTML = queueHTML;
}

// Fungsi untuk memperbarui statistik antrian
function updateQueueStats() {
    const totalQueue = queueData.queueList.length;
    const remainingQueue = queueData.queueList.filter(item => !item.called).length;
    const servedQueue = totalQueue - remainingQueue;
    
    document.getElementById('total-queue').textContent = totalQueue;
    document.getElementById('remaining-queue').textContent = remainingQueue;
    document.getElementById('served-queue').textContent = servedQueue;
}

// Fungsi untuk merender panel gate
function renderGatePanel() {
    const gateGrid = document.querySelector('.gate-grid');
    let gateHTML = '';
    
    queueData.gates.forEach(gate => {
        const statusClass = gate.status === "available" ? "status-available" : "status-busy";
        const statusText = gate.status === "available" ? "Tersedia" : "Sibuk";
        const cardClass = gate.status === "busy" ? "busy" : "";
        
        gateHTML += `
            <div class="gate-card ${cardClass}" data-gate-id="${gate.id}">
                <div class="gate-icon">
                    <i class="fas fa-door-open"></i>
                </div>
                <div class="gate-name">${gate.name}</div>
                <div class="gate-desc">${gate.description}</div>
                <div class="gate-status ${statusClass}">${statusText}</div>
            </div>
        `;
    });
    
    gateGrid.innerHTML = gateHTML;
    
    // Tambahkan event listener untuk kartu gate
    document.querySelectorAll('.gate-card').forEach(card => {
        card.addEventListener('click', function() {
            const gateId = parseInt(this.getAttribute('data-gate-id'));
            document.getElementById('gate').value = gateId;
            console.log(`Gate ${gateId} dipilih`);
        });
    });
}

// Fungsi untuk memperbarui tampilan panggilan terakhir
function updateLastCallDisplay() {
    const lastCallDisplay = document.getElementById('last-call-display');
    const callTimeDisplay = document.getElementById('call-time');
    
    if (queueData.lastCall) {
        lastCallDisplay.innerHTML = `
            <div>Nomor: <strong>${queueData.lastCall.number}</strong></div>
            <div>Gate: <strong>${queueData.lastCall.gate}</strong></div>
            <div>Layanan: ${queueData.lastCall.description}</div>
        `;
        
        const timeDiff = Math.floor((new Date() - queueData.lastCall.timestamp) / 1000);
        const minutes = Math.floor(timeDiff / 60);
        const seconds = timeDiff % 60;
        
        callTimeDisplay.textContent = `${minutes} menit ${seconds} detik yang lalu`;
    } else {
        lastCallDisplay.textContent = "Belum ada panggilan";
        callTimeDisplay.textContent = "";
    }
}

// Fungsi untuk memperbarui volume
function updateVolume() {
    const volumeSlider = document.getElementById('volume');
    const volumeValue = document.getElementById('volume-value');
    const volume = volumeSlider.value;
    
    volumeValue.textContent = `${volume}%`;
    
    // Simpan volume ke localStorage
    localStorage.setItem('kaiVolume', volume);
    
    console.log(`Volume diatur ke: ${volume}%`);
}

// Fungsi untuk memperbarui kecepatan suara
function updateSpeed() {
    const speedSlider = document.getElementById('speed');
    const speedValue = document.getElementById('speed-value');
    const speed = parseFloat(speedSlider.value);
    
    speedValue.textContent = `${speed.toFixed(1)}x`;
    
    // Simpan kecepatan ke localStorage
    localStorage.setItem('kaiSpeed', speed);
    
    console.log(`Kecepatan suara diatur ke: ${speed}x`);
}

// Fungsi untuk memainkan suara panggilan dengan efek kereta
function playCallSound(number, gate) {
    console.log(`Memanggil antrian: Nomor ${number} ke ${gate}`);
    
    // Mainkan suara klakson kereta terlebih dahulu
    playTrainHorn(() => {
        // Setelah suara klakson, mainkan pengumuman
        playAnnouncement(number, gate);
    });
}

// Fungsi untuk memainkan suara klakson kereta
function playTrainHorn(callback) {
    try {
        const trainHorn = document.getElementById('train-horn');
        const volumeSlider = document.getElementById('volume');
        
        trainHorn.volume = volumeSlider.value / 100;
        trainHorn.currentTime = 0;
        
        trainHorn.onended = function() {
            if (callback) callback();
        };
        
        trainHorn.play().catch(e => {
            console.error("Error playing train horn:", e);
            if (callback) callback();
        });
        
        console.log("Suara klakson kereta dimainkan");
    } catch (error) {
        console.error("Error memainkan suara klakson:", error);
        if (callback) callback();
    }
}

// Fungsi untuk memainkan pengumuman
function playAnnouncement(number, gate) {
    // Teks pengumuman dalam bahasa Indonesia dengan gaya kereta
    const announcementText = `Nomor antrian ${number}, harap menuju ke ${gate}. Terima kasih.`;
    
    // Gunakan Web Speech API jika tersedia
    if ('speechSynthesis' in window && isSpeechReady) {
        console.log("Speech synthesis tersedia, membuat pengumuman...");
        
        // Hentikan pembicaraan yang sedang berlangsung
        speechSynthesis.cancel();
        
        setTimeout(() => {
            // Buat objek SpeechSynthesisUtterance
            const utterance = new SpeechSynthesisUtterance(announcementText);
            
            // Atur bahasa ke Indonesia
            utterance.lang = 'id-ID';
            
            // Cari voice Indonesia atau wanita
            let selectedVoice = voices.find(voice => voice.lang.includes('id'));
            
            // Jika tidak ada voice Indonesia, cari voice wanita Inggris
            if (!selectedVoice) {
                selectedVoice = voices.find(voice => 
                    voice.lang.includes('en') && 
                    voice.name.toLowerCase().includes('female')
                );
            }
            
            // Jika masih tidak ada, ambil voice pertama
            if (!selectedVoice && voices.length > 0) {
                selectedVoice = voices[0];
            }
            
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                console.log("Menggunakan voice:", selectedVoice.name);
            }
            
            // Atur volume dari slider
            const volumeSlider = document.getElementById('volume');
            utterance.volume = volumeSlider.value / 100;
            
            // Atur kecepatan dari slider
            const speedSlider = document.getElementById('speed');
            utterance.rate = parseFloat(speedSlider.value);
            
            // Atur pitch untuk suara wanita
            utterance.pitch = 1.2;
            
            // Event listeners untuk debugging
            utterance.onstart = function() {
                console.log("Pengumuman mulai diucapkan");
            };
            
            utterance.onend = function() {
                console.log("Pengumuman selesai diucapkan");
                // Mainkan suara bel setelah pengumuman
                playBellSound();
            };
            
            utterance.onerror = function(event) {
                console.error("Error dalam speech synthesis:", event);
                // Fallback ke alert jika speech synthesis gagal
                alert(`Nomor antrian ${number}, harap menuju ke ${gate}`);
                playBellSound();
            };
            
            // Mainkan pengumuman
            speechSynthesis.speak(utterance);
            
        }, 300); // Delay sedikit setelah suara klakson
    } else {
        console.log("Speech synthesis tidak tersedia, menggunakan fallback");
        // Fallback jika Web Speech API tidak didukung
        alert(`Nomor antrian ${number}, harap menuju ke ${gate}`);
        playBellSound();
    }
}

// Fungsi untuk memainkan suara bel
function playBellSound() {
    try {
        const bellSound = document.getElementById('bell-sound');
        const volumeSlider = document.getElementById('volume');
        
        bellSound.volume = volumeSlider.value / 100;
        bellSound.currentTime = 0;
        bellSound.play().catch(e => console.log("Error playing bell sound:", e));
        
        console.log("Suara bel dimainkan");
    } catch (error) {
        console.error("Error memainkan suara bel:", error);
    }
}

// Fungsi untuk memainkan pengumuman kereta (untuk test)
function playTrainAnnouncement() {
    const testText = "Perhatian. Selamat datang di Stasiun Gambir. Harap perhatikan barang bawaan Anda dan nomor antrian yang dipanggil. Terima kasih.";
    
    if ('speechSynthesis' in window && isSpeechReady) {
        speechSynthesis.cancel();
        
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(testText);
            utterance.lang = 'id-ID';
            
            // Cari voice Indonesia atau wanita
            let selectedVoice = voices.find(voice => voice.lang.includes('id'));
            if (!selectedVoice) {
                selectedVoice = voices.find(voice => 
                    voice.lang.includes('en') && 
                    voice.name.toLowerCase().includes('female')
                );
            }
            
            if (selectedVoice) utterance.voice = selectedVoice;
            
            const volumeSlider = document.getElementById('volume');
            utterance.volume = volumeSlider.value / 100;
            
            const speedSlider = document.getElementById('speed');
            utterance.rate = parseFloat(speedSlider.value);
            utterance.pitch = 1.1;
            
            utterance.onstart = function() {
                console.log("Test suara mulai");
            };
            
            utterance.onend = function() {
                console.log("Test suara selesai");
                playBellSound();
            };
            
            speechSynthesis.speak(utterance);
            
        }, 100);
    } else {
        alert("Test suara: Sistem pengumuman kereta KAI siap digunakan!");
        playBellSound();
    }
}

// Fungsi untuk menyimpan data ke localStorage
function saveData() {
    try {
        const saveData = {
            queueData: queueData,
            nextNumber: queueData.nextNumber
        };
        localStorage.setItem('kaiQueueSystem', JSON.stringify(saveData));
        console.log("Data disimpan ke localStorage");
    } catch (error) {
        console.error("Error menyimpan data:", error);
    }
}

// Fungsi untuk memuat data dari localStorage
function loadSavedData() {
    try {
        const savedData = localStorage.getItem('kaiQueueSystem');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            queueData = parsedData.queueData || queueData;
            queueData.nextNumber = parsedData.nextNumber || queueData.nextNumber;
            
            // Update tampilan dengan data yang dimuat
            updateQueueDisplay();
            updateQueueStats();
            renderGatePanel();
            updateLastCallDisplay();
            
            // Update input nomor antrian
            document.getElementById('queue-number').value = queueData.nextNumber;
            
            console.log("Data dimuat dari localStorage");
        }
        
        // Load volume dan speed settings
        const savedVolume = localStorage.getItem('kaiVolume');
        if (savedVolume) {
            document.getElementById('volume').value = savedVolume;
            updateVolume();
        }
        
        const savedSpeed = localStorage.getItem('kaiSpeed');
        if (savedSpeed) {
            document.getElementById('speed').value = savedSpeed;
            updateSpeed();
        }
    } catch (error) {
        console.error("Error memuat data:", error);
    }
}

// Tambahkan debugging info ke konsol
console.log("Sistem Antrian KAI berhasil dimuat!");