# Spotify LLM Recommendations

A Node.js application that connects to your Spotify account, analyzes your listening habits, and uses various LLM providers to generate personalized music recommendations and AI-curated themed playlists.

*Created with assistance from Claude Sonnet 3.7*

## Features

- **Spotify OAuth Integration** - Securely connect to your Spotify account
- **Music Taste Analysis** - Analyze your top artists, tracks, and recent listening history
- **Personalized Recommendations** - Get AI-powered music suggestions tailored to your taste
- **Feedback System** - Like or dislike recommendations to improve future suggestions
- **AI-Curated Themed Playlists** - Create playlists based on any theme (mood, activity, genre) with tracks specifically selected by AI
- **Multiple LLM Support** - Choose from Ollama, OpenAI, Claude, Gemini, or Grok
- **Lightweight Design** - Uses SQLite for minimal resource usage

## Installation

### Option 1: Clone from GitHub

```bash
# Clone the repository
git clone https://github.com/tsella/spotify-llm-recommendations.git
cd spotify-llm-recommendations

# Install dependencies
npm install

# Create data directory
mkdir -p data

# Create and configure .env file
cp .env.example .env
# Edit .env with your credentials
```

### Option 2: Manual Setup

```bash
# Create project directory
mkdir spotify-llm-recommendations
cd spotify-llm-recommendations

# Initialize the project
npm init -y

# Install dependencies
npm install axios connect-sqlite3 dotenv ejs express express-session querystring spotify-web-api-node sqlite3

# Dev dependencies
npm install --save-dev nodemon

# Create data directory
mkdir -p data

# Create .env file with your credentials
```

## Configuration

Create a `.env` file with the following variables:

```
# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback

# Database Configuration
DB_PATH=./data/spotify.db
SESSION_SECRET=your_session_secret
PORT=3000

# LLM Provider Configuration
# Options: ollama, openai, claude, gemini, grok
LLM_PROVIDER=ollama

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Other LLM configurations as needed
# See .env.example for all options
```

### Spotify Developer Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Create a new application
3. Set `http://localhost:3000/auth/callback` as a Redirect URI
4. Copy your Client ID and Client Secret to the `.env` file
5. Make sure to include the necessary scopes (already configured in the app):
   - user-read-private
   - user-read-email
   - user-top-read
   - user-read-recently-played
   - playlist-read-private
   - playlist-modify-private

### LLM Setup

#### Ollama (Default, Local)
1. Install [Ollama](https://ollama.ai)
2. Run `ollama pull llama3`
3. Start Ollama with `ollama serve`

For other LLM providers (OpenAI, Claude, Gemini, Grok), get the appropriate API keys and add them to your `.env` file.

## Usage

```bash
# Start the application
npm start

# Development mode with auto-reload
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Features in Detail

### Music Recommendations
- Analysis of your music taste based on Spotify listening data
- Personalized artist and track recommendations with explanations
- Interactive interface to provide feedback and improve future suggestions

### AI-Curated Themed Playlists
- Create playlists based on any theme, mood, activity, or genre
- AI generates creative playlist names and descriptions
- **LLM-Powered Track Selection** - The AI selects specific tracks that match your theme
- Tracks are automatically added to your Spotify account

### LLM Provider Options
- **Ollama**: Free, local, open-source models (default)
- **OpenAI**: GPT models (GPT-4, GPT-3.5)
- **Claude**: Anthropic's Claude models
- **Gemini**: Google's Gemini models
- **Grok**: Elon Musk's xAI Grok model

## Project Structure

```
spotify-llm-recommendations/
├── app.js                   # Main application entry point
├── package.json            # Project dependencies
├── .env.example            # Environment variables template
├── data/                   # Database storage (created at runtime)
├── public/                 # Static assets
│   └── css/                # Stylesheets
│       └── style.css       # Centralized CSS file
├── routes/                 # Express routes
│   ├── auth.js             # Authentication routes
│   ├── spotify.js          # Spotify data routes
│   ├── recommendations.js  # Recommendation routes
│   └── playlists.js        # Playlist creation routes
├── services/               # Business logic
│   ├── spotify.js          # Spotify API interactions
│   ├── playlist.js         # Playlist generation
│   ├── llm.js              # Main LLM service
│   └── llm/                # LLM provider implementations
│       ├── index.js        # LLM provider factory
│       ├── base.js         # Base LLM class
│       ├── ollama.js       # Ollama implementation
│       ├── openai.js       # OpenAI implementation
│       ├── claude.js       # Claude implementation
│       ├── gemini.js       # Google Gemini implementation
│       └── grok.js         # xAI Grok implementation
├── models/                 # Data models
│   └── feedback.js         # Feedback storage and retrieval
├── views/                  # EJS templates
│   ├── partials/           # Reusable template parts
│   │   ├── header.ejs      # Common head section
│   │   ├── navbar.ejs      # Navigation bar
│   │   └── footer.ejs      # Common footer section
│   ├── index.ejs           # Home page
│   ├── dashboard.ejs       # User dashboard
│   ├── recommendations.ejs # Recommendations page
│   ├── error.ejs           # Error page
│   └── playlists/          # Playlist templates
│       ├── create.ejs      # Playlist creation page
│       └── list.ejs        # Playlist listing page
├── utils/                  # Utility functions
    └── helpers.js          # Helper functions
```

## UI Improvements

This project features a modern, consistent UI with:
- **Centralized Styling** - All styles in a single CSS file for easy maintenance
- **Component-Based Architecture** - Reusable EJS partials for common elements
- **Dark Theme** - Spotify-inspired dark theme with accessible text
- **Responsive Design** - Works on mobile and desktop devices

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Claude Sonnet 3.7's assistance
- Uses the [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- Powered by various LLM providers
- @CapitalAdult for the idea
