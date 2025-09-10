import { Client, ID, Permission, Role, Storage } from "appwrite";
import type { GenerateRequest, GenerateResponse } from "./types";

// Appwrite client setup
const client = new Client();
client
    .setEndpoint(
        import.meta.env.VITE_APPWRITE_ENDPOINT ||
            "https://syd.cloud.appwrite.io/v1",
    )
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || "");

const storage = new Storage(client);

// Storage bucket ID
const STORAGE_BUCKET_ID = "68c145ad00133af3b044"; // user_history storage bucket

// IMPORTANT: Bucket Configuration Required
// In the Appwrite Console, ensure the storage bucket has these settings:
// 1. File Security: Enabled (this enforces file-level permissions)
// 2. Maximum File Size: Set appropriate limit (e.g., 10MB)
// 3. Allowed File Extensions: ["json"] (optional, for security)
// 4. Encryption: Enabled (recommended)
// 5. CORS Configuration: Add your frontend domain to allowed origins
//    - Go to Storage > Buckets > user_history > Settings
//    - Add allowed origins: ["*"] for development or your specific domain for production
//    - Example: ["http://localhost:5173", "https://yourdomain.com"]
//
// The file-level permissions are set programmatically when creating files,
// giving users read/update/delete access only to their own history files.

export interface HistoryItem {
    $id: string;
    $createdAt: string;
    userId: string;
    event: string;
    perspective: string;
    detailLevel: number;
    result: GenerateResponse;
}

// Interface for the JSON file structure
interface HistoryFileData {
    userId: string;
    event: string;
    perspective: string;
    detailLevel: number;
    result: GenerateResponse;
    createdAt: string;
}

export class HistoryService {
    // Check if history feature is available
    static isHistoryAvailable(): boolean {
        return true;
    }

    // Generate a filename for the history item
    static generateFileName(userId: string): string {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        return `${userId}_${timestamp}_${randomId}.json`;
    }

