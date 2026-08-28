import * as PIXI from 'pixi.js';
import { TileStyle } from './DraggableTile';

export interface DropSlotOptions {
    id: string;
    width: number;
    height: number;
    style: TileStyle;
    /** Optional small label rendered inside the empty slot (e.g. "1", "2"). */
    placeholder?: string;
    /** Fired when the slot is tapped — used for tap-to-place. */
    onTap?: (slot: DropSlot) => void;
}

/**
 * A drop target for a DraggableTile. Draws a dashed-looking outline with a
 * subtle fill, highlights while a dragged tile hovers over it, and supports
 * tap-to-place.
 */
export class DropSlot extends PIXI.Container {
    public readonly slotId: string;
    public readonly slotWidth: number;
    public readonly slotHeight: number;

    /** Tile id currently occupying this slot, or null when empty. */
    public occupantTileId: string | null = null;

    private readonly style: TileStyle;
    private readonly body: PIXI.Graphics;
    private readonly placeholderText: PIXI.Text | null = null;
    private highlighted = false;
    private readonly onTapCb?: (slot: DropSlot) => void;

    constructor(options: DropSlotOptions) {
        super();
        this.slotId = options.id;
        this.slotWidth = options.width;
        this.slotHeight = options.height;
        this.style = options.style;
        this.onTapCb = options.onTap;
        this.label = `DropSlot-${options.id}`;

        this.body = new PIXI.Graphics();
        this.addChild(this.body);

        if (options.placeholder) {
            this.placeholderText = new PIXI.Text({
                text: options.placeholder,
                style: {
                    fontSize: Math.max(12, options.style.fontSize - 6),
                    fill: options.style.borderColor,
                    fontFamily: options.style.fontFamily,
                    align: 'center',
                },
            });
            this.placeholderText.anchor.set(0.5);
            this.placeholderText.x = this.slotWidth / 2;
            this.placeholderText.y = this.slotHeight / 2;
            this.placeholderText.alpha = 0.55;
            this.addChild(this.placeholderText);
        }

        this._draw();

        this.hitArea = new PIXI.Rectangle(0, 0, this.slotWidth, this.slotHeight);
        this.eventMode = 'static';
        this.cursor = 'pointer';
        this.on('pointertap', this._onTap, this);
    }

    /** Center of the slot in global coordinates (for hit-testing dropped tiles). */
    public getGlobalCenter(): PIXI.Point {
        return this.toGlobal(new PIXI.Point(this.slotWidth / 2, this.slotHeight / 2));
    }

    /** True when a global point falls within the slot's (padded) bounds. */
    public containsGlobalPoint(point: PIXI.Point, padding = 12): boolean {
        const local = this.toLocal(point);
        return (
            local.x >= -padding &&
            local.x <= this.slotWidth + padding &&
            local.y >= -padding &&
            local.y <= this.slotHeight + padding
        );
    }

    public setHighlighted(highlighted: boolean): void {
        if (this.highlighted === highlighted) return;
        this.highlighted = highlighted;
        this._draw();
    }

    public setOccupant(tileId: string | null): void {
        this.occupantTileId = tileId;
        if (this.placeholderText) {
            this.placeholderText.visible = tileId === null;
        }
        this._draw();
    }

    public isEmpty(): boolean {
        return this.occupantTileId === null;
    }

    private _onTap(): void {
        this.onTapCb?.(this);
    }

    private _draw(): void {
        const radius = 12;
        const outline = this.highlighted ? this.style.shadowColor : this.style.borderColor;
        const outlineWidth = this.highlighted ? 4 : 2;
        const fillAlpha = this.highlighted ? 0.92 : 0.72;

        this.body.clear();
        this.body
            .roundRect(0, 0, this.slotWidth, this.slotHeight, radius)
            .fill({ color: this.style.fillColor, alpha: fillAlpha })
            .stroke({ color: outline, width: outlineWidth, alpha: this.highlighted ? 0.9 : 0.62 });
    }

    public override destroy(options?: Parameters<PIXI.Container['destroy']>[0]): void {
        this.off('pointertap', this._onTap, this);
        super.destroy(options ?? { children: true });
    }
}
