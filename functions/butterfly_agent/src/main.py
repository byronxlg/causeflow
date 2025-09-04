"""Appwrite Function for causal chain analysis."""

import json
import logging

from .causal_analysis import analyze_causal_chain

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main(context):  # noqa: ANN001, ANN201
    """
    Appwrite Function entry point for causal chain analysis.

    Expected payload format:
    {
        "event": "string",
        "perspective": "balanced" (optional),
        "detailLevel": 5 (optional)
    }
    """
    try:
        logger.info("Function started")

        # Parse the payload
        if hasattr(context.req, "body"):
            payload = json.loads(context.req.body) if context.req.body else {}
            logger.info(f"Parsed payload from context.req.body: {payload}")
        else:
            # Fallback for different context structures
            payload = getattr(context, "payload", {})
            if isinstance(payload, str):
                payload = json.loads(payload)
            logger.info(f"Parsed payload from context.payload: {payload}")

        # Extract parameters
        event = payload.get("event", "").strip()
        perspective = payload.get("perspective", "balanced")
        detail_level = payload.get("detailLevel", 5)

        logger.info(
            f"Extracted parameters - event: {event}, perspective: {perspective}, detail_level: {detail_level}"
        )

        # Validate input
        if not event:
            logger.error("Missing required field: event")
            return context.res.json({"error": "Missing required field: event"}, 400)

        detail_level = max(1, min(int(detail_level), 10))  # Clamp between 1 and 10
        logger.info(f"Clamped detail_level: {detail_level}")

        # Run the analysis
        logger.info("Starting causal chain analysis")
        result = analyze_causal_chain(event=event, perspective=perspective, detail_level=detail_level)
        logger.info("Analysis completed successfully")

        # Convert Pydantic model to dict for JSON response
        response_data = result.model_dump()
        logger.info(f"Response data prepared: {len(str(response_data))} characters")

        return context.res.json(response_data, 200)

    except ValueError as e:
        logger.error(f"Analysis failed with ValueError: {e!s}")
        return context.res.json({"error": f"Analysis failed: {e!s}"}, 500)

    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e!s}")
        return context.res.json({"error": "Invalid JSON payload"}, 400)

    except Exception as e:
        logger.error(f"Unexpected error: {e!s}", exc_info=True)
        return context.res.json({"error": f"Internal server error: {e!s}"}, 500)
