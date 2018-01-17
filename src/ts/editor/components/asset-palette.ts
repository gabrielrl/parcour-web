/// <reference path="../../defs/prkr.bundle.d.ts" />

/// <reference path="../editor-api.ts" />

/// <reference path="../tools/room-drawing-tool.ts" />
/// <reference path="../tools/location-placement-tool.ts" />

/// <reference path="./palette-item.ts" />

namespace PRKR.Editor.Components {

  import LocationKind = Model.LocationKind;
  import RoomDrawingTool = Tools.RoomDrawingTool;
  import LocationPlacementTool = Tools.LocationPlacementTool;

  /**
   * TODO comment
   * Emits `item-click`
   * 
   */
  export class AssetPalette extends EventEmitter {

    public static ID_PREFIX = 'asspal-';
    public static CLASS_NAME = 'prkred-pal-item'

    private _editor: ParcourEditor;

    private _view: HTMLElement;

    private _assets: PaletteItemInfo[];
    //private _assetViews: { [key:string]: JQuery } = {};

    private _assetItems: PaletteItem[];

    constructor(editor: ParcourEditor) {     
      super();
      this._editor = editor;
      this._assets = this._fetchAssets();
      this._view = this._build(this._assets);
    }

    public get view() { return this._view; }

    public update() {
      let activeTool = this._editor.activeTool;
      this._assetItems.forEach(item => {
        item.active = !!(item.tool && item.tool === activeTool);
      });
    }

    public notifyItemClick(item: PaletteItem) {
      console.debug('on notifyItemClick', 'item=', item);

      this.emit('item-click', item);
      // TODO.
    }

    private _fetchAssets(): PaletteItemInfo[] {
      // TODO Fetch assets (for real)
      let assets: PaletteItemInfo[] = [{
        type: 'Area', name: 'Room',
        tool: new RoomDrawingTool(this._editor)
      }, {
        type: 'Location', name: 'Start',
        tool: new LocationPlacementTool(this._editor, LocationKind.Start)
      }, {
        type: 'Location', name: 'End',
        tool: new LocationPlacementTool(this._editor, LocationKind.End)
      }];
      return assets;
    }

    private _build(assets: PaletteItemInfo[]): HTMLElement {
      let $root = $('<div></div>');
      let items: PaletteItem[] = []
      assets.forEach(a => {
        let item = new PaletteItem(this, a);
        $root.append(item.view);
        items.push(item);
      });

      this._assetItems = items;

      return $root.get(0);
    }
  }
}