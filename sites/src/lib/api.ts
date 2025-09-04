import { Client, Functions, Account } from "appwrite";
import type { GenerateRequest, GenerateResponse } from "./types";
import { generateResponseSchema } from "./types";

const IS_LOCAL = import.meta.env.VITE_ENV === "local";
const API_BASE = `${
    import.meta.env.VITE_LOCAL_API_HOST || "http://localhost:3000"
}/api`;

// Appwrite client setup
const client = new Client();
client
    .setEndpoint(
        import.meta.env.VITE_APPWRITE_ENDPOINT ||
            "https://cloud.appwrite.io/v1",
    )
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || "");

// Set the locale for better error messages
if (typeof window !== 'undefined') {
    client.headers['X-Appwrite-Response-Format'] = '1.6.0';
}

// Initialize services
export const account = new Account(client);
let functions: Functions | null = null;

if (!IS_LOCAL) {
    functions = new Functions(client);
}

export class ApiError extends Error {
    public status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

export async function generateCausalChain(
    payload: GenerateRequest,
): Promise<GenerateResponse> {
    if (IS_LOCAL) {
        // Local API call using fetch
        const response = await fetch(`${API_BASE}/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = "Failed to generate causal chain";

            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.detail || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            throw new ApiError(response.status, errorMessage);
        }

        const data = await response.json();
        return generateResponseSchema.parse(data);
    } else {
        // Appwrite function call
        if (!functions) {
            throw new ApiError(500, "Appwrite functions not initialized");
        }

        try {
            const result = await functions.createExecution(
                "68b8201e0034fdb29ab0",
                JSON.stringify(payload),
            );

            if (result.responseStatusCode !== 200) {
                let errorMessage = "Failed to generate causal chain";

                try {
                    const errorData = JSON.parse(result.responseBody);
                    errorMessage = errorData.detail || errorMessage;
                } catch {
                    errorMessage = result.responseBody || errorMessage;
                }

                throw new ApiError(result.responseStatusCode, errorMessage);
            }

            const data = JSON.parse(result.responseBody);
            return generateResponseSchema.parse(data);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new ApiError(
                500,
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
            );
        }
    }
}

// Authentication utilities
export const auth = {
    // Register with email and password
    async register(email: string, password: string) {
        try {
            // Create account using the newer method
            const user = await account.create('unique()', email, password);
            return user;
        } catch (error: any) {
            const errorMessage = error?.message || 'Registration failed';
            throw new ApiError(400, errorMessage);
        }
    },

    // Login with email and password
    async login(email: string, password: string) {
        try {
            // Create session using the newer method
            const session = await account.createEmailPasswordSession(email, password);
            return session;
        } catch (error: any) {
            const errorMessage = error?.message || 'Login failed';
            throw new ApiError(401, errorMessage);
        }
    },

    // Get current user
    async getCurrentUser() {
        try {
            return await account.get();
        } catch (error) {
            return null;
        }
    },

    // Logout
    async logout() {
        try {
            return await account.deleteSession('current');
        } catch (error: any) {
            const errorMessage = error?.message || 'Logout failed';
            throw new ApiError(400, errorMessage);
        }
    },

    // Check if user is logged in
    async isLoggedIn() {
        try {
            await account.get();
            return true;
        } catch {
            return false;
        }
    }
};
