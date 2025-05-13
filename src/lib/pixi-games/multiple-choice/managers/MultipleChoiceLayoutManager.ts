// PIXI import might not be strictly needed if only calculating, but keep for now if direct PIXI types are used.
// import * as PIXI from 'pixi.js';

export interface LayoutParameters {
    questionFontSize: number; // Now in logical units
    questionWrapWidth: number; // Now in logical units, derived from logicalWidth and multiplier
    questionY: number; // Now in logical units
    answerColumns: number;
    answerButtonWidth: number; // Now in logical units
    answerButtonHeight: number; // Now in logical units
    answerButtonFontSize: number; // Now in logical units
    answerContainerY: number; // Now in logical units
    answerContainerHeight: number; // Now in logical units
    answerButtonGap: number; // Now in logical units
    imageMaxHeight: number; // Now in logical units
    imageY: number; // Now in logical units
    topPadding: number; // Now in logical units
    bottomPadding: number; // Now in logical units
    sidePadding: number; // Now in logical units
}

// Define the structure for a logical resolution profile
interface LogicalProfile {
    name: string;
    logicalWidth: number;
    logicalHeight: number;
    aspectRatio: number;
    // Relative multipliers or fixed logical sizes for this profile's base design
    params: {
        questionFontSizeRatio: number; // e.g., 0.05 of logicalHeight
        questionWrapWidthRatio: number; // e.g., 0.9 of logicalWidth (after side padding)
        questionYRatio: number; // e.g., 0.15 of logicalHeight
        answerColumns: number;
        answerButtonWidthRatio: number; // e.g., 0.4 of (logicalWidth / columns - gap)
        answerButtonHeightRatio: number; // e.g., 0.1 of logicalHeight
        answerButtonFontSizeRatio: number; // e.g., 0.03 of logicalHeight
        answerContainerYRatio: number; // e.g., 0.6 of logicalHeight
        answerContainerHeightRatio: number; // e.g., 0.35 of logicalHeight
        answerButtonGapRatio: number; // e.g., 0.02 of logicalWidth
        imageMaxHeightRatio: number; // e.g., 0.25 of logicalHeight
        imageYRatio: number; // e.g., 0.05 of logicalHeight (top padding for image area)
        topPaddingRatio: number; // e.g., 0.02 of logicalHeight
        bottomPaddingRatio: number; // e.g., 0.02 of logicalHeight
        sidePaddingRatio: number; // e.g., 0.05 of logicalWidth
    };
}

// Define a few logical profiles
const PROFILE_16_9: LogicalProfile = {
    name: "16:9 Landscape",
    logicalWidth: 1280,
    logicalHeight: 720,
    aspectRatio: 16 / 9,
    params: {
        questionFontSizeRatio: 0.045, // Adjusted for typical 16:9
        questionWrapWidthRatio: 0.9, // Content width after padding
        questionYRatio: 0.30, // Y position after potential image
        answerColumns: 2,
        answerButtonWidthRatio: 0.45, // Relative to available column width
        answerButtonHeightRatio: 0.12,
        answerButtonFontSizeRatio: 0.035,
        answerContainerYRatio: 0.65,
        answerContainerHeightRatio: 0.30,
        answerButtonGapRatio: 0.015, // Gap relative to logical width
        imageMaxHeightRatio: 0.25,
        imageYRatio: 0.04,
        topPaddingRatio: 0.03,
        bottomPaddingRatio: 0.03,
        sidePaddingRatio: 0.04,
    }
};

const PROFILE_4_3: LogicalProfile = {
    name: "4:3 Landscape (Tablet-like)",
    logicalWidth: 1024,
    logicalHeight: 768,
    aspectRatio: 4 / 3,
    params: {
        questionFontSizeRatio: 0.05,
        questionWrapWidthRatio: 0.88,
        questionYRatio: 0.32,
        answerColumns: 2,
        answerButtonWidthRatio: 0.44,
        answerButtonHeightRatio: 0.11,
        answerButtonFontSizeRatio: 0.038,
        answerContainerYRatio: 0.68,
        answerContainerHeightRatio: 0.28,
        answerButtonGapRatio: 0.02,
        imageMaxHeightRatio: 0.28,
        imageYRatio: 0.05,
        topPaddingRatio: 0.04,
        bottomPaddingRatio: 0.04,
        sidePaddingRatio: 0.06,
    }
};

// Fallback/Default Profile (can be one of the above or a generic one)
const DEFAULT_PROFILE = PROFILE_16_9;

