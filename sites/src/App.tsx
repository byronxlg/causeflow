import { AuthModal } from "@/components/auth/AuthModal";
import { Header } from "@/components/Header";
import { LandingPage } from "@/components/LandingPage";
import { PromptBar } from "@/components/PromptBar";
import { Timeline } from "@/components/Timeline";
import { MultiStepLoaderInline } from "@/components/ui/multi-step-loader";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError, generateCausalChain } from "@/lib/api";
import { HistoryService, type HistoryItem } from "@/lib/history";
import type { GenerateRequest, QueryState } from "@/lib/types";
import { encodeUrlState } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const LOADING_STATES = [
    { text: "Understanding your event..." },
    { text: "Searching for historical context..." },
    { text: "Identifying key causal factors..." },
    { text: "Tracing backward through time..." },
    { text: "Finding connecting events..." },
    { text: "Finalizing causal chain..." },
];

function App() {
    const { user, loading: authLoading } = useAuth();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [showLandingPage, setShowLandingPage] = useState(true);
    const [pendingPrompt, setPendingPrompt] = useState<QueryState | null>(null);
    const [state, setState] = useState<QueryState>({
        event: "",
        perspective: "balanced",
        detailLevel: 5,
        verify: false, // Keep for URL state compatibility
        loading: false,
    });
    const [loadingMoreEvents, setLoadingMoreEvents] = useState(false);

    // URL state management
    useEffect(() => {
        // Always show landing page on reload and clear URL parameters
        if (window.location.hash) {
            // Clear the URL hash and replace with clean URL
            window.history.replaceState(null, "", window.location.pathname);
        }

        // Always start with landing page on reload
        setShowLandingPage(true);
        setState({
            event: "",
            perspective: "balanced",
            detailLevel: 5,
            verify: false,
            loading: false,
        });
    }, []);

    // Update URL when state changes (but not on landing page)
    useEffect(() => {
        // Only update URL when not on landing page and there are actual changes
        if (
            !showLandingPage &&
            (state.event ||
                state.perspective !== "balanced" ||
                state.detailLevel !== 5 ||
                state.verify)
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
    }, [
        state.event,
        state.perspective,
        state.detailLevel,
        state.verify,
        showLandingPage,
    ]);

    // Show landing page when there's no result and no loading
    useEffect(() => {
        if (!state.result && !state.loading && !showLandingPage) {
            setShowLandingPage(true);
        }
    }, [state.result, state.loading, showLandingPage]);

    // Handle pending prompt after login
    useEffect(() => {
        if (user && pendingPrompt && !authLoading) {
            // User just logged in and we have a pending prompt
            setState(pendingPrompt);
            setPendingPrompt(null);
            handleGenerate(pendingPrompt);
        }
    }, [user, pendingPrompt, authLoading]);

    const handleGenerate = async (currentState?: QueryState) => {
        const stateToUse = currentState || state;

        if (!user) {
            // Store the pending prompt with all current state
            setPendingPrompt(stateToUse);
            toast.error("Please sign in to generate causal chains");
            setAuthModalOpen(true);
            return;
        }

        if (!stateToUse.event.trim()) {
            toast.error("Please enter an event to analyze");
            return;
        }

        // Hide landing page when starting generation
        setShowLandingPage(false);
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

            // Save to history and track file ID for future updates
            try {
                const historyItem = await HistoryService.saveHistory(
                    user.$id,
                    request,
                    result,
                );
                setState((prev) => ({
                    ...prev,
                    currentHistoryFileId: historyItem.$id,
                }));
            } catch (error) {
                console.error("Failed to save to history:", error);
                // History is optional, don't show error to user
                // User can still use the app without history feature
            }

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

    const handleRequestMoreEvents = async () => {
        if (!user || !state.result) {
            toast.error("Unable to load more events");
            return;
        }

        setLoadingMoreEvents(true);

        try {
            // Get the oldest event as the starting point for more history
            const oldestStep =
                state.result.steps[state.result.steps.length - 1];

            const request: GenerateRequest = {
                event: `${oldestStep.summary} (expand historical context)`,
                perspective: state.perspective,
                detailLevel: Math.max(3, state.detailLevel - 1), // Slightly less detail for additional events
            };

            const result = await generateCausalChain(request);

            // Merge the new steps with existing ones, avoiding duplicates
            const newSteps = result.steps.filter(
                (newStep) =>
                    !state.result!.steps.some(
                        (existingStep) =>
                            existingStep.summary
                                .toLowerCase()
                                .includes(
                                    newStep.summary
                                        .toLowerCase()
                                        .substring(0, 50),
                                ) ||
                            existingStep.title.toLowerCase() ===
                                newStep.title.toLowerCase(),
                    ),
            );

            if (newSteps.length > 0) {
                const updatedResult = state.result
                    ? {
                          ...state.result,
                          steps: [...state.result.steps, ...newSteps],
                      }
                    : state.result;

                setState((prev) => ({
                    ...prev,
                    result: updatedResult,
                }));

                // Update the history file with the expanded timeline
                console.log("Attempting to update history - File ID:", state.currentHistoryFileId, "Has result:", !!updatedResult);
                console.log("Original steps:", state.result?.steps.length, "New steps:", newSteps.length, "Total steps:", updatedResult?.steps.length);
                if (state.currentHistoryFileId && updatedResult) {
                    try {
                        console.log("Updating history file with", updatedResult.steps.length, "steps");
                        await HistoryService.updateHistory(
                            state.currentHistoryFileId,
                            user.$id,
                            updatedResult,
                        );
                        console.log("History file updated successfully with expanded timeline");
                        toast.success("Timeline saved with expanded history");
                    } catch (error) {
                        console.error("Failed to update history file:", error);
                        toast.error("Failed to save expanded timeline to history");
                    }
                } else {
                    console.log("Skipping history update - Missing fileId or result");
                }

                toast.success(
                    `Added ${newSteps.length} more historical events`,
                );
            } else {
                toast.info(
                    "No additional unique events found in this time period",
                );
            }
        } catch (error) {
            console.error("More events error:", error);
            let errorMessage = "Failed to load more events";

            if (error instanceof ApiError) {
                if (error.status === 429) {
                    errorMessage =
                        "Rate limit exceeded. Please try again later.";
                } else if (error.status === 400) {
                    errorMessage =
                        "Invalid request. Please try a different approach.";
                }
            }

            toast.error(errorMessage);
        } finally {
            setLoadingMoreEvents(false);
        }
    };

    const handleEventChange = (event: string) => {
        setState((prev) => ({ ...prev, event }));
    };

    const handleNewEventAnalysis = () => {
        setState({
            event: "",
            perspective: "balanced",
            detailLevel: 5,
            verify: false,
            loading: false,
        });
        setShowLandingPage(true);
    };

    const handleSelectHistory = (item: HistoryItem) => {
        // Load the historical analysis
        setState({
            event: item.event,
            perspective: item.perspective as
                | "economic"
                | "political"
                | "social"
                | "technical"
                | "balanced",
            detailLevel: item.detailLevel,
            verify: false,
            loading: false,
            result: item.result,
            currentHistoryFileId: item.$id, // Track the loaded history file
        });
        setShowLandingPage(false);
        toast.success("Loaded historical analysis");
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

    // Show landing page initially (even during auth loading)
    if (showLandingPage) {
        return (
            <>
                <Header
                    onSignInClick={() => setAuthModalOpen(true)}
                    onSelectHistory={handleSelectHistory}
                />
                <LandingPage
                    event={state.event}
                    onEventChange={handleEventChange}
                    onGenerate={() => handleGenerate()}
                    loading={state.loading || authLoading}
                    onExampleClick={handleExampleClick}
                    isUserLoggedIn={!!user}
                />

                {/* Auth Modal */}
                <AuthModal
                    isOpen={authModalOpen}
                    onClose={() => setAuthModalOpen(false)}
                />

                <Toaster />
            </>
        );
    }

    // Show auth loading state for main interface if needed
    if (authLoading) {
        return (
            <>
                <Header
                    onSignInClick={() => setAuthModalOpen(true)}
                    onSelectHistory={handleSelectHistory}
                />
                <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20 flex items-center justify-center pt-20">
                    <div className="text-center">
                        <div className="w-8 h-8 animate-pulse bg-muted rounded-lg mb-4 mx-auto" />
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20 flex flex-col">
            <Header
                onSignInClick={() => setAuthModalOpen(true)}
                onSelectHistory={handleSelectHistory}
            />

            {/* Main content */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full pt-20">
                {/* Prompt bar */}
                <div className="mb-8">
                    {!state.result && (
                        <PromptBar
                            event={state.event}
                            onEventChange={handleEventChange}
                            onGenerate={() => handleGenerate()}
                            loading={state.loading}
                            onExampleClick={handleExampleClick}
                            isUserLoggedIn={!!user}
                        />
                    )}
                </div>

                {/* Content area */}
                <div className="min-h-[400px]">
                    {state.result && !state.loading ? (
                        <div className="space-y-8">
                            {/* Show capitalized event title */}
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-primary mb-2">
                                    {state.event.charAt(0).toUpperCase() +
                                        state.event.slice(1)}
                                </h2>
                                <p className="text-muted-foreground">
                                    Causal chain analysis completed
                                </p>
                            </div>
                            <Timeline
                                data={state.result}
                                onRequestMoreEvents={handleRequestMoreEvents}
                                loadingMoreEvents={loadingMoreEvents}
                                onNewEventAnalysis={handleNewEventAnalysis}
                            />
                        </div>
                    ) : state.loading ? (
                        <div className="space-y-8">
                            {/* Show capitalized event being analyzed */}
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-primary mb-2">
                                    {state.event.charAt(0).toUpperCase() +
                                        state.event.slice(1)}
                                </h2>
                                <p className="text-muted-foreground">
                                    Building causal chain for this event...
                                </p>
                            </div>
                            <MultiStepLoaderInline
                                loadingStates={LOADING_STATES}
                                loading={state.loading}
                                duration={3000}
                                loop={true}
                            />
                        </div>
                    ) : null}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-card/60 border-t border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-muted-foreground">
                            <p>AI-powered causal chain analysis</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <a
                                href="https://github.com/byronxlg/causeflow"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                            >
                                GitHub
                            </a>
                            <a
                                href="https://www.linkedin.com/in/byron-lg-smith/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                            >
                                LinkedIn
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Toast notifications */}
            <Toaster position="top-right" />

            {/* Auth modal */}
            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
            />
        </div>
    );
}

export default App;
