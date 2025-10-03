const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const qrcode = require('qrcode');
const cors = require('cors');

// --- Express ve Socket.IO Kurulumu ---
const app = express();
app.use(express.json());
app.use(cors()); // CORS'u etkinleştir

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", // Vite'nin varsayılan adresi
        methods: ["GET", "POST"]
    }
});

const PORT = 3001;

// --- WhatsApp Client Kurulumu ---
console.log("WhatsApp istemcisi oluşturuluyor...");
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true, // Arka planda çalışsın
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Linux sunucuları için önemli
    }
});

// --- Socket.IO Olayları ---
io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);

    // Bağlantı durumunu ve QR kodunu hemen gönder
    socket.emit('status', 'Başlatılıyor...');

    client.on('qr', async (qr) => {
        console.log('QR Kodu alındı, frontend\'e gönderiliyor.');
        const qrDataUrl = await qrcode.toDataURL(qr);
        socket.emit('qr', qrDataUrl);
        socket.emit('status', 'QR Kodu bekleniyor. Lütfen taratın.');
    });

    client.on('ready', () => {
        console.log('WhatsApp istemcisi hazır!');
        socket.emit('status', 'Bağlandı!');
        socket.emit('qr', null); // QR kodunu temizle
    });

    client.on('message', message => {
        // Gelen mesajı frontend'e gönder
        socket.emit('message', { from: message.from, body: message.body });
    });

    client.on('disconnected', (reason) => {
        socket.emit('status', 'Bağlantı kesildi!');
    });
});

// --- API Endpoint'leri ---
app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ success: false, error: 'Numara ve mesaj gerekli.' });
    }

    // WhatsApp numarası formatı: 905xxxxxxxxx@c.us
    const chatId = `${number.replace(/\D/g, '')}@c.us`;

    try {
        await client.sendMessage(chatId, message);
        res.json({ success: true, message: 'Mesaj başarıyla gönderildi.' });
    } catch (error) {
        console.error('Mesaj gönderilirken hata:', error);
        res.status(500).json({ success: false, error: 'Mesaj gönderilemedi.' });
    }
});


// --- Sunucuyu Başlat ---
client.initialize();
httpServer.listen(PORT, () => {
    console.log(`API sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
});