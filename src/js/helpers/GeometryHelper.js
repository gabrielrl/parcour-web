(function(window, THREE) {

  /**
   * Computes the center of a geometry. NOTE: It assumes the
   * bounding box has already been computed.
   * @param geometry {THREE.Geometry} The geometry for which
   * the center should be computed.
   * @returns {THREE.Vector3} Geometry's center.
   */
  var computeCenter = function computeCenter(geometry) {
    var bbox = geometry.boundingBox;

    var c = new THREE.Vector3();

    var centerX = 0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    var centerY = 0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
    var centerZ = 0.5 * (geometry.boundingBox.max.z - geometry.boundingBox.min.z);

    return new THREE.Vector3(centerX, centerY, centerZ);
  }

  // Expose ourselves
  window.PRKR = window.PRKR || {};
  window.PRKR.utils = window.PRKR.utils || {};
  window.PRKR.utils.GeometryHelper = {};
  window.PRKR.utils.GeometryHelper.computeCenter = computeCenter;

})(window, THREE);