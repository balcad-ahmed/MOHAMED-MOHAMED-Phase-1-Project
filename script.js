// Mood Playlist Generator - Student Project
// Hybrid version using both JSON Server and Spotify API

const SPOTIFY_CLIENT_ID = '3d10d56b42b84ab0a3fd9264c85e69b3'; // Your Spotify App ID
const SPOTIFY_CLIENT_SECRET = '9ff0f659abd04eac8f6ccbf43cc15877'; // Your Spotify App Secret
const JSON_SERVER_URL = 'http://localhost:3000';

// Global variables
let spotifyAccessToken = '';
let currentMood = '';
let currentPlaylist = [];
let usingSpotifyAPI = false;

// Mood data with search queries for Spotify API
const moodData = {
    happy: {
        color1: '#FFD700',
        color2: '#FF6B9D',
        emoji: '😊',
        searchQueries: [
            'Happy Pharrell Williams',
            'Good Vibrations Beach Boys',
            'Walking on Sunshine Katrina & The Waves',
            'Don\'t Stop Me Now Queen',
            'Uptown Funk Mark Ronson'
        ]
    },
    sad: {
        color1: '#4A5568',
        color2: '#2D3748',
        emoji: '😢',
        searchQueries: [
            'Someone Like You Adele',
            'The Night We Met Lord Huron',
            'Hurt Johnny Cash',
            'Mad World Gary Jules',
            'Fix You Coldplay'
        ]
    },
    energetic: {
        color1: '#FF4500',
        color2: '#FF8C00',
        emoji: '⚡',
        searchQueries: [
            'Eye of the Tiger Survivor',
            'Thunderstruck AC/DC',
            'We Will Rock You Queen',
            'Lose Yourself Eminem',
            'The Final Countdown Europe'
        ]
    },
    chill: {
        color1: '#48BB78',
        color2: '#38B2AC',
        emoji: '😌',
        searchQueries: [
            'Weightless Marconi Union',
            'Electric Feel MGMT',
            'Riptide Vance Joy',
            'Ho Hey The Lumineers',
            'Island in the Sun Weezer'
        ]
    },
    romantic: {
        color1: '#FF1493',
        color2: '#FF69B4',
        emoji: '💖',
        searchQueries: [
            'Perfect Ed Sheeran',
            'All of Me John Legend',
            'A Thousand Years Christina Perri',
            'Thinking Out Loud Ed Sheeran',
            'At Last Etta James'
        ]
    },
    focused: {
        color1: '#4299E1',
        color2: '#3182CE',
        emoji: '🎯',
        searchQueries: [
            'Time Hans Zimmer',
            'Experience Ludovico Einaudi',
            'River Flows in You Yiruma',
            'Clair de Lune Debussy',
            'Nuvole Bianche Ludovico Einaudi'
        ]
    },
    party: {
        color1: '#9F7AEA',
        color2: '#805AD5',
        emoji: '🎉',
        searchQueries: [
            'Party Rock Anthem LMFAO',
            'Uptown Funk',
            'Get Lucky Daft Punk',
            'Can\'t Stop the Feeling Justin Timberlake',
            'September Earth Wind Fire'
        ]
    },
    nostalgic: {
        color1: '#F6AD55',
        color2: '#ED8936',
        emoji: '🌅',
        searchQueries: [
            'Wonderwall Oasis',
            'Mr. Brightside The Killers',
            'The Scientist Coldplay',
            'Chasing Cars Snow Patrol',
            'Don\'t Look Back in Anger Oasis'
        ]
    }
};

// When the page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎵 Mood Playlist Generator - Hybrid Mode');
    
    // Try to connect to Spotify API first
    await setupSpotifyAPI();
    
    setupEventListeners();
    showInitialStatus();
});

// Try to get Spotify API access
async function setupSpotifyAPI() {
    try {
        console.log('🔑 Trying to connect to Spotify API...');
        
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
            },
            body: 'grant_type=client_credentials'
        });
        
        if (!response.ok) {
            throw new Error(`Spotify auth failed: ${response.status}`);
        }
        
        const data = await response.json();
        spotifyAccessToken = data.access_token;
        usingSpotifyAPI = true;
        console.log('✅ Successfully connected to Spotify API!');
        
    } catch (error) {
        console.error('❌ Spotify API unavailable:', error);
        console.log('🔄 Will use JSON Server as primary source');
        usingSpotifyAPI = false;
    }
}

// Set up all event listeners
function setupEventListeners() {
    const moodCards = document.querySelectorAll('.mood-card');
    moodCards.forEach(card => {
        card.addEventListener('click', function() {
            const mood = this.getAttribute('data-mood');
            console.log('Selected mood:', mood);
            selectMood(mood);
        });
    });

    document.getElementById('shuffle-btn').addEventListener('click', shufflePlaylist);
    document.getElementById('change-mood-btn').addEventListener('click', goBackToMoods);
}

