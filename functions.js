const drugsUrl = "https://nzbjdivwzf.execute-api.eu-north-1.amazonaws.com/prod/drugs";
let currentPage = 1;
const itemsPerPage = 12;
let cachedData = null;
let isLoading = false;
let debounceTimeout;

// Modify the initializeCache function
async function initializeCache() {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.className = 'fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50';
    loadingIndicator.innerHTML = '<div class="text-white text-xl">Loading...</div>';
    
    try {
        if (isLoading) {
            console.log('Already loading data...');
            return;
        }

        isLoading = true;
        document.body.appendChild(loadingIndicator);
        
        console.log('Fetching data from:', `${drugsUrl}?drugsId=all`);
        const response = await axios.get(`${drugsUrl}?drugsId=all`);
        
        if (!response.data) {
            throw new Error('No data received from API');
        }
        
        console.log('Data received:', response.data); // Debug log
        cachedData = response.data;
        isLoading = false; // Set loading to false before calling getDrugs
        getDrugs(currentPage);
        
    } catch (error) {
        console.error("Error initializing cache:", error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded shadow-lg';
        errorMessage.textContent = 'Failed to load data. Please refresh the page.';
        document.body.appendChild(errorMessage);
        setTimeout(() => errorMessage.remove(), 5000);
    } finally {
        isLoading = false;
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.remove();
        }
    }
}

// Modify getDrugs function
function getDrugs(page = 1, searchQuery = '') {
    console.log('getDrugs called with page:', page, 'searchQuery:', searchQuery);
    console.log('isLoading:', isLoading);
    console.log('cachedData:', cachedData);

    if (isLoading) {
        console.log('Still loading data...');
        return;
    }

    if (!cachedData || !Array.isArray(cachedData)) {
        console.error("Cache not initialized or invalid");
        initializeCache();
        return;
    }

    // Make sure table1 is visible
    const table1 = document.getElementById('table1');
    if (table1) {
        table1.style.display = 'block';
    }

    // Use querySelector to find the tbody with class data-list inside table1
    const dataList = document.querySelector('#table1 .data-list');
    if (!dataList) {
        console.error("Data list element not found");
        return;
    }

    // Clear existing items
    dataList.innerHTML = '';

    const filteredData = searchQuery 
        ? cachedData.filter(item => 
            item['ÜRÜN ADI']?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : cachedData;

    console.log('Filtered data length:', filteredData.length);

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    console.log('Page data length:', pageData.length);

    if (pageData.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="8" class="border border-gray-300 p-2 text-center">No data found</td>';
        dataList.appendChild(emptyRow);
    } else {
        pageData.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = generateRowHTML(item, startIndex + index);
            dataList.appendChild(row);
        });
    }

    setupPagination(filteredData.length, page, searchQuery);
}

// Modify the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing...');
    
    // Make sure table1 is visible before loading data
    const table1 = document.getElementById('table1');
    if (table1) {
        table1.style.display = 'block';
        console.log('Table1 display set to block');
    }
    
    // Initialize data
    await initializeCache();
    
    // Setup autocomplete
    setupAutocomplete();
    
    // Setup search handlers
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            searchDrugs(query);
        });
    }

    // Add search on Enter key
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = searchInput.value.toLowerCase();
                searchDrugs(query);
            }
        });
    }
});

// Modified search function to use cached data
function searchDrugs(query) {
    console.log(`Searching for: ${query}`);
    
    if (!cachedData) {
        console.error("Cache not initialized");
        return;
    }

    const dataList = document.getElementsByClassName('data-list')[0];
    if (!dataList) {
        console.error("Element with class 'data-list' not found.");
        return;
    }

    dataList.innerHTML = '';  // Clear existing items

    const filteredData = cachedData.filter(item =>
        item['ÜRÜN ADI'].toLowerCase().includes(query)
    );

    // Only show first page of results
    const startIndex = 0;
    const endIndex = itemsPerPage;
    
    filteredData.slice(startIndex, endIndex).forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = generateRowHTML(item, index);
        dataList.appendChild(row);
    });

    setupPagination(filteredData.length, 1, query);
}

