# Butterfly Causal Analysis Function

This directory contains both an Appwrite Function and a standalone FastAPI server for causal chain analysis.

## Structure

```
butterfly/
├── src/
│   ├── main.py              # Appwrite Function entry point
│   └── causal_analysis.py   # Pure causal analysis logic
├── server.py                # Standalone FastAPI server
├── run_server.py            # Server startup script
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables
└── README.md                # This file
```

## Components

### 1. Core Analysis (`src/causal_analysis.py`)
- Pure Python logic for causal chain analysis
- Uses LangChain + OpenAI + Tavily Search
- No web framework dependencies
- Reusable across different deployment contexts

### 2. Appwrite Function (`src/main.py`)
- Lightweight wrapper for Appwrite Functions
- Uses the pure analysis logic
- Handles Appwrite-specific request/response format

### 3. Standalone FastAPI Server (`server.py`)
- Full-featured REST API for local development
- CORS support, rate limiting, health checks
- Uses the same pure analysis logic
- OpenAPI documentation at `/docs`

## Usage

### Running the Appwrite Function
Deploy to Appwrite Functions platform - the `src/main.py` will be the entry point.

### Running the Standalone Server
```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python run_server.py

# Or directly
python server.py
```

The server will start on `http://127.0.0.1:8000` by default.

### API Endpoints

#### POST `/api/generate`
Generate a causal chain analysis.

**Request:**
```json
{
  "event": "OpenAI releases GPT-4",
  "perspective": "balanced",
  "detail_level": 5
}
```

**Response:**
```json
{
  "event": "OpenAI releases GPT-4",
  "generated_at": "2024-01-01T12:00:00Z",
  "perspective": "balanced",
  "steps": [
    {
      "id": "c1",
      "title": "OpenAI completes GPT-4 training",
      "summary": "Final training phase completed after months of compute-intensive training on diverse datasets",
      "when": "2023-12",
      "mechanism": "Large-scale transformer training with reinforcement learning from human feedback",
      "evidence_needed": null,
      "sources": [],
      "depends_on": ["c2"]
    }
  ]
}
```

#### GET `/health`
Health check endpoint.

#### GET `/`
API information and available endpoints.

## Environment Variables

```bash
# OpenAI API
OPENAI_API_KEY=your_openai_key
MODEL_NAME=gpt-4o-mini  # optional

# Tavily Search API
TAVILY_API_KEY=your_tavily_key

# Server configuration (for standalone server)
HOST=127.0.0.1      # optional
PORT=8000           # optional
RELOAD=true         # optional

# CORS configuration
ALLOWED_ORIGIN=http://localhost:5173  # optional
```

## Development

The code is structured to separate concerns:

- **Pure logic** in `causal_analysis.py` - no web framework dependencies
- **Appwrite integration** in `src/main.py` - minimal wrapper
- **FastAPI server** in `server.py` - full-featured API for development

This allows the same core logic to work in both Appwrite Functions (serverless) and as a standalone API server.