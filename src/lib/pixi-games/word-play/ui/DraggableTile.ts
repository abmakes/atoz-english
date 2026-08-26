import * as PIXI from 'pixi.js';
import { AnimationUtils } from '@/lib/pixi-engine/utils/AnimationUtils';

/** Visual style shared by tiles and slots, sourced from the active Pixi theme. */
export interface TileStyle {
    fillColor: string | number;
    textColor: string | number;
    borderColor: string | number;
    shadowColor: string | number;
    fontFamily: string;
    fontSize: number;
}

export interface DraggableTileOptions {
    id: string;
    text: string;
    width: number;
    height: number;
    style: TileStyle;
    /**
     * The container used to track pointer movement while dragging
     * (normally the app stage, with `eventMode = 'static'` and a screen-sized hitArea).
     */
    dragSurface: PIXI.Container;
    /** Fired when a drag starts (after passing the tap-vs-drag threshold). */
    onDragStart?: (tile: DraggableTile) => void;
    /** Fired continuously while dragging — useful for highlighting hovered slots. */
    onDragMove?: (tile: DraggableTile, globalPosition: PIXI.Point) => void;
    /** Fired when the pointer is released after a real drag. Global position given. */
    onDragEnd?: (tile: DraggableTile, globalPosition: PIXI.Point) => void;
    /** Fired on a short press without movement — used for tap-to-place on mobile. */
    onTap?: (tile: DraggableTile) => void;
}

const TAP_MAX_DISTANCE_PX = 10;
const TAP_MAX_DURATION_MS = 350;
const DRAG_SCALE = 1.08;
/** Extra invisible padding around the tile so small fingers can grab it. */
const TOUCH_HIT_PADDING = 10;

/**
 * A draggable word tile with mobile-friendly controls:
 * pointer-based dragging (mouse + touch), a tap gesture for tap-to-place,
 * enlarged hit area, and snap animations.
 */
export class DraggableTile extends PIXI.Container {
    public readonly tileId: string;
    public readonly text: string;
    public readonly tileWidth: number;
    public readonly tileHeight: number;

    /** Slot id this tile currently occupies, or null while in the tray. */
    public currentSlotId: string | null = null;
    /** Tray position the tile returns to when not placed in a slot. */
    public homePosition: PIXI.Point = new PIXI.Point(0, 0);

    private readonly style: TileStyle;
    private readonly dragSurface: PIXI.Container;
    private readonly body: PIXI.Graphics;
    private readonly labelText: PIXI.Text;
    private readonly shadowOffset = 4;

    private dragging = false;
    private dragMoved = false;
    private pointerDownAt = 0;
    private pointerDownGlobal = new PIXI.Point();
    private grabOffset = new PIXI.Point();
    private positionBeforeDrag = new PIXI.Point();
    private selected = false;
    private interactionEnabled = true;
    private tweenFrameId: number | null = null;

    private readonly onDragStartCb?: (tile: DraggableTile) => void;
    private readonly onDragMoveCb?: (tile: DraggableTile, globalPosition: PIXI.Point) => void;
    private readonly onDragEndCb?: (tile: DraggableTile, globalPosition: PIXI.Point) => void;
    private readonly onTapCb?: (tile: DraggableTile) => void;

    constructor(options: DraggableTileOptions) {
        super();
        this.tileId = options.id;
        this.text = options.text;
        this.tileWidth = options.width;
        this.tileHeight = options.height;
        this.style = options.style;
        this.dragSurface = options.dragSurface;
        this.onDragStartCb = options.onDragStart;
        this.onDragMoveCb = options.onDragMove;
        this.onDragEndCb = options.onDragEnd;
        this.onTapCb = options.onTap;

        this.label = `DraggableTile-${options.id}`;

        this.body = new PIXI.Graphics();
        this.addChild(this.body);

        this.labelText = new PIXI.Text({
            text: options.text,
            style: {
                fontSize: options.style.fontSize,
                fill: options.style.textColor,
                fontFamily: options.style.fontFamily,
                align: 'center',
            },
        });
        this.labelText.anchor.set(0.5);
        this.labelText.x = this.tileWidth / 2;
        this.labelText.y = this.tileHeight / 2;
        this._fitLabel();
        this.addChild(this.labelText);

        this._drawBody();

        // Enlarged hit area for touch friendliness.
        this.hitArea = new PIXI.Rectangle(
            -TOUCH_HIT_PADDING,
            -TOUCH_HIT_PADDING,
            this.tileWidth + TOUCH_HIT_PADDING * 2,
            this.tileHeight + TOUCH_HIT_PADDING * 2
        );
        this.eventMode = 'static';
        this.cursor = 'pointer';

        this.on('pointerdown', this._onPointerDown, this);
    }

    // --- Public API ---

    public setSelected(selected: boolean): void {
        if (this.selected === selected) return;
        this.selected = selected;
        this._drawBody();
        this.scale.set(selected ? 1.05 : 1);
    }

    public isSelected(): boolean {
        return this.selected;
    }

    public setEnabled(enabled: boolean): void {
        this.interactionEnabled = enabled;
        this.cursor = enabled ? 'pointer' : 'default';
        if (!enabled && this.dragging) {
            this._detachSurfaceListeners();
            this.dragging = false;
            this.scale.set(1);
        }
        this.alpha = enabled ? 1 : 0.85;
    }

    /** Tints the tile for correct/incorrect feedback. */
    public showFeedback(kind: 'correct' | 'incorrect' | 'neutral'): void {
        if (kind === 'correct') {
            this._drawBody({ fill: '#E0F6EE', border: '#57D255', shadow: '#3F8C33' });
        } else if (kind === 'incorrect') {
            this._drawBody({ fill: '#EEE4EF', border: '#EB6D9B', shadow: '#FF1F6B' });
        } else {
            this._drawBody();
        }
    }

