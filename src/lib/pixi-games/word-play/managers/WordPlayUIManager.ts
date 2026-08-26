import * as PIXI from 'pixi.js';
import { Button } from '@pixi/ui';
import { GifSprite } from 'pixi.js/gif';
import { PixiApplication } from '@/lib/pixi-engine/core/PixiApplication';
import { AssetLoader } from '@/lib/pixi-engine/assets/AssetLoader';
import { EventBus } from '@/lib/pixi-engine/core/EventBus';
import { PixiSpecificConfig } from '@/lib/themes';
import {
    TimerEventPayload,
    TIMER_EVENTS,
    ENGINE_EVENTS,
    GAME_STATE_EVENTS,
} from '@/lib/pixi-engine/core/EventTypes';
import { PixiTimer } from '@/lib/pixi-games/multiple-choice/ui/PixiTimer';
import { VisualEffectsManager } from '@/lib/pixi-engine/ui/VisualEffectsManager';
import { WordPlayLayoutManager } from './WordPlayLayoutManager';
import { DraggableTile, TileStyle } from '../ui/DraggableTile';
import { DropSlot } from '../ui/DropSlot';
import { WordPlayRound, SortingRound, MatchingRound } from '../wordPlayQuestion';

/** Extra size of a slot relative to the tile it hosts. */
const SLOT_PADDING = 8;

interface MatchingArrangementEntry {
    leftText: string;
    rightText: string | null;
}

/**
 * Renders the Word Play board: prompt (+ optional image), drop slots,
 * a tray of draggable word tiles, a Check button, and the round timer.
 * Handles both interaction styles: full drag-and-drop and tap-to-place.
 */
export class WordPlayUIManager {
    private readonly view: PIXI.Container;
    private readonly themeConfig: PixiSpecificConfig;
    private readonly tileStyle: TileStyle;

    private readonly promptContainer: PIXI.Container;
    private readonly boardContainer: PIXI.Container;
    private readonly trayPanel: PIXI.Graphics;
    private readonly tileLayer: PIXI.Container;
    private readonly pixiTimerInstance: PixiTimer;
    private readonly visualEffectsManager: VisualEffectsManager;

    private promptText: PIXI.Text | null = null;
    private promptImage: PIXI.Sprite | null = null;
    private checkButton: Button | null = null;
    private checkButtonView: PIXI.Graphics | null = null;
    private checkButtonLabel: PIXI.Text | null = null;
    private checkButtonEnabled = false;

    private currentRound: WordPlayRound | null = null;
    private tiles = new Map<string, DraggableTile>();
    private slots = new Map<string, DropSlot>();
    private orderedSlotIds: string[] = [];
    private matchingLeftTexts: string[] = [];
    private selectedTile: DraggableTile | null = null;
    private dragOriginSlotId: string | null = null;
    private interactionEnabled = true;
    private initialDurationMs = 0;

    constructor(
        private readonly pixiApp: PixiApplication,
        private readonly eventBus: EventBus,
        private readonly assetLoader: typeof AssetLoader,
        themeConfig: PixiSpecificConfig,
        private readonly gameRef: { onCheckPressed: () => void },
        private readonly layoutManager: WordPlayLayoutManager
    ) {
        this.themeConfig = themeConfig;
        this.tileStyle = {
            fillColor: themeConfig.buttonFillColor,
            textColor: themeConfig.buttonTextColor,
            borderColor: themeConfig.primaryAccent,
            shadowColor: themeConfig.primaryAccentHover,
            fontFamily: themeConfig.fontFamilyTheme,
            fontSize: this.layoutManager.getLayoutParams().tileFontSize,
        };

        this.view = new PIXI.Container();
        this.view.label = 'WordPlayUI';

        this.promptContainer = new PIXI.Container();
        this.promptContainer.label = 'WordPlayPrompt';
        this.boardContainer = new PIXI.Container();
        this.boardContainer.label = 'WordPlayBoard';
        this.trayPanel = new PIXI.Graphics();
        this.trayPanel.label = 'WordPlayTrayPanel';
        this.tileLayer = new PIXI.Container();
        this.tileLayer.label = 'WordPlayTileLayer';
        this.tileLayer.sortableChildren = true;

        this.view.addChild(this.trayPanel);
        this.view.addChild(this.promptContainer);
        this.view.addChild(this.boardContainer);
        this.view.addChild(this.tileLayer);

        this.pixiTimerInstance = new PixiTimer({
            textColor: this.themeConfig.timerColor,
            progressBarColor: this.themeConfig.primaryAccent,
        });
        this.pixiTimerInstance.label = 'PixiTimerInstance';

        this._setupDragSurface();
        this._positionTimer();
        this._createCheckButton();

        this.eventBus.on(TIMER_EVENTS.TIMER_TICK, this._handleTimerTick);
        this.eventBus.on(ENGINE_EVENTS.RESIZED, this._handleResize);
        this.eventBus.on(GAME_STATE_EVENTS.GAME_PAUSED, this._handleGamePaused);
        this.eventBus.on(GAME_STATE_EVENTS.GAME_RESUMED, this._handleGameResumed);

        this.visualEffectsManager = new VisualEffectsManager(this.pixiApp.getApp(), this.view);
    }

