(function(window, THREE) {

  var Room = function Room(data) {
    this.width = 1;
    this.height = 1;
    this.depth = 1;

    if (data) {
      if (data.width) this.width = data.width;
      if (data.height) this.height = data.height;
      if (data.depth) this.depth = data.depth;
    }
  };

  Room.prototype.getGeometry = function getGeometry() {
    var g = new THREE.Geometry();
    var w = this.width;
    var h = this.height;
    var d = this.depth;

    // FLOOR LEVEL
    var V = THREE.Vector3;
    var vertices = g.vertices;
    vertices.push(new V(0, 0, 0));
    vertices.push(new V(w, 0, 0));
    vertices.push(new V(w, 0, d));
    vertices.push(new V(0, 0, d));

    // ROOF LEVEL
    vertices.push(new V(0, h, 0));
    vertices.push(new V(w, h, 0));
    vertices.push(new V(w, h, d));
    vertices.push(new V(0, h, d));

    // FLOOR FACE
    var F = THREE.Face3;
    var faces = g.faces;
    faces.push(new F(0, 2, 1));
    faces.push(new F(2, 0, 3));

    // WALL FACES
    // first wall (along 0-1).
    faces.push(new F(0, 5, 4));
    faces.push(new F(5, 0, 1));

    // second wall (along 1-2).
    faces.push(new F(1, 6, 5));
    faces.push(new F(6, 1, 2));

    // third wall (along 2-3).
    faces.push(new F(2, 7, 6));
    faces.push(new F(7, 2, 3));

    // fourth wall (along 3-0).
    faces.push(new F(3, 4, 7));
    faces.push(new F(4, 3, 0));

    g.computeFaceNormals();
    g.computeBoundingBox();

    return g;
  }

  window.PRKR = window.PRKR || {};
  window.PRKR.Room = Room;
})(window, THREE);