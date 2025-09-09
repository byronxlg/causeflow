import { PromptBar } from "@/components/PromptBar";
import { Timeline } from "@/components/Timeline";
import { LandingPage } from "@/components/LandingPage";
import { Toaster } from "@/components/ui/sonner";
import { AuthModal } from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { ApiError, generateCausalChain } from "@/lib/api";
import type { GenerateRequest, QueryState } from "@/lib/types";
import { encodeUrlState } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Route, LogIn, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function App() {
    const { user, loading: authLoading, logout } = useAuth();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [showLandingPage, setShowLandingPage] = useState(true);
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
        if (!showLandingPage && (
            state.event ||
            state.perspective !== "balanced" ||
            state.detailLevel !== 5 ||
            state.verify
        )) {
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
    }, [state.event, state.perspective, state.detailLevel, state.verify, showLandingPage]);

    // Show landing page when there's no result and no loading
    useEffect(() => {
        if (!state.result && !state.loading && !showLandingPage) {
            setShowLandingPage(true);
        }
    }, [state.result, state.loading, showLandingPage]);

    const handleGenerate = async (currentState?: QueryState) => {
        if (!user) {
            toast.error("Please sign in to generate causal chains");
            setAuthModalOpen(true);
            return;
        }

        const stateToUse = currentState || state;

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
            const oldestStep = state.result.steps[state.result.steps.length - 1];

            const request: GenerateRequest = {
                event: `${oldestStep.summary} (expand historical context)`,
                perspective: state.perspective,
                detailLevel: Math.max(3, state.detailLevel - 1), // Slightly less detail for additional events
            };

            const result = await generateCausalChain(request);

            // Merge the new steps with existing ones, avoiding duplicates
            const newSteps = result.steps.filter(newStep =>
                !state.result!.steps.some(existingStep =>
                    existingStep.summary.toLowerCase().includes(newStep.summary.toLowerCase().substring(0, 50)) ||
                    existingStep.title.toLowerCase() === newStep.title.toLowerCase()
                )
            );

            if (newSteps.length > 0) {
                setState((prev) => ({
                    ...prev,
                    result: prev.result ? {
                        ...prev.result,
                        steps: [...prev.result.steps, ...newSteps]
                    } : prev.result
                }));

                toast.success(`Added ${newSteps.length} more historical events`);
            } else {
                toast.info("No additional unique events found in this time period");
            }
        } catch (error) {
            console.error("More events error:", error);
            let errorMessage = "Failed to load more events";

            if (error instanceof ApiError) {
                if (error.status === 429) {
                    errorMessage = "Rate limit exceeded. Please try again later.";
                } else if (error.status === 400) {
                    errorMessage = "Invalid request. Please try a different approach.";
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

    const handleLogout = async () => {
        try {
            await logout();
            setState({
                event: "",
                perspective: "balanced",
                detailLevel: 5,
                verify: false,
                loading: false,
            });
            toast.success("Successfully logged out");
        } catch (error: any) {
            toast.error(error.message || "Logout failed");
        }
    };

    // Show landing page initially (even during auth loading)
    if (showLandingPage) {
        return (
            <>
                <LandingPage
                    event={state.event}
                    onEventChange={handleEventChange}
                    onGenerate={() => handleGenerate()}
                    loading={state.loading || authLoading}
                    onExampleClick={handleExampleClick}
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
            <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-chart-1 rounded-lg flex justify-center items-center mb-4 mx-auto">
                        <Route />
                    </div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20 flex flex-col">
            {/* Header */}
            <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-chart-1 rounded-lg flex justify-center items-center">
                                <Route />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Butterfly
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            {user ? (
                                <>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <User size={16} />
                                        <span>{user.name || user.email}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleLogout}
                                    >
                                        <LogOut size={16} />
                                        Sign Out
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => setAuthModalOpen(true)}
                                >
                                    <LogIn size={16} />
                                    Sign In
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {/* Prompt bar */}
                <div className="mb-8">
                    {!state.result && (
                        <PromptBar
                            event={state.event}
                            onEventChange={handleEventChange}
                            onGenerate={() => handleGenerate()}
                            loading={state.loading}
                            onExampleClick={handleExampleClick}
                        />
                    )}
                </div>

                {/* Content area */}
                <div className="min-h-[400px]">
                    {state.result && !state.loading ? (
                        <Timeline
                            data={state.result}
                            onRequestMoreEvents={handleRequestMoreEvents}
                            loadingMoreEvents={loadingMoreEvents}
                            onNewEventAnalysis={handleNewEventAnalysis}
                        />
                    ) : state.loading ? (
                        <Timeline data={null as any} loading={true} />
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
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                            >
                                GitHub
                            </a>
                            <a
                                href="https://linkedin.com"
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