    public getView(): PIXI.Container {
        return this.view;
    }

    public getTimerContainer(): PIXI.Container {
        return this.pixiTimerInstance;
    }

    // --- Round lifecycle ---

    public displayRound(round: WordPlayRound): void {
        this.clearRoundState();
        this.currentRound = round;
        this._buildRound(round);
        this.setInteractionEnabled(true);
        this._updateCheckButtonState();
    }

    public clearRoundState(): void {
        this.selectedTile = null;
        this.dragOriginSlotId = null;
        this.tiles.forEach((tile) => tile.destroy());
        this.tiles.clear();
        this.slots.forEach((slot) => slot.destroy());
        this.slots.clear();
        this.orderedSlotIds = [];
        this.matchingLeftTexts = [];
        this.boardContainer.removeChildren().forEach((child) => child.destroy({ children: true }));
        this.tileLayer.removeChildren();
        this._clearPrompt();
        this.currentRound = null;
        this.visualEffectsManager.clearAllEffects();
        this._setCheckButtonEnabled(false);
    }

    /** Placed word texts by slot order (null for empty slots). Sorting rounds. */
    public getSortingArrangement(): (string | null)[] {
        return this.orderedSlotIds.map((slotId) => {
            const slot = this.slots.get(slotId);
            if (!slot || !slot.occupantTileId) return null;
            return this.tiles.get(slot.occupantTileId)?.text ?? null;
        });
    }

    /** Left/right pairs as currently placed. Matching rounds. */
    public getMatchingArrangement(): MatchingArrangementEntry[] {
        return this.orderedSlotIds.map((slotId, i) => {
            const slot = this.slots.get(slotId);
            const occupant = slot?.occupantTileId ? this.tiles.get(slot.occupantTileId) : null;
            return {
                leftText: this.matchingLeftTexts[i] ?? '',
                rightText: occupant?.text ?? null,
            };
        });
    }

    public isArrangementComplete(): boolean {
        return this.orderedSlotIds.every((slotId) => !this.slots.get(slotId)?.isEmpty());
    }

    /**
     * Tints tiles green/red against the correct answer and plays a
     * celebration or sad effect. Interactions are disabled first.
     */
    public showRoundFeedback(round: WordPlayRound, allCorrect: boolean): void {
        this.setInteractionEnabled(false);

        if (round.kind === 'sorting') {
            this.orderedSlotIds.forEach((slotId, i) => {
                const slot = this.slots.get(slotId);
                const tile = slot?.occupantTileId ? this.tiles.get(slot.occupantTileId) : null;
                if (tile) {
                    tile.showFeedback(tile.text === round.correctOrder[i] ? 'correct' : 'incorrect');
                }
            });
        } else {
            const remaining = [...round.correctPairs];
            this.orderedSlotIds.forEach((slotId, i) => {
                const slot = this.slots.get(slotId);
                const tile = slot?.occupantTileId ? this.tiles.get(slot.occupantTileId) : null;
                if (!tile) return;
                const leftText = this.matchingLeftTexts[i] ?? '';
                const index = remaining.findIndex(
                    (p) => p.left === leftText && p.right === tile.text
                );
                if (index !== -1) {
                    remaining.splice(index, 1);
                    tile.showFeedback('correct');
                } else {
                    tile.showFeedback('incorrect');
                }
            });
        }

        const { width, height } = this.pixiApp.getScreenSize();
        if (allCorrect) {
            this.visualEffectsManager.createCelebrateEmoji(width / 2, height / 2, {
                duration: 2000,
                scale: 1.5,
                alpha: 0.9,
            });
        } else {
            this.visualEffectsManager.createSadEmoji(width / 2, height / 2, {
                duration: 1500,
                scale: 1.5,
                alpha: 0.9,
            });
        }
    }

