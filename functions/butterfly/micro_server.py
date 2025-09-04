"""Micro FastAPI server for butterfly - absolute minimum."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.causal_analysis import GenerateRequest, GenerateResponse, analyze_causal_chain

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/generate")
def generate(request: GenerateRequest):
    try:
        result = analyze_causal_chain(request.event, request.perspective, request.detail_level)
        return result.model_dump()
    except Exception as e:  # noqa: BLE001
        raise HTTPException(400, str(e))  # noqa: B904


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)  # noqa: S104
