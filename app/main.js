import * as THREE from '../node_modules/three/build/three.module.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { MeshLine, MeshLineMaterial } from './THREE.MeshLine.module.js';
import * as util from './util.js';
import * as lbu from './lbu.js';
// import * as data from '../data/random_on_land_000.json';

const W = 1280;
const H = 800;

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars
//let coordinates = 'data/random_on_land_000.json';

let coordinates1 = [];

let dots = [];

let objectSize = 1.0;
let centerConnectionWidth = 1.11;
let pathConnectionWidth = 6.5;

let pointHistory = 5; // path ... maximum: 100

let numberOfPoints = 321;

var lines = [];
var animateVisibility = true;

var resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );

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

var Params = function() {
  this.curves = true;
  this.circles = false;
  this.amount = 100;
  this.lineWidth = pathConnectionWidth;
  this.dashArray = 0.0;
  this.dashOffset = 0;
  this.dashRatio = 0.5;
  this.taper = 'parabolic';
  this.strokes = false;
  this.sizeAttenuation = false;
  this.animateWidth = false;
  this.spread = false;
  this.autoRotate = true;
  this.autoUpdate = true;
  this.animateVisibility = false;
  this.animateDashOffset = false;
};

let pointColorIndex = [];
var params = new Params();

(function main() {

  setup(); // set up scene
  loop(); // start game loop

})();

function setup() {

  initLibrary();
  initPageElements();

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

  // showDots();
  volumeConnect();
  connectPathLine();

  // lights
  // var ambientLight = new THREE.AmbientLight( 0x404040, 5 ); // soft white light
  // var directionalLight = new THREE.PointLight( 0xffffff, 20, 50 );
  // scene.add( directionalLight );
  // scene.add( ambientLight );
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
      // mat = new THREE.MeshLambertMaterial({ color: projectColors[pointColorIndex[numberDots]], flatShading: true, transparent: false, opacity: 1.0 });

      mat = new MeshLineMaterial( {
        // map: strokeTexture,
        useMap: params.strokes,
        color: new THREE.Color( projectColors[pointColorIndex[numberDots]] ),
        opacity: params.strokes ? .5 : 1,
        dashArray: params.dashArray,
        dashOffset: params.dashOffset,
        dashRatio: params.dashRatio,
        resolution: resolution,
        sizeAttenuation: params.sizeAttenuation,
        lineWidth: centerConnectionWidth,
        near: camera.near,
        far: camera.far,
        depthWrite: false,
        depthTest: !params.strokes,
        alphaTest: .5,//params.strokes ? .5 : 0,
        transparent: true,
        side: THREE.DoubleSide
    });


      let mesh = new THREE.Mesh( dotGeo, mat );
      mesh.position.set(coordinates1[i].x, coordinates1[i].y, coordinates1[i].z);
      dots.push( mesh );
      scene.add( mesh );
      numberDots++;
    }
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

    // var splineMat = new MeshLineMaterial( {
    //   color: new THREE.Color( projectColors[pointColorIndex[i]] ),
    //   opacity: 0.8,
    //   sizeAttenuation: true,
    //   lineWidth: pathConnectionWidth,
    //   depthWrite: true,
    //   wireframe: false,
    //   transparent: true,
    //   side: THREE.DoubleSide,
    //   dashArray: 2,     // always has to be the double of the line
    //   dashOffset: -1,    // start the dash at zero
    //   dashRatio: 0.2
    // });

    var splineMat = new MeshLineMaterial( {
      // map: strokeTexture,
      useMap: params.strokes,
      color: new THREE.Color( projectColors[pointColorIndex[i]] ),
      opacity: 0.9,//params.strokes ? .5 : 1,
      dashArray: params.dashArray,
      dashOffset: params.dashOffset,
      dashRatio: params.dashRatio,
      resolution: resolution,
      sizeAttenuation: params.sizeAttenuation,
      lineWidth: params.lineWidth,
      near: camera.near,
      far: camera.far,
      depthWrite: false,
      depthTest: !params.strokes,
      alphaTest: params.strokes ? .5 : 0,
      transparent: true,
      side: THREE.DoubleSide
	});

    let mesh = new THREE.Mesh( line.geometry, splineMat );
    lines.push ( mesh );
    scene.add( mesh );
  }
}

function volumeConnect(){

  // let splineMat = new THREE.MeshLambertMaterial( { color: 0xccf0fd, flatShading: false, wireframe: false, transparent: true, opacity: 0.8 } );
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

      // var centerMat = new MeshLineMaterial( {
      //   color: new THREE.Color( 0xffffff ),
      //   opacity: 0.5,
      //   sizeAttenuation: true,
      //   lineWidth: centerConnectionWidth,
      //   depthWrite: true,
      //   wireframe: false,
      //   transparent: true,
      //   side: THREE.DoubleSide,
      //   dashArray: 2,     // always has to be the double of the line
      //   dashOffset: -1,    // start the dash at zero
      //   dashRatio: 0.2
      // });

      var centerMat = new MeshLineMaterial( {
        // map: strokeTexture,
        useMap: params.strokes,
        color: new THREE.Color( 0xffffff ),
        opacity: params.strokes ? .5 : 1,
        dashArray: params.dashArray,
        dashOffset: params.dashOffset,
        dashRatio: params.dashRatio,
        resolution: resolution,
        sizeAttenuation: params.sizeAttenuation,
        lineWidth: centerConnectionWidth,
        near: camera.near,
        far: camera.far,
        depthWrite: false,
        depthTest: !params.strokes,
        alphaTest: .5,//params.strokes ? .5 : 0,
        transparent: true,
        side: THREE.DoubleSide
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

  // animation connections
  lines.forEach( function( l, i ) {
    if (i > numberOfPoints) {
      l.material.uniforms.visibility.value = Math.sin(time/(6000-i*2));// % 1.0;
    }
  } );

  // // animation dots
  // dots.forEach( function( l, i ) {
  //   l.radius = 2.0 + i*10;
  // } );

  // console.log ( dots );

  // animation centerConnection
  lines.forEach( function( l, i ) {
    if (i <= numberOfPoints) {
      l.material.uniforms.visibility.value = Math.cos(time/(6000-i));// % 1.0;
    }
  } );
  // console.log(time);


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

function initLibrary() {
  // Initialize LBU Library
  const config = {
    apiKey: "AIzaSyCdr0kpTbsED6du_p-RulO_m4L7aglFoio",
    projectId: "letsbuildutopia-84770",
    storageBucket: "letsbuildutopia-84770.appspot.com",
  };
  lbu.init(config);
}

function initPageElements() {
  // population clock
  lbu.setupPopCounter({ selector: '#count_total', interval: 1000 });

  // live upload count
  lbu.setupUploadCounter({ selector: '#count_connected' });

  // code entry
  lbu.setupCodeEntry({ code_input: '#code', digit_buttons: '#keypad button[data-digit]', delete_button: '#keypad button.delete' });
}
