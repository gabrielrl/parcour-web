/// < reference path="../../defs/jquery.d.ts" />

/// <reference path="./asset-palette.ts" />

namespace PRKR.Editor.Components {

  export interface PaletteItemInfo {
    type: string;
    name: string;
    tool?: Tools.Tool;
  }
  
  export class PaletteItem {

    private _palette: AssetPalette;

    private _info: PaletteItemInfo;    

    private _view: HTMLElement;

    private _active: boolean;

    constructor(palette: AssetPalette, info: PaletteItemInfo) {
      this._palette = palette;
      this._info = info;
      this._view = this._buildView();
    }

    public get view() { return this._view; }

    public get active() { return this._active; }
    public set active(value: boolean) { 
      this._active = value;
      if (this._active) {
        $(this._view).addClass('active');
      } else {
        $(this.view).removeClass('active');
      }
    }

    public get tool() { return this._info.tool; }

    public get type() { return this._info.type; }

    public get name() { return this._info.name; }

    private _onClick(e: JQuery.ClickEvent) {
      this._palette.notifyItemClick(this);
    }

    private _buildView() {
        let $div = $('<div></div>')
          .attr('id', AssetPalette.ID_PREFIX + this._info.name)
          .addClass(AssetPalette.CLASS_NAME)
          .html('<span>' + this._info.name + '</span>')
          .on('click', e => this._onClick(e));
        return $div.get(0);
    }


  }
}