    /** Animates the tile (in its parent's coordinate space) to a target position. */
    public snapTo(x: number, y: number, durationMs = 180): void {
        this._cancelTween();
        const startX = this.x;
        const startY = this.y;
        const start = performance.now();

        const step = () => {
            const t = Math.min(1, (performance.now() - start) / durationMs);
            const eased = AnimationUtils.easeOutQuad(t);
            this.x = AnimationUtils.lerp(startX, x, eased);
            this.y = AnimationUtils.lerp(startY, y, eased);
            if (t < 1 && !this.destroyed) {
                this.tweenFrameId = requestAnimationFrame(step);
            } else {
                this.tweenFrameId = null;
            }
        };
        this.tweenFrameId = requestAnimationFrame(step);
    }

    /** Sends the tile back to its tray position. */
    public returnHome(animate = true): void {
        this.currentSlotId = null;
        if (animate) {
            this.snapTo(this.homePosition.x, this.homePosition.y);
        } else {
            this._cancelTween();
            this.position.copyFrom(this.homePosition);
        }
    }

    // --- Drag handling ---

    private _onPointerDown(event: PIXI.FederatedPointerEvent): void {
        if (!this.interactionEnabled) return;
        this._cancelTween();

        this.dragging = true;
        this.dragMoved = false;
        this.pointerDownAt = performance.now();
        this.pointerDownGlobal.copyFrom(event.global);
        this.positionBeforeDrag.set(this.x, this.y);

        // Where inside the tile the user grabbed it, in parent space.
        const parentPoint = this.parent.toLocal(event.global);
        this.grabOffset.set(parentPoint.x - this.x, parentPoint.y - this.y);

        this.dragSurface.on('pointermove', this._onPointerMove, this);
        this.dragSurface.on('pointerup', this._onPointerUp, this);
        this.dragSurface.on('pointerupoutside', this._onPointerUp, this);
    }

    private _onPointerMove(event: PIXI.FederatedPointerEvent): void {
        if (!this.dragging) return;

        if (!this.dragMoved) {
            const dx = event.global.x - this.pointerDownGlobal.x;
            const dy = event.global.y - this.pointerDownGlobal.y;
            if (Math.hypot(dx, dy) < TAP_MAX_DISTANCE_PX) {
                return; // Still within tap tolerance.
            }
            this.dragMoved = true;
            this.zIndex = 1000;
            this.parent?.sortChildren?.();
            this.scale.set(DRAG_SCALE);
            this.alpha = 0.95;
            this.onDragStartCb?.(this);
        }

        const parentPoint = this.parent.toLocal(event.global);
        this.x = parentPoint.x - this.grabOffset.x;
        this.y = parentPoint.y - this.grabOffset.y;
        this.onDragMoveCb?.(this, new PIXI.Point(event.global.x, event.global.y));
    }

    private _onPointerUp(event: PIXI.FederatedPointerEvent): void {
        if (!this.dragging) return;
        this._detachSurfaceListeners();
        this.dragging = false;
        this.scale.set(this.selected ? 1.05 : 1);
        this.alpha = 1;
        this.zIndex = 0;

        const duration = performance.now() - this.pointerDownAt;
        if (!this.dragMoved && duration <= TAP_MAX_DURATION_MS) {
            this.onTapCb?.(this);
            return;
        }

        if (this.dragMoved) {
            const globalPos = new PIXI.Point(event.global.x, event.global.y);
            this.onDragEndCb?.(this, globalPos);
        } else {
            // Long press without movement: put it back where it was.
            this.snapTo(this.positionBeforeDrag.x, this.positionBeforeDrag.y);
        }
    }

    private _detachSurfaceListeners(): void {
        this.dragSurface.off('pointermove', this._onPointerMove, this);
        this.dragSurface.off('pointerup', this._onPointerUp, this);
        this.dragSurface.off('pointerupoutside', this._onPointerUp, this);
    }

    // --- Drawing ---

    private _drawBody(colors?: { fill: string | number; border: string | number; shadow: string | number }): void {
        const fill = colors?.fill ?? this.style.fillColor;
        const border = colors?.border ?? (this.selected ? this.style.shadowColor : this.style.borderColor);
        const shadow = colors?.shadow ?? this.style.shadowColor;
        const borderWidth = this.selected ? 4 : 3;
        const radius = 12;
        const innerRadius = Math.max(0, radius - borderWidth);

        this.body.clear();
        this.body
            .roundRect(this.shadowOffset, this.shadowOffset, this.tileWidth, this.tileHeight, radius)
            .fill(shadow);
        this.body.roundRect(0, 0, this.tileWidth, this.tileHeight, radius).fill(border);
        this.body
            .roundRect(
                borderWidth,
                borderWidth,
                this.tileWidth - 2 * borderWidth,
                this.tileHeight - 2 * borderWidth,
                innerRadius
            )
            .fill(fill);
    }

    /** Shrinks the label font until the text fits inside the tile. */
    private _fitLabel(): void {
        const maxWidth = this.tileWidth - 14;
        let fontSize = this.style.fontSize;
        while (this.labelText.width > maxWidth && fontSize > 10) {
            fontSize -= 1;
            this.labelText.style.fontSize = fontSize;
        }
    }

    private _cancelTween(): void {
        if (this.tweenFrameId !== null) {
            cancelAnimationFrame(this.tweenFrameId);
            this.tweenFrameId = null;
        }
    }

    public override destroy(options?: Parameters<PIXI.Container['destroy']>[0]): void {
        this._cancelTween();
        this._detachSurfaceListeners();
        this.off('pointerdown', this._onPointerDown, this);
        super.destroy(options ?? { children: true });
    }
}
