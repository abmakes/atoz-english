export interface SplashDashLayoutProfile {
    // Control buttons
    controlButtonRadius: number;
    controlButtonPadding: number;
    
    // Question area
    questionContainerWidthMultiplier: number;
    questionImageWidth: number;
    questionImagePadding: number;
    questionFontSize: number;
    questionCounterFontSize: number;
    
    // Answer rectangles
    answerRectangleWidth: number;
    answerRectangleHeight: number;
    answerRectangleGap: number;
    answerFontSize: number;
    
    // Bottom UI
    bottomUIHeight: number;
    
    // General spacing
    sidePadding: number;
    topPadding: number;
}

export class SplashDashLayoutManager {
    private currentLayoutProfile!: SplashDashLayoutProfile;

    // Define a default profile for SplashDash game
    private readonly defaultProfile: SplashDashLayoutProfile = {
        // Control buttons
        controlButtonRadius: 54,
        controlButtonPadding: 20,
        
        // Question area
        questionContainerWidthMultiplier: 0.8, // 80% of screen width minus button space
        questionImageWidth: 120,
        questionImagePadding: 20,
        questionFontSize: 24,
        questionCounterFontSize: 14,
        
        // Answer rectangles
        answerRectangleWidth: 120,
        answerRectangleHeight: 60,
        answerRectangleGap: 20,
        answerFontSize: 16,
        
        // Bottom UI
        bottomUIHeight: 150,
        
        // General spacing
        sidePadding: 20,
        topPadding: 20,
    };

    constructor(initialScreenWidth: number, initialScreenHeight: number) {
        console.log("SplashDashLayoutManager: Initializing with dimensions:", initialScreenWidth, "x", initialScreenHeight);
        this.updateLayout(initialScreenWidth, initialScreenHeight);
    }

    public updateLayout(screenWidth: number, screenHeight: number): void {
        console.log("SplashDashLayoutManager: Updating layout for screen dimensions:", screenWidth, "x", screenHeight);
        this.currentLayoutProfile = this._getLayoutParameters(screenWidth, screenHeight);
        console.log("SplashDashLayoutManager: Using responsive profile:", this.currentLayoutProfile);
    }

    public getLayoutParams(): SplashDashLayoutProfile {
        if (!this.currentLayoutProfile) {
            throw new Error("SplashDashLayoutManager: Layout profile accessed before initial calculation.");
        }
        return this.currentLayoutProfile;
    }

    private _getLayoutParameters(screenWidth: number, screenHeight: number): SplashDashLayoutProfile {
        const aspectRatio = screenWidth / screenHeight;
        console.log("SplashDashLayoutManager: Calculating parameters for aspect ratio:", aspectRatio);

        // Create a copy of the default profile to modify
        const responsiveProfile = { ...this.defaultProfile };

        // Apply responsive scaling based on screen size
        this._applyResponsiveScaling(responsiveProfile, screenWidth, screenHeight);

        console.log("SplashDashLayoutManager: Applied responsive scaling");
        return responsiveProfile;
    }

    /**
     * Apply responsive scaling based on screen dimensions
     */
    private _applyResponsiveScaling(profile: SplashDashLayoutProfile, screenWidth: number, screenHeight: number): void {
        const baseWidth = 1200; // Reference width
        const baseHeight = 700; // Reference height
        
        // Scale based on screen size
        const widthScale = Math.min(1.2, Math.max(0.8, screenWidth / baseWidth));
        const heightScale = Math.min(1.2, Math.max(0.8, screenHeight / baseHeight));
        
        // Apply scaling to relevant properties
        profile.controlButtonRadius = Math.round(profile.controlButtonRadius * widthScale);
        profile.questionImageWidth = Math.round(profile.questionImageWidth * widthScale);
        profile.answerRectangleWidth = Math.round(profile.answerRectangleWidth * widthScale);
        profile.answerRectangleHeight = Math.round(profile.answerRectangleHeight * heightScale);
        profile.bottomUIHeight = Math.round(profile.bottomUIHeight * heightScale);
        
        // Scale font sizes
        profile.questionFontSize = Math.round(profile.questionFontSize * widthScale);
        profile.questionCounterFontSize = Math.round(profile.questionCounterFontSize * widthScale);
        profile.answerFontSize = Math.round(profile.answerFontSize * widthScale);
        
        // Scale padding
        profile.controlButtonPadding = Math.round(profile.controlButtonPadding * widthScale);
        profile.questionImagePadding = Math.round(profile.questionImagePadding * widthScale);
        profile.answerRectangleGap = Math.round(profile.answerRectangleGap * widthScale);
        profile.sidePadding = Math.round(profile.sidePadding * widthScale);
        profile.topPadding = Math.round(profile.topPadding * heightScale);
        
        console.log(`SplashDashLayoutManager: Applied scaling - width: ${widthScale.toFixed(2)}, height: ${heightScale.toFixed(2)}`);
    }

    /**
     * Calculate the available width for the question container
     */
    public calculateQuestionContainerWidth(screenWidth: number): number {
        const params = this.getLayoutParams();
        const buttonSpace = (params.controlButtonRadius + params.controlButtonPadding) * 2;
        return screenWidth - buttonSpace;
    }

    /**
     * Calculate the available width for answer rectangles
     */
    public calculateAnswerAreaWidth(screenWidth: number): number {
        const params = this.getLayoutParams();
        return screenWidth - (params.sidePadding * 2);
    }
}