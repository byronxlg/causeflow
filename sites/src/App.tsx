import { EmptyState } from "@/components/EmptyState";
import { PromptBar } from "@/components/PromptBar";
import { Timeline } from "@/components/Timeline";
import { Toaster } from "@/components/ui/sonner";
import { ApiError, generateCausalChain } from "@/lib/api";
import type { GenerateRequest, Perspective, QueryState } from "@/lib/types";
import { decodeUrlState, encodeUrlState } from "@/lib/utils";
import { Route } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function App() {
    const [state, setState] = useState<QueryState>({
        event: "",
        perspective: "balanced",
        detailLevel: 5,
        verify: false, // Keep for URL state compatibility
        loading: false,
    });

    // URL state management
    useEffect(() => {
        // Load from URL hash on mount
        const urlState = decodeUrlState(window.location.hash);
        if (urlState.event) {
            const newState = {
                event: "",
                perspective: "balanced" as Perspective,
                detailLevel: 5,
                verify: false,
                loading: false,
                ...urlState,
            };
            setState(newState);
            // Don't auto-generate, let user initiate
        }
    }, []);

    // Update URL when state changes
    useEffect(() => {
        if (
            state.event ||
            state.perspective !== "balanced" ||
            state.detailLevel !== 5 ||
            state.verify
        ) {
            const params = encodeUrlState(state);
            const newHash = params ? `#${params}` : "";
            if (window.location.hash !== newHash) {
                window.history.replaceState(
                    null,
                    "",
                    newHash || window.location.pathname,
                );
            }
        }
    }, [state.event, state.perspective, state.detailLevel, state.verify]);

    const handleGenerate = async (currentState?: QueryState) => {
        const stateToUse = currentState || state;

        if (!stateToUse.event.trim()) {
            toast.error("Please enter an event to analyze");
            return;
        }

        setState((prev) => ({ ...prev, loading: true, error: undefined }));

        try {
            const request: GenerateRequest = {
                event: stateToUse.event.trim(),
                perspective: stateToUse.perspective,
                detailLevel: stateToUse.detailLevel,
            };

            const result = await generateCausalChain(request);

            setState((prev) => ({
                ...prev,
                result,
                loading: false,
            }));

            toast.success(`Generated ${result.steps.length} causal steps`);
        } catch (error) {
            console.error("Generation error:", error);
            let errorMessage = "Failed to generate causal chain";

            if (error instanceof ApiError) {
                if (error.status === 429) {
                    errorMessage =
                        "Rate limit exceeded. Please try again later.";
                } else if (error.status === 400) {
                    errorMessage = "Invalid request. Please check your input.";
                }
            }

            setState((prev) => ({
                ...prev,
                loading: false,
                error: errorMessage,
            }));

            toast.error(errorMessage);
        }
    };

    const handleExampleClick = (example: string) => {
        setState((prev) => ({ ...prev, event: example }));
        // Don't auto-generate, let user press enter or click button
    };

    const handleEventChange = (event: string) => {
        setState((prev) => ({ ...prev, event }));
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Skip if user is typing in an input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            switch (e.key) {
                case "Enter":
                    if (state.event.trim() && !state.loading) {
                        e.preventDefault();
                        handleGenerate();
                    }
                    break;
                case "Escape":
                    if (state.result) {
                        e.preventDefault();
                        setState((prev) => ({
                            ...prev,
                            result: undefined,
                            event: "",
                        }));
                    }
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [state.event, state.loading, state.result]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex justify-center items-center">
                                <Route />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Butterfly
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Prompt bar */}
                <div className="mb-8">
                    <PromptBar
                        event={state.event}
                        onEventChange={handleEventChange}
                        onGenerate={() => handleGenerate()}
                        loading={state.loading}
                        onExampleClick={handleExampleClick}
                    />
                </div>

                {/* Content area */}
                <div className="min-h-[400px]">
                    {state.result && !state.loading ? (
                        <Timeline data={state.result} />
                    ) : state.loading ? (
                        <Timeline data={null as any} loading={true} />
                    ) : (
                        <EmptyState onExampleClick={handleExampleClick} />
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white/60 border-t border-orange-200 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="text-center text-sm text-gray-500">
                        <p>
                            AI-generated causal analysis • Review critically •
                            Built with ❤️
                        </p>
                    </div>
                </div>
            </footer>

            {/* Toast notifications */}
            <Toaster position="top-right" />
        </div>
    );
}

export default App;
