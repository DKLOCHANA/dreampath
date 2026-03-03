// src/services/contentFilterService.ts
// Client-side content filtering for quick pre-validation
// This runs locally before API calls to provide instant feedback

import { Alert } from 'react-native';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface FilterResult {
    blocked: boolean;
    category?: HarmfulCategory;
    reason?: string;
}

export type HarmfulCategory = 
    | 'violence'
    | 'terrorism'
    | 'illegal_drugs'
    | 'weapons'
    | 'self_harm'
    | 'exploitation'
    | 'fraud'
    | 'hacking'
    | 'harassment'
    | 'other';

// ═══════════════════════════════════════════════════════════════
// HARMFUL CONTENT PATTERNS (Client-side subset)
// ═══════════════════════════════════════════════════════════════

interface HarmfulPattern {
    pattern: RegExp;
    category: HarmfulCategory;
}

// High-priority patterns for quick client-side check
const HARMFUL_PATTERNS: HarmfulPattern[] = [
    // Violence & Murder - broad patterns
    { pattern: /\b(kill|murder|assassinate|poison)\b/i, category: 'violence' },
    { pattern: /\bharm(ing)?\s+(someone|people|person|him|her|them|others)\b/i, category: 'violence' },
    { pattern: /\bhurt\s+(someone|people|person|him|her|them)\b/i, category: 'violence' },
    
    // Terrorism & Explosives
    { pattern: /\b(terrorist|terrorism|terror\s+attack)\b/i, category: 'terrorism' },
    { pattern: /\b(bomb|explosive|detonate|ied)\b/i, category: 'terrorism' },
    { pattern: /\b(mass\s+shooting|mass\s+attack)\b/i, category: 'terrorism' },
    
    // Weapons
    { pattern: /\b(make|build|create)\s+(a\s+)?(gun|firearm|weapon)\b/i, category: 'weapons' },
    { pattern: /\billegal\s+(gun|firearm|weapon)\b/i, category: 'weapons' },
    
    // Illegal Drugs
    { pattern: /\b(make|cook|manufacture|sell)\s+(meth|cocaine|heroin|fentanyl|drugs)\b/i, category: 'illegal_drugs' },
    { pattern: /\bdrug\s+(dealing|trafficking|dealer)\b/i, category: 'illegal_drugs' },
    
    // Self-harm
    { pattern: /\b(kill|end)\s+(myself|my\s+life)\b/i, category: 'self_harm' },
    { pattern: /\bsuicide\b/i, category: 'self_harm' },
    
    // Exploitation
    { pattern: /\b(child|minor)\s+(porn|exploitation|abuse|trafficking)\b/i, category: 'exploitation' },
    { pattern: /\bhuman\s+trafficking\b/i, category: 'exploitation' },
    
    // Fraud
    { pattern: /\b(scam|defraud|steal\s+from)\s+(people|elderly|seniors)\b/i, category: 'fraud' },
    { pattern: /\bidentity\s+theft\b/i, category: 'fraud' },
    
    // Hacking
    { pattern: /\bhack\s+(into|someone|bank|company)\b/i, category: 'hacking' },
    { pattern: /\b(steal|breach)\s+(data|passwords|credentials)\b/i, category: 'hacking' },
    
    // Harassment
    { pattern: /\bstalk(ing)?\s+(someone|person|ex|him|her)\b/i, category: 'harassment' },
    { pattern: /\brevenge\s+porn\b/i, category: 'harassment' },
];

// ═══════════════════════════════════════════════════════════════
// USER-FRIENDLY MESSAGES
// ═══════════════════════════════════════════════════════════════

