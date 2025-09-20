// Configurație API
const API_KEY = "eb1741142d9a3b9ecbfacde1aa253a51";
const BASE_URL = "https://api.themoviedb.org/3";
const PROXY_URL = "https://corsproxy.io/?";
const IMG_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Elemente DOM
const contentListEl = document.getElementById('content-list');
const detailPageEl = document.getElementById('detail-page');
const detailContentEl = document.getElementById('detail-content');
const backButtonEl = document.getElementById('back-button');
const navLinks = document.querySelectorAll('.nav-link');
const genreSelectEl = document.getElementById('genre-select');

// Variabile globale
let currentCategory = 'all';
let currentGenre = '';

// Inițializare aplicație
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Funcție de inițializare
async function initApp() {
    try {
        // Încarcă conținutul inițial
        loadContent();
        
        // Adaugă event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Eroare la inițializare:', error);
        contentListEl.innerHTML = '<p class="error">A apărut o eroare. Vă rugăm încercați din nou.</p>';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigare prin categorii
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            currentCategory = link.dataset.category;
            currentGenre = ''; // Resetează genul la schimbarea categoriei
            genreSelectEl.value = '';
            loadContent();
        });
    });
    
    // Filtrare după gen
    genreSelectEl.addEventListener('change', () => {
        currentGenre = genreSelectEl.value;
        loadContent();
    });
    
    // Buton back de la detaliu
    backButtonEl.addEventListener('click', () => {
        detailPageEl.classList.add('hidden');
    });
}

// Încarcă conținutul în funcție de categorie și gen
async function loadContent() {
    try {
        contentListEl.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Se încarcă...</div>';
        
        let url;
        
        if (currentCategory === 'all') {
            // Pentru "Toate", combină rezultatele din filme și seriale populare
            const [movies, tvShows] = await Promise.all([
                fetchContent('movie', 'popular'),
                fetchContent('tv', 'popular')
            ]);
            
            // Combină și amestecă rezultatele
            const allContent = [...movies, ...tvShows]
                .sort(() => Math.random() - 0.5)
                .slice(0, 20);
                
            displayContent(allContent);
        } else {
            // Pentru filme sau seriale specifice
            if (currentGenre) {
                url = `${BASE_URL}/discover/${currentCategory}?api_key=${API_KEY}&language=ro-RO&sort_by=popularity.desc&with_genres=${currentGenre}`;
            } else {
                url = `${BASE_URL}/${currentCategory}/popular?api_key=${API_KEY}&language=ro-RO`;
            }
            
            // Folosește proxy pentru a evita problemele CORS
            const proxyUrl = `${PROXY_URL}${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();
            
            displayContent(data.results || []);
        }
    } catch (error) {
        console.error('Eroare la încărcarea conținutului:', error);
        contentListEl.innerHTML = '<p class="error">A apărut o eroare la încărcarea conținutului.</p>';
    }
}

// Fetch content helper cu proxy
async function fetchContent(type, category) {
    const url = `${PROXY_URL}${encodeURIComponent(`${BASE_URL}/${type}/${category}?api_key=${API_KEY}&language=ro-RO`)}`;
    const response = await fetch(url);
    const data = await response.json();
    return (data.results || []).map(item => ({ ...item, media_type: type }));
}

// Afișează conținutul în interfață
function displayContent(content) {
    contentListEl.innerHTML = '';
    
    if (content.length === 0) {
        contentListEl.innerHTML = '<p class="error">Nu s-au găsit rezultate.</p>';
        return;
    }
    
    content.forEach(item => {
        const contentItemEl = createContentItem(item);
        contentListEl.appendChild(contentItemEl);
    });
}

// Creează un element de conținut
function createContentItem(item) {
    const isMovie = item.media_type === 'movie' || item.title;
    const title = isMovie ? item.title : item.name;
    const releaseDate = isMovie ? item.release_date : item.first_air_date;
    const year = releaseDate ? releaseDate.substring(0, 4) : 'Necunoscut';
    
    const contentItemEl = document.createElement('div');
    contentItemEl.classList.add('content-item');
    contentItemEl.dataset.id = item.id;
    contentItemEl.dataset.type = isMovie ? 'movie' : 'tv';
    
    contentItemEl.innerHTML = `
        <img src="${item.poster_path ? IMG_BASE_URL + item.poster_path : 'https://via.placeholder.com/500x750/1a2b4a/ffffff?text=Imagine+indisponibilă'}" alt="${title}">
        <div class="content-info">
            <h2>${title}</h2>
            <p>${year}</p>
            <div class="rating">
                <span class="rating-value">${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                <span>Rating</span>
            </div>
        </div>
    `;
    
    contentItemEl.addEventListener('click', () => {
        showDetails(item.id, isMovie ? 'movie' : 'tv');
    });
    
    return contentItemEl;
}

// Afișează detaliile pentru un film/serial
async function showDetails(id, type) {
    try {
        detailContentEl.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Se încarcă...</div>';
        detailPageEl.classList.remove('hidden');
        
        const url = `${PROXY_URL}${encodeURIComponent(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=ro-RO`)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        displayDetails(data, type);
    } catch (error) {
        console.error('Eroare la încărcarea detaliilor:', error);
        detailContentEl.innerHTML = '<p class="error">A apărut o eroare la încărcarea detaliilor.</p>';
    }
}

// Afișează detaliile în interfață
function displayDetails(data, type) {
    const isMovie = type === 'movie';
    const title = isMovie ? data.title : data.name;
    const releaseDate = isMovie ? data.release_date : data.first_air_date;
    const year = releaseDate ? releaseDate.substring(0, 4) : 'Necunoscut';
    const runtime = isMovie ? `${data.runtime} min` : `${data.episode_run_time?.[0] || 'Necunoscut'} min/ep`;
    
    detailContentEl.innerHTML = `
        <div class="detail-header">
            <img class="detail-poster" src="${data.poster_path ? IMG_BASE_URL + data.poster_path : 'https://via.placeholder.com/400x600/1a2b4a/ffffff?text=Imagine+indisponibilă'}" alt="${title}">
            <div class="detail-info">
                <h1 class="detail-title">${title} (${year})</h1>
                <div class="detail-meta">
                    <span class="rating-value">${data.vote_average ? data.vote_average.toFixed(1) : 'N/A'}</span>
                    <span>${runtime}</span>
                </div>
                <div class="detail-meta">
                    ${data.genres ? data.genres.map(g => `<span class="genre-badge">${g.name}</span>`).join('') : ''}
                </div>
                <h3>Sinopsis</h3>
                <p class="detail-overview">${data.overview || 'Fără descriere disponibilă.'}</p>
                ${data.homepage ? `<a href="${data.homepage}" target="_blank" style="color: #4dabf7; text-decoration: none;"><i class="fas fa-external-link-alt"></i> Site oficial</a>` : ''}
            </div>
        </div>
    `;
}

// Simulăm încărcarea inițială a datelor
setTimeout(() => {
    loadContent();
}, 1500);
