// Mock version for testing without API key
async function fetchDrugInfo(drugName) {
    try {
        console.log('Fetching detailed info for:', drugName);
        
        const prompt = `
            "${drugName}" ilacı hakkında aşağıdaki başlıklar altında çok detaylı bilgi ver. 
            Bilgiler Türkçe olmalı ve tıbbi terminoloji kullanılmalı:

            1. İLAÇ TANIMI VE KULLANIM ALANLARI
            - İlacın sınıfı ve türü
            - Farmakolojik özellikleri
            - Endikasyonları (tüm kullanım alanları)
            - Etki mekanizması

            2. ETKEN MADDELER VE BİLEŞİMİ
            - Ana etken madde ve miktarı
            - Yardımcı maddeler
            - Farmakokinetik özellikleri
            - Biyoyararlanım bilgisi

            3. KULLANIM ŞEKLİ VE DOZAJ
            - Yetişkin dozu
            - Pediyatrik doz
            - Özel popülasyonlarda kullanım (yaşlı, böbrek/karaciğer yetmezliği)
            - Uygulama yolu ve sıklığı
            - Maksimum günlük doz
            - Tedavi süresi

            4. YAN ETKİLER VE GÜVENLİK
            - Çok yaygın yan etkiler
            - Yaygın yan etkiler
            - Seyrek görülen yan etkiler
            - Ciddi advers reaksiyonlar
            - Risk grupları

            5. KONTRENDİKASYONLAR VE UYARILAR
            - Kesin kontrendikasyonlar
            - Göreceli kontrendikasyonlar
            - Özel kullanım uyarıları
            - İlaç etkileşimleri
            - Gebelik ve emzirme kategorisi

            6. SAKLAMA KOŞULLARI VE RAF ÖMRÜ
            - Saklama sıcaklığı
            - Işık hassasiyeti
            - Nem hassasiyeti
            - Raf ömrü
            - Özel saklama koşulları

            7. FARMAKOLOJİK ÖZELLİKLER
            - ATC kodu ve sınıfı
            - Absorpsiyon bilgisi
            - Dağılım özellikleri
            - Metabolizma
            - Eliminasyon

            8. KLİNİK BİLGİLER
            - Klinik çalışma sonuçları
            - Etkinlik verileri
            - Güvenlilik profili
            - Özel hasta gruplarında kullanım
            
            Lütfen yanıtı HTML formatında, başlıklar ve alt başlıklar halinde düzenle. 
            Her bölüm için mümkün olduğunca detaylı ve spesifik bilgi ver.
            Bilimsel kaynaklardan ve klinik çalışmalardan bahset.`;

        // OpenAI API'ye istek at
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                temperature: 0.7,
                max_tokens: 2500
            })
        });

        if (!response.ok) {
            throw new Error('OpenAI API error');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        return formatProspectusContent({
            content: `
                <div class="prose max-w-none">
                    ${content}
                </div>
            `,
            pdfUrl: null
        }, drugName, 'Yapay Zeka', null);

    } catch (error) {
        console.error('Error fetching drug information:', error);
        return getFallbackData(drugName);
    }
}

function formatProspectusContent(content, drugName, sourceName, sourceUrl) {
    return `
        <div class="space-y-8">
            <div class="bg-green-50 border-l-4 border-green-400 p-4 mb-8">
                <p class="text-green-700">
                    Bu bilgiler yapay zeka tarafından çeşitli kaynaklardan derlenerek oluşturulmuştur.
                </p>
                <p class="text-sm text-gray-600 mt-2">
                    Not: Bu bilgiler yalnızca referans amaçlıdır. Her zaman doktorunuza danışınız.
                </p>
            </div>

            <div class="mb-4">
                <a href="#" onclick="window.print()" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Bilgileri Yazdır
                </a>
            </div>

            <div class="prospectus-content">
                ${typeof content === 'string' ? content : content.content}
            </div>

            <div class="mt-8 text-sm text-gray-500 border-t pt-4">
                <p>Son Güncelleme: ${new Date().toLocaleDateString('tr-TR')}</p>
                <p>Bu içerik yapay zeka tarafından oluşturulmuştur ve sadece bilgilendirme amaçlıdır. 
                   Tedavi için her zaman bir sağlık profesyoneline danışınız.</p>
            </div>
        </div>
    `;
}

function getFallbackData(drugName, searchUrl = null) {
    return `
        <div class="space-y-8">
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
                <p class="text-yellow-700 mb-4">
                    Üzgünüz, ${drugName} için prospektüs bilgisi bulunamadı.
                </p>
                ${searchUrl ? `
                    <p class="text-sm">
                        <a href="${searchUrl}" target="_blank" class="text-blue-600 hover:underline">
                            Google'da prospektüs ara →
                        </a>
                    </p>
                ` : ''}
            </div>
            
            <section>
                <h3 class="text-xl font-semibold mb-4">1. İlacın Tanımı ve Kullanım Alanları</h3>
                <p class="mb-4">${drugName} ağrı kesici, ateş düşürücü ve hafif ile orta şiddetteki ağrıların tedavisinde kullanılan bir ilaçtır.</p>
                <p>Kullanım alanları:</p>
                <ul class="list-disc pl-5 mt-2">
                    <li>Baş ağrısı</li>
                    <li>Diş ağrısı</li>
                    <li>Ateş</li>
                    <li>Kas ağrıları</li>
                </ul>
            </section>

            <section>
                <h3 class="text-xl font-semibold mb-4">2. Etken Maddeler</h3>
                <p>Ana etken maddesi Parasetamol'dür.</p>
            </section>

            <section>
                <h3 class="text-xl font-semibold mb-4">3. Kullanım Şekli ve Dozu</h3>
                <p>Yetişkinler için önerilen doz 4-6 saat arayla 1-2 tablettir.</p>
            </section>

            <section>
                <h3 class="text-xl font-semibold mb-4">4. Yan Etkiler</h3>
                <p>Genellikle iyi tolere edilir. Nadir görülen yan etkiler:</p>
                <ul class="list-disc pl-5 mt-2">
                    <li>Alerjik reaksiyonlar</li>
                    <li>Mide bulantısı</li>
                    <li>Baş dönmesi</li>
                </ul>
            </section>

            <section>
                <h3 class="text-xl font-semibold mb-4">5. Kontrendikasyonlar</h3>
                <p>Aşağıdaki durumlarda kullanılmamalıdır:</p>
                <ul class="list-disc pl-5 mt-2">
                    <li>İlaca karşı aşırı duyarlılığı olanlar</li>
                    <li>Ağır karaciğer yetmezliği olanlar</li>
                </ul>
            </section>

            <section>
                <h3 class="text-xl font-semibold mb-4">6. Saklama Koşulları</h3>
                <p>25°C'nin altındaki oda sıcaklığında, kuru bir yerde ve çocukların ulaşamayacağı bir yerde saklayınız.</p>
            </section>
        </div>
    `;
} 