// Show initial status message
function showInitialStatus() {
    if (usingSpotifyAPI) {
        showStatusMessage('Connected to Spotify API! 🎵', 'success');
    } else {
        showStatusMessage('Using JSON Server (Spotify failed)', 'info');
    }
}

// Show status message
function showStatusMessage(message, type) {
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 15px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        background: ${type === 'success' ? '#48BB78' : 
                     type === 'info' ? '#4299E1' : '#ED8936'};
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    statusDiv.textContent = message;
    document.body.appendChild(statusDiv);
    
    setTimeout(() => {
        statusDiv.remove();
    }, 4000);
}

// Search for a song using Spotify API
async function searchSpotifySong(query) {
    try {
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1&market=US`,
            {
                headers: {
                    'Authorization': 'Bearer ' + spotifyAccessToken
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`Spotify search failed: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.tracks.items.length > 0) {
            const track = data.tracks.items[0];
            return {
                title: track.name,
                artist: track.artists.map(artist => artist.name).join(', '),
                spotifyId: track.id,
                albumArt: track.album.images[0]?.url,
                previewUrl: track.preview_url,
                popularity: track.popularity,
                source: 'spotify-live'
            };
        }
        return null;
        
    } catch (error) {
        console.error('❌ Spotify search failed:', error);
        return null;
    }
}

// Generate playlist using Spotify API
async function generateSpotifyPlaylist(mood) {
    const queries = moodData[mood].searchQueries;
    
    console.log(`🎵 Searching Spotify for ${mood} songs...`);
    
    const playlist = [];
    for (let query of queries) {
        const song = await searchSpotifySong(query);
        if (song) {
            playlist.push(song);
            console.log(`✅ Found: ${song.title} - ${song.artist}`);
        }
        
        // Wait to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Stop when we have enough songs
        if (playlist.length >= 4) break;
    }
    
    return playlist;
}

// Get playlist from JSON Server
async function getPlaylistFromJSONServer(mood) {
    try {
        console.log(`📁 Getting ${mood} playlist from JSON Server...`);
        
        const response = await fetch(`${JSON_SERVER_URL}/playlists/${mood}`);
        
        if (!response.ok) {
            throw new Error(`JSON Server error: ${response.status}`);
        }
        
        const playlist = await response.json();
        // Add source identifier
        const playlistWithSource = playlist.map(song => ({
            ...song,
            source: 'json-server'
        }));
        
        console.log(`✅ Found ${playlistWithSource.length} songs in JSON Server`);
        return playlistWithSource;
        
    } catch (error) {
        console.error('❌ JSON Server failed:', error);
        return [];
    }
}

// Smart playlist fetcher - tries both sources
async function getPlaylistSmart(mood) {
    // Try Spotify API first if available
    if (usingSpotifyAPI && spotifyAccessToken) {
        console.log('🚀 Attempting to use Spotify API...');
        const spotifyPlaylist = await generateSpotifyPlaylist(mood);
        
        if (spotifyPlaylist.length > 0) {
            showStatusMessage('Using live Spotify data! 🎵', 'success');
            return spotifyPlaylist;
        }
        
        console.log('🔄 Spotify API returned no songs, trying JSON Server...');
    }
    
    // Fallback to JSON Server
    console.log('📁 Using JSON Server...');
    const jsonPlaylist = await getPlaylistFromJSONServer(mood);
    
    if (jsonPlaylist.length > 0) {
        showStatusMessage('Using JSON Server data 💾', 'info');
        return jsonPlaylist;
    }
    
    // Ultimate fallback - demo data
    console.log('⚠️ Both sources failed, using demo data');
    showStatusMessage('Using demo data 🎵', 'warning');
    return getDemoPlaylist(mood);
}

// Demo data as last resort
function getDemoPlaylist(mood) {
    const demoData = {
        happy: [
            {
                title: "Happy",
                artist: "Pharrell Williams",
                spotifyId: "60nZcImufyMA1MKQY3dcCH",
                albumArt: "https://i.scdn.co/image/ab67616d0000b27386a8ab515de4b7aef28cd631",
                source: 'demo-fallback'
            }
        ],
        sad: [
            {
                title: "Someone Like You",
                artist: "Adele",
                spotifyId: "1zwMYTA5nlNjZxYrvBB2pV",
                albumArt: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
                source: 'demo-fallback'
            }
        ]
    };
    
    return demoData[mood] || [];
}

