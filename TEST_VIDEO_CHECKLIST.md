# 🎬 TEST VİDEOSU İÇİN CHECKLIST

## 📋 YAPILACAKLAR LİSTESİ

### 1. ✅ Servisleri Başlat
- [ ] Docker Desktop'ı başlat (şu an paused)
- [ ] PostgreSQL container'ı çalıştır
- [ ] Trading Service'i başlat (Port 8000)
- [ ] Auth Service'i başlat (Port 4000)
- [ ] Frontend'i başlat (Port 5174)

### 2. 🌐 Tarayıcı Sekmelerini Aç
- [ ] Frontend: http://localhost:5174/
- [ ] Trading API Docs: http://localhost:8000/docs
- [ ] Auth API Docs: http://localhost:4000/docs
- [ ] Trading Health: http://localhost:8000/health

### 3. 🎥 Demo Akışı (Video İçin)

#### Senaryo 1: Login & Deposit
1. Login sayfasına git
2. Token Login:
   - Party ID: `canton::user::demo`
   - Token: `demo123`
3. Portfolio sayfasına git
4. Deposit yap:
   - Asset: USDT
   - Amount: 10000
   - ✅ Başarılı mesajı göster
5. Tekrar Deposit:
   - Asset: BTC
   - Amount: 1
   - ✅ Başarılı mesajı göster

#### Senaryo 2: Order Placement
1. Dashboard'a git
2. "+ New Order" butonuna tıkla
3. SELL Order oluştur:
   - Pair: BTC/USDT
   - Side: SELL
   - Type: LIMIT
   - Price: 45500
   - Quantity: 0.1
   - ✅ "Order Placed!" toast göster
4. Order Book'u göster (kırmızı ask görünmeli)

#### Senaryo 3: Matching & Trade Execution
1. İkinci bir tarayıcı sekmesi aç (Incognito)
2. Login: `canton::user::trader2` / `demo123`
3. Deposit: 5000 USDT
4. BUY Order oluştur:
   - Pair: BTC/USDT
   - Side: BUY
   - Type: LIMIT
   - Price: 45600 (sell'den yüksek!)
   - Quantity: 0.1
5. İlk sekmede Trade History'yi göster
6. ✅ Trade'in göründüğünü göster
7. Her iki kullanıcının Portfolio'sunu göster (balance güncellemeleri)

#### Senaryo 4: Order Book & Market Data
1. Dashboard'da Order Book'u göster
2. Bids (yeşil) ve Asks (kırmızı) göster
3. Spread hesaplamasını göster
4. Market Data'yı göster

### 4. 📊 Veritabanı Doğrulama (Opsiyonel)
- [ ] PostgreSQL'e bağlan
- [ ] Orders tablosunu göster
- [ ] Trades tablosunu göster
- [ ] Balances tablosunu göster

### 5. 🎯 Konuşma Noktaları (Video İçin)

**Açılış:**
> "Merhaba! Bu CantonDEX - Canton Network üzerinde çalışan bir decentralized exchange prototipi. Şimdi size gerçek zamanlı order matching, atomic settlement ve privacy özelliklerini göstereceğim."

**Order Placement:**
> "Kullanıcı bir SELL order oluşturuyor. Order Book'da kırmızı renkte görünüyor. Bu order, matching engine tarafından her 500ms'de kontrol ediliyor."

**Trade Execution:**
> "İkinci kullanıcı bir BUY order oluşturdu. Fiyatlar kesiştiği için matching engine otomatik olarak trade'i execute etti. PostgreSQL transaction'ı sayesinde tüm balance güncellemeleri atomik olarak gerçekleşti - ya hepsi ya hiçbiri."

**Privacy:**
> "Her kullanıcı sadece kendi order'larını ve balance'larını görebiliyor. Bu, Canton Network'ün sub-transaction privacy özelliğini simüle ediyor."

**Canton Alignment:**
> "Veritabanı şeması DAML contract'larıyla birebir uyumlu. TradingAccount, ConfidentialOrder, AtomicTrade - hepsi PostgreSQL tablolarında mevcut. Migration path açık."

---

## 🚀 HIZLI BAŞLATMA KOMUTLARI

```powershell
# 1. Docker Desktop'ı başlat (manuel)

# 2. Trading Service
cd cantondex-backend\trading-service
.\run.ps1

# 3. Auth Service (yeni terminal)
cd cantondex-backend\auth-service
.\run.ps1

# 4. Frontend (yeni terminal)
cd apps\trading-terminal
npm run dev
```

---

## ✅ SERVİS KONTROLÜ

Her servisin çalıştığını kontrol et:

```powershell
# Trading Service
curl http://localhost:8000/health

# Auth Service
curl http://localhost:4000/health

# Frontend
# Tarayıcıda http://localhost:5174/ açılmalı
```

---

## 🎬 VİDEO ÇEKİM İPUÇLARI

1. **Ekran Çözünürlüğü:** 1920x1080 (Full HD)
2. **Ses:** Mikrofon açık, arka plan gürültüsü yok
3. **Hız:** Yavaş ve net konuş, her adımı açıkla
4. **Odak:** Her özelliği göster, hızlı geçme
5. **Süre:** 5-7 dakika ideal
6. **Son:** "Bu bir prototip ama production-ready bir mimari. Canton Network'e migration path açık."

---

**HAZIR! ŞİMDİ SERVİSLERİ BAŞLATALIM! 🚀**

