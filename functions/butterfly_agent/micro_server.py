"""Micro FastAPI server for butterfly - absolute minimum."""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.causal_analysis import GenerateRequest, GenerateResponse, analyze_causal_chain

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/generate")
def generate(request: GenerateRequest):
    logger.info(f"Received generate request: event='{request.event}', perspective='{request.perspective}', detail_level={request.detail_level}")
    try:
        result = analyze_causal_chain(request.event, request.perspective, request.detail_level)
        logger.info("Analysis completed successfully")
        return result.model_dump()
    except Exception as e:  # noqa: BLE001
        logger.error(f"Analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(400, str(e))  # noqa: B904


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)  # noqa: S104
