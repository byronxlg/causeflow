import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import React from "react";

interface PromptBarProps {
    event: string;
    onEventChange: (event: string) => void;
    onGenerate: () => void;
    loading: boolean;
    onExampleClick: (example: string) => void;
}

const PLACEHOLDERS = [
    "ChatGPT-4 released",
    "Elon Musk buys Twitter",
    "Apple Vision Pro launched",
    "Taylor Swift becomes billionaire",
    "Hamas attacks Israel",
    "Russia invades Ukraine",
    "King Charles crowned",
    "Turkey earthquake disaster",
    "Silicon Valley Bank fails",
    "EU passes AI Act",
];

const LOADING_STATES = [
    { text: "Understanding your event..." },
    { text: "Searching for historical context..." },
    { text: "Identifying key causal factors..." },
    { text: "Tracing backward through time..." },
    { text: "Finding connecting events..." },
    { text: "Finalizing causal chain..." },
];

export function PromptBar({
    event,
    onEventChange,
    onGenerate,
    loading,
}: PromptBarProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onEventChange(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!loading && event.trim()) {
            onGenerate();
        }
    };

    if (loading) {
        return (
            <>
                <MultiStepLoader
                    loadingStates={LOADING_STATES}
                    loading={loading}
                    duration={3000}
                    loop={true}
                />
                <div className="w-full max-w-4xl mx-auto relative opacity-50">
                    <PlaceholdersAndVanishInput
                        placeholders={PLACEHOLDERS}
                        onChange={() => {}} // Disabled during loading
                        onSubmit={() => {}} // Disabled during loading
                    />
                </div>
            </>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto relative">
            <PlaceholdersAndVanishInput
                placeholders={PLACEHOLDERS}
                onChange={handleChange}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
