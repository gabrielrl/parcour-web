/// <reference path="../parcour-editor.ts" />

namespace PRKR.Editor.Components {

  export interface RibbonConfiguration {
    tabs: RibbonTabConfiguration[];
  }

  export interface RibbonTabConfiguration {
    name: string,
    display: string,
    items: RibbonElementConfiguration[];
  }

  export interface RibbonElementConfiguration {
    name: string;
    display: string;
    image?: string;
    tool?: Tools.Tool;
    command?: Commands.Command;
  }




}