    public setInteractionEnabled(enabled: boolean): void {
        this.interactionEnabled = enabled;
        this.tiles.forEach((tile) => tile.setEnabled(enabled));
        if (!enabled) {
            this._clearSelection();
            this._setCheckButtonEnabled(false);
        } else {
            this._updateCheckButtonState();
        }
    }

    // --- Timer (same pattern as MultipleChoiceUIManager) ---

    public updateTimerDisplay(timeMs: number): void {
        this.initialDurationMs = Math.max(1, timeMs);
        this.pixiTimerInstance.updateDisplay(timeMs, this.initialDurationMs);
    }

    private _handleTimerTick = (payload: TimerEventPayload): void => {
        if (payload.remaining !== undefined) {
            this.pixiTimerInstance.updateDisplay(payload.remaining, this.initialDurationMs);
        }
    };

    private _handleGamePaused = (): void => {
        this.pixiTimerInstance?.pause();
    };

    private _handleGameResumed = (): void => {
        this.pixiTimerInstance?.resume();
    };

    // --- Board construction ---

    private _buildRound(round: WordPlayRound): void {
        const params = this.layoutManager.getLayoutParams();
        this.tileStyle.fontSize = params.tileFontSize;
        const { width: screenWidth, height: screenHeight } = this.pixiApp.getScreenSize();
        const contentWidth = screenWidth - 2 * params.sidePadding;

        const promptBottom = this._buildPrompt(
            round,
            screenWidth,
            params.contentTop,
            contentWidth
        );

        if (round.kind === 'sorting') {
            this._buildSortingBoard(round, promptBottom, screenWidth, screenHeight, contentWidth);
        } else {
            this._buildMatchingBoard(round, promptBottom, screenWidth, screenHeight, contentWidth);
        }
    }

    private _buildPrompt(
        round: WordPlayRound,
        screenWidth: number,
        topPadding: number,
        contentWidth: number
    ): number {
        const params = this.layoutManager.getLayoutParams();
        let currentY = topPadding;

        const imageUrl = round.imageUrl;
        const hasUsableImage =
            imageUrl &&
            params.imageMaxHeight > 0 &&
            !imageUrl.toLowerCase().includes('placeholder.webp');
        if (hasUsableImage) {
            try {
                // getDisplayObject returns Sprite | AnimatedSprite | GifSprite | null.
                const displayObject = this.assetLoader.getDisplayObject(imageUrl);
                if (displayObject) {
                    this.promptImage = displayObject as PIXI.Sprite;
                    this.promptImage.anchor.set(0.5, 0);
                    const scale = Math.min(
                        params.imageMaxHeight / this.promptImage.height,
                        (contentWidth * 0.5) / this.promptImage.width,
                        1
                    );
                    this.promptImage.scale.set(scale);
                    this.promptImage.x = screenWidth / 2;
                    this.promptImage.y = currentY;
                    this.promptContainer.addChild(this.promptImage);
                    currentY += this.promptImage.height + 8;

                    if (
                        displayObject instanceof PIXI.AnimatedSprite ||
                        displayObject instanceof GifSprite
                    ) {
                        if (!displayObject.playing) {
                            setTimeout(() => {
                                if (displayObject && !displayObject.destroyed) {
                                    displayObject.play();
                                }
                            }, 50);
                        }
                    }
                }
            } catch (error) {
                console.error(`[WordPlayUI] Error loading question image: ${imageUrl}`, error);
            }
        }

        this.promptText = new PIXI.Text({
            text: round.prompt,
            style: {
                fontSize: params.promptFontSize,
                fill: this.themeConfig.questionTextColor,
                fontFamily: this.themeConfig.fontFamilyTheme,
                align: 'center',
                wordWrap: true,
                wordWrapWidth: Math.min(contentWidth, params.promptMaxWidth),
            },
        });
        this.promptText.anchor.set(0.5, 0);
        this.promptText.x = screenWidth / 2;
        this.promptText.y = currentY;
        this.promptContainer.addChild(this.promptText);

        return currentY + this.promptText.height + params.rowGap;
    }

