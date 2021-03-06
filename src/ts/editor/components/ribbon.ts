/// <reference path="./ribbon-configuration.ts" />

/// <reference path="../parcour-editor.ts" />
/// <reference path="../tools/tool.ts" />

namespace PRKR.Editor.Components {

  import Tool = Editor.Tools.Tool;
  import Command = Editor.Commands.Command;

  export class RibbonTab implements RibbonTabConfiguration {
    name: string;
    display: string;
    items: RibbonItem[];
    $elem: JQuery;
    $content: JQuery;
  }

  export class RibbonItem implements RibbonElementConfiguration {
    name: string;
    display: string;
    image: string;
    tool: Tool;
    command: Command;
    $elem: JQuery;
  }

  export class Ribbon implements Component {

    private _editor: ParcourEditor;
    private _configuration: RibbonConfiguration;
    private _domRoot: HTMLElement;

    private _tabRoot: HTMLElement;
    private _contentRoot: HTMLElement;

    private _data: RibbonTab[];

    private _selectedTab: RibbonTab;

    constructor(editor: ParcourEditor, configuration: RibbonConfiguration) {
      this._editor = editor;
      this._configuration = configuration;

      this._build();
      if (this._data.length > 0) {
        this.selectTab(this._data[0]);
      }
      this.update();
    }

    get dom() { return this._domRoot; }

    get tabs() { return this._data; }

    public selectTab(tab: RibbonTab) {

      if (this._selectedTab) {
        this._selectedTab.$elem.removeClass('selected');
        this._selectedTab.$content.addClass('hidden');
      }

      this._selectedTab = tab;

      if (tab) {
        tab.$elem.addClass('selected');
        tab.$content.removeClass('hidden');
      }

    }

    get tabCount(): number { return this._data.length }

    public selectTabIndex(index: number) {
      if (index < 0 || index >= this._data.length) {
        throw new Error(
          `"index" out of bounds. ${ index } is not in [0, ${ this._data.length }[.`)
      }
      this.selectTab(this._data[index]);
    }

    /** Trys to show the specified tool to the user by selecting a tab where it is referenced. */
    public showTool(tool: Tool) {

      // Does the tool show in the current tab?
      if (this._selectedTab.items.find(item => item.tool === tool)) {
        return;
      }

      // Try to find the tool in another tab
      for (let i = 0; i < this._data.length; i++) {
        let tab = this._data[i];
        if (tab !== this._selectedTab) {
          if (tab.items.find(item => item.tool === tool)) {
            this.selectTab(tab);
            return;
          }
        }
      }
    }

    private _tabClicked(tabData: RibbonTab) {
      this.selectTab(tabData);
    }

    private _itemMouseEnter(item: RibbonItem) {
      this._editor.setStatus(buildItemStatus(item));
    }

    private _itemClicked(item: RibbonItem) {
      console.debug('Ribbon item clicked', item);
      
      if (item.tool && item.tool.enabled) {
        this._editor.selectTool(item.tool);
      }

      if (item.command && item.command.enabled) {
        item.command.run();
      }

      this.update();
    }

    public update() {

      this._data.forEach(tab => {
        tab.items.forEach(item => {

          let enabled: boolean = false;
          let selected: boolean = false;
          let highlighted: boolean = false;

          if (item.tool && item.tool.enabled) {
            enabled = true;
            if (item.tool === this._editor.activeTool) {
              selected = true;
            }
          }
            // if (!item.tool.enabled) {
            //   item.$elem.addClass('disabled');
            //   item.$elem.removeClass('selected');
            // } else {
            //   item.$elem.removeClass('disabled');
            //   if (item.tool === this._editor.activeTool) {
            //     item.$elem.addClass('selected');
            //   } else {
            //     item.$elem.removeClass('selected');
            //   }
            // }
          // }
          if (item.command && item.command.enabled) {
            enabled = true;
            if (item.command.highlighted) {
              highlighted = true;
            }
          }

          if (enabled) {
            item.$elem.removeClass('disabled');
          } else {
            item.$elem.addClass('disabled');
          }
          if (selected) {
            item.$elem.addClass('selected');
          } else {
            item.$elem.removeClass('selected');
          }
          if (highlighted) {
            item.$elem.addClass('highlighted');
          } else {
            item.$elem.removeClass('highlighted');
          }
        });
      });

    }

    private _build() {
      let $root = $(
        '<div id="ribbonRoot" class="prkr-ribbon-root">' + 
          '<div id="ribbonTabRoot" class="prkr-ribbon-tab-root"></div>' + 
          '<div id="ribbonContentRoot" class="prkr-ribbon-content-root"></div>' +
        '</div>');
      this._domRoot = $root[0];
      let $tabRoot = $root.find('#ribbonTabRoot');
      this._tabRoot = $tabRoot[0];
      let $contentRoot = $root.find('#ribbonContentRoot')
      this._contentRoot = $contentRoot[0];

      this._data = [];

      this._configuration.tabs.forEach(tab => {

        let $tab = $( 
          `<div id="ribbon-tab-${tab.name}" class="prkr-ribbon-tab">` +
            `${tab.display}` +
          '</div>');

        let $tabContentRoot = $('<div class="tab-content-root hidden"></div>');

        let tabData: RibbonTab = {
          name: tab.name,
          display: tab.display,
          items: [],
          $elem: $tab,
          $content: $tabContentRoot
        };
        $tab.on('click', () => this._tabClicked(tabData));
        this._data.push(tabData);
        $tabRoot.append($tab);

        tab.items.forEach(tabItem => {

          let $tabItem = $(`<div id="ribbon-item-${tabItem.name}" class="prkr-ribbon-item">` +
            `<div class="ribbon-item-image"> ` +
              (tabItem.image != null ? '<i class="fa ' + tabItem.image + '" />' : '') + 
            `</div>` +
            `<div class="ribbon-item-text">${tabItem.display}</div>` +
          '</div>');

          let itemData: RibbonItem = {
            name: tabItem.name,
            display: tabItem.display,
            image: tabItem.image,
            tool: tabItem.tool,
            command: tabItem.command,
            $elem: $tabItem
          };
          $tabItem.on('mouseenter', () => this._itemMouseEnter(itemData));
          $tabItem.on('click', () => this._itemClicked(itemData));
          tabData.items.push(itemData);
          $tabContentRoot.append($tabItem);
        });

        $contentRoot.append($tabContentRoot);
      });
    }
  }

  function buildItemStatus(item: RibbonItem) {
    let description = '';
    let shortcut = null;

    if (item.command) {
      if (item.command.keyboardShortcut) {
        shortcut = item.command.keyboardShortcut.toString();
      }
      description = `"${ item.display }" command`;
    } else if (item.tool) {
      if (item.tool.keyboardShortcut) {
        shortcut = item.tool.keyboardShortcut.toString();
      }
      description = `"${ item.display }" tool`;
    }

    return description + (shortcut ? `<span class="keyboard-shortcut">${ shortcut }</span>` : '');
  }
}