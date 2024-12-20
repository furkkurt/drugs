// Mock version for testing without API key
async function fetchDrugInfo(drugName) {
    try {
        // Use a CORS proxy to access TITCK API
        const corsProxy = 'https://corsproxy.io/?';
        const titckBaseUrl = 'https://www.titck.gov.tr';
        const searchUrl = `${titckBaseUrl}/kubkt/api/search`;
        
        console.log('Searching for drug:', drugName);

        // First search request
        const searchResponse = await fetch(`${corsProxy}${encodeURIComponent(searchUrl)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: drugName,
                page: 0,
                size: 10
            })
        });

        const searchData = await searchResponse.json();
        console.log('Search results:', searchData);

        if (searchData && searchData.content && searchData.content.length > 0) {
            // Find the best matching result
            const matchingDrug = searchData.content.find(drug => 
                drug.ilacAdi.toLowerCase().includes(drugName.toLowerCase())
            ) || searchData.content[0];

            console.log('Matching drug found:', matchingDrug);

            // Fetch KT (Kullanma Talimatı) document
            const ktUrl = `${corsProxy}${encodeURIComponent(
                `${titckBaseUrl}/kubkt/api/document/${matchingDrug.ktId}`
            )}`;

            const ktResponse = await fetch(ktUrl);
            const ktData = await ktResponse.text();
            
            return formatTitckData(ktData, matchingDrug.ilacAdi);
        } else {
            console.log('No results found in TITCK database');
            return getFallbackData(drugName);
        }
    } catch (error) {
        console.error('Error fetching from TITCK:', error);
        return getFallbackData(drugName);
    }
}

function formatTitckData(ktData, drugName) {
    try {
        // Parse the XML/HTML content
        const parser = new DOMParser();
        const doc = parser.parseFromString(ktData, 'text/html');
        const content = doc.body.textContent || doc.body.innerText;

        return `
            <div class="space-y-8">
                <div class="bg-green-50 border-l-4 border-green-400 p-4 mb-8">
                    <p class="text-green-700">
                        Bu bilgiler TİTCK veritabanından alınmıştır.
                    </p>
                </div>

                <section>
                    <h3 class="text-xl font-semibold mb-4">1. İlacın Tanımı ve Kullanım Alanları</h3>
                    ${extractSection(content, "Bu ilacı kullanmaya başlamadan önce", "Kullanım alanları") || 
                      extractSection(content, "1.", "2.")}
                </section>

                <section>
                    <h3 class="text-xl font-semibold mb-4">2. Etken Maddeler ve Bileşimi</h3>
                    ${extractSection(content, "Etkin madde", "Yardımcı maddeler") || 
                      extractSection(content, "2.", "3.")}
                </section>

                <section>
                    <h3 class="text-xl font-semibold mb-4">3. Kullanım Şekli ve Dozu</h3>
                    ${extractSection(content, "Uygun kullanım ve doz/uygulama sıklığı", "Uygulama yolu ve metodu") || 
                      extractSection(content, "3.", "4.")}
                </section>

                <section>
                    <h3 class="text-xl font-semibold mb-4">4. Yan Etkiler</h3>
                    ${extractSection(content, "Yan etkiler", "Eğer bu kullanma talimatında") || 
                      extractSection(content, "4.", "5.")}
                </section>

                <section>
                    <h3 class="text-xl font-semibold mb-4">5. Kontrendikasyonlar</h3>
                    ${extractSection(content, "KULLANMAYINIZ", "DİKKATLİ KULLANINIZ") || 
                      extractSection(content, "5.", "6.")}
                </section>

                <section>
                    <h3 class="text-xl font-semibold mb-4">6. Saklama Koşulları</h3>
                    ${extractSection(content, "Saklama koşulları", "Son kullanma tarihi") || 
                      extractSection(content, "6.", "7.")}
                </section>
            </div>
        `;
    } catch (error) {
        console.error('Error formatting TITCK data:', error);
        return getFallbackData(drugName);
    }
}

function extractSection(text, startMarker, endMarker) {
    try {
        const start = text.indexOf(startMarker);
        if (start === -1) return null;
        
        const end = text.indexOf(endMarker, start + startMarker.length);
        if (end === -1) return text.substring(start);
        
        let content = text.substring(start, end)
            .replace(/\n/g, '<br>')
            .replace(/•/g, '<br>•')
            .replace(/\s+/g, ' ')
            .trim();

        // Add the marker if it's not a number
        if (isNaN(startMarker)) {
            content = `<strong>${startMarker}</strong><br>${content}`;
        }

        return content || "Bilgi bulunamadı.";
    } catch (error) {
        console.error('Error extracting section:', error);
        return "Bu bölüm için bilgi bulunamadı.";
    }
}

// Fallback data function for when TITCK fetch fails
function getFallbackData(drugName) {
    return `
        <div class="space-y-8">
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
                <p class="text-yellow-700">
                    TİTCK veritabanından bilgi alınamadığı için genel bilgiler gösterilmektedir.
                </p>
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