    private _buildSortingBoard(
        round: SortingRound,
        boardTop: number,
        screenWidth: number,
        screenHeight: number,
        contentWidth: number
    ): void {
        const params = this.layoutManager.getLayoutParams();
        const tileWidth = this._measureUniformTileWidth(round.correctOrder, contentWidth);
        const tileHeight = params.tileHeight;
        const slotWidth = tileWidth + SLOT_PADDING;
        const slotHeight = tileHeight + SLOT_PADDING;

        // Slots: one per word in the correct order, flow-wrapped and centered.
        const portraitColumns = params.isPortrait
            ? Math.ceil(Math.sqrt(round.correctOrder.length))
            : undefined;
        const slotFlowWidth = portraitColumns
            ? portraitColumns * slotWidth + (portraitColumns - 1) * params.tileGap
            : contentWidth;
        const slotPositions = this._flowLayout(
            round.correctOrder.length,
            slotWidth,
            slotHeight,
            Math.min(contentWidth, slotFlowWidth),
            params.tileGap,
            params.rowGap
        );
        const trayTop = this._buildTray(
            round.tiles.map((t) => ({ id: t.id, text: t.text })),
            tileWidth,
            tileHeight,
            screenWidth,
            screenHeight,
            contentWidth
        );
        const slotsBlockWidth = Math.max(...slotPositions.map((p) => p.x + slotWidth), 0);
        const slotsBlockHeight = Math.max(...slotPositions.map((p) => p.y + slotHeight), 0);
        const slotsOffsetX = params.sidePadding + (contentWidth - slotsBlockWidth) / 2;
        const boardHeight = Math.max(0, trayTop - params.rowGap - boardTop);
        const slotsOffsetY = boardTop + Math.max(0, (boardHeight - slotsBlockHeight) / 2);

        round.correctOrder.forEach((_, i) => {
            const slotId = `slot-${i}`;
            const slot = new DropSlot({
                id: slotId,
                width: slotWidth,
                height: slotHeight,
                style: this.tileStyle,
                placeholder: `${i + 1}`,
                onTap: this._onSlotTap,
            });
            slot.x = slotsOffsetX + slotPositions[i].x;
            slot.y = slotsOffsetY + slotPositions[i].y;
            this.boardContainer.addChild(slot);
            this.slots.set(slotId, slot);
            this.orderedSlotIds.push(slotId);
        });

    }

    private _buildMatchingBoard(
        round: MatchingRound,
        boardTop: number,
        screenWidth: number,
        screenHeight: number,
        contentWidth: number
    ): void {
        const params = this.layoutManager.getLayoutParams();
        const leftWidth = this._measureUniformTileWidth(round.leftItems.map((i) => i.text), contentWidth * 0.45);
        const rightWidth = this._measureUniformTileWidth(round.rightTiles.map((t) => t.text), contentWidth * 0.45);
        const tileHeight = params.tileHeight;
        const slotWidth = rightWidth + SLOT_PADDING;
        const slotHeight = tileHeight + SLOT_PADDING;
        const columnGap = Math.max(24, params.tileGap * 2);

        const rowWidth = leftWidth + columnGap + slotWidth;
        const rowsOffsetX = params.sidePadding + (contentWidth - rowWidth) / 2;
        const rowStride = slotHeight + params.rowGap;
        const trayTop = this._buildTray(
            round.rightTiles.map((t) => ({ id: t.id, text: t.text })),
            rightWidth,
            tileHeight,
            screenWidth,
            screenHeight,
            contentWidth
        );
        const rowsHeight = Math.max(0, round.leftItems.length * rowStride - params.rowGap);
        const boardHeight = Math.max(0, trayTop - params.rowGap - boardTop);
        const rowsOffsetY = boardTop + Math.max(0, (boardHeight - rowsHeight) / 2);

        round.leftItems.forEach((leftItem, i) => {
            const rowY = rowsOffsetY + i * rowStride;

            // Fixed left anchor drawn in the tile style (not draggable).
            const anchor = this._createAnchorPanel(leftItem.text, leftWidth, tileHeight);
            anchor.x = rowsOffsetX;
            anchor.y = rowY + SLOT_PADDING / 2;
            this.boardContainer.addChild(anchor);

            const slotId = `slot-${i}`;
            const slot = new DropSlot({
                id: slotId,
                width: slotWidth,
                height: slotHeight,
                style: this.tileStyle,
                onTap: this._onSlotTap,
            });
            slot.x = rowsOffsetX + leftWidth + columnGap;
            slot.y = rowY;
            this.boardContainer.addChild(slot);
            this.slots.set(slotId, slot);
            this.orderedSlotIds.push(slotId);
            this.matchingLeftTexts.push(leftItem.text);
        });
    }

