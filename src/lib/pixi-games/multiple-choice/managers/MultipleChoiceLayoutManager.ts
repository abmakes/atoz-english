export interface LayoutProfile {
    questionFontSize: number;
    questionWrapMultiplier: number;
    questionYMultiplier: number;
    questionWrapFontSize: number;
    questionWrapYMultiplier: number;
    answerColumns: number;
    answerButtonWidthMultiplier: number;
    answerButtonHeightMultiplier: number;
    answerButtonFontSize: number;
    answerContainerYMultiplier: number;
    answerButtonGap: number;
    answerButtonWrapFontSize: number;
    answerButtonWrapHeightMultiplier: number;
    imageMaxHeightMultiplier: number;
    topPadding: number;
    bottomPadding: number;
    sidePadding: number;
}

export class MultipleChoiceLayoutManager {
    private currentLayoutProfile!: LayoutProfile;

    // Define a default profile (e.g., for 16:9 aspect ratio)
    private readonly defaultProfile: LayoutProfile = {
        questionFontSize: 44,
        questionWrapMultiplier: 0.75,
        questionWrapFontSize: 38,
        questionWrapYMultiplier: 0.55,
        questionYMultiplier: 0.73, // Position question text to maintain ~15px gap
        answerColumns: 2, // 2 columns for answer buttons (question will span both)
        answerButtonWidthMultiplier: 0.38,
        answerButtonHeightMultiplier: 0.25,
        answerButtonFontSize: 32,
        answerContainerYMultiplier: 0.85,
        answerButtonGap: 15,
        answerButtonWrapFontSize: 24,
        answerButtonWrapHeightMultiplier: 0.27,
        imageMaxHeightMultiplier: 0.4,
        topPadding: 20,
        bottomPadding: 40,
        sidePadding: 40,
    };

    constructor(initialScreenWidth: number, initialScreenHeight: number) {
        console.log("LayoutManager: Initializing with dimensions:", initialScreenWidth, "x", initialScreenHeight);
        this.updateLayout(initialScreenWidth, initialScreenHeight);
    }

    public updateLayout(screenWidth: number, screenHeight: number): void {
        console.log("LayoutManager: Updating layout for dimensions:", screenWidth, "x", screenHeight);
        this.currentLayoutProfile = this._getLayoutParameters(screenWidth, screenHeight);
        console.log("LayoutManager: New profile:", this.currentLayoutProfile);
    }

    public getLayoutParams(): LayoutProfile {
        if (!this.currentLayoutProfile) {
            throw new Error("LayoutManager: Layout profile accessed before initial calculation.");
        }
        return this.currentLayoutProfile;
    }

    private _getLayoutParameters(screenWidth: number, screenHeight: number): LayoutProfile {
        const aspectRatio = screenWidth / screenHeight;
        console.log("LayoutManager: Calculating parameters for aspect ratio:", aspectRatio);

        // Create a copy of the default profile to modify
        const responsiveProfile = { ...this.defaultProfile };

        // Apply responsive scaling based on screen height
        this._applyResponsiveScaling(responsiveProfile, screenHeight);

        console.log("LayoutManager: Applied responsive scaling for height:", screenHeight);
        return responsiveProfile;
    }

    /**
     * Apply responsive scaling based on screen height
     * - For heights < 600px: Scale down button height and adjust other elements
     * - For heights >= 600px: Keep max button height at 90px and allow images to scale up
     */
    private _applyResponsiveScaling(profile: LayoutProfile, screenHeight: number): void {
        const baseHeight = 600; // Reference height
        const minHeight = 400;  // Minimum height for scaling
        const maxHeight = 1000; // Maximum height for scaling

        // Clamp screen height to reasonable bounds
        const clampedHeight = Math.max(minHeight, Math.min(maxHeight, screenHeight));
        
        if (clampedHeight < baseHeight) {
            // Scale down for smaller screens
            const scaleFactor = Math.max(0.6, clampedHeight / baseHeight); // Minimum 60% of original size
            
            // Scale button height more aggressively for small screens
            const buttonHeightScale = Math.max(0.5, scaleFactor * 0.8);
            profile.answerButtonHeightMultiplier *= buttonHeightScale;
            
            // Reduce font sizes proportionally
            profile.answerButtonFontSize = Math.round(profile.answerButtonFontSize * scaleFactor);
            profile.questionFontSize = Math.round(profile.questionFontSize * scaleFactor);
            profile.questionWrapFontSize = Math.round(profile.questionWrapFontSize * scaleFactor);
            profile.answerButtonWrapFontSize = Math.round(profile.answerButtonWrapFontSize * scaleFactor);
            
            // Reduce padding proportionally
            profile.topPadding = Math.round(profile.topPadding * scaleFactor);
            profile.bottomPadding = Math.round(profile.bottomPadding * scaleFactor);
            profile.sidePadding = Math.round(profile.sidePadding * scaleFactor);
            
            // Reduce gaps
            profile.answerButtonGap = Math.round(profile.answerButtonGap * scaleFactor);
            
            // Allow images to take more space on small screens
            profile.imageMaxHeightMultiplier = Math.min(0.5, profile.imageMaxHeightMultiplier * 1.2);
            
            // Move question text lower on small screens to maintain 10-12px gap
            profile.questionYMultiplier = Math.min(0.85, profile.questionYMultiplier + 0.08);
            
            console.log(`LayoutManager: Applied small screen scaling (factor: ${scaleFactor.toFixed(2)})`);
            
        } else if (clampedHeight > baseHeight) {
            // Scale up for larger screens
            const scaleFactor = Math.min(1.3, clampedHeight / baseHeight); // Maximum 130% of original size
            
            // Enforce maximum button height of 90px regardless of screen size
            const maxButtonHeightPx = 90;
            const maxButtonHeightMultiplier = maxButtonHeightPx / clampedHeight;
            profile.answerButtonHeightMultiplier = Math.min(maxButtonHeightMultiplier, profile.answerButtonHeightMultiplier);
            
            // Scale up font sizes moderately
            profile.answerButtonFontSize = Math.round(profile.answerButtonFontSize * Math.min(1.1, scaleFactor));
            profile.questionFontSize = Math.round(profile.questionFontSize * Math.min(1.1, scaleFactor));
            profile.questionWrapFontSize = Math.round(profile.questionWrapFontSize * Math.min(1.1, scaleFactor));
            profile.answerButtonWrapFontSize = Math.round(profile.answerButtonWrapFontSize * Math.min(1.1, scaleFactor));
            
            // Reduce padding for larger screens to give more space to images
            profile.topPadding = Math.round(profile.topPadding * 0.5); // Reduce top padding significantly
            profile.bottomPadding = Math.round(profile.bottomPadding * 0.5); // Reduce bottom padding significantly
            profile.sidePadding = Math.round(profile.sidePadding * Math.min(1.2, scaleFactor)); // Keep side padding moderate
            
            // Allow images to take significantly more space on large screens
            profile.imageMaxHeightMultiplier = Math.min(0.6, profile.imageMaxHeightMultiplier * 1.5);
            
            // Move question text closer to the image on large screens
            profile.questionYMultiplier = Math.max(0.65, profile.questionYMultiplier - 0.05);
            
            console.log(`LayoutManager: Applied large screen scaling (factor: ${scaleFactor.toFixed(2)}, max button height: ${maxButtonHeightPx}px)`);
        }
    }
}
