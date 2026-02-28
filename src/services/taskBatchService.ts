// src/services/taskBatchService.ts
// Service to manage task batch generation and tracking
// Ensures continuous task generation for long-duration goals

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal } from '@/domain/entities/Goal';
import { Task } from '@/domain/entities/Task';
import { GoalWizardData } from '@/presentation/components/goal/GoalWizard';
import { 
    BatchMetadata, 
    GeneratedWeeklyPatterns,
    generateHybridTasks,
    generateNextBatch,
    generateDefaultPatterns,
    shouldGenerateMoreTasks,
} from './hybridTaskService';

// ═══════════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEYS = {
    BATCH_METADATA: '@dreampath_batch_metadata',
    WEEKLY_PATTERNS: '@dreampath_weekly_patterns',
    WIZARD_DATA: '@dreampath_wizard_data',
};

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface GoalBatchInfo {
    metadata: BatchMetadata;
    patterns: GeneratedWeeklyPatterns;
    wizardData: GoalWizardData;
}

export interface BatchGenerationResult {
    newTasks: Task[];
    updatedMetadata: BatchMetadata;
    isComplete: boolean;
}

// ═══════════════════════════════════════════════════════════════
// BATCH METADATA STORAGE
// ═══════════════════════════════════════════════════════════════

/**
 * Save batch metadata for a goal
 */
export async function saveBatchMetadata(
    goalId: string,
    metadata: BatchMetadata
): Promise<void> {
    try {
        const allMetadata = await getAllBatchMetadata();
        allMetadata[goalId] = {
            ...metadata,
            lastGenerationDate: metadata.lastGenerationDate.toISOString(),
        };
        await AsyncStorage.setItem(STORAGE_KEYS.BATCH_METADATA, JSON.stringify(allMetadata));
        console.log('[BatchService] Batch metadata saved for goal:', goalId);
    } catch (error) {
        console.error('[BatchService] Error saving batch metadata:', error);
        throw error;
    }
}

/**
 * Get batch metadata for a specific goal
 */
export async function getBatchMetadata(goalId: string): Promise<BatchMetadata | null> {
    try {
        const allMetadata = await getAllBatchMetadata();
        const metadata = allMetadata[goalId];
        if (metadata) {
            return {
                ...metadata,
                lastGenerationDate: new Date(metadata.lastGenerationDate),
            };
        }
        return null;
    } catch (error) {
        console.error('[BatchService] Error getting batch metadata:', error);
        return null;
    }
}

/**
 * Get all batch metadata
 */
async function getAllBatchMetadata(): Promise<Record<string, any>> {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.BATCH_METADATA);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('[BatchService] Error getting all batch metadata:', error);
        return {};
    }
}

/**
 * Delete batch metadata for a goal
 */
export async function deleteBatchMetadata(goalId: string): Promise<void> {
    try {
        const allMetadata = await getAllBatchMetadata();
        delete allMetadata[goalId];
        await AsyncStorage.setItem(STORAGE_KEYS.BATCH_METADATA, JSON.stringify(allMetadata));
        console.log('[BatchService] Batch metadata deleted for goal:', goalId);
    } catch (error) {
        console.error('[BatchService] Error deleting batch metadata:', error);
    }
}

// ═══════════════════════════════════════════════════════════════
// WEEKLY PATTERNS STORAGE
// ═══════════════════════════════════════════════════════════════

/**
 * Save weekly patterns for a goal (for reuse in batch generation)
 */
export async function saveWeeklyPatterns(
    goalId: string,
    patterns: GeneratedWeeklyPatterns
): Promise<void> {
    try {
        const allPatterns = await getAllWeeklyPatterns();
        allPatterns[goalId] = patterns;
        await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PATTERNS, JSON.stringify(allPatterns));
        console.log('[BatchService] Weekly patterns saved for goal:', goalId);
    } catch (error) {
        console.error('[BatchService] Error saving weekly patterns:', error);
        throw error;
    }
}

/**
 * Get weekly patterns for a specific goal
 */
export async function getWeeklyPatterns(goalId: string): Promise<GeneratedWeeklyPatterns | null> {
    try {
        const allPatterns = await getAllWeeklyPatterns();
        return allPatterns[goalId] || null;
    } catch (error) {
        console.error('[BatchService] Error getting weekly patterns:', error);
        return null;
    }
}

async function getAllWeeklyPatterns(): Promise<Record<string, GeneratedWeeklyPatterns>> {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_PATTERNS);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('[BatchService] Error getting all weekly patterns:', error);
        return {};
    }
}

/**
 * Delete weekly patterns for a goal
 */
export async function deleteWeeklyPatterns(goalId: string): Promise<void> {
    try {
        const allPatterns = await getAllWeeklyPatterns();
        delete allPatterns[goalId];
        await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PATTERNS, JSON.stringify(allPatterns));
        console.log('[BatchService] Weekly patterns deleted for goal:', goalId);
    } catch (error) {
        console.error('[BatchService] Error deleting weekly patterns:', error);
    }
}

