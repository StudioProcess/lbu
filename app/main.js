import * as util from './util.js';
// import * as data from '../data/random_on_land_000.json';

const W = 1280;
const H = 800;

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars
//let coordinates = 'data/random_on_land_000.json';

let coordinates1 = [];
let coordinates2 = [];
let coordinates3 = [];

let splines = [];

let objectSize = 3;
let connectionWidth = 0.2;

(function main() {

  setup(); // set up scene
  loop(); // start game loop

})();

function setup() {

  // fetch("../data/random_on_land_000.json")
  //   .then(function(resp) {
  //     return resp.json();
  //   })
  //   .then(function(data) {
  //     coordinates = data;
  //     return data;
  //     // console.log(coordinates);
  //   });

  var request = new XMLHttpRequest();
  request.open("GET","../data/random_on_land_000.json", false);
  request.send(null);
  var data1 = JSON.parse(request.responseText);

  request.open("GET","../data/random_on_land_001.json", false);
  request.send(null);
  var data2 = JSON.parse(request.responseText);

  request.open("GET","../data/random_on_land_002.json", false);
  request.send(null);
  var data3 = JSON.parse(request.responseText);

  // console.log(data.length);

  for(let u = 0; u < data1.length; u++){

    let lat = data1[u][0];
    let lon = data1[u][1];

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

  for(let u = 0; u < data2.length; u++){

    let lat = data2[u][0];
    let lon = data2[u][1];

    cosLat = Math.cos(lat * Math.PI / 180.0);
    sinLat = Math.sin(lat * Math.PI / 180.0);
    cosLon = Math.cos(lon * Math.PI / 180.0);
    sinLon = Math.sin(lon * Math.PI / 180.0);
    rad = 40.0;
    let x = rad * cosLat * cosLon;
    let y = rad * cosLat * sinLon;
    let z = rad * sinLat;

    coordinates2.push( {x: x, y: y, z: z} );
  }

  for(let u = 0; u < data3.length; u++){

    let lat = data3[u][0];
    let lon = data3[u][1];

    cosLat = Math.cos(lat * Math.PI / 180.0);
    sinLat = Math.sin(lat * Math.PI / 180.0);
    cosLon = Math.cos(lon * Math.PI / 180.0);
    sinLon = Math.sin(lon * Math.PI / 180.0);
    rad = 40.0;
    let x = rad * cosLat * cosLon;
    let y = rad * cosLat * sinLon;
    let z = rad * sinLat;

    coordinates3.push( {x: x, y: y, z: z} );
  }

  // console.log(coordinates);


  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize( W, H );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setClearColor(0xf3f3f3);
  document.body.appendChild( renderer.domElement );

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, W / H, 0.01, 1000 );
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  camera.position.z = 100;

  // let geo = new THREE.SphereGeometry( 3, 4, 4 );
  // let mat = new THREE.MeshBasicMaterial({ color: 0x1e90ff, wireframe: true });
  // let mesh = new THREE.Mesh( geo, mat );
  // scene.add( mesh );

  for(let i = 0; i < coordinates1.length; i++){
    // let dotGeo = new THREE.CylinderBufferGeometry( objectSize, objectSize, objectSize/3, 6, 6 );
    let dotGeo = new THREE.SphereGeometry( objectSize/4, 10, 10 );
    let mat = new THREE.MeshLambertMaterial({ color: 0x14193c, flatShading: true });
    let mesh = new THREE.Mesh( dotGeo, mat );
    mesh.position.set(coordinates1[i].x, coordinates1[i].y, coordinates1[i].z);
    scene.add( mesh );
  }

  // connect

  // connectToCenter();
  volumeConnect();

  var ambientLight = new THREE.AmbientLight( 0x404040, 5 ); // soft white light
  var directionalLight = new THREE.PointLight( 0xffffff, 20, 50 );
  scene.add( directionalLight );
  scene.add( ambientLight );



  // for(let i = 0; i < coordinates2.length; i++){
  //   let dotGeo = new THREE.SphereGeometry( objectSize/4, 4, 4 );
  //   let mat = new THREE.MeshBasicMaterial({ color: 0xCCCCCC, wireframe: false });
  //   let mesh = new THREE.Mesh( dotGeo, mat );
  //   mesh.position.set(coordinates2[i].x, coordinates2[i].y, coordinates2[i].z);
  //   scene.add( mesh );
  // }
  //
  // for(let i = 0; i < coordinates3.length; i++){
  //   let dotGeo = new THREE.SphereGeometry( objectSize/4, 4, 4 );
  //   let mat = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: false });
  //   let mesh = new THREE.Mesh( dotGeo, mat );
  //   mesh.position.set(coordinates3[i].x, coordinates3[i].y, coordinates3[i].z);
  //   scene.add( mesh );
  // }

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
  for(let i = 0; i < coordinates1.length; i++){
    let connectionMat = new THREE.LineBasicMaterial( { color: 0x1e90ff } );

    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3( coordinates1[i].x, coordinates1[i].y, coordinates1[i].z ) );
    geometry.vertices.push(new THREE.Vector3( coordinates2[i].x, coordinates2[i].y, coordinates2[i].z ) );

    var line = new THREE.Line( geometry, connectionMat );
    scene.add( line );
  }
}

function volumeConnect(){
  // https://threejs.org/examples/#webgl_geometry_extrude_splines

  let splineMat = new THREE.MeshLambertMaterial( { color: 0x1e90ff, flatShading: false, wireframe: false, transparent: true, opacity: 0.8 } );
  var centerX = 0;
  var centerY = 0;
  var centerZ = 0;

  for(let i = 0; i < coordinates1.length; i++){

    var midpointX = (coordinates1[i].x+centerX)/2;
    var midpointY = (coordinates1[i].y+centerY)/2;
    var midpointZ = (coordinates1[i].z+centerZ)/2;

    var spline = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3( coordinates1[i].x, coordinates1[i].y, coordinates1[i].z ),
      new THREE.Vector3( midpointX, midpointY, midpointZ ),
      new THREE.Vector3( 0, 0, 0 )
    );

    splines.push ( spline );
    var tubeGeometry = new THREE.TubeBufferGeometry( spline, 4, connectionWidth, 4, false );

    let mesh = new THREE.Mesh( tubeGeometry, splineMat );
    // var wireframe = new THREE.Mesh( geometry, wireframeMaterial );
    // mesh.add( wireframe );
    // console.log( spline );
    scene.add( mesh );


  }

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
