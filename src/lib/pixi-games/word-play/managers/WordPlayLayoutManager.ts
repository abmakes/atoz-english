/**
 * Responsive layout values for the Word Play board.
 * Adapted from MultipleChoiceLayoutManager's height-based scaling, with
 * minimum tile heights kept touch-friendly (~48px) on small screens.
 */
export interface WordPlayLayoutProfile {
    promptFontSize: number;
    /** Maximum width of prompt text relative to the viewport. */
    promptMaxWidth: number;
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
    /** Top of game content after accounting for overlay HUD controls. */
    contentTop: number;
    /** Height of the bottom tray panel (tiles waiting to be placed). */
    trayMinHeight: number;
    checkButtonWidth: number;
    checkButtonHeight: number;
    checkButtonFontSize: number;
    /** True below the mobile breakpoint; used for tighter padding. */
    isCompact: boolean;
    /** Portrait phones use a vertically stacked tray and a HUD-safe header. */
    isPortrait: boolean;
    /** Whether the Check button sits below the tile rows instead of beside them. */
    stackTrayControls: boolean;
    /** Timer scale and center position for the current viewport. */
    timerScale: number;
    timerY: number;
}

const TOUCH_TARGET_MIN = 48;

export class WordPlayLayoutManager {
    private currentProfile!: WordPlayLayoutProfile;

    private readonly defaultProfile: WordPlayLayoutProfile = {
        promptFontSize: 32,
        promptMaxWidth: 760,
        imageMaxHeight: 140,
        tileFontSize: 24,
        tileHeight: 56,
        tileMinWidth: 72,
        tileMaxWidth: 300,
        tilePaddingX: 22,
        tileGap: 14,
        rowGap: 16,
        sidePadding: 40,
        contentTop: 48,
        trayMinHeight: 90,
        checkButtonWidth: 190,
        checkButtonHeight: 60,
        checkButtonFontSize: 26,
        isCompact: false,
        isPortrait: false,
        stackTrayControls: false,
        timerScale: 1,
        timerY: 96,
    };

    constructor(initialScreenWidth: number, initialScreenHeight: number) {
        this.updateLayout(initialScreenWidth, initialScreenHeight);
    }

    public updateLayout(screenWidth: number, screenHeight: number): void {
        const profile = { ...this.defaultProfile };
        const baseHeight = 600;
        const clampedHeight = Math.max(400, Math.min(1000, screenHeight));
        profile.isPortrait = screenWidth < 640 && screenHeight > screenWidth;
        profile.isCompact = screenHeight < 700 || screenWidth < 640;
        profile.stackTrayControls = profile.isPortrait;
        profile.promptMaxWidth = Math.min(760, screenWidth * (profile.isPortrait ? 0.88 : 0.72));

        if (clampedHeight < baseHeight) {
            const scale = Math.max(0.7, clampedHeight / baseHeight);
            profile.promptFontSize = Math.round(profile.promptFontSize * scale);
            profile.tileFontSize = Math.round(profile.tileFontSize * scale);
            profile.tileHeight = Math.max(TOUCH_TARGET_MIN, Math.round(profile.tileHeight * scale));
            profile.tilePaddingX = Math.round(profile.tilePaddingX * scale);
            profile.tileGap = Math.round(profile.tileGap * scale);
            profile.rowGap = Math.round(profile.rowGap * scale);
            profile.sidePadding = Math.round(profile.sidePadding * scale);
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
            profile.tileMaxWidth = Math.round(screenWidth * (profile.isPortrait ? 0.38 : 0.42));
            profile.sidePadding = Math.min(profile.sidePadding, 14);
        } else {
            profile.tileMaxWidth = Math.min(profile.tileMaxWidth, Math.round(screenWidth * 0.4));
        }

        if (profile.isPortrait) {
            // Two compact score cards occupy the top-left and navigation occupies
            // the top-right. Start game content below both overlays.
            profile.contentTop = Math.max(170, Math.min(210, Math.round(screenHeight * 0.22)));
            profile.promptFontSize = Math.min(profile.promptFontSize, 26);
            profile.tileFontSize = Math.min(profile.tileFontSize, 23);
            profile.tileHeight = 58;
            profile.tilePaddingX = Math.max(profile.tilePaddingX, 24);
            profile.rowGap = Math.min(profile.rowGap, 12);
            profile.tileGap = Math.min(profile.tileGap, 12);
            profile.trayMinHeight = 72;
            profile.imageMaxHeight = 0;
            profile.checkButtonWidth = Math.min(220, screenWidth - profile.sidePadding * 4);
            profile.checkButtonHeight = 56;
            profile.checkButtonFontSize = Math.min(profile.checkButtonFontSize, 23);
            profile.timerScale = 0.7;
            profile.timerY = Math.max(105, Math.round(profile.contentTop * 0.62));
        } else {
            // Keep content away from the top edge while leaving the center clear.
            profile.contentTop = Math.max(28, Math.round(screenHeight * 0.08));
            profile.timerScale = profile.isCompact ? 0.78 : 0.9;
            profile.timerY = Math.max(86, Math.round(screenHeight * 0.18));
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
