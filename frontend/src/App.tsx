import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css'; // Birazdan stil ekleyeceğiz

// Gelen mesajlar için bir tip tanımı yapalım
interface IMessage {
    from: string;
    body: string;
}

function App() {
    const [status, setStatus] = useState('Bağlanılıyor...');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [messages, setMessages] = useState<IMessage[]>([]);

    // Form state'leri
    const [toNumber, setToNumber] = useState('');
    const [messageText, setMessageText] = useState('');

    useEffect(() => {
        // Backend sunucumuza bağlanıyoruz
        const newSocket = io('http://localhost:3001');

        newSocket.on('status', (newStatus: string) => {
            setStatus(newStatus);
            if (newStatus === 'Bağlandı!') {
                setQrCodeUrl(''); // Bağlanınca QR kodunu kaldır
            }
        });

        newSocket.on('qr', (url: string) => {
            setQrCodeUrl(url);
        });

        newSocket.on('message', (newMessage: IMessage) => {
            setMessages(prevMessages => [...prevMessages, newMessage]);
        });

        // Component unmount olduğunda bağlantıyı kes
        return () => {
            newSocket.disconnect();
        };
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!toNumber || !messageText) {
            alert('Lütfen numara ve mesaj girin.');
            return;
        }
        try {
            const response = await fetch('http://localhost:3001/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: toNumber, message: messageText }),
            });
            const data = await response.json();
            if (data.success) {
                alert('Mesaj gönderildi!');
                setMessageText('');
            } else {
                alert('Hata: ' + data.error);
            }
        } catch (error) {
            alert('Mesaj gönderilirken bir sunucu hatası oluştu.');
        }
    };

    return (
        <div className="container">
            <header>
                <h1>WhatsApp Web API Test Arayüzü</h1>
                <p className={`status status-${status.split(' ')[0].toLowerCase()}`}>
                    Durum: <strong>{status}</strong>
                </p>
            </header>

            {qrCodeUrl && (
                <div className="qr-container">
                    <h2>Giriş için QR Kodu</h2>
                    <img src={qrCodeUrl} alt="WhatsApp QR Code" />
                    <p>Telefonunuzdaki WhatsApp uygulamasından bu kodu okutun.</p>
                </div>
            )}

            {status === 'Bağlandı!' && (
                <div className="main-content">
                    <form className="send-form" onSubmit={handleSendMessage}>
                        <h3>Mesaj Gönder</h3>
                        <input
                            type="text"
                            placeholder="Numara (örn: 905321234567)"
                            value={toNumber}
                            onChange={(e) => setToNumber(e.target.value)}
                        />
                        <textarea
                            placeholder="Mesajınız..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                        />
                        <button type="submit">Gönder</button>
                    </form>

                    <div className="messages-container">
                        <h3>Gelen Mesajlar</h3>
                        <div className="message-list">
                            {messages.length === 0 ? <p>Henüz mesaj yok.</p> :
                                messages.map((msg, index) => (
                                    <div key={index} className="message">
                                        <p className="from"><strong>Kimden:</strong> {msg.from}</p>
                                        <p className="body">{msg.body}</p>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;