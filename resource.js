let materialsData = [];
        const API_KEY = 'AIzaSyDzdiDMtiY250DS-lDuZeIZOocw9oqMlhM'; // Replace with your API key
        const SHEET_ID = '1VOdK-3yofh-wLkbXRh-T7FiXgDjVFrkd4uszkRre1V0'; // Replace with your Google Sheet ID
        const RANGE = 'Sheet1!A:E'; // Updated to fetch 5 columns

        const mainFilter = document.getElementById('mainFilter');
        const subFilter = document.getElementById('subFilter');
        const nameFilter = document.getElementById('nameFilter');
        const materialsContainer = document.getElementById('materialsContainer');

        // Helper function to get YouTube thumbnail from URL
        function getYouTubeThumbnail(url) {
            let videoId = null;
            const defaultVideoId = 'oozJFcPwSl8'; // Default YouTube video ID

            try {
                const urlString = url ? url.trim() : '';
                const urlObj = new URL(urlString);

                if (urlObj.hostname.includes('youtube.com')) {
                    if (urlObj.pathname === '/watch') {
                        videoId = urlObj.searchParams.get('v');
                    } else if (urlObj.pathname.startsWith('/embed/') || urlObj.pathname.startsWith('/live/') || urlObj.pathname.startsWith('/shorts/')) {
                        videoId = urlObj.pathname.split('/').pop();
                    }
                } else if (urlObj.hostname === 'youtu.be') {
                    videoId = urlObj.pathname.substring(1);
                }
            } catch (error) {
                console.warn(`Could not parse YouTube URL: ${url}`);
            }
            
            // If no video ID was found, use the default one.
            if (!videoId) {
                videoId = defaultVideoId;
            }

            return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }

        async function fetchMaterialsFromSheet() {
            materialsContainer.innerHTML = '<div class="flex justify-center items-center h-48"><div class="loading"></div></div>';
            try {
                const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (!data.values || data.values.length === 0) {
                    materialsContainer.innerHTML = '<p class="text-center text-stone-600">No data found in the spreadsheet.</p>';
                    return;
                }

                // Assuming the first row is the header
                const [header, ...rows] = data.values;
                materialsData = rows.map(row => {
                    const youtubeLink = row[4];
                    return {
                        type: row[0],
                        subtype: row[1],
                        name: row[2],
                        downloadLink: row[3],
                        thumbnailUrl: getYouTubeThumbnail(youtubeLink)
                    };
                });

                initializeFilters();
                updateDisplay();

            } catch (error) {
                console.error("Error fetching data:", error);
                materialsContainer.innerHTML = '<p class="text-center text-red-600">Failed to load data. Please check your API key and Sheet ID.</p>';
            }
        }

        function initializeFilters() {
            const types = [...new Set(materialsData.map(item => item.type))];
            mainFilter.innerHTML = '<option value="all">All Materials</option>';
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                mainFilter.appendChild(option);
            });

            const names = [...new Set(materialsData.map(item => item.name))].sort();
            nameFilter.innerHTML = '<option value="all">All Names</option>';
            names.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                nameFilter.appendChild(option);
            });

            subFilter.disabled = true;
            subFilter.value = 'all';
        }

        function updateDisplay() {
            const selectedType = mainFilter.value;
            const selectedSubtype = subFilter.value;
            const selectedName = nameFilter.value;

            let filteredData = materialsData;
            
            // Apply main category filter
            if (selectedType !== 'all') {
                filteredData = filteredData.filter(item => item.type === selectedType);
            }

            // Apply subtype filter
            if (selectedSubtype !== 'all') {
                filteredData = filteredData.filter(item => item.subtype === selectedSubtype);
            }

            // Apply name filter
            if (selectedName !== 'all') {
                filteredData = filteredData.filter(item => item.name === selectedName);
            }

            displayMaterials(filteredData);
        }

        function displayMaterials(data) {
            materialsContainer.innerHTML = ''; // Clear previous content
            
            if (data.length === 0) {
                materialsContainer.innerHTML = '<p class="text-center text-stone-600">No materials found.</p>';
                return;
            }

            const cardView = document.createElement('div');
            cardView.id = 'cardView';
            // Grid layout for responsiveness
            cardView.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full';

            data.forEach(material => {
                const card = `
                    <div class="card p-6 rounded-lg shadow-lg flex flex-col justify-between">
                        <div>
                            <div class="aspect-16-9 rounded-lg mb-4">
                                <img src="${material.thumbnailUrl}" alt="${material.name}" class="w-full h-full object-cover rounded-lg">
                            </div>
                            <h3 class="text-lg font-semibold text-stone-800 mb-1">${material.name} | ${material.subtype}</h3>
                            <p class="text-stone-600 text-sm">Category: ${material.type}</p>
                        </div>
                        <a href="${material.downloadLink}" target="_blank" rel="noopener noreferrer" class="mt-4 w-full text-center py-2 px-4 rounded-lg text-sm font-medium download-button">Download</a>
                    </div>
                `;
                cardView.innerHTML += card;
            });

            materialsContainer.appendChild(cardView);
        }

        mainFilter.addEventListener('change', (e) => {
            const selectedType = e.target.value;
            const filteredByMain = selectedType === 'all' ? materialsData : materialsData.filter(item => item.type === selectedType);

            // Populate sub-filter
            const subtypes = [...new Set(filteredByMain.map(item => item.subtype))];
            subFilter.innerHTML = '<option value="all">All</option>';
            subtypes.forEach(subtype => {
                const option = document.createElement('option');
                option.value = subtype;
                option.textContent = subtype;
                subFilter.appendChild(option);
            });
            subFilter.disabled = selectedType === 'all';
            subFilter.value = 'all';

            // Populate name filter based on new main filter selection
            const names = [...new Set(filteredByMain.map(item => item.name))].sort();
            nameFilter.innerHTML = '<option value="all">All Names</option>';
            names.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                nameFilter.appendChild(option);
            });

            updateDisplay();
        });

        subFilter.addEventListener('change', updateDisplay);
        nameFilter.addEventListener('change', updateDisplay);

        // Fetch materials on page load
        document.addEventListener('DOMContentLoaded', fetchMaterialsFromSheet);