    private _buildTray(
        tileData: { id: string; text: string }[],
        tileWidth: number,
        tileHeight: number,
        screenWidth: number,
        screenHeight: number,
        contentWidth: number
    ): number {
        const params = this.layoutManager.getLayoutParams();

        // Landscape/desktop keeps Check beside the tiles. Portrait stacks it
        // below the tile rows so tiles can use the full width (2–3 per row).
        const buttonReserve = params.stackTrayControls
            ? 0
            : params.checkButtonWidth + params.tileGap * 2;
        const trayFlowWidth = Math.max(tileWidth + SLOT_PADDING, contentWidth - buttonReserve);

        const positions = this._flowLayout(
            tileData.length,
            tileWidth,
            tileHeight,
            trayFlowWidth,
            params.tileGap,
            params.rowGap
        );
        const rowsHeight = Math.max(...positions.map((p) => p.y + tileHeight), params.trayMinHeight);
        const trayPadding = params.isCompact ? 10 : 16;
        const stackedButtonHeight = params.stackTrayControls
            ? params.rowGap + params.checkButtonHeight
            : 0;
        const trayHeight = rowsHeight + trayPadding * 2 + stackedButtonHeight;
        const trayTop = screenHeight - trayHeight;

        // Tray backdrop panel (matches the MC bottom panel look).
        this.trayPanel.clear();
        this.trayPanel
            .roundRect(
                params.sidePadding / 2,
                trayTop,
                screenWidth - params.sidePadding,
                trayHeight,
                20
            )
            .fill({ color: this.themeConfig.panelBg, alpha: 0.92 });

        const blockWidth = Math.max(...positions.map((p) => p.x + tileWidth), 0);
        const offsetX = params.sidePadding + (trayFlowWidth - blockWidth) / 2;

        const stage = this.pixiApp.getApp().stage;
        tileData.forEach((data, i) => {
            const tile = new DraggableTile({
                id: data.id,
                text: data.text,
                width: tileWidth,
                height: tileHeight,
                style: this.tileStyle,
                dragSurface: stage,
                onDragStart: this._onTileDragStart,
                onDragMove: this._onTileDragMove,
                onDragEnd: this._onTileDragEnd,
                onTap: this._onTileTap,
            });
            tile.homePosition.set(offsetX + positions[i].x, trayTop + trayPadding + positions[i].y);
            tile.position.copyFrom(tile.homePosition);
            this.tileLayer.addChild(tile);
            this.tiles.set(data.id, tile);
        });

        this._positionCheckButton(screenWidth, trayTop, trayHeight, rowsHeight, trayPadding);
        return trayTop;
    }

