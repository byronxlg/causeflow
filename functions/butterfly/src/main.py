import json
import os
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph
from pydantic import BaseModel, Field


# Pydantic models
class GenerateRequest(BaseModel):
    event: str = Field(..., min_length=5, max_length=300)
    detail_level: int = Field(default=5, ge=1, le=7)
    perspective: str = Field(default="balanced")


class Source(BaseModel):
    title: str
    url: str


class CauseStep(BaseModel):
    id: str
    title: str
    summary: str
    when: str
    confidence: str
    mechanism: str
    evidence_needed: str | None = None
    sources: list[Source] = []
    depends_on: list[str] = []


class GenerateResponse(BaseModel):
    event: str
    generated_at: str
    perspective: str
    steps: list[CauseStep]


# LangGraph State
class CausalState(BaseModel):
    event: str
    perspective: str
    detail_level: int
    raw_response: str | None = None
    structured_steps: list[dict] | None = None
    verified_steps: list[CauseStep] | None = None
    error: str | None = None


# Initialize tools
openai_client = ChatOpenAI(
    model=os.getenv("MODEL_NAME", "gpt-4o-mini"), api_key=os.getenv("OPENAI_API_KEY"), temperature=0.3
)

tavily_search = TavilySearchResults(api_key=os.getenv("TAVILY_API_KEY"), max_results=3)

# System prompt for causal analysis
SYSTEM_PROMPT = """You produce reverse-chronological causal chains for current events.
Requirements:

- Start at the event ("present") and move backward in time.
- 6-10 steps, succinct (<= 60 words per step).
- Prefer concrete mechanisms (decisions, policies, shocks) over vague factors.
- Annotate each step with confidence: High | Medium | Low.
- If confidence < High, add "evidence_needed" with what would verify it (1 line).
- Output VALID JSON matching the provided JSON schema EXACTLY. No extra text.
- If you are unsure of dates, give best known granularity (YYYY or YYYY-MM).
- Avoid speculation beyond commonly accepted causal links.

JSON schema to follow:
{
  "steps": [
    {
      "id": "c1",
      "title": "string",
      "summary": "string",
      "when": "YYYY or YYYY-MM or YYYY-MM-DD",
      "confidence": "High|Medium|Low",
      "mechanism": "string",
      "evidence_needed": "string (optional)",
      "depends_on": ["c2", "c3"]
    }
  ]
}

Return ONLY the JSON."""


def generate_causal_chain(state: CausalState) -> CausalState:
    """Generate the initial causal chain using OpenAI."""
    try:
        user_prompt = f"""Event: "{state.event}"
Perspective: "{state.perspective}"
Detail level (1-7): {state.detail_level}

Generate a reverse-chronological causal chain starting from this event and working backward in time."""

        messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=user_prompt)]

        response = openai_client.invoke(messages)
        state.raw_response = response.content

        # Parse the JSON response
        try:
            parsed = json.loads(response.content)
            state.structured_steps = parsed.get("steps", [])
        except json.JSONDecodeError as e:
            state.error = f"Failed to parse JSON response: {e}"

    except (KeyError, ValueError, TypeError) as e:
        state.error = f"OpenAI generation failed: {e}"

    return state


def verify_with_search(state: CausalState) -> CausalState:
    """Verify causal steps using Tavily search and add sources."""
    if state.error or not state.structured_steps:
        return state

    verified_steps = []

    for i, step_data in enumerate(state.structured_steps):
        try:
            # Create the step object
            step = CauseStep(
                id=step_data.get("id", f"c{i + 1}"),
                title=step_data.get("title", ""),
                summary=step_data.get("summary", ""),
                when=step_data.get("when", ""),
                confidence=step_data.get("confidence", "Medium"),
                mechanism=step_data.get("mechanism", ""),
                evidence_needed=step_data.get("evidence_needed"),
                depends_on=step_data.get("depends_on", []),
            )

            # Search for verification if confidence is not High
            if step.confidence != "High" and step.evidence_needed:
                try:
                    search_query = f"{step.title} {step.when}"
                    search_results = tavily_search.invoke({"query": search_query})

                    # Parse search results and add as sources
                    sources = [
                        Source(title=result.get("title", "Search Result"), url=result.get("url", ""))
                        for result in search_results[:2]  # Limit to 2 sources per step
                        if isinstance(result, dict)
                    ]

                    step.sources = sources

                except (ValueError, KeyError, TypeError):
                    # Continue without sources - search API issues are non-critical
                    pass

            verified_steps.append(step)

        except (KeyError, TypeError, ValueError):  # noqa: PERF203
            # Skip malformed steps
            continue

    state.verified_steps = verified_steps
    return state


def should_verify(state: CausalState) -> str:
    """Decide whether to verify steps with search."""
    if state.error:
        return "end"
    return "verify"


# Create the LangGraph workflow
def create_causal_workflow() -> CompiledStateGraph:  # type: ignore[return-value]
    workflow = StateGraph(CausalState)

    # Add nodes
    workflow.add_node("generate", generate_causal_chain)
    workflow.add_node("verify", verify_with_search)

    # Add edges
    workflow.add_edge(START, "generate")
    workflow.add_conditional_edges("generate", should_verify, {"verify": "verify", "end": END})
    workflow.add_edge("verify", END)

    return workflow.compile()


# Initialize the workflow
causal_workflow = create_causal_workflow()

# FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("ALLOWED_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Rate limiting (simple in-memory)
request_counts = {}
RATE_LIMIT_WINDOW = 60  # 1 minute
RATE_LIMIT_MAX = 10


def check_rate_limit(ip: str) -> bool:
    now = datetime.now(timezone.utc).timestamp()
    if ip not in request_counts:
        request_counts[ip] = []

    # Clean old requests
    request_counts[ip] = [req_time for req_time in request_counts[ip] if now - req_time < RATE_LIMIT_WINDOW]

    if len(request_counts[ip]) >= RATE_LIMIT_MAX:
        return False

    request_counts[ip].append(now)
    return True


@app.post("/api/generate")
async def generate_causal_analysis(request: GenerateRequest, client_ip: str = "127.0.0.1") -> GenerateResponse:
    """Generate causal chain analysis for an event."""

    # Rate limiting
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    try:
        # Create initial state
        initial_state = CausalState(
            event=request.event, perspective=request.perspective, detail_level=request.detail_level
        )

        # Run the workflow
        final_state = causal_workflow.invoke(initial_state)

        if final_state.error:
            raise HTTPException(status_code=500, detail=final_state.error)

        if not final_state.verified_steps:
            raise HTTPException(status_code=500, detail="No causal steps generated")

        # Create response
        return GenerateResponse(
            event=request.event,
            generated_at=datetime.now(timezone.utc).isoformat(),
            perspective=request.perspective,
            steps=final_state.verified_steps,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}") from e


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


# For Appwrite Functions
def main(_context: object) -> FastAPI:
    """Appwrite Functions entry point."""
    return app
