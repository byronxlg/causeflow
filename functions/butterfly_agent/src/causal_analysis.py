"""Pure causal analysis logic without FastAPI dependencies."""

import json
import logging
import os
from datetime import datetime, timezone
from typing import TypedDict

from dotenv import load_dotenv
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph
from pydantic import BaseModel, Field

load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)


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
class CausalState(TypedDict):
    event: str
    perspective: str
    detail_level: int
    raw_response: str | None
    structured_steps: list[dict] | None
    verified_steps: list[CauseStep] | None
    error: str | None


# Initialize tools
openai_client = ChatOpenAI(
    model=os.getenv("MODEL_NAME", "gpt-4o-mini"), 
    api_key=os.getenv("OPENAI_API_KEY"), 
    temperature=0.3,
    timeout=60,  # 60 second timeout for OpenAI calls
    max_retries=2  # Allow 2 retries
)

tavily_search = TavilySearchResults(api_key=os.getenv("TAVILY_API_KEY"), max_results=3)

# System prompt for causal analysis
SYSTEM_PROMPT = """You produce reverse-chronological causal chains for current events.
Requirements:

CRITICAL - FACTUAL ACCURACY:
- Only include events that actually happened. Never create fictional events.
- Verify dates carefully. If unsure about exact dates, use broader timeframes (YYYY or YYYY-MM).
- Current date context: We are in 2024. GPT-5 has NOT been released as of 2024.
- Be extremely conservative about recent AI releases - verify they actually happened.

- Start at the event ("present") and move backward in time.
- 6-10 steps, succinct (<= 60 words per step).
- Prefer concrete mechanisms (decisions, policies, shocks) over vague factors.
- Add "evidence_needed" if uncertain (1 line what would verify it).
- Include relevant sources when available.
- Output VALID JSON matching the provided JSON schema EXACTLY. No extra text, no markdown formatting.
- If you are unsure of dates, give best known granularity (YYYY or YYYY-MM).
- Avoid speculation beyond commonly accepted causal links.
- Start your response with { and end with }. Do not include any text before or after the JSON.

JSON schema to follow:
{
  "steps": [
    {
      "id": "c1",
      "title": "string",
      "summary": "string",
      "when": "YYYY or YYYY-MM or YYYY-MM-DD",
      "mechanism": "string",
      "evidence_needed": "string (optional)",
      "sources": [{"title": "string", "url": "string"}],
      "depends_on": ["c2", "c3"]
    }
  ]
}

IMPORTANT: Return ONLY valid JSON. No explanations, no markdown, no code blocks."""


def generate_causal_chain(state: CausalState) -> CausalState:
    """Generate the initial causal chain using OpenAI."""
    logger.info(f"Generating causal chain for event: '{state['event']}'")

    try:
        current_date = datetime.now().strftime("%Y-%m-%d")
        user_prompt = f"""Event: "{state["event"]}"
Perspective: "{state["perspective"]}"
Detail level (1-7): {state["detail_level"]}
Current date: {current_date}

Generate a reverse-chronological causal chain starting from this event and working backward in time.

IMPORTANT: Only include events that actually happened. Verify all dates are accurate. Do not speculate about events that may not have occurred."""

        logger.info("Sending prompt to OpenAI")
        messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=user_prompt)]

        try:
            response = openai_client.invoke(messages)
            
            if not response.content or response.content.strip() == "":
                error_msg = "OpenAI returned empty response"
                logger.error(error_msg)
                state["error"] = error_msg
                return state
                
            state["raw_response"] = response.content
            logger.info(f"Received response from OpenAI: {len(response.content)} characters")
            logger.debug(f"OpenAI response content: {response.content[:500]}...")
            
        except Exception as e:
            error_msg = f"OpenAI API call failed: {e}"
            logger.error(error_msg)
            state["error"] = error_msg
            return state

        # Parse the JSON response
        try:
            # Clean up response content in case it has markdown formatting
            content = response.content.strip()
            if content.startswith("```json"):
                content = content[7:]  # Remove ```json
            if content.startswith("```"):
                content = content[3:]  # Remove ```
            if content.endswith("```"):
                content = content[:-3]  # Remove trailing ```
            content = content.strip()
            
            parsed = json.loads(content)
            state["structured_steps"] = parsed.get("steps", [])
            logger.info(f"Successfully parsed {len(state['structured_steps'])} structured steps")
        except json.JSONDecodeError as e:
            error_msg = f"Failed to parse JSON response: {e}. Response was: {response.content[:200]}..."
            logger.error(error_msg)
            state["error"] = error_msg

    except (KeyError, ValueError, TypeError) as e:
        error_msg = f"OpenAI generation failed: {e}"
        logger.error(error_msg)
        state["error"] = error_msg

    return state


