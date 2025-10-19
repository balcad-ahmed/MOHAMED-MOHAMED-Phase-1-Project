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