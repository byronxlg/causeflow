"""Appwrite Function for causal chain analysis."""

import json

from .causal_analysis import analyze_causal_chain


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
        # Parse the payload
        if hasattr(context.req, "body"):
            payload = json.loads(context.req.body) if context.req.body else {}
        else:
            # Fallback for different context structures
            payload = getattr(context, "payload", {})
            if isinstance(payload, str):
                payload = json.loads(payload)

        # Extract parameters
        event = payload.get("event", "").strip()
        perspective = payload.get("perspective", "balanced")
        detail_level = payload.get("detailLevel", 5)

        # Validate input
        if not event:
            return context.res.json({"error": "Missing required field: event"}, 400)

        detail_level = max(1, min(int(detail_level), 10))  # Clamp between 1 and 10

        # Run the analysis
        result = analyze_causal_chain(event=event, perspective=perspective, detail_level=detail_level)

        # Convert Pydantic model to dict for JSON response
        response_data = result.model_dump()

        return context.res.json(response_data, 200)

    except ValueError as e:
        return context.res.json({"error": f"Analysis failed: {e!s}"}, 500)

    except json.JSONDecodeError:
        return context.res.json({"error": "Invalid JSON payload"}, 400)

    except Exception as e:  # noqa: BLE001
        return context.res.json({"error": f"Internal server error: {e!s}"}, 500)
