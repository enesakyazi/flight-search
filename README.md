# Flight Search Application

Bu uygulama, kullanıcıların uçuş aramalarını yapabilecekleri, sonuçları filtreleyebilecekleri ve harita üzerinde uçuş rotalarını görüntüleyebilecekleri bir web uygulamasıdır.

## Özellikler

- Uçuş arama (tek yön ve gidiş-dönüş)
- Havaalanı otomatik tamamlama
- Uçuş sonuçlarını fiyata göre sıralama
- Aktarma sayısına göre filtreleme
- Google Maps ile uçuş rotası görüntüleme
- Detaylı uçuş bilgileri
- Responsive tasarım

## Teknolojiler

- React
- Vite
- Google Maps API
- Sky Scanner API
- CSS3

## Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/[YOUR_USERNAME]/flight-search.git
cd flight-search
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. `.env` dosyası oluşturun ve gerekli API anahtarlarını ekleyin:
```env
VITE_RAPIDAPI_KEY=your_api_key_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

4. Uygulamayı başlatın:
```bash
npm run dev
```

## Kullanım

1. Kalkış ve varış noktalarını seçin
2. Tarih(leri) seçin
3. "Search Flights" butonuna tıklayın
4. Sonuçları filtrelemek için üst kısımdaki filtreleri kullanın
5. Uçuş detayları için herhangi bir uçuş kartına tıklayın
6. Harita üzerinde uçuş rotasını görüntüleyin

## Katkıda Bulunma

1. Bu repository'yi fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Bir Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına bakın.
