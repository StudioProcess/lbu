import * as util from './util.js';
// import * as data from '../data/random_on_land_000.json';

const W = 1280;
const H = 800;

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars
//let coordinates = 'data/random_on_land_000.json';

let coordinates1 = [];

let splines = [];

let objectSize = 1.3;
let centerConnectionWidth = 0.09;
let pathConnectionWidth = 0.15;

let pointHistory = 4; // path ... maximum: 100

let numberOfPoints = 321;

let projectColors = [
  '#ce3b43',
  '#2452c2',
  '#f2c200',
  '#b94db3',
  '#9bcfe4',
  '#b7b5a8',
  '#1e1e1a',
  '#ccf0fd'
];

let pointColorIndex = [];

(function main() {

  setup(); // set up scene
  loop(); // start game loop

})();

function setup() {

  var request = new XMLHttpRequest();
  request.open("GET","./data/on_land_stream_001.json", false);
  request.send(null);
  var data1 = JSON.parse(request.responseText);

  for(let i = 1; i <= numberOfPoints; i++) {
    let randColorIndex = getRndInteger(0, projectColors.length-2);
    pointColorIndex.push(randColorIndex);
  }

  for(let u = 0; u < data1.length; u++){ // 321 points

    for(let o = 0; o < pointHistory; o++){ // 100 positions per point

      let lat = data1[u][o][0];
      let lon = data1[u][o][1];

      var cosLat = Math.cos(lat * Math.PI / 180.0);
      var sinLat = Math.sin(lat * Math.PI / 180.0);
      var cosLon = Math.cos(lon * Math.PI / 180.0);
      var sinLon = Math.sin(lon * Math.PI / 180.0);
      var rad = 40.0;
      let x = rad * cosLat * cosLon;
      let y = rad * cosLat * sinLon;
      let z = rad * sinLat;

      coordinates1.push( {x: x, y: y, z: z} );
    }
  }

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    canvas: document.querySelector("canvas")
  });
  renderer.setSize( W, H );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setClearColor(projectColors[7]);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, W / H, 0.01, 1000 );
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  camera.position.z = 80;

  showDots();
  //connectToCenter();
  volumeConnect();
  connectPath();

  // lights
  var ambientLight = new THREE.AmbientLight( 0x404040, 5 ); // soft white light
  // var directionalLight = new THREE.PointLight( 0xffffff, 20, 50 );
  // scene.add( directionalLight );
  scene.add( ambientLight );

  console.log( pointColorIndex );
}

function showDots(){
  let numberDots = 0;
  for(let i = 0; i < coordinates1.length; i++){
    // let dotGeo = new THREE.CylinderBufferGeometry( objectSize, objectSize, objectSize/3, 6, 6 );
    let dotGeo = null;
    let mat = null;
    if(i%pointHistory==0 && numberDots<numberOfPoints) {
      dotGeo = new THREE.SphereGeometry( objectSize/4, 5, 5 );
      // let randColorIndex = getRndInteger(0, projectColors.length-2);
      console.log(pointColorIndex[numberDots]);
      mat = new THREE.MeshLambertMaterial({ color: projectColors[pointColorIndex[numberDots]], flatShading: true });
      let mesh = new THREE.Mesh( dotGeo, mat );
      mesh.position.set(coordinates1[i].x, coordinates1[i].y, coordinates1[i].z);
      scene.add( mesh );
      numberDots++;
    } else {
      // dotGeo = new THREE.SphereGeometry( objectSize/12, 5, 5 );
      // mat = new THREE.MeshLambertMaterial({ color: 0xda4c40, flatShading: true });
      // let mesh = new THREE.Mesh( dotGeo, mat );
      // mesh.position.set(coordinates1[i].x, coordinates1[i].y, coordinates1[i].z);
      // scene.add( mesh );
    }
  }
}

function connectToCenter(){
  for(let i = 0; i < coordinates1.length; i++){
    let connectionMat = new THREE.LineBasicMaterial( { color: 0x1e90ff } );

    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(0, 0, 0) );
    geometry.vertices.push(new THREE.Vector3( coordinates1[i].x, coordinates1[i].y, coordinates1[i].z) );

    var line = new THREE.Line( geometry, connectionMat );
    scene.add( line );
  }
}


