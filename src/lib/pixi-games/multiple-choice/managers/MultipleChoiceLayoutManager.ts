import * as PIXI from 'pixi.js'; // May not be needed if just calculating

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
        questionYMultiplier: 0.6,
        answerColumns: 2,
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

        // --- Logic to Select Profile ---
        // For now, we always return the default profile.
        // In the future, you can expand this logic to select different profiles:
        /*
        if (aspectRatio > 1.7 && screenHeight > 700) { // Example: Wide desktop
            // return this.profiles.get("wideDesktop") || this.defaultProfile;
            return this.defaultProfile; // Still default for now
        } else if (aspectRatio > 1.1 && screenHeight > 600) { // Example: Tablet landscape
            // return this.profiles.get("tabletLandscape") || this.defaultProfile;
            return this.defaultProfile; // Still default for now
        } else if (aspectRatio <= 1.1 && screenHeight > 700) { // Example: Tablet portrait
            // return this.profiles.get("tabletPortrait") || this.defaultProfile;
            return this.defaultProfile; // Still default for now
        } else { // Example: Phone
            // return this.profiles.get("phone") || this.defaultProfile;
            return this.defaultProfile; // Still default for now
        }
        */

        // Simplified: Always return the default profile for now
        console.log("LayoutManager: Selected Default Profile (16:9 base)");
        return this.defaultProfile;
    }
}