const BLOCK_MESSAGES: Record<HarmfulCategory, { title: string; message: string }> = {
    violence: {
        title: "Goal Not Supported",
        message: "DreamPath can't help with goals that involve harming others. Please choose a positive goal that improves your life."
    },
    terrorism: {
        title: "Goal Not Supported",
        message: "This goal involves harmful activities. DreamPath is designed to help you achieve positive life goals."
    },
    illegal_drugs: {
        title: "Goal Not Supported",
        message: "DreamPath can't assist with illegal drug-related activities. Consider focusing on health and wellness goals instead."
    },
    weapons: {
        title: "Goal Not Supported",
        message: "We can't help with goals involving illegal weapons. Try setting goals around legal hobbies or skills."
    },
    self_harm: {
        title: "We Care About You",
        message: "If you're struggling, please reach out to a crisis helpline. DreamPath is here to help you build a better future.\n\nNational Suicide Prevention Lifeline: 988"
    },
    exploitation: {
        title: "Goal Not Supported",
        message: "This type of goal is not something DreamPath can assist with. Please choose a goal that respects others' rights."
    },
    fraud: {
        title: "Goal Not Supported",
        message: "DreamPath can't help with fraudulent activities. Consider setting goals around building legitimate skills and income."
    },
    hacking: {
        title: "Goal Not Supported",
        message: "We can't assist with unauthorized access or cybercrime. Consider ethical cybersecurity or IT career goals instead."
    },
    harassment: {
        title: "Goal Not Supported",
        message: "DreamPath promotes positive relationships. We can't help with goals that harm or harass others."
    },
    other: {
        title: "Goal Not Supported",
        message: "This goal doesn't align with DreamPath's community guidelines. Please choose a different goal."
    }
};

// ═══════════════════════════════════════════════════════════════
// MAIN FILTER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if text contains harmful patterns (client-side)
 * @param text - The text to check
 * @returns FilterResult with blocked status
 */
export function checkGoalContent(text: string): FilterResult {
    console.log('[ContentFilter] Checking text:', text);
    
    if (!text || typeof text !== 'string') {
        console.log('[ContentFilter] No text to check');
        return { blocked: false };
    }

    const normalizedText = text.toLowerCase().trim();
    console.log('[ContentFilter] Normalized:', normalizedText);
    
    for (const { pattern, category } of HARMFUL_PATTERNS) {
        if (pattern.test(normalizedText)) {
            console.log(`[ContentFilter] BLOCKED - Category: ${category}, Pattern: ${pattern}`);
            return {
                blocked: true,
                category,
                reason: BLOCK_MESSAGES[category].message
            };
        }
    }

    console.log('[ContentFilter] SAFE - No harmful patterns found');
    return { blocked: false };
}

/**
 * Check multiple text fields at once
 * @param texts - Array of texts to check
 * @returns FilterResult - blocked if ANY text matches
 */
export function checkMultipleGoalContent(texts: (string | undefined)[]): FilterResult {
    for (const text of texts) {
        if (text) {
            const result = checkGoalContent(text);
            if (result.blocked) {
                return result;
            }
        }
    }
    return { blocked: false };
}

/**
 * Show a user-friendly alert for blocked content
 * @param filterResult - The filter result with category
 */
export function showBlockedGoalAlert(filterResult: FilterResult): void {
    const category = filterResult.category || 'other';
    const { title, message } = BLOCK_MESSAGES[category];
    
    Alert.alert(title, message, [{ text: 'OK' }]);
}

/**
 * Convenience function to check and show alert if blocked
 * @param title - Goal title
 * @param description - Goal description (optional)
 * @returns true if content is safe, false if blocked
 */
export function validateGoalContent(title: string, description?: string): boolean {
    const filterResult = checkMultipleGoalContent([title, description]);
    
    if (filterResult.blocked) {
        showBlockedGoalAlert(filterResult);
        return false;
    }
    
    return true;
}

// ═══════════════════════════════════════════════════════════════
// HANDLE API BLOCKED RESPONSE
// ═══════════════════════════════════════════════════════════════

/**
 * Check if API response indicates blocked content
 * @param response - API response object
 * @returns true if response indicates blocked content
 */
export function isBlockedResponse(response: any): boolean {
    return response?.blocked === true;
}

/**
 * Handle a blocked API response by showing alert
 * @param response - API response with blocked content
 */
export function handleBlockedApiResponse(response: any): void {
    const message = response?.message || BLOCK_MESSAGES.other.message;
    Alert.alert("Goal Not Supported", message, [{ text: 'OK' }]);
}
