import * as THREE from '../node_modules/three/build/three.module.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { MeshLine, MeshLineMaterial } from './THREE.MeshLine.module.js';
import * as util from './util.js';
// import * as data from '../data/random_on_land_000.json';

const W = 1280;
const H = 800;

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars
//let coordinates = 'data/random_on_land_000.json';

let coordinates1 = [];

let splines = [];

let objectSize = 1.7;
let centerConnectionWidth = 0.11;
let pathConnectionWidth = 0.5;

let pointHistory = 5; // path ... maximum: 100

let numberOfPoints = 321;

var lines = [];
var animateVisibility = true;

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

  initFirebase();
  initCounters();
  initUpload();

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
    antialias: false,
    alpha: true,
    preserveDrawingBuffer: true,
    canvas: document.querySelector("canvas")
  });

  renderer.setSize( W, H );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setClearColor(projectColors[7]);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, W / H, 0.01, 1000 );
  controls = new OrbitControls( camera, renderer.domElement );
  camera.position.z = 70;

  showDots();
  // connectToCenter();
  volumeConnect();
  // connectPath();
  connectPathLine();

  // lights
  var ambientLight = new THREE.AmbientLight( 0x404040, 5 ); // soft white light
  // var directionalLight = new THREE.PointLight( 0xffffff, 20, 50 );
  // scene.add( directionalLight );
  scene.add( ambientLight );
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
      // console.log(pointColorIndex[numberDots]);
      mat = new THREE.MeshLambertMaterial({ color: projectColors[pointColorIndex[numberDots]], flatShading: true, transparent: false, opacity: 1.0 });
      let mesh = new THREE.Mesh( dotGeo, mat );
      mesh.position.set(coordinates1[i].x, coordinates1[i].y, coordinates1[i].z);
      scene.add( mesh );
      numberDots++;
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

function connectPathLine(){
  for(let i = 0; i < numberOfPoints; i++) {
    let geometry = new THREE.Geometry();
    for(let u = 0; u < pointHistory; u++) {
      geometry.vertices.push( new THREE.Vector3(
        coordinates1[i*pointHistory+u].x,
        coordinates1[i*pointHistory+u].y,
        coordinates1[i*pointHistory+u].z
      ) );
    }
    var line = new MeshLine();

    line.setGeometry( geometry );

    var splineMat = new MeshLineMaterial( {
      color: new THREE.Color( projectColors[pointColorIndex[i]] ),
      opacity: 0.8,
      sizeAttenuation: true,
      lineWidth: pathConnectionWidth,
      depthWrite: true,
      wireframe: false,
      transparent: true,
      side: THREE.DoubleSide,
      dashArray: 2,     // always has to be the double of the line
      dashOffset: -1,    // start the dash at zero
      dashRatio: 0.2
    });

    let mesh = new THREE.Mesh( line.geometry, splineMat );
    lines.push ( mesh );
    scene.add( mesh );
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

      var geometry = new THREE.Geometry();

      geometry.vertices.push( new THREE.Vector3( coordinates1[i].x, coordinates1[i].y, coordinates1[i].z ) );
      geometry.vertices.push( new THREE.Vector3( midpointX, midpointY, midpointZ ) );
      geometry.vertices.push( new THREE.Vector3( centerX, centerY, centerZ ) );

      // splines.push ( spline );
      // var tubeGeometry = new THREE.TubeBufferGeometry( spline, 4, centerConnectionWidth, 4, false );

      // let mesh = new THREE.Mesh( tubeGeometry, splineMat );
      // var wireframe = new THREE.Mesh( geometry, wireframeMaterial );
      // mesh.add( wireframe );
      // lines.push ( mesh );
      // scene.add( mesh );

      var line = new MeshLine();

      line.setGeometry( geometry );

      var centerMat = new MeshLineMaterial( {
        color: new THREE.Color( 0xffffff ),
        opacity: 0.5,
        sizeAttenuation: true,
        lineWidth: centerConnectionWidth,
        depthWrite: true,
        wireframe: false,
        transparent: true,
        side: THREE.DoubleSide,
        dashArray: 2,     // always has to be the double of the line
        dashOffset: -1,    // start the dash at zero
        dashRatio: 0.2
      });

      let mesh = new THREE.Mesh( line.geometry, centerMat );
      lines.push ( mesh );
      scene.add( mesh );

    }
  }

  // console.log(scene);

}