function connectPath(){
  let first = true;

  // let splineMat = new THREE.MeshLambertMaterial( { color: 0xedbe00, flatShading: false, wireframe: false, transparent: true, opacity: 0.8 } );

  var startX;
  var startY;
  var startZ;

  var endPointX;
  var endPointY;
  var endPointZ;

  for(let i = 0; i < numberOfPoints; i++){
    first = true;
    for(let u = 0; u < pointHistory-1; u++) { // for each path segment

      if(u==0){
        startX = coordinates1[i*pointHistory+u].x;
        startY = coordinates1[i*pointHistory+u].y;
        startZ = coordinates1[i*pointHistory+u].z;

        endPointX = coordinates1[i*pointHistory+u+1].x;
        endPointY = coordinates1[i*pointHistory+u+1].y;
        endPointZ = coordinates1[i*pointHistory+u+1].z;
      } else if(u==pointHistory-2) {
        startX = coordinates1[i*pointHistory+u].x;
        startY = coordinates1[i*pointHistory+u].y;
        startZ = coordinates1[i*pointHistory+u].z;

        endPointX = coordinates1[i*pointHistory+u+1].x;
        endPointY = coordinates1[i*pointHistory+u+1].y;
        endPointZ = coordinates1[i*pointHistory+u+1].z;

        // console.log("last");
      } else {
        startX = coordinates1[i*pointHistory+u].x;
        startY = coordinates1[i*pointHistory+u].y;
        startZ = coordinates1[i*pointHistory+u].z;

        endPointX = coordinates1[i*pointHistory+u+1].x;
        endPointY = coordinates1[i*pointHistory+u+1].y;
        endPointZ = coordinates1[i*pointHistory+u+1].z;
      }

      var midpointX = (startX+endPointX)/2;
      var midpointY = (startY+endPointY)/2;
      var midpointZ = (startZ+endPointZ)/2;

      var spline = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3( startX, startY, startZ ),
        new THREE.Vector3( midpointX, midpointY, midpointZ ),
        new THREE.Vector3( endPointX, endPointY, endPointZ )
      );

      splines.push ( spline );
      var tubeGeometry = new THREE.TubeBufferGeometry( spline, 4, pathConnectionWidth, 4, false );

      // let randColorIndex = getRndInteger(0, projectColors.length-2);
      let splineMat = new THREE.MeshLambertMaterial( { color: projectColors[pointColorIndex[i]], flatShading: false, wireframe: false, transparent: true, opacity: 0.8 } );

      let mesh = new THREE.Mesh( tubeGeometry, splineMat );
      // var wireframe = new THREE.Mesh( geometry, wireframeMaterial );
      // mesh.add( wireframe );
      // console.log( spline );
      scene.add( mesh );
    }
    // i+=pointHistory;
    first = false;
  }
}

function volumeConnect(){
  // https://threejs.org/examples/#webgl_geometry_extrude_splines

  let splineMat = new THREE.MeshLambertMaterial( { color: 0xccf0fd, flatShading: false, wireframe: false, transparent: true, opacity: 0.8 } );
  var centerX = 0;
  var centerY = 0;
  var centerZ = 0;

  for(let i = 0; i < coordinates1.length; i++){

    if(i%pointHistory==0 && i < numberOfPoints*pointHistory){
      var midpointX = (coordinates1[i].x+centerX)/2;
      var midpointY = (coordinates1[i].y+centerY)/2;
      var midpointZ = (coordinates1[i].z+centerZ)/2;

      var spline = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3( coordinates1[i].x, coordinates1[i].y, coordinates1[i].z ),
        new THREE.Vector3( midpointX, midpointY, midpointZ ),
        new THREE.Vector3( centerX, centerY, centerZ )
      );

      splines.push ( spline );
      var tubeGeometry = new THREE.TubeBufferGeometry( spline, 4, centerConnectionWidth, 4, false );

      let mesh = new THREE.Mesh( tubeGeometry, splineMat );
      // var wireframe = new THREE.Mesh( geometry, wireframeMaterial );
      // mesh.add( wireframe );
      console.log( "spline" );
      scene.add( mesh );
    }
  }

}

// always returns a random number between min and max (both included)
function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}


function loop(time) { // eslint-disable-line no-unused-vars

  requestAnimationFrame( loop );
  renderer.render( scene, camera );

}


document.addEventListener('keydown', e => {
  // console.log(e.key, e.keyCode, e);

  if (e.key == 'f') { // f .. fullscreen
    util.toggleFullscreen();
  }

  else if (e.key == 's') {
    util.saveCanvas();
  }

});
