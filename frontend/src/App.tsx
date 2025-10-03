import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

// Tipleri tanımlayalım
interface IMessage {
    id: string;
    fromMe: boolean;
    body: string;
    timestamp: number;
}

interface IChat {
    id: string;
    name: string;
    isGroup: boolean;
    unreadCount: number;
    messages: IMessage[];
}

function App() {
    const [status, setStatus] = useState('Bağlanılıyor...');
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    const [chats, setChats] = useState<IChat[]>([]);
    const [activeChat, setActiveChat] = useState<IChat | null>(null);
    const [messageText, setMessageText] = useState('');

    useEffect(() => {
        const newSocket = io('http://localhost:3001');

        newSocket.on('status', setStatus);
        newSocket.on('qr', setQrCodeUrl);

        newSocket.on('all_chats', (allChats: IChat[]) => {
            setChats(allChats);
        });

        newSocket.on('new_message', ({ chatId, message }: { chatId: string, message: IMessage }) => {
            setChats(prevChats => {
                const updatedChats = [...prevChats];
                const chatIndex = updatedChats.findIndex(c => c.id === chatId);
                if (chatIndex !== -1) {
                    updatedChats[chatIndex].messages.push(message);
                    // Eğer aktif sohbet değilse okunmadı sayısını artır
                    if (activeChat?.id !== chatId) {
                        updatedChats[chatIndex].unreadCount++;
                    }
                }
                return updatedChats;
            });
        });

        return () => { newSocket.disconnect(); };
    }, [activeChat]); // activeChat değiştiğinde de effect'i yeniden kurabiliriz.

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText || !activeChat) return;

        try {
            const response = await fetch('http://localhost:3001/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: activeChat.id, message: messageText }),
            });
            const data = await response.json();
            if (data.success) {
                // Optimistic UI: Mesajı gönderilir gönderilmez listeye ekle
                const newMessage: IMessage = {
                    id: new Date().toISOString(),
                    fromMe: true,
                    body: messageText,
                    timestamp: Date.now() / 1000
                };
                activeChat.messages.push(newMessage);
                setMessageText('');
            } else {
                alert('Hata: ' + data.error);
            }
        } catch (error) {
            alert('Mesaj gönderilirken bir sunucu hatası oluştu.');
        }
    };

    const selectChat = (chat: IChat) => {
        chat.unreadCount = 0; // Sohbete girince okunmadı sayısını sıfırla
        setActiveChat(chat);
    }

    if (status !== 'Bağlandı!') {
        return (
            <div className="login-container">
                <h1>WhatsApp Web API Test Arayüzü</h1>
                <p className={`status status-${status.split(' ')[0].toLowerCase()}`}>
                    Durum: <strong>{status}</strong>
                </p>
                {qrCodeUrl && (
                    <div className="qr-container">
                        <img src={qrCodeUrl} alt="WhatsApp QR Code" />
                        <p>Giriş için QR Kodu</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="app-container">
            <aside className="sidebar">
                <header>Sohbetler</header>
                <div className="chat-list">
                    {chats.sort((a,b) => (b.messages.slice(-1)[0]?.timestamp || 0) - (a.messages.slice(-1)[0]?.timestamp || 0)).map(chat => (
                        <div key={chat.id} className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`} onClick={() => selectChat(chat)}>
                            <span className="chat-name">{chat.name}</span>
                            {chat.unreadCount > 0 && <span className="unread-badge">{chat.unreadCount}</span>}
                        </div>
                    ))}
                </div>
            </aside>
            <main className="chat-area">
                {activeChat ? (
                    <>
                        <header>{activeChat.name}</header>
                        <div className="message-list">
                            {activeChat.messages.map(msg => (
                                <div key={msg.id} className={`message-bubble ${msg.fromMe ? 'sent' : 'received'}`}>
                                    {msg.body}
                                </div>
                            ))}
                        </div>
                        <form className="message-form" onSubmit={handleSendMessage}>
                            <input type="text" placeholder="Bir mesaj yazın..." value={messageText} onChange={e => setMessageText(e.target.value)} />
                            <button type="submit">Gönder</button>
                        </form>
                    </>
                ) : (
                    <div className="placeholder">
                        Sohbet geçmişini görmek için bir sohbet seçin.
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;