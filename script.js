// Mood Playlist Generator - Student Project
// This is my attempt to combine JSON Server and Spotify API
// Hope this works! 😅

// My Spotify app credentials from developer.spotify.com
const SPOTIFY_CLIENT_ID = '3d10d56b42b84ab0a3fd9264c85e69b3';
const SPOTIFY_CLIENT_SECRET = '9ff0f659abd04eac8f6ccbf43cc15877';
const JSON_SERVER_URL = 'http://localhost:3000';

// Global variables I need to keep track of
let spotifyToken = '';
let currentMood = '';
let currentSongs = [];
let usingRealSpotify = false;

// All the mood data - spent a lot of time picking these songs!
const moodPlaylists = {
    happy: {
        color1: '#FFD700',
        color2: '#FF6B9D', 
        emoji: '😊',
        // These are the search terms for Spotify
        spotifySearches: [
            'Happy Pharrell Williams',
            'Good Vibrations Beach Boys', 
            'Walking on Sunshine',
            'Uptown Funk',
            'September Earth Wind Fire'
        ]
    },
    sad: {
        color1: '#4A5568',
        color2: '#2D3748',
        emoji: '😢',
        spotifySearches: [
            'Someone Like You Adele',
            'The Night We Met Lord Huron',
            'Fix You Coldplay',
            'Hurt Johnny Cash',
            'Let Her Go Passenger'
        ]
    },
    energetic: {
        color1: '#FF4500', 
        color2: '#FF8C00',
        emoji: '⚡',
        spotifySearches: [
            'Eye of the Tiger Survivor',
            'Thunderstruck AC/DC',
            'We Will Rock You Queen',
            'Lose Yourself Eminem',
            'The Final Countdown Europe'
        ]
    }
    // ... I have more moods but shortened for example
};

// Try to get Spotify token when page loads
async function setupSpotify() {
    console.log('Trying to connect to Spotify...');
    
    try {
        // This is the Spotify API auth thing I learned about
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
            },
            body: 'grant_type=client_credentials'
        });
        
        if (!response.ok) {
            throw new Error('Spotify said no :(');
        }
        
        const data = await response.json();
        spotifyToken = data.access_token;
        usingRealSpotify = true;
        console.log('Yay! Connected to Spotify API 🎵');
        showMessage('Connected to Spotify!', 'good');
        
    } catch (error) {
        console.log('Spotify failed, will use JSON Server instead');
        usingRealSpotify = false;
        showMessage('Using local data (Spotify failed)', 'info');
    }
}