    // Helper method to fetch file content with CORS-friendly approach
    static async fetchFileContent(fileId: string): Promise<HistoryFileData> {
        try {
            // Try using direct fetch with cache-busting first
            const downloadUrl = storage.getFileDownload(STORAGE_BUCKET_ID, fileId);
            
            // Multiple cache-busting strategies
            const timestamp = Date.now();
            const random = Math.random();
            const cacheBustUrl = `${downloadUrl}?nocache=${timestamp}&rand=${random}&v=${Math.floor(timestamp/1000)}`;
            
            const response = await fetch(cacheBustUrl, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.warn('Direct fetch failed, trying alternative method:', error);
            
            // Fallback: Try using the download URL without additional parameters
            // This might work if CORS is configured but our cache-busting params are causing issues
            try {
                const downloadUrl = storage.getFileDownload(STORAGE_BUCKET_ID, fileId);
                const response = await fetch(downloadUrl, {
                    method: 'GET',
                    cache: 'no-store'
                });

                if (!response.ok) {
                    throw new Error(`Fallback fetch failed: ${response.status} ${response.statusText}`);
                }

                return await response.json();
            } catch (fallbackError) {
                console.error('All fetch methods failed:', fallbackError);
                throw new Error(`Failed to fetch file content. Please ensure CORS is configured for the storage bucket. Original error: ${error}`);
            }
        }
    }

    static async saveHistory(
        userId: string,
        request: GenerateRequest,
        result: GenerateResponse,
    ): Promise<HistoryItem> {
        if (!this.isHistoryAvailable()) {
            throw new Error(
                "History feature is not available - storage not configured",
            );
        }

        try {
            const fileId = ID.unique();
            const fileName = this.generateFileName(userId);
            const createdAt = new Date().toISOString();

            const historyData: HistoryFileData = {
                userId,
                event: request.event,
                perspective: request.perspective,
                detailLevel: request.detailLevel,
                result,
                createdAt,
            };

            // Create a File object with JSON data
            const jsonContent = JSON.stringify(historyData, null, 2);
            const file = new File([jsonContent], fileName, {
                type: "application/json",
            });

            // Upload to Appwrite Storage with user-specific permissions
            // User can read, update, and delete their own files
            const permissions = [
                Permission.read(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ];

            await storage.createFile(
                STORAGE_BUCKET_ID,
                fileId,
                file,
                permissions,
            );

            return {
                $id: fileId,
                $createdAt: createdAt,
                userId,
                event: request.event,
                perspective: request.perspective,
                detailLevel: request.detailLevel,
                result,
            };
        } catch (error: any) {
            console.error("Failed to save history:", error);

            if (error?.code === 404) {
                throw new Error(
                    "History storage bucket not found. Please check bucket configuration.",
                );
            }

            throw error;
        }
    }

    static async getUserHistory(
        userId: string,
        limit: number = 20,
    ): Promise<HistoryItem[]> {
        if (!this.isHistoryAvailable()) {
            return [];
        }

        try {
            // List files in the storage bucket (with permissions, this should only return user's own files)
            const response = await storage.listFiles(STORAGE_BUCKET_ID);

            // Filter files by userId and get the most recent ones
            // This is a double-check since permissions should already filter
            const userFiles = response.files
                .filter((file) => file.name.startsWith(`${userId}_`))
                .sort(
                    (a, b) =>
                        new Date(b.$createdAt).getTime() -
                        new Date(a.$createdAt).getTime(),
                )
                .slice(0, limit);

            // Download and parse each file
            const historyItems: HistoryItem[] = [];

            for (const file of userFiles) {
                try {
                    // Use helper method for cache-busted file fetch
                    const historyData: HistoryFileData = await this.fetchFileContent(file.$id);

                    historyItems.push({
                        $id: file.$id,
                        $createdAt: historyData.createdAt,
                        userId: historyData.userId,
                        event: historyData.event,
                        perspective: historyData.perspective,
                        detailLevel: historyData.detailLevel,
                        result: historyData.result,
                    });
                } catch (parseError) {
                    console.error(
                        `Failed to parse history file ${file.$id}:`,
                        parseError,
                    );
                    // Continue with other files
                }
            }

            return historyItems;
        } catch (error) {
            console.error("Failed to get user history:", error);
            return [];
        }
    }

    static async deleteHistoryItem(itemId: string): Promise<void> {
        try {
            await storage.deleteFile(STORAGE_BUCKET_ID, itemId);
        } catch (error) {
            console.error("Failed to delete history item:", error);
            throw error;
        }
    }

    static async updateHistory(
        fileId: string,
        userId: string,
        updatedResult: GenerateResponse,
    ): Promise<void> {
        try {
            // First, get the existing file info to preserve the original filename
            const fileList = await storage.listFiles(STORAGE_BUCKET_ID);
            const existingFile = fileList.files.find((f) => f.$id === fileId);

            if (!existingFile) {
                throw new Error(`History file with ID ${fileId} not found`);
            }

            // Get the existing file data with cache-busting
            const existingData: HistoryFileData = await this.fetchFileContent(fileId);

            // Update the result with new data
            const updatedData: HistoryFileData = {
                ...existingData,
                result: updatedResult,
            };

            // Create updated file content with the original filename
            const jsonContent = JSON.stringify(updatedData, null, 2);
            const file = new File([jsonContent], existingFile.name, {
                type: "application/json",
            });

            // Set user-specific permissions
            const permissions = [
                Permission.read(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ];

            // Delete the old file and create a new one with updated content
            // (Appwrite doesn't have direct file update, so we recreate it)
            await storage.deleteFile(STORAGE_BUCKET_ID, fileId);
            
            // Small delay to ensure file deletion is processed
            await new Promise(resolve => setTimeout(resolve, 100));
            
            await storage.createFile(
                STORAGE_BUCKET_ID,
                fileId,
                file,
                permissions,
            );
            
            // Small delay to ensure file creation is processed
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error("Failed to update history:", error);
            throw error;
        }
    }

    static async clearUserHistory(userId: string): Promise<void> {
        try {
            const history = await this.getUserHistory(userId, 100); // Get more items to clear

            // Delete in batches
            const deletePromises = history.map((item) =>
                this.deleteHistoryItem(item.$id),
            );

            await Promise.all(deletePromises);
        } catch (error) {
            console.error("Failed to clear user history:", error);
            throw error;
        }
    }
}
