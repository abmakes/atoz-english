/**
 * Responsive layout values for the Word Play board.
 * Adapted from MultipleChoiceLayoutManager's height-based scaling, with
 * minimum tile heights kept touch-friendly (~48px) on small screens.
 */
export interface WordPlayLayoutProfile {
    promptFontSize: number;
    /** Max height reserved for an optional question image. */
    imageMaxHeight: number;
    tileFontSize: number;
    tileHeight: number;
    tileMinWidth: number;
    tileMaxWidth: number;
    tilePaddingX: number;
    tileGap: number;
    /** Vertical gap between slot rows / tray rows. */
    rowGap: number;
    sidePadding: number;
    topPadding: number;
    /** Height of the bottom tray panel (tiles waiting to be placed). */
    trayMinHeight: number;
    checkButtonWidth: number;
    checkButtonHeight: number;
    checkButtonFontSize: number;
    /** True below the mobile breakpoint; used for tighter padding. */
    isCompact: boolean;
}

const TOUCH_TARGET_MIN = 48;

export class WordPlayLayoutManager {
    private currentProfile!: WordPlayLayoutProfile;

    private readonly defaultProfile: WordPlayLayoutProfile = {
        promptFontSize: 32,
        imageMaxHeight: 140,
        tileFontSize: 24,
        tileHeight: 56,
        tileMinWidth: 72,
        tileMaxWidth: 300,
        tilePaddingX: 22,
        tileGap: 14,
        rowGap: 16,
        sidePadding: 40,
        topPadding: 20,
        trayMinHeight: 90,
        checkButtonWidth: 190,
        checkButtonHeight: 60,
        checkButtonFontSize: 26,
        isCompact: false,
    };

    constructor(initialScreenWidth: number, initialScreenHeight: number) {
        this.updateLayout(initialScreenWidth, initialScreenHeight);
    }

    public updateLayout(screenWidth: number, screenHeight: number): void {
        const profile = { ...this.defaultProfile };
        const baseHeight = 600;
        const clampedHeight = Math.max(400, Math.min(1000, screenHeight));
        profile.isCompact = screenHeight < 700 || screenWidth < 640;

        if (clampedHeight < baseHeight) {
            const scale = Math.max(0.7, clampedHeight / baseHeight);
            profile.promptFontSize = Math.round(profile.promptFontSize * scale);
            profile.tileFontSize = Math.round(profile.tileFontSize * scale);
            profile.tileHeight = Math.max(TOUCH_TARGET_MIN, Math.round(profile.tileHeight * scale));
            profile.tilePaddingX = Math.round(profile.tilePaddingX * scale);
            profile.tileGap = Math.round(profile.tileGap * scale);
            profile.rowGap = Math.round(profile.rowGap * scale);
            profile.sidePadding = Math.round(profile.sidePadding * scale);
            profile.topPadding = Math.round(profile.topPadding * scale);
            profile.imageMaxHeight = Math.round(profile.imageMaxHeight * scale);
            profile.checkButtonWidth = Math.round(profile.checkButtonWidth * scale);
            profile.checkButtonHeight = Math.max(
                TOUCH_TARGET_MIN,
                Math.round(profile.checkButtonHeight * scale)
            );
            profile.checkButtonFontSize = Math.round(profile.checkButtonFontSize * scale);
            profile.trayMinHeight = Math.max(
                profile.tileHeight + profile.rowGap,
                Math.round(profile.trayMinHeight * scale)
            );
        } else if (clampedHeight > baseHeight) {
            const scale = Math.min(1.25, clampedHeight / baseHeight);
            profile.promptFontSize = Math.round(profile.promptFontSize * Math.min(1.15, scale));
            profile.tileFontSize = Math.round(profile.tileFontSize * Math.min(1.15, scale));
            profile.tileHeight = Math.round(profile.tileHeight * Math.min(1.15, scale));
            profile.imageMaxHeight = Math.round(profile.imageMaxHeight * scale);
        }

        // Narrow screens: cap tile width so several tiles fit per row.
        if (screenWidth < 640) {
            profile.tileMaxWidth = Math.round(screenWidth * 0.42);
            profile.sidePadding = Math.min(profile.sidePadding, 14);
        } else {
            profile.tileMaxWidth = Math.min(profile.tileMaxWidth, Math.round(screenWidth * 0.4));
        }

        this.currentProfile = profile;
    }

    public getLayoutParams(): WordPlayLayoutProfile {
        if (!this.currentProfile) {
            throw new Error('WordPlayLayoutManager: profile accessed before calculation.');
        }
        return this.currentProfile;
    }
}
