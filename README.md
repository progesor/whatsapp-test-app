# WhatsApp Web API Test Arayüzü

Bu proje, `whatsapp-web.js` kütüphanesini bir Node.js/Express backend API'si olarak sarmalayan ve bu API ile etkileşim kurmak için bir React/Vite/TypeScript frontend arayüzü sağlayan bir test ortamıdır.

Amacı, kişisel WhatsApp hesabı üzerinden programatik olarak mesaj göndermeyi ve almayı test etmeyi kolaylaştırmaktır.

---

## ✨ Özellikler

-   **Backend API:** Mesaj göndermek için bir HTTP endpoint'i sunar.
-   **Real-time Frontend:** Socket.IO kullanarak backend ile anlık iletişim kurar.
-   **QR Kod Gösterimi:** Bağlantı için gerekli olan QR kodu doğrudan web arayüzünde gösterilir.
-   **Mesajlaşma Arayüzü:** Basit bir form ile mesaj gönderme ve gelen mesajları anlık olarak listede görme imkanı.
-   **Tek Komutla Başlatma:** Hem backend hem de frontend sunucuları `npm run dev` komutu ile aynı anda başlatılır.

---

## 🛠️ Kullanılan Teknolojiler

* **Backend:**
    * [Node.js](https://nodejs.org/)
    * [Express](https://expressjs.com/)
    * [whatsapp-web.js](https://wwebjs.dev/)
    * [Socket.IO](https://socket.io/)
* **Frontend:**
    * [React](https://reactjs.org/)
    * [Vite](https://vitejs.dev/)
    * [TypeScript](https://www.typescriptlang.org/)
    * [Socket.IO Client](https://socket.io/)

---

## 🚀 Kurulum ve Başlatma

Projeyi yerel makinenizde kurmak ve çalıştırmak için aşağıdaki adımları izleyin.

**1. Projeyi Klonlayın:**

```bash
git clone [https://github.com/KULLANICI-ADIN/whatsapp-test-app.git](https://github.com/KULLANICI-ADIN/whatsapp-test-app.git)
cd whatsapp-test-app
```

**2. Tüm Bağımlılıkları Kurun:**

Projenin ana dizinindeyken aşağıdaki komutu çalıştırın. Bu komut hem ana proje, hem `backend` hem de `frontend` için gerekli tüm paketleri tek seferde kuracaktır.

```bash
npm install
```

**3. Geliştirme Sunucularını Başlatın:**

Kurulum tamamlandıktan sonra, aşağıdaki komut ile hem backend API'sini hem de frontend arayüzünü aynı anda başlatın.

```bash
npm run dev
```

-   Backend API `http://localhost:3001` adresinde çalışacaktır.
-   Frontend arayüzü `http://localhost:5173` (veya terminalde belirtilen başka bir port) adresinde açılacaktır.

**4. WhatsApp'a Bağlanın:**

Tarayıcıda açılan arayüzde görünecek olan QR kodunu, telefonunuzdaki WhatsApp uygulaması (Bağlı Cihazlar menüsünden) ile taratın. Bağlantı kurulduğunda arayüz güncellenecektir.

---

## ⚠️ ÖNEMLİ UYARI

Bu proje, WhatsApp'ın resmi olarak desteklemediği bir yöntem olan `whatsapp-web.js` kütüphanesini kullanır. WhatsApp'ın kullanım koşullarına aykırı olduğu için hesabınızın **geçici veya kalıcı olarak askıya alınma (ban) riski** bulunmaktadır. **Bu projeyi kullanmanın tüm sorumluluğu size aittir.**