// ═══════════════════════════════════════════════════════════════
// WIZARD DATA STORAGE (for batch regeneration)
// ═══════════════════════════════════════════════════════════════

/**
 * Save wizard data for a goal (needed for batch regeneration)
 */
export async function saveWizardData(
    goalId: string,
    wizardData: GoalWizardData
): Promise<void> {
    try {
        const allData = await getAllWizardData();
        allData[goalId] = {
            ...wizardData,
            startDate: wizardData.startDate.toISOString(),
            targetDate: wizardData.targetDate.toISOString(),
        };
        await AsyncStorage.setItem(STORAGE_KEYS.WIZARD_DATA, JSON.stringify(allData));
        console.log('[BatchService] Wizard data saved for goal:', goalId);
    } catch (error) {
        console.error('[BatchService] Error saving wizard data:', error);
        throw error;
    }
}

/**
 * Get wizard data for a specific goal
 */
export async function getWizardData(goalId: string): Promise<GoalWizardData | null> {
    try {
        const allData = await getAllWizardData();
        const data = allData[goalId];
        if (data) {
            return {
                ...data,
                startDate: new Date(data.startDate),
                targetDate: new Date(data.targetDate),
            };
        }
        return null;
    } catch (error) {
        console.error('[BatchService] Error getting wizard data:', error);
        return null;
    }
}

async function getAllWizardData(): Promise<Record<string, any>> {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.WIZARD_DATA);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('[BatchService] Error getting all wizard data:', error);
        return {};
    }
}

// ═══════════════════════════════════════════════════════════════
// MAIN BATCH MANAGEMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize batch generation for a new goal
 * Called when goal is first created
 */
export async function initializeBatchGeneration(
    goal: Goal,
    wizardData: GoalWizardData,
    patterns: GeneratedWeeklyPatterns
): Promise<{ tasks: Task[]; metadata: BatchMetadata }> {
    console.log('[BatchService] Initializing batch generation for:', goal.id);
    
    // Generate first batch of tasks
    const { tasks, batchMetadata } = await generateHybridTasks(
        goal,
        wizardData,
        patterns,
        0 // Start from day 0
    );
    
    // Save all data for future batch generation
    await Promise.all([
        saveBatchMetadata(goal.id, batchMetadata),
        saveWeeklyPatterns(goal.id, patterns),
        saveWizardData(goal.id, wizardData),
    ]);
    
    return { tasks, metadata: batchMetadata };
}

/**
 * Check and generate next batch if needed
 * Should be called when user completes tasks or opens the app
 */
export async function checkAndGenerateNextBatch(
    goal: Goal,
    completedTasksCount: number,
    totalTasksInCurrentBatch: number
): Promise<BatchGenerationResult | null> {
    const metadata = await getBatchMetadata(goal.id);
    
    if (!metadata) {
        console.log('[BatchService] No batch metadata found for goal:', goal.id);
        return null;
    }
    
    // Check if we need to generate more tasks
    if (!shouldGenerateMoreTasks(metadata, completedTasksCount, totalTasksInCurrentBatch)) {
        console.log('[BatchService] No need to generate more tasks yet');
        return null;
    }
    
    // Check if goal is complete
    if (metadata.generatedUpToDay >= metadata.totalDays) {
        console.log('[BatchService] Goal task generation complete');
        return { newTasks: [], updatedMetadata: metadata, isComplete: true };
    }
    
    // Get stored patterns and wizard data
    const [patterns, wizardData] = await Promise.all([
        getWeeklyPatterns(goal.id),
        getWizardData(goal.id),
    ]);
    
    if (!patterns || !wizardData) {
        console.error('[BatchService] Missing patterns or wizard data for batch generation');
        return null;
    }
    
    // Generate next batch
    const { tasks, batchMetadata } = await generateNextBatch(
        goal,
        wizardData,
        patterns,
        metadata
    );
    
    // Save updated metadata
    await saveBatchMetadata(goal.id, batchMetadata);
    
    const isComplete = batchMetadata.generatedUpToDay >= batchMetadata.totalDays;
    
    return {
        newTasks: tasks,
        updatedMetadata: batchMetadata,
        isComplete,
    };
}

/**
 * Force generate more tasks (useful for manual refresh)
 */
export async function forceGenerateMoreTasks(
    goal: Goal,
    daysToGenerate?: number
): Promise<BatchGenerationResult | null> {
    const metadata = await getBatchMetadata(goal.id);
    
    if (!metadata || metadata.generatedUpToDay >= metadata.totalDays) {
        return null;
    }
    
    const [patterns, wizardData] = await Promise.all([
        getWeeklyPatterns(goal.id),
        getWizardData(goal.id),
    ]);
    
    if (!patterns || !wizardData) {
        return null;
    }
    
    const { tasks, batchMetadata } = await generateHybridTasks(
        goal,
        wizardData,
        patterns,
        metadata.generatedUpToDay,
        daysToGenerate
    );
    
    await saveBatchMetadata(goal.id, batchMetadata);
    
    return {
        newTasks: tasks,
        updatedMetadata: batchMetadata,
        isComplete: batchMetadata.generatedUpToDay >= batchMetadata.totalDays,
    };
}