// Make LOGICAL_PROFILES and DEFAULT_PROFILE exportable for use in GameplayView
export const LOGICAL_PROFILES: LogicalProfile[] = [PROFILE_16_9, PROFILE_4_3];
export const DEFAULT_LOGICAL_PROFILE = DEFAULT_PROFILE;


export class MultipleChoiceLayoutManager {
    private currentLayoutParams!: LayoutParameters;
    private selectedLogicalProfile: LogicalProfile; // Store the profile itself
    private currentLogicalWidth: number;
    private currentLogicalHeight: number;
    // private currentScaleFactor: number = 1.0; // Removed

    constructor(selectedProfile: LogicalProfile = DEFAULT_LOGICAL_PROFILE) {
        this.selectedLogicalProfile = selectedProfile;
        this.currentLogicalWidth = this.selectedLogicalProfile.logicalWidth;
        this.currentLogicalHeight = this.selectedLogicalProfile.logicalHeight;
        console.log(`[MMLM] Constructor: Initialized with profile: '${this.selectedLogicalProfile.name}' (\${this.currentLogicalWidth}x\${this.currentLogicalHeight})`);
        this._calculateCurrentAbsoluteParams();
    }

    // updateScreenDimensions removed as it's no longer needed here.
    // Profile selection and scaling happen externally.
    
    private _calculateCurrentAbsoluteParams(): void {
        const profileParams = this.selectedLogicalProfile.params;
        const lw = this.currentLogicalWidth;
        const lh = this.currentLogicalHeight;

        const sidePadding = lh * profileParams.sidePaddingRatio; // Changed to be relative to logical height for consistency
        const topPadding = lh * profileParams.topPaddingRatio;
        const bottomPadding = lh * profileParams.bottomPaddingRatio;

        const contentWidth = lw - (2 * sidePadding);

        const imageMaxHeight = lh * profileParams.imageMaxHeightRatio;
        const imageY = topPadding + (lh * profileParams.imageYRatio); // Y pos for top of image area

        const questionFontSize = lh * profileParams.questionFontSizeRatio;
        const questionWrapWidth = contentWidth * profileParams.questionWrapWidthRatio;
        // Adjust questionY to be below image area, considering top padding for question itself
        const questionY = imageY + imageMaxHeight + (lh * 0.02); // Small gap after image

        const answerColumns = profileParams.answerColumns;
        const answerButtonGap = lw * profileParams.answerButtonGapRatio;
        
        const totalGapWidth = (answerColumns - 1) * answerButtonGap;
        const availableWidthForButtons = contentWidth - totalGapWidth;
        const answerButtonWidth = (availableWidthForButtons / answerColumns) * profileParams.answerButtonWidthRatio; // Width is relative to a single column's available space
          // Multiplier here should be closer to 1 if it's to fill column width.
          // Let's make it simple: width of one button.
          // const answerButtonWidth = (availableWidthForButtons / answerColumns);

        const answerButtonHeight = lh * profileParams.answerButtonHeightRatio;
        const answerButtonFontSize = lh * profileParams.answerButtonFontSizeRatio;
        
        const answerContainerHeight = lh * profileParams.answerContainerHeightRatio;
        const answerContainerY = lh - bottomPadding - answerContainerHeight;


        this.currentLayoutParams = {
            questionFontSize: Math.round(questionFontSize),
            questionWrapWidth: Math.round(questionWrapWidth),
            questionY: Math.round(questionY),
            answerColumns,
            answerButtonWidth: Math.round(answerButtonWidth),
            answerButtonHeight: Math.round(answerButtonHeight),
            answerButtonFontSize: Math.round(answerButtonFontSize),
            answerContainerY: Math.round(answerContainerY),
            answerContainerHeight: Math.round(answerContainerHeight),
            answerButtonGap: Math.round(answerButtonGap),
            imageMaxHeight: Math.round(imageMaxHeight),
            imageY: Math.round(imageY),
            topPadding: Math.round(topPadding),
            bottomPadding: Math.round(bottomPadding),
            sidePadding: Math.round(sidePadding),
        };
        console.log("[MMLM] Calculated Absolute Layout Params (Logical Units):", this.currentLayoutParams);
    }

    public getLayoutParams(): LayoutParameters {
        if (!this.currentLayoutParams) {
            // This should ideally not happen if constructor always calculates.
            console.warn("[MMLM] getLayoutParams called before params fully initialized. Forcing calculation with selected profile.");
            this._calculateCurrentAbsoluteParams();
        }
        return this.currentLayoutParams;
    }

    // getScaleFactor removed

    public getLogicalDimensions(): { width: number; height: number } {
        return {
            width: this.currentLogicalWidth,
            height: this.currentLogicalHeight,
        };
    }
}