// Search for one song on Spotify
async function findSpotifySong(searchTerm) {
    try {
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchTerm)}&type=track&limit=1`,
            {
                headers: {
                    'Authorization': 'Bearer ' + spotifyToken
                }
            }
        );
              
        if (!response.ok) {
            throw new Error('Spotify search failed');
        }
        
        const data = await response.json();
        
        if (data.tracks.items.length > 0) {
            const track = data.tracks.items[0];
            return {
                title: track.name,
                artist: track.artists[0].name,
                spotifyId: track.id,
                albumArt: track.album.images[0]?.url,
                preview: track.preview_url,
                // Cool extra data from Spotify
                popularity: track.popularity,
                source: 'live' // Mark as live data
            };
        }
        
        return null;
        
    } catch (error) {
        console.log('Could not find song:', searchTerm);
        return null;
    }
}

// Get songs from my JSON Server
async function getSongsFromJSON(mood) {
    try {
        console.log('Getting songs from JSON Server...');
        
        const response = await fetch(`${JSON_SERVER_URL}/playlists/${mood}`);
        
        if (!response.ok) {
            throw new Error('JSON Server not working');
        }
        
        const songs = await response.json();
        
        // Add source info to each song
        return songs.map(song => ({
            ...song,
            source: 'cached'
        }));
        
    } catch (error) {
        console.log('JSON Server failed too');
        return [];
    }
}

// My main function to get songs - tries both sources!
async function getSongsForMood(mood) {
    console.log(`Getting songs for ${mood} mood...`);
    
    // First try: Spotify API (if it's working)
    if (usingRealSpotify && spotifyToken) {
        console.log('Trying Spotify API first...');
        
        const searches = moodPlaylists[mood].spotifySearches;
        const spotifySongs = [];
        
        // Try each search term
        for (let search of searches) {
            const song = await findSpotifySong(search);
            if (song) {
                spotifySongs.push(song);
                console.log(`Found: ${song.title}`);
            }
            
            // Wait a bit so we don't spam Spotify
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Stop when we have enough songs
            if (spotifySongs.length >= 4) break;
        }
        
        if (spotifySongs.length > 0) {
            showMessage('Using live Spotify data!', 'good');
            return spotifySongs;
        }
        
        console.log('Spotify returned no songs, trying JSON...');
    }
    
    // Second try: JSON Server
    console.log('Trying JSON Server...');
    const jsonSongs = await getSongsFromJSON(mood);
    
    if (jsonSongs.length > 0) {
        showMessage('Using cached data', 'info');
        return jsonSongs;
    }
    
    // Last resort: hardcoded backup songs
    console.log('Using backup songs...');
    showMessage('Using backup data', 'warning');
    return getBackupSongs(mood);
}


// Backup songs in case everything else fails
function getBackupSongs(mood) {
    const backupSongs = {
        happy: [
            {
                title: "Happy",
                artist: "Pharrell Williams",
                spotifyId: "60nZcImufyMA1MKQY3dcCH",
                albumArt: "https://i.scdn.co/image/ab67616d0000b27386a8ab515de4b7aef28cd631",
                source: 'backup'
            }
        ],
        sad: [
            {
                title: "Someone Like You",
                artist: "Adele",
                spotifyId: "1zwMYTA5nlNjZxYrvBB2pV", 
                albumArt: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
                source: 'backup'
            }
        ]
    };
    
    return backupSongs[mood] || [];
}

// When the page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('My Mood Playlist App is loading!');
    
    // Try to setup Spotify
    await setupSpotify();
    
    // Make mood cards clickable
    const moodCards = document.querySelectorAll('.mood-card');
    moodCards.forEach(card => {
        card.addEventListener('click', function() {
            const mood = this.getAttribute('data-mood');
            chooseMood(mood);
        });
    });

    // Setup buttons
    document.getElementById('shuffle-btn').addEventListener('click', mixUpSongs);
    document.getElementById('change-mood-btn').addEventListener('click', goBackToMoods);
    
    console.log('All ready! Click a mood to start :)');
});

// Show messages to user
function showMessage(text, type) {
    // Remove old message if exists
    const oldMsg = document.getElementById('user-message');
    if (oldMsg) oldMsg.remove();
    
    const msgDiv = document.createElement('div');
    msgDiv.id = 'user-message';
    msgDiv.textContent = text;
    msgDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 15px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        background: ${type === 'good' ? '#48BB78' : 
                     type === 'info' ? '#4299E1' : '#ED8936'};
    `;
    
    document.body.appendChild(msgDiv);
    
    // Hide after 3 seconds
    setTimeout(() => {
        if (msgDiv.parentNode) {
            msgDiv.remove();
        }
    }, 3000);
}

// When user picks a mood
async function chooseMood(mood) {
    currentMood = mood;
    const moodInfo = moodPlaylists[mood];

    // Change background colors
    document.documentElement.style.setProperty('--bg-color1', moodInfo.color1);
    document.documentElement.style.setProperty('--bg-color2', moodInfo.color2);

    // Show results section
    document.getElementById('mood-selection').style.display = 'none';
    document.getElementById('results').style.display = 'block';

    // Update title
    document.getElementById('selected-mood-title').textContent = 
        moodInfo.emoji + ' ' + mood.charAt(0).toUpperCase() + mood.slice(1) + ' Playlist';

    // Show loading message
    const loadingText = usingRealSpotify ? 
        'Searching Spotify for perfect songs...' : 
        'Loading your playlist...';
    
    document.getElementById('playlist-container').innerHTML = 
        `<div style="color: white; text-align: center; font-size: 1.5em; padding: 40px;">
            🎵 ${loadingText}
        </div>`;

    // Get the songs!
    await loadPlaylist(mood);
}