/**
 * Get batch info for a goal
 */
export async function getGoalBatchInfo(goalId: string): Promise<GoalBatchInfo | null> {
    const [metadata, patterns, wizardData] = await Promise.all([
        getBatchMetadata(goalId),
        getWeeklyPatterns(goalId),
        getWizardData(goalId),
    ]);
    
    if (!metadata || !patterns || !wizardData) {
        return null;
    }
    
    return { metadata, patterns, wizardData };
}

/**
 * Clean up all batch data for a goal (when goal is deleted)
 */
export async function cleanupGoalBatchData(goalId: string): Promise<void> {
    await Promise.all([
        deleteBatchMetadata(goalId),
        deleteWeeklyPatterns(goalId),
    ]);
    console.log('[BatchService] Cleaned up batch data for goal:', goalId);
}

/**
 * Get batch progress statistics
 */
export async function getBatchProgress(goalId: string): Promise<{
    totalDays: number;
    generatedDays: number;
    remainingDays: number;
    progressPercent: number;
} | null> {
    const metadata = await getBatchMetadata(goalId);
    
    if (!metadata) return null;
    
    return {
        totalDays: metadata.totalDays,
        generatedDays: metadata.generatedUpToDay,
        remainingDays: metadata.totalDays - metadata.generatedUpToDay,
        progressPercent: Math.round((metadata.generatedUpToDay / metadata.totalDays) * 100),
    };
}

// ═══════════════════════════════════════════════════════════════
// SYNC-ENABLED FUNCTIONS (saves to both local + Firestore)
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize batch generation with Firestore sync
 * This version saves batch data to both local storage AND Firestore
 */
export async function initializeBatchGenerationWithSync(
    goal: Goal,
    wizardData: GoalWizardData,
    patterns: GeneratedWeeklyPatterns
): Promise<{ tasks: Task[]; metadata: BatchMetadata }> {
    console.log('[BatchService] Initializing batch generation with sync for:', goal.id);
    
    // Generate first batch of tasks
    const { tasks, batchMetadata } = await generateHybridTasks(
        goal,
        wizardData,
        patterns,
        0 // Start from day 0
    );
    
    // Save all data locally first
    await Promise.all([
        saveBatchMetadata(goal.id, batchMetadata),
        saveWeeklyPatterns(goal.id, patterns),
        saveWizardData(goal.id, wizardData),
    ]);
    
    // Also sync to Firestore
    try {
        const { auth } = await import('@/infrastructure/firebase/config');
        const userId = auth.currentUser?.uid;
        
        if (userId) {
            const {
                saveBatchMetadataToFirestore,
                saveWeeklyPatternsToFirestore,
                saveWizardDataToFirestore,
            } = await import('@/infrastructure/firebase/firestoreService');
            
            await Promise.all([
                saveBatchMetadataToFirestore(userId, goal.id, batchMetadata),
                saveWeeklyPatternsToFirestore(userId, goal.id, patterns),
                saveWizardDataToFirestore(userId, goal.id, wizardData),
            ]);
            console.log('[BatchService] Batch data synced to Firestore');
        }
    } catch (error) {
        console.warn('[BatchService] Failed to sync batch data to Firestore:', error);
        // Continue - local save succeeded
    }
    
    return { tasks, metadata: batchMetadata };
}

/**
 * Check and generate next batch with Firestore sync
 */
export async function checkAndGenerateNextBatchWithSync(
    goal: Goal,
    completedTasksCount: number,
    totalTasksInCurrentBatch: number
): Promise<BatchGenerationResult | null> {
    const result = await checkAndGenerateNextBatch(goal, completedTasksCount, totalTasksInCurrentBatch);
    
    if (!result || result.newTasks.length === 0) {
        return result;
    }
    
    // Sync updated metadata to Firestore
    try {
        const { auth } = await import('@/infrastructure/firebase/config');
        const userId = auth.currentUser?.uid;
        
        if (userId) {
            const { saveBatchMetadataToFirestore } = await import('@/infrastructure/firebase/firestoreService');
            await saveBatchMetadataToFirestore(userId, goal.id, result.updatedMetadata);
            console.log('[BatchService] Updated batch metadata synced to Firestore');
        }
    } catch (error) {
        console.warn('[BatchService] Failed to sync updated batch metadata:', error);
    }
    
    return result;
}

export default {
    // Metadata
    saveBatchMetadata,
    getBatchMetadata,
    deleteBatchMetadata,
    // Patterns
    saveWeeklyPatterns,
    getWeeklyPatterns,
    deleteWeeklyPatterns,
    // Wizard data
    saveWizardData,
    getWizardData,
    // Main functions (local only)
    initializeBatchGeneration,
    checkAndGenerateNextBatch,
    forceGenerateMoreTasks,
    getGoalBatchInfo,
    cleanupGoalBatchData,
    getBatchProgress,
    // Main functions (with Firestore sync)
    initializeBatchGenerationWithSync,
    checkAndGenerateNextBatchWithSync,
};