// Helper function to generate row HTML
function generateRowHTML(item, index) {
    return `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${index + 1}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.BARKOD ?? 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${item['ÜRÜN ADI'] ?? 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item['ETKEN MADDE'] ?? 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item['ATC KODU'] ?? 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item['RUHSAT SAHİBİ'] ?? 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item['RUHSAT TARİHİ'] ? new Date(item['RUHSAT TARİHİ']).toLocaleDateString() : 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item['RUHSAT NUMARASI'] ?? 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            <button onclick="viewProspectus(${JSON.stringify(item).replace(/"/g, '&quot;')})" 
                    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Prospektüs
            </button>
        </td>
    `;
}

// Update setupPagination function for better styling
function setupPagination(totalItems, currentPage, searchQuery = '') {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const buttonClass = 'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150';
    const activeClass = 'bg-blue-600 text-white';
    const inactiveClass = 'bg-white text-gray-700 hover:bg-blue-50';
    const disabledClass = 'bg-gray-100 text-gray-400 cursor-not-allowed';

    // First page button
    const firstPageButton = document.createElement('button');
    firstPageButton.innerHTML = "<<";
    firstPageButton.className = `${buttonClass} ${currentPage === 1 ? disabledClass : inactiveClass}`;
    firstPageButton.addEventListener('click', () => getDrugs(1, searchQuery));
    pagination.appendChild(firstPageButton);

    // Previous page button
    const prevPageButton = document.createElement('button');
    prevPageButton.innerHTML = "<";
    prevPageButton.className = `${buttonClass} ${currentPage === 1 ? disabledClass : inactiveClass}`;
    if (currentPage > 1) {
        prevPageButton.addEventListener('click', () => getDrugs(currentPage - 1, searchQuery));
    }
    pagination.appendChild(prevPageButton);

    // Current page number
    const pageLink = document.createElement('button');
    pageLink.innerHTML = currentPage;
    pageLink.className = `${buttonClass} ${activeClass}`;
    pagination.appendChild(pageLink);

    // Next page button
    const nextPageButton = document.createElement('button');
    nextPageButton.innerHTML = ">";
    nextPageButton.className = `${buttonClass} ${currentPage >= totalPages ? disabledClass : inactiveClass}`;
    if (currentPage < totalPages) {
        nextPageButton.addEventListener('click', () => getDrugs(currentPage + 1, searchQuery));
    }
    pagination.appendChild(nextPageButton);

    // Last page button
    const lastPageButton = document.createElement('button');
    lastPageButton.innerHTML = ">>";
    lastPageButton.className = `${buttonClass} ${currentPage >= totalPages ? disabledClass : inactiveClass}`;
    lastPageButton.addEventListener('click', () => getDrugs(totalPages, searchQuery));
    pagination.appendChild(lastPageButton);
}

function addColumn() {
    console.log("ADDING COLUMN")
    function addRow() {
        // Get the table body element
        const tableBody = document.getElementById('dataTable').getElementsByTagName('tbody')[0];

        // Create a new row
        const newRow = tableBody.insertRow();

        // Insert new cells (columns) into the row
        const cell1 = newRow.insertCell(0);
        const cell2 = newRow.insertCell(1);
        const cell3 = newRow.insertCell(2);

        // Add data to the cells
        cell1.textContent = 'John Doe'; // Replace with actual data
        cell2.textContent = '30';        // Replace with actual data
        cell3.textContent = 'New York';  // Replace with actual data
    }
}

