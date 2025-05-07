import * as PIXI from 'pixi.js'; // May not be needed if just calculating

export interface LayoutParameters {
    // ... (same definition as before) ...
    questionFontSize: number;
    questionWrapMultiplier: number;
    questionYMultiplier: number;
    answerColumns: number;
    answerButtonWidthMultiplier: number;
    answerButtonHeightMultiplier: number;
    answerButtonFontSize: number;
    answerContainerYMultiplier: number;
    answerButtonGap: number;
    imageMaxHeightMultiplier: number;
    topPadding: number;
    bottomPadding: number;
    sidePadding: number;
}

export class MultipleChoiceLayoutManager {
    private currentLayoutParams!: LayoutParameters;

    constructor(initialScreenWidth: number, initialScreenHeight: number) {
        console.log("LayoutManager: Initializing with dimensions:", initialScreenWidth, "x", initialScreenHeight);
        this.updateLayout(initialScreenWidth, initialScreenHeight);
    }

    public updateLayout(screenWidth: number, screenHeight: number): void {
        console.log("LayoutManager: Updating layout for dimensions:", screenWidth, "x", screenHeight);
        this.currentLayoutParams = this._getLayoutParameters(screenWidth, screenHeight);
        console.log("LayoutManager: New params:", this.currentLayoutParams);
    }

    public getLayoutParams(): LayoutParameters {
        if (!this.currentLayoutParams) {
            throw new Error("LayoutManager: Layout parameters accessed before initial calculation.");
        }
        return this.currentLayoutParams;
    }

    private _getLayoutParameters(screenWidth: number, screenHeight: number): LayoutParameters {
        const aspectRatio = screenWidth / screenHeight;
        console.log("LayoutManager: Calculating parameters for aspect ratio:", aspectRatio);

        // Define Profiles (Adjust these values based on testing)
        const wideDesktopLayout: LayoutParameters = {
            questionFontSize: 36,
            questionWrapMultiplier: 0.75,
            questionYMultiplier: 0.6,
            answerColumns: 2,
            answerButtonWidthMultiplier: 0.38,
            answerButtonHeightMultiplier: 0.2,
            answerButtonFontSize: 30,
            answerContainerYMultiplier: 0.9,
            answerButtonGap: 15,
            imageMaxHeightMultiplier: 0.4,
            topPadding: 20,
            bottomPadding: 20,
            sidePadding: 40,
        };

        const bigDesktopLayout: LayoutParameters = {
            questionFontSize: 44,
            questionWrapMultiplier: 0.75,
            questionYMultiplier: 0.6,
            answerColumns: 2,
            answerButtonWidthMultiplier: 0.38,
            answerButtonHeightMultiplier: 0.30,
            answerButtonFontSize: 40,
            answerContainerYMultiplier: 0.9,
            answerButtonGap: 15,
            imageMaxHeightMultiplier: 0.4,
            topPadding: 20,
            bottomPadding: 20,
            sidePadding: 40,
        };

        const tabletLayout: LayoutParameters = {
            questionFontSize: 36,
            questionWrapMultiplier: 0.80,
            questionYMultiplier: 0.6,
            answerColumns: 2,
            answerButtonWidthMultiplier: 0.42,
            answerButtonHeightMultiplier: 0.28,
            answerButtonFontSize: 32,
            answerContainerYMultiplier: 0.9,
            answerButtonGap: 12,
            imageMaxHeightMultiplier: 0.35,
            topPadding: 15,
            bottomPadding: 15,
            sidePadding: 25,
        };

        const phoneLayout: LayoutParameters = {
            questionFontSize: 22,
            questionWrapMultiplier: 0.9,
            questionYMultiplier: 0.6,
            answerColumns: 1,
            answerButtonWidthMultiplier: 0.85,
            answerButtonHeightMultiplier: 0.2,
            answerButtonFontSize: 18,
            answerContainerYMultiplier: 0.92,
            answerButtonGap: 10,
            imageMaxHeightMultiplier: 0.30,
            topPadding: 10,
            bottomPadding: 10,
            sidePadding: 15,
        };

        // --- Logic to Select Profile ---
        let selectedLayout: LayoutParameters;
        if (aspectRatio > 1.1 && screenHeight > 1024) {
            console.log("LayoutManager: Selected Big Desktop Layout");
            selectedLayout = bigDesktopLayout;
        } else if (aspectRatio > 1.5 && screenHeight > 800) {
            console.log("LayoutManager: Selected Wide Desktop Layout");
            selectedLayout = wideDesktopLayout;
        } else if (aspectRatio > 1.1 && screenHeight > 600) {
            console.log("LayoutManager: Selected Tablet Layout");
            selectedLayout = tabletLayout;
        } else {
            console.log("LayoutManager: Selected Phone Layout");
            selectedLayout = phoneLayout;
        }

        // Log the selected layout parameters
        console.log("LayoutManager: Using layout parameters:", selectedLayout);
        return selectedLayout;
    }
}
