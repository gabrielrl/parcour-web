namespace PRKR.Editor.Tools {

  import MeshBasicMaterial = THREE.MeshBasicMaterial;
  import LineBasicMaterial = THREE.LineBasicMaterial;
  import LineDashedMaterial = THREE.LineDashedMaterial;


  const VALID_COLOR: number = 0x00ff00;
  const INVALID_COLOR: number = 0xff0000;

  export let Constants = {

    /** Helpers color for valid state. */
    ValidColor: VALID_COLOR,
    
    /** Helpers color for invalid state. */
    InvalidColor: INVALID_COLOR,

    /** Materials */
    Materials: {

      TileHelper: {

        Valid: {

          Lines: new THREE.LineBasicMaterial({
            color: VALID_COLOR,
            depthTest: false
          }),
          Faces: new THREE.MeshBasicMaterial({
            color: VALID_COLOR,
            depthTest: false,
            transparent: true,
            opacity: 0.333
          })

        },

        Invalid: {

          Lines: new THREE.LineBasicMaterial({
            color: INVALID_COLOR,
            depthTest: false
          }),
          Faces: new THREE.MeshBasicMaterial({
            color: INVALID_COLOR,
            depthTest: false,
            transparent: true,
            opacity: 0.333
          })
        }

      },

      Faces: {

        Valid: new THREE.MeshBasicMaterial({
          color: VALID_COLOR,
          transparent: true,
          opacity: 0.333
        }),

        Invalid: new THREE.MeshBasicMaterial({
          color: INVALID_COLOR,
          transparent: true,
          opacity: 0.333
        })

      },

      Lines: {

        Valid: new THREE.LineDashedMaterial({
          color: VALID_COLOR,
          dashSize: 0.25,
          gapSize: 0.125
        }),

        Invalid: new THREE.LineDashedMaterial({
          color: INVALID_COLOR,
          dashSize: 0.25,
          gapSize: 0.125
        })
      }
    }
  };
}