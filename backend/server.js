// ... dosyanın üst kısımları aynı kalıyor ...
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const qrcode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const PORT = 3001;

let status = 'Başlatılıyor...';
let qrCodeDataUrl = null;

console.log("WhatsApp istemcisi oluşturuluyor...");
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', async (qr) => {
    console.log('QR Kodu alındı, tüm istemcilere gönderiliyor.');
    qrCodeDataUrl = await qrcode.toDataURL(qr);
    status = 'QR Kodu bekleniyor. Lütfen taratın.';
    io.emit('qr', qrCodeDataUrl);
    io.emit('status', status);
});

// ==================== DEĞİŞİKLİK BURADA BAŞLIYOR ====================
client.on('ready', async () => {
    console.log('WhatsApp istemcisi hazır! Tüm istemcilere bildiriliyor.');
    qrCodeDataUrl = null;
    status = 'Bağlandı!';
    io.emit('status', status);
    io.emit('qr', null);

    // --- Sohbet Geçmişini Çekme ---
    console.log('Sohbetler ve okunmamış mesajlar alınıyor...');
    try {
        const chats = await client.getChats();
        // Sadece okunmamış mesajı olanları veya son birkaç sohbeti alalım
        // Tüm sohbetleri çekmek ve her birinin mesajlarını getirmek uzun sürebilir
        const relevantChats = chats.filter(chat => chat.unreadCount > 0 || !chat.archived).slice(0, 20); // Okunmamış veya arşivlenmemiş ilk 20 sohbet

        const chatData = [];
        for (const chat of relevantChats) {
            const messages = await chat.fetchMessages({ limit: 15 }); // Her sohbetin son 15 mesajını al
            chatData.push({
                id: chat.id._serialized,
                name: chat.name || chat.id.user,
                isGroup: chat.isGroup,
                unreadCount: chat.unreadCount,
                // Sadece temel mesaj bilgilerini gönderelim
                messages: messages.map(m => ({
                    id: m.id.id,
                    fromMe: m.fromMe,
                    body: m.body,
                    timestamp: m.timestamp
                }))
            });
        }
        console.log(`${chatData.length} adet sohbet bilgisi ve geçmişi gönderiliyor.`);
        io.emit('all_chats', chatData); // Yeni bir event ile tüm sohbetleri gönder
    } catch (error) {
        console.error("Sohbetler çekilirken hata oluştu:", error);
    }
});
// ==================== DEĞİŞİKLİK BURADA BİTİYOR ====================

client.on('message', message => {
    console.log("Yeni bir mesaj geldi, istemcilere yayınlanıyor.");
    // Sadece yeni mesajı göndererek frontend'in ilgili sohbeti güncellemesini sağlayabiliriz.
    io.emit('new_message', {
        chatId: message.from,
        message: {
            id: message.id.id,
            fromMe: message.fromMe,
            body: message.body,
            timestamp: message.timestamp
        }
    });
});

client.on('disconnected', (reason) => {
    console.log('Bağlantı kesildi:', reason);
    status = 'Bağlantı kesildi!';
    qrCodeDataUrl = null;
    io.emit('status', status);
});

io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);
    console.log(`Mevcut durum yeni istemciye gönderiliyor: ${status}`);
    socket.emit('status', status);
    if (qrCodeDataUrl) {
        socket.emit('qr', qrCodeDataUrl);
    }
});

app.post('/send-message', async (req, res) => {
    // ... bu kısım aynı kalıyor ...
    const { number, message } = req.body;
    if (!number || !message) return res.status(400).json({ success: false, error: 'Numara ve mesaj gerekli.' });
    const chatId = number.includes('@') ? number : `${number}@c.us`; // Grup veya kişi ID'si olabilir
    try {
        await client.sendMessage(chatId, message);
        res.json({ success: true, message: 'Mesaj başarıyla gönderildi.' });
    } catch (error) {
        console.error('Mesaj gönderilirken hata:', error);
        res.status(500).json({ success: false, error: 'Mesaj gönderilemedi.' });
    }
});

client.initialize();
httpServer.listen(PORT, () => {
    console.log(`API sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
});