// When user selects a mood
async function selectMood(mood) {
    currentMood = mood;
    const data = moodData[mood];

    // Update UI
    updateUIForMood(mood, data);
    
    // Show loading message
    showLoadingMessage(mood);
    
    // Get playlist using smart fetcher
    await generatePlaylist(mood);
}

// Update UI for selected mood
function updateUIForMood(mood, data) {
    document.documentElement.style.setProperty('--bg-color1', data.color1);
    document.documentElement.style.setProperty('--bg-color2', data.color2);

    document.getElementById('mood-selection').style.display = 'none';
    document.getElementById('results').style.display = 'block';
    document.getElementById('results').style.animation = 'fadeIn 0.5s ease';

    document.getElementById('selected-mood-title').textContent = 
        `${data.emoji} ${mood.charAt(0).toUpperCase() + mood.slice(1)} Playlist`;
}

// Show loading message
function showLoadingMessage(mood) {
    const source = usingSpotifyAPI ? 'Spotify' : 'JSON Server';
    document.getElementById('playlist-container').innerHTML = 
        `<div style="color: white; text-align: center; font-size: 1.5em; padding: 40px;">
            🎵 Searching ${source} for ${mood} songs...
        </div>`;
}

// Generate playlist using smart approach
async function generatePlaylist(mood) {
    try {
        currentPlaylist = await getPlaylistSmart(mood);
        
        if (currentPlaylist.length > 0) {
            displayPlaylist();
            
            // Log source statistics
            const sources = currentPlaylist.reduce((acc, song) => {
                acc[song.source] = (acc[song.source] || 0) + 1;
                return acc;
            }, {});
            
            console.log('📊 Playlist sources:', sources);
            
        } else {
            showErrorMessage('No songs found for this mood. Please try another mood.');
        }
    } catch (error) {
        console.error('Error generating playlist:', error);
        showErrorMessage('Failed to load playlist. Please try again.');
    }
}

// Display playlist with source indicators
function displayPlaylist() {
    const container = document.getElementById('playlist-container');
    container.innerHTML = '';

    currentPlaylist.forEach((song, index) => {
        const songCard = createSongCard(song, index);
        container.appendChild(songCard);
    });
}

// Create song card with source badge
function createSongCard(song, index) {
    const songCard = document.createElement('div');
    songCard.className = 'song-card';
    songCard.style.animation = `slideIn 0.5s ease ${index * 0.1}s both`;
    
    // Source badge
    const sourceBadge = song.source === 'spotify-live' 
        ? '<span style="background: #48BB78; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.7em; margin-left: 8px;">LIVE</span>'
        : '<span style="background: #4299E1; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.7em; margin-left: 8px;">CACHED</span>';
    
    songCard.innerHTML = `
        <div class="song-info">
            ${song.albumArt ? `
                <img src="${song.albumArt}" alt="Album Art" 
                     style="width: 60px; height: 60px; border-radius: 5px; margin-right: 15px; float: left;">
            ` : ''}
            <div style="overflow: hidden;">
                <div class="song-title">
                    ${song.title}
                    ${sourceBadge}
                </div>
                <div class="song-artist">${song.artist}</div>
                ${song.previewUrl ? `
                    <audio controls style="width: 100%; margin-top: 10px; height: 30px;">
                        <source src="${song.previewUrl}" type="audio/mpeg">
                    </audio>
                ` : ''}
                ${song.popularity ? `
                    <div style="font-size: 0.8em; color: #666; margin-top: 5px;">
                        Popularity: ${song.popularity}/100
                    </div>
                ` : ''}
            </div>
        </div>
        <div class="video-container">
            <iframe 
                src="https://open.spotify.com/embed/track/${song.spotifyId}?utm_source=generator&theme=0" 
                width="100%" 
                height="152" 
                frameborder="0" 
                allowfullscreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy">
            </iframe>
        </div>
    `;
    
    return songCard;
}

// Show error message
function showErrorMessage(message) {
    document.getElementById('playlist-container').innerHTML = 
        `<div style="color: white; text-align: center; font-size: 1.2em; padding: 40px;">
            ${message}
        </div>`;
}

// Shuffle playlist
function shufflePlaylist() {
    if (currentPlaylist.length > 0) {
        currentPlaylist = [...currentPlaylist].sort(() => 0.5 - Math.random());
        displayPlaylist();
        console.log('🔀 Playlist shuffled!');
        showStatusMessage('Playlist shuffled!', 'info');
    }
}

// Go back to mood selection
function goBackToMoods() {
    document.getElementById('results').style.display = 'none';
    document.getElementById('mood-selection').style.display = 'grid';
    document.documentElement.style.setProperty('--bg-color1', '#667eea');
    document.documentElement.style.setProperty('--bg-color2', '#764ba2');
}