function animateRandomPath() {
  scene.children[getRndInteger(numberOfPoints*2, numberOfPoints*pointHistory)].material.opacity = getRndInteger(1,10)*0.1;
}

// always returns a random number between min and max (both included)
function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}


function loop(time) { // eslint-disable-line no-unused-vars

  //using timer as animation
  var speed = Date.now() * 0.00005;
  camera.position.x = Math.cos(speed) * 60;
  camera.position.z = Math.sin(speed) * 60;

  // animateRandomPath();

  camera.lookAt(scene.position);

  requestAnimationFrame( loop );

  // console.log ( lines[0] );
  lines.forEach( function( l, i ) {
    if (i > numberOfPoints) {
      // l.material.uniforms.visibility.value = i ? (time/3000) % 1.0 : 1.0;
      // l.material.uniforms.dashOffset.value = Math.sin(i) + (time/(10*i));
      // l.material.uniforms.visibility.value = (Math.sin(i) + (time/(10*i)) % 1.0);
      l.material.uniforms.visibility.value = Math.sin(time/(6000-i*2));// % 1.0;
      // l.material.uniforms.dashOffset.value -= 0.01;
    }
  } );

  lines.forEach( function( l, i ) {
    if (i <= numberOfPoints) {
      l.material.uniforms.visibility.value = Math.cos(time/(3000-i));// % 1.0;
      // l.material.uniforms.dashOffset.value -= 0.01;
    }
  } );

  // lines[getRndInteger(1, lines.length)].material.uniforms.dashOffset.value = 0.002; //? (time/3000) % 1.0 : 1.0;


  renderer.render( scene, camera );


  // console.log( scene.children );
}


// document.addEventListener('keydown', e => {
//   // console.log(e.key, e.keyCode, e);
//
//   if (e.key == 'f') { // f .. fullscreen
//     util.toggleFullscreen();
//   }
//
//   else if (e.key == 's') {
//     util.saveCanvas();
//   }
//
// });

function initFirebase() {
  // Initialize Firebase
  const config = {
    apiKey: "AIzaSyCdr0kpTbsED6du_p-RulO_m4L7aglFoio",
    projectId: "letsbuildutopia-84770",
    storageBucket: "letsbuildutopia-84770.appspot.com",
  };
  firebase.initializeApp(config);
  console.info(`Firebase SDK ${firebase.SDK_VERSION}`);
}

function initCounters() {
  const locale = 'de';

  // Population clock
  document.addEventListener('DOMContentLoaded', () => {
    const start = 7714100000;
    const persecond = 2.62;
    const date = new Date('2019-07-05');
    const interval = 1000;
    const el = document.querySelector('#count_total')
    setInterval(() => {
      let diff = Math.round( (new Date() - date)/1000 ) + 1;
      let result = Math.round( diff * persecond + start );
      el.textContent = Number(result).toLocaleString(locale);
    }, interval);
  });

  // Live Upload Count
  document.addEventListener('DOMContentLoaded', () => {
    let el = document.querySelector('#count_connected');
    firebase.firestore().doc('_/stats').onSnapshot(doc => {
      let count = doc.data().uploadCount;
      if (count !== undefined) {
        console.log(`Count updated: ${count}`);
        el.textContent = Number(count).toLocaleString(locale);
      }
    });
  });
}

function initUpload() {
  const digits = {
    0: ['md-heart', '0xf308'],
    1: ['ios-moon', '0xf468'],
    2: ['md-flower', '0xf2f3'],
    3: ['ios-star', '0xf4b3'],
    4: ['ios-sunny', '0xf4b7'],
    5: ['md-play', '0xf357'],
    6: ['md-cloud', '0xf2c9'],
    7: ['ios-square', '0xf21a'],
    8: ['md-water', '0xf3a7'],
    9: ['ios-happy', '0xf192'],
  };

  // Code entry
  function characterForDigit(d) {
    let hex = digits[d][1];
    let cp= parseInt(hex, 16); // the 16 is not actually necessary when using hex formatted as 0xABCD
    return String.fromCodePoint(cp);
  }
  const input = document.querySelector('#code');
  const digitButtons = document.querySelectorAll('#keypad button[data-digit]');
  const deleteButton = document.querySelector('#keypad button.delete');
  digitButtons.forEach(el => {
    el.addEventListener('click', e => {
      input.value += characterForDigit(el.dataset.digit);
    });
  });
  deleteButton.addEventListener('click', e => {
    input.value = input.value.slice(0, -1);
  });
}
