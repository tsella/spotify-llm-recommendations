# Spotify LLM Recommendations with Ollama

This guide will help you set up your Spotify recommendation system using Ollama for local LLM inference.

## Prerequisites

1. Node.js and npm installed
2. Ollama installed on your local machine
3. Spotify Developer account

## Installation Steps

### 1. Install Ollama

If you haven't already installed Ollama, you can get it from [https://ollama.ai/](https://ollama.ai/)

After installation, pull the LLama3 model (or another model of your choice):

```bash
ollama pull llama3
```

Make sure Ollama is running:

```bash
ollama serve
```

### 2. Clone and Set Up the Project

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
```

### 3. Create the Project Structure

Copy all the files from the code provided in earlier responses.

### 4. Set Up Your Environment Variables

Create a `.env` file in the root directory and fill in your credentials:

```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
DB_PATH=./data/spotify.db
SESSION_SECRET=your_random_secret_string
PORT=3000
```

### 5. Register Your Spotify Application

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in with your Spotify account
3. Create a new application
4. Note your Client ID and Client Secret
5. Add `http://localhost:3000/auth/callback` as a Redirect URI in your app settings
6. Select 'Web API'

### 6. Start the Application

```bash
# Create the data directory
mkdir -p data

# Start the server
npm start
```

Visit `http://localhost:3000` in your browser to use the application.

## Key Features

- **OAuth Authentication** with Spotify
- **Local LLM Inference** using Ollama
- **SQLite Database** for lightweight storage
- **Feedback System** to improve recommendations
- **Responsive UI** that works well on all devices

## Troubleshooting

### Ollama Connection Issues

If you encounter issues connecting to Ollama, verify:

1. Ollama is running (`ollama serve` in terminal)
2. The model is downloaded (`ollama pull llama3`)
3. The OLLAMA_BASE_URL is correct in your .env file

### Database Issues

If the SQLite database isn't working:

1. Make sure the `data` directory exists
2. Check permissions on the directory
3. Try manually creating the database file using the SQLite CLI:
   ```bash
   cd data
   sqlite3 spotify.db
   .quit
   ```

### Spotify API Issues

1. Verify your credentials are correct
2. Check that your redirect URI matches exactly what's in your Spotify Dashboard
3. Make sure you've added the correct scopes in your application

## Next Steps

- Add more models to Ollama for different recommendation styles
- Expand the feedback system to include more detailed preferences
- Add playlist creation from recommendations