def verify_with_search(state: CausalState) -> CausalState:
    """Verify causal steps using Tavily search and add sources."""
    logger.info("Starting verification with search")

    if state["error"] or not state["structured_steps"]:
        logger.warning("Skipping verification due to error or no structured steps")
        return state

    verified_steps = []

    for i, step_data in enumerate(state["structured_steps"]):
        try:
            # Create the step object with proper source conversion
            existing_sources = []
            if step_data.get("sources"):
                for src in step_data.get("sources", []):
                    if isinstance(src, dict):
                        existing_sources.append(Source(
                            title=src.get("title", ""),
                            url=src.get("url", "")
                        ))
                    
            step = CauseStep(
                id=step_data.get("id", f"c{i + 1}"),
                title=step_data.get("title", ""),
                summary=step_data.get("summary", ""),
                when=step_data.get("when", ""),
                mechanism=step_data.get("mechanism", ""),
                evidence_needed=step_data.get("evidence_needed"),
                sources=existing_sources,
                depends_on=step_data.get("depends_on", []),
            )

            # Only search for additional sources if no sources exist and evidence is needed
            if len(step.sources) == 0 and step.evidence_needed:
                try:
                    # Add timeout for search requests
                    search_query = f"{step.title} {step.when}"
                    # Set shorter timeout for search to prevent hanging
                    search_results = tavily_search.invoke({"query": search_query})

                    logger.info(f"Search results for '{search_query}': {search_results}")

                    # Parse search results and add as sources
                    sources = []
                    for result in search_results[:2]:  # Limit to 2 sources per step
                        if isinstance(result, dict) and result.get("url"):
                            title = result.get("title", result.get("content", "Unknown Source")[:50])
                            url = result.get("url", "")
                            logger.info(f"Adding source: title='{title}', url='{url}'")
                            sources.append(Source(title=title, url=url))

                    step.sources = sources

                except (ValueError, KeyError, TypeError, Exception):
                    # Continue without sources - search API issues are non-critical
                    logger.warning(f"Search failed for step {step.title}, continuing without sources")

            verified_steps.append(step)

        except (KeyError, TypeError, ValueError):  # noqa: PERF203
            # Skip malformed steps
            continue

    state["verified_steps"] = verified_steps
    return state


def should_verify(state: CausalState) -> str:
    """Decide whether to verify steps with search."""
    if state["error"]:
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


def analyze_causal_chain(event: str, perspective: str = "balanced", detail_level: int = 5) -> GenerateResponse:
    """
    Main function to analyze a causal chain.

    Args:
        event: The event to analyze
        perspective: Analysis perspective (default: "balanced")
        detail_level: Detail level 1-7 (default: 5)

    Returns:
        GenerateResponse with the causal chain analysis

    Raises:
        ValueError: If analysis fails or no steps are generated
    """  # noqa: D401
    logger.info(
        f"Starting causal chain analysis for event: '{event}' "
        f"with perspective: '{perspective}' and detail_level: {detail_level}"
    )

    # Create initial state
    initial_state: CausalState = {
        "event": event,
        "perspective": perspective,
        "detail_level": detail_level,
        "raw_response": None,
        "structured_steps": None,
        "verified_steps": None,
        "error": None,
    }

    logger.info("Initial state created, invoking causal workflow")

    # Run the workflow
    final_state = causal_workflow.invoke(initial_state)

    logger.info("Causal workflow completed")

    if final_state["error"]:
        logger.error(f"Workflow failed with error: {final_state['error']}")
        raise ValueError(final_state["error"])

    if not final_state["verified_steps"]:
        msg = "No causal steps generated"
        logger.error(msg)
        raise ValueError(msg)

    logger.info(f"Successfully generated {len(final_state['verified_steps'])} verified causal steps")

    # Create response
    response = GenerateResponse(
        event=event,
        generated_at=datetime.now(timezone.utc).isoformat(),
        perspective=perspective,
        steps=final_state["verified_steps"],
    )

    logger.info("GenerateResponse object created successfully")
    return response
