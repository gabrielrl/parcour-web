namespace PRKR.Editor {

  import LineBasicMaterial = THREE.LineBasicMaterial;
  import MeshBasicMaterial = THREE.MeshBasicMaterial;

  export class EditorConstants {

    private constructor() { }

    static SelectionColor = 0x0000ff;

    static SelectionColorDim = 0x000088;
    
    static ToolSuccessColor = 0x00ff00;

    static ToolSuccessColorDim = 0x008800;

    static ToolErrorColor = 0xff0000;

    static ToolErrorColorDim = 0x880000;

    static OverlayInflation = .1;

    static SelectionBoxLineMaterial = new LineBasicMaterial({
      color: EditorConstants.SelectionColorDim,
      depthTest: true,
      depthWrite: true
    });

    static SelectionOverlayFaceMaterial = new MeshBasicMaterial({
      color: EditorConstants.SelectionColor,
      depthTest: true,
      depthWrite: false,
      transparent: true,
      opacity: .333
    });

  }
}