    /** Simple centered flow layout; returns relative positions per item. */
    private _flowLayout(
        count: number,
        itemWidth: number,
        itemHeight: number,
        maxWidth: number,
        gapX: number,
        gapY: number
    ): { x: number; y: number }[] {
        const positions: { x: number; y: number }[] = [];
        const perRow = Math.max(1, Math.floor((maxWidth + gapX) / (itemWidth + gapX)));
        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / perRow);
            const col = i % perRow;
            // Center the (possibly shorter) last row.
            const itemsInRow = Math.min(perRow, count - row * perRow);
            const rowWidth = itemsInRow * itemWidth + (itemsInRow - 1) * gapX;
            const fullRowWidth = perRow * itemWidth + (perRow - 1) * gapX;
            const rowOffset = (fullRowWidth - rowWidth) / 2;
            positions.push({
                x: rowOffset + col * (itemWidth + gapX),
                y: row * (itemHeight + gapY),
            });
        }
        return positions;
    }

    private _measureUniformTileWidth(texts: readonly string[], maxAllowed: number): number {
        const params = this.layoutManager.getLayoutParams();
        const probe = new PIXI.Text({
            text: '',
            style: { fontSize: params.tileFontSize, fontFamily: this.themeConfig.fontFamilyTheme },
        });
        let widest = 0;
        for (const text of texts) {
            probe.text = text;
            widest = Math.max(widest, probe.width);
        }
        probe.destroy();
        const width = widest + params.tilePaddingX * 2;
        return Math.round(
            Math.min(Math.max(width, params.tileMinWidth), Math.min(params.tileMaxWidth, maxAllowed))
        );
    }

    private _createAnchorPanel(text: string, width: number, height: number): PIXI.Container {
        const container = new PIXI.Container();
        const body = new PIXI.Graphics();
        body
            .roundRect(0, 0, width, height, 12)
            .fill({ color: this.themeConfig.secondaryBg, alpha: 0.95 })
            .stroke({ color: this.tileStyle.borderColor, width: 2 });
        container.addChild(body);

        const label = new PIXI.Text({
            text,
            style: {
                fontSize: this.tileStyle.fontSize,
                fill: this.themeConfig.textColor,
                fontFamily: this.themeConfig.fontFamilyTheme,
                align: 'center',
            },
        });
        label.anchor.set(0.5);
        label.x = width / 2;
        label.y = height / 2;
        let fontSize = this.tileStyle.fontSize;
        while (label.width > width - 14 && fontSize > 10) {
            fontSize -= 1;
            label.style.fontSize = fontSize;
        }
        container.addChild(label);
        return container;
    }

    // --- Interaction handlers ---

    private _onTileDragStart = (tile: DraggableTile): void => {
        if (!this.interactionEnabled) return;
        this._clearSelection();
        this.dragOriginSlotId = tile.currentSlotId;
        if (tile.currentSlotId) {
            this.slots.get(tile.currentSlotId)?.setOccupant(null);
            tile.currentSlotId = null;
        }
        this._updateCheckButtonState();
    };

    private _onTileDragMove = (_tile: DraggableTile, globalPos: PIXI.Point): void => {
        this.slots.forEach((slot) => {
            slot.setHighlighted(slot.containsGlobalPoint(globalPos));
        });
    };

    private _onTileDragEnd = (tile: DraggableTile, globalPos: PIXI.Point): void => {
        this.slots.forEach((slot) => slot.setHighlighted(false));
        if (!this.interactionEnabled) {
            tile.returnHome();
            return;
        }

        const targetSlot = this._findSlotAtGlobalPoint(globalPos);
        if (targetSlot) {
            this._placeTileInSlot(tile, targetSlot, this.dragOriginSlotId);
        } else if (this.dragOriginSlotId) {
            // Dropped nowhere: send it back to the tray.
            tile.returnHome();
        } else {
            tile.returnHome();
        }
        this.dragOriginSlotId = null;
        this._updateCheckButtonState();
    };

    private _onTileTap = (tile: DraggableTile): void => {
        if (!this.interactionEnabled) return;

        if (tile.currentSlotId) {
            // Tapping a placed tile sends it back to the tray.
            const slot = this.slots.get(tile.currentSlotId);
            slot?.setOccupant(null);
            tile.returnHome();
            this._clearSelection();
        } else if (this.selectedTile === tile) {
            this._clearSelection();
        } else {
            this._clearSelection();
            this.selectedTile = tile;
            tile.setSelected(true);
        }
        this._updateCheckButtonState();
    };

    private _onSlotTap = (slot: DropSlot): void => {
        if (!this.interactionEnabled) return;

        if (this.selectedTile) {
            const tile = this.selectedTile;
            this._clearSelection();
            this._placeTileInSlot(tile, slot, tile.currentSlotId);
        } else if (slot.occupantTileId) {
            // Tapping an occupied slot with nothing selected frees it.
            const occupant = this.tiles.get(slot.occupantTileId);
            slot.setOccupant(null);
            occupant?.returnHome();
        }
        this._updateCheckButtonState();
    };

    private _placeTileInSlot(
        tile: DraggableTile,
        slot: DropSlot,
        cameFromSlotId: string | null
    ): void {
        // Free the tile's previous slot (tap-to-place path).
        if (tile.currentSlotId && tile.currentSlotId !== slot.slotId) {
            this.slots.get(tile.currentSlotId)?.setOccupant(null);
            tile.currentSlotId = null;
        }

        // Handle an existing occupant: swap into the origin slot or return to tray.
        if (slot.occupantTileId && slot.occupantTileId !== tile.tileId) {
            const occupant = this.tiles.get(slot.occupantTileId);
            if (occupant) {
                if (cameFromSlotId && cameFromSlotId !== slot.slotId) {
                    const originSlot = this.slots.get(cameFromSlotId);
                    if (originSlot && originSlot.isEmpty()) {
                        this._snapTileToSlot(occupant, originSlot);
                    } else {
                        occupant.returnHome();
                    }
                } else {
                    occupant.returnHome();
                }
            }
        }

        this._snapTileToSlot(tile, slot);
    }

    private _snapTileToSlot(tile: DraggableTile, slot: DropSlot): void {
        slot.setOccupant(tile.tileId);
        tile.currentSlotId = slot.slotId;
        // Slots and tiles share the same root coordinate space (view at origin),
        // so slot coordinates map directly onto the tile layer.
        tile.snapTo(slot.x + SLOT_PADDING / 2, slot.y + SLOT_PADDING / 2);
    }

    private _findSlotAtGlobalPoint(globalPos: PIXI.Point): DropSlot | null {
        for (const slot of this.slots.values()) {
            if (slot.containsGlobalPoint(globalPos)) {
                return slot;
            }
        }
        return null;
    }

    private _clearSelection(): void {
        if (this.selectedTile) {
            this.selectedTile.setSelected(false);
            this.selectedTile = null;
        }
    }

    // --- Check button ---

    private _createCheckButton(): void {
        const params = this.layoutManager.getLayoutParams();
        const view = new PIXI.Graphics();
        this.checkButtonView = view;

        const label = new PIXI.Text({
            text: 'Check!',
            style: {
                fontSize: params.checkButtonFontSize,
                fill: this.themeConfig.buttonTextColor,
                fontFamily: this.themeConfig.fontFamilyTheme,
                align: 'center',
            },
        });
        label.anchor.set(0.5);
        this.checkButtonLabel = label;
        view.addChild(label);

        this._drawCheckButton();

        const button = new Button(view);
        button.view.eventMode = 'static';
        button.onPress.connect(() => {
            if (!this.checkButtonEnabled || !this.interactionEnabled) return;
            this.gameRef.onCheckPressed();
        });
        button.onDown.connect(() => view.scale.set(0.95));
        button.onUp.connect(() => view.scale.set(1));
        button.onUpOut.connect(() => view.scale.set(1));
        this.checkButton = button;

        this.view.addChild(view);
        this._setCheckButtonEnabled(false);
    }

    private _drawCheckButton(): void {
        if (!this.checkButtonView || !this.checkButtonLabel) return;
        const params = this.layoutManager.getLayoutParams();
        const w = params.checkButtonWidth;
        const h = params.checkButtonHeight;
        const shadowOffset = 5;
        const borderWidth = 3;
        const radius = 16;

        this.checkButtonView.clear();
        this.checkButtonView
            .roundRect(shadowOffset, shadowOffset, w, h, radius)
            .fill(this.themeConfig.primaryAccentHover);
        this.checkButtonView.roundRect(0, 0, w, h, radius).fill(this.themeConfig.primaryAccent);
        this.checkButtonView
            .roundRect(borderWidth, borderWidth, w - 2 * borderWidth, h - 2 * borderWidth, radius - borderWidth)
            .fill(this.themeConfig.buttonFillColor);
        this.checkButtonView.hitArea = new PIXI.Rectangle(0, 0, w, h);

        this.checkButtonLabel.style.fontSize = params.checkButtonFontSize;
        this.checkButtonLabel.x = w / 2;
        this.checkButtonLabel.y = h / 2;
    }

    private _positionCheckButton(
        screenWidth: number,
        trayTop: number,
        trayHeight: number,
        rowsHeight: number,
        trayPadding: number
    ): void {
        if (!this.checkButtonView) return;
        const params = this.layoutManager.getLayoutParams();
        if (params.stackTrayControls) {
            this.checkButtonView.x = (screenWidth - params.checkButtonWidth) / 2;
            this.checkButtonView.y =
                trayTop + trayPadding + rowsHeight + params.rowGap;
        } else {
            this.checkButtonView.x = screenWidth - params.checkButtonWidth - params.sidePadding;
            this.checkButtonView.y = trayTop + (trayHeight - params.checkButtonHeight) / 2;
        }
    }

    private _updateCheckButtonState(): void {
        this._setCheckButtonEnabled(this.interactionEnabled && this.isArrangementComplete());
    }

    private _setCheckButtonEnabled(enabled: boolean): void {
        this.checkButtonEnabled = enabled;
        if (this.checkButton) {
            this.checkButton.enabled = enabled;
        }
        if (this.checkButtonView) {
            this.checkButtonView.alpha = enabled ? 1 : 0.5;
            this.checkButtonView.cursor = enabled ? 'pointer' : 'default';
        }
    }

    // --- Layout / resize ---

    private _setupDragSurface(): void {
        const stage = this.pixiApp.getApp().stage;
        stage.eventMode = 'static';
        this._updateStageHitArea();
    }

    private _updateStageHitArea(): void {
        const { width, height } = this.pixiApp.getScreenSize();
        this.pixiApp.getApp().stage.hitArea = new PIXI.Rectangle(0, 0, width, height);
    }

    private _positionTimer(): void {
        const { width: screenWidth } = this.pixiApp.getScreenSize();
        const params = this.layoutManager.getLayoutParams();
        this.pixiTimerInstance.x = screenWidth - (params.isPortrait ? 50 : 64 + params.sidePadding);
        this.pixiTimerInstance.y = params.timerY;
        this.pixiTimerInstance.resize(params.timerScale);
    }

    private _handleResize = (): void => {
        const { width, height } = this.pixiApp.getScreenSize();
        this.layoutManager.updateLayout(width, height);
        this._updateStageHitArea();
        this._positionTimer();
        this._drawCheckButton();

        if (this.currentRound) {
            // Rebuild the board at the new size, preserving current placements.
            const round = this.currentRound;
            const placements = this.orderedSlotIds.map((slotId) => {
                const slot = this.slots.get(slotId);
                return slot?.occupantTileId ?? null;
            });
            const wasEnabled = this.interactionEnabled;

            this.clearRoundState();
            this.currentRound = round;
            this._buildRound(round);

            placements.forEach((tileId, i) => {
                if (!tileId) return;
                const tile = this.tiles.get(tileId);
                const slot = this.slots.get(this.orderedSlotIds[i]);
                if (tile && slot) {
                    slot.setOccupant(tile.tileId);
                    tile.currentSlotId = slot.slotId;
                    tile.position.set(slot.x + SLOT_PADDING / 2, slot.y + SLOT_PADDING / 2);
                }
            });

            this.setInteractionEnabled(wasEnabled);
            this._updateCheckButtonState();
        }
    };

    private _clearPrompt(): void {
        if (this.promptImage) {
            this.promptImage.destroy();
            this.promptImage = null;
        }
        if (this.promptText) {
            this.promptText.destroy();
            this.promptText = null;
        }
        this.promptContainer.removeChildren();
    }

    public destroy(): void {
        this.eventBus.off(TIMER_EVENTS.TIMER_TICK, this._handleTimerTick);
        this.eventBus.off(ENGINE_EVENTS.RESIZED, this._handleResize);
        this.eventBus.off(GAME_STATE_EVENTS.GAME_PAUSED, this._handleGamePaused);
        this.eventBus.off(GAME_STATE_EVENTS.GAME_RESUMED, this._handleGameResumed);

        this.clearRoundState();
        this.visualEffectsManager?.destroy();
        this.pixiTimerInstance?.destroy();
        this.view.destroy({ children: true });
    }
}
