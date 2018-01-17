namespace PRKR.Helpers {
  import LineBasicMaterial = THREE.LineBasicMaterial;
  import MeshBasicMaterial = THREE.MeshBasicMaterial;
  
  export let Constants = {

    DefaultLineMaterial: new THREE.LineBasicMaterial({
      color: 0x0000ff
    }),

    DefaultFaceMaterial: new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      transparent: true,
      opacity: .25
    })

  };
}