// Add this new function for autocomplete
function setupAutocomplete() {
    const searchInput = document.getElementById('searchInput');
    const suggestionsContainer = document.getElementById('searchSuggestions');

    searchInput.addEventListener('input', function(e) {
        // Clear previous timeout
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        // Debounce the search to avoid too many updates
        debounceTimeout = setTimeout(() => {
            const query = e.target.value.toLowerCase();
            
            if (query.length < 2) {
                suggestionsContainer.classList.add('hidden');
                return;
            }

            if (!cachedData) {
                console.error("Cache not initialized");
                return;
            }

            // Filter drugs that start with the query
            const suggestions = cachedData
                .filter(item => item['ÜRÜN ADI'].toLowerCase().startsWith(query))
                .slice(0, 10) // Limit to 10 suggestions
                .map(item => item['ÜRÜN ADI']);

            // Display suggestions
            if (suggestions.length > 0) {
                suggestionsContainer.innerHTML = suggestions
                    .map(suggestion => `
                        <div class="suggestion p-3 hover:bg-blue-50 cursor-pointer text-gray-700">
                            ${suggestion}
                        </div>
                    `)
                    .join('');
                suggestionsContainer.classList.remove('hidden');

                // Add click handlers to suggestions
                const suggestionElements = suggestionsContainer.getElementsByClassName('suggestion');
                Array.from(suggestionElements).forEach(element => {
                    element.addEventListener('click', function() {
                        searchInput.value = this.textContent.trim();
                        suggestionsContainer.classList.add('hidden');
                        searchDrugs(searchInput.value);
                    });
                });
            } else {
                suggestionsContainer.classList.add('hidden');
            }
        }, 300); // 300ms delay
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.classList.add('hidden');
        }
    });

    // Handle keyboard navigation
    searchInput.addEventListener('keydown', function(e) {
        const suggestions = suggestionsContainer.getElementsByClassName('suggestion');
        const currentIndex = Array.from(suggestions).findIndex(el => el.classList.contains('bg-blue-100'));

        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (suggestions.length > 0) {
                    suggestionsContainer.classList.remove('hidden');
                    if (currentIndex < 0) {
                        suggestions[0].classList.add('bg-blue-100');
                    } else {
                        suggestions[currentIndex].classList.remove('bg-blue-100');
                        if (currentIndex < suggestions.length - 1) {
                            suggestions[currentIndex + 1].classList.add('bg-blue-100');
                        } else {
                            suggestions[0].classList.add('bg-blue-100');
                        }
                    }
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (suggestions.length > 0) {
                    suggestionsContainer.classList.remove('hidden');
                    if (currentIndex > 0) {
                        suggestions[currentIndex].classList.remove('bg-blue-100');
                        suggestions[currentIndex - 1].classList.add('bg-blue-100');
                    } else if (currentIndex === 0) {
                        suggestions[currentIndex].classList.remove('bg-blue-100');
                        suggestions[suggestions.length - 1].classList.add('bg-blue-100');
                    }
                }
                break;

            case 'Enter':
                if (currentIndex >= 0) {
                    searchInput.value = suggestions[currentIndex].textContent.trim();
                    suggestionsContainer.classList.add('hidden');
                    searchDrugs(searchInput.value);
                }
                break;

            case 'Escape':
                suggestionsContainer.classList.add('hidden');
                break;
        }
    });
}

// Add this new function to handle prospectus viewing
function viewProspectus(drugData) {
    // Simplify drug name by removing dosage information
    let simplifiedName = drugData['ÜRÜN ADI']
        .split(' ')
        .filter(word => {
            // Remove parts containing mg, ml, etc.
            return !word.match(/\d+(\.\d+)?\s*(MG|MCG|ML|G|IU|UI|KG|%)/i) &&
                   !word.match(/^(\d+|,|\.|\/)+$/); // Remove numbers and separators
        })
        .slice(0, 2) // Take only first two words
        .join(' ')
        .trim();

    console.log('Simplified drug name:', simplifiedName);

    // Store both original and simplified data
    const prospectusData = {
        original: drugData,
        simplifiedName: simplifiedName
    };
    
    localStorage.setItem('selectedDrug', JSON.stringify(prospectusData));
    
    // Open in a new window with specific dimensions
    const width = 1000;
    const height = 800;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    
    window.open(
        'prospectus.html',
        '_blank',
        `width=${width},height=${height},left=${left},top=${top}`
    );
}