import * as THREE from '../node_modules/three/build/three.module.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { MeshLine, MeshLineMaterial } from './THREE.MeshLine.module.js';
import * as util from './util.js';
import * as lbu from './lbu.js';
// import * as data from '../data/random_on_land_000.json';

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

const W = 1280;
const H = 800;

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars
//let coordinates = 'data/random_on_land_000.json';

let coordinates1 = [];
let originalCoordinates = [];
let mappedCoordinates = [];
let mainDots = [];
let streamsForDots = [];

let dots = [];

let objectSize = 1.0;
let centerConnectionWidth = 2.11;
let pathConnectionWidth = 2.5;

let pointHistory = 5; // path ... maximum: 100

let numberOfPointStreams;
var lines = [];
var resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );

let projectColors = [ '#ce3b43', '#2452c2', '#f2c200', '#b94db3', '#9bcfe4', '#b7b5a8', '#CCCCCC', '#CCDEFF' ];

let pointColorIndex = [];
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
var params = new Params();

let originalLat = [];
let originalLon = [];

let mappedLat = [];
let mappedLon = [];

(async function main() {

  await setup(); // set up scene
  loop(); // start game loop

})();

async function setup() {

  initLibrary();
  initPageElements();
  initUpload();

  let data = await lbu.onData(() => {});
  numberOfPointStreams = Object.keys(data.integrated).length; // set total number of visualized paths

  // var request = new XMLHttpRequest();
  // request.open("GET","./data/on_land_stream_001.json", false);
  // request.send(null);
  // var data1 = JSON.parse(request.responseText);

  // for(let i = 1; i <= numberOfPoints; i++) {
  //   let randColorIndex = getRndInteger(0, projectColors.length-2);
  // }

  let numberOfCoords = 0;
  let minLat = 90;
  let maxLat = -90;
  let minLon = 90;
  let maxLon = -90;

  let noPointsPerStream = [];
  for (let key of Object.keys(data.integrated)) { // for all streams
    let points = data.integrated[key];
    for(let u = 0; u < points.length-1; u++) { // for all previous points for each streams
      let lat = data.integrated[key][u];
      let lon = data.integrated[key][u+1];

      if (lat <= minLat) { minLat = lat; }
      if (lat >= maxLat) { maxLat = lat; }

      if (lon <= minLon) { minLon = lon; }
      if (lon >= maxLon) { maxLon = lon; }

      originalLat.push(lat);
      originalLon.push(lon);

      numberOfCoords++;
    }
    noPointsPerStream[key] = points.length/2;
  }

  for(let t = 0; t < originalLat.length; t++) {

    mappedLat.push(originalLat[t].map(minLat, maxLat, -90, 90));
    mappedLon.push(originalLon[t].map(minLon, maxLon, -180, 180));

    var cosLat = Math.cos(mappedLat[t] * Math.PI / 180.0);
    var sinLat = Math.sin(mappedLat[t] * Math.PI / 180.0);
    var cosLon = Math.cos(mappedLon[t] * Math.PI / 180.0);
    var sinLon = Math.sin(mappedLon[t] * Math.PI / 180.0);
    var rad = 40.0;
    let x = rad * cosLat * cosLon;
    let y = rad * cosLat * sinLon;
    let z = rad * sinLat;

    coordinates1.push( {x: x, y: y, z: z} );
  }

  // console.log( noPointsPerStream );

  // console.log(numberOfCoords/2);
  // console.log(data.integrated );

  // for(let u = 0; u < numberOfPointStreams; u++){ // max 321 points
  //
  //   for(let o = 0; o < pointHistory; o++){ // 100 positions per point
  //
  //     let lat = data1[u][o][0];
  //     let lon = data1[u][o][1];
  //
  //     if (lat <= minLat) { minLat = lat; }
  //     if (lat >= maxLat) { maxLat = lat; }
  //
  //     if (lon <= minLon) { minLon = lon; }
  //     if (lon >= maxLon) { maxLon = lon; }
  //
  //     originalLat.push(lat);
  //     originalLon.push(lon);
  //
  //     numberOfCoords++;
  //
  //     // console.log("lat: "+data1[u][o][0]+" long: "+data1[u][o][1]);
  //
  //     // mappedLat = mapLatLong (minLat, maxLat, -90, 90);
  //
  //     // map lat from -90° to 90°
  //     // map long from -180° to 180°
  //   }
  // }
  //
  // console.log( data1 );
  //
  // // TODO: use visible coordinates only for mapping
  // for(let t = 0; t < originalLat.length; t++) {
  //
  //   mappedLat.push(originalLat[t].map(minLat, maxLat, -90, 90));
  //   mappedLon.push(originalLon[t].map(minLon, maxLon, -180, 180));
  //
  //   var cosLat = Math.cos(mappedLat[t] * Math.PI / 180.0);
  //   var sinLat = Math.sin(mappedLat[t] * Math.PI / 180.0);
  //   var cosLon = Math.cos(mappedLon[t] * Math.PI / 180.0);
  //   var sinLon = Math.sin(mappedLon[t] * Math.PI / 180.0);
  //   var rad = 40.0;
  //   let x = rad * cosLat * cosLon;
  //   let y = rad * cosLat * sinLon;
  //   let z = rad * sinLat;
  //
  //   coordinates1.push( {x: x, y: y, z: z} );
  // }
  //
  // // test if mapping works...
  // let minLatMapped = 90;
  // let maxLatMapped = -90;
  // let minLonMapped = 90;
  // let maxLonMapped = -90;
  // for (let u=0; u < mappedLat.length; u++) {
  //
  //   let latMapped = mappedLat[u];
  //   let lonMapped = mappedLon[u];
  //
  //   if (latMapped <= minLatMapped) { minLatMapped = latMapped; }
  //   if (latMapped >= maxLatMapped) { maxLatMapped = latMapped; }
  //
  //   if (lonMapped <= minLonMapped) { minLonMapped = lonMapped; }
  //   if (lonMapped >= maxLonMapped) { maxLonMapped = lonMapped; }
  // }
  //
  // console.log("prior to mapping...");
  // console.log("LAT: min: "+minLat+", max: "+maxLat+" / "+" LON: min: "+minLon+", max: "+maxLon);
  // console.log("after mapping...");
  // console.log("LAT: min: "+minLatMapped+", max: "+maxLatMapped+" / "+"LON: min: "+minLonMapped+", max: "+maxLonMapped);


  // console.log( originalLon );
  // console.log( mappedLon );


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

  createTravelledPaths();
  showLastPositionAsDots();
  connectToCenter();

  // lights
  // var ambientLight = new THREE.AmbientLight( 0x404040, 5 ); // soft white light
  // var directionalLight = new THREE.PointLight( 0xffffff, 20, 50 );
  // scene.add( directionalLight );
  // scene.add( ambientLight );

  // testData();
}

function testData(){
  lbu.onData( ( data ) => {
    console.log( data );
    console.log( Object.keys(data.integrated).length ); // number of current paths in dataset
    console.log( data.updated ); // last updated path
    console.log( data.integrated[data.updated] ); // stream of points of last updated path
    console.log( data.integrated ); // current data
  });

}

let indexDot = 0;
function showLastPositionAsDots() {
  lbu.onData( ( data ) => {
    let skipper = 0;
    for (let key of Object.keys(data.integrated)) {
      let points = data.integrated[key];
      let dotGeo = null;
      let mat = null;

      for (let i = 0; i < points.length-1; i++) {

        if(i == points.length-2) { // last point
          dotGeo = new THREE.SphereGeometry( objectSize/2, 5, 5 );
          pointColorIndex.push(indexDot);
          // console.log("indexDot: "+indexDot);

        } else {
          dotGeo = new THREE.SphereGeometry( objectSize/10, 5, 5 );
        }

        // let lat = points[i];
        // let lon = points[i+1];
        //
        // var cosLat = Math.cos(lat * Math.PI / 180.0);
        // var sinLat = Math.sin(lat * Math.PI / 180.0);
        // var cosLon = Math.cos(lon * Math.PI / 180.0);
        // var sinLon = Math.sin(lon * Math.PI / 180.0);
        // var rad = 40.0;
        // let x = rad * cosLat * cosLon;
        // let y = rad * cosLat * sinLon;
        // let z = rad * sinLat;

        // console.log( "x: "+x+" y: "+" z: "+z );

        mat = new MeshLineMaterial( {
          // map: strokeTexture,
          useMap: params.strokes,
          color: new THREE.Color( projectColors[indexDot%projectColors.length] ),
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

        // mesh.position.set(coordinates1[indexDot+data.integrated[key].length].x, coordinates1[indexDot+data.integrated[key].length].y, coordinates1[indexDot+data.integrated[key].length].z);
        mesh.position.set(coordinates1[skipper].x, coordinates1[skipper].y, coordinates1[skipper].z);

        dots.push( mesh );
        scene.add( mesh );

        // console.log("mesh: "+mesh);
        i++;
      }
      skipper += points.length;
      indexDot++;
    }

  });
}

function createTravelledPaths(){

  let index = 0;

  lbu.onData( ( data ) => {
    // console.log( data );
    // console.log( Object.keys(data.integrated).length ); // number of current paths in dataset
    // console.log( data.updated ); // last updated path
    // console.log( data.integrated[data.updated] ); // stream of points of last updated path
    // console.log( data.integrated ); // current data

    // console.log( data.integrated );
    let skipper = 0;
    for (let key of Object.keys(data.integrated)) {
      let points = data.integrated[key];
      var line = new MeshLine();
      let geometry = new THREE.Geometry();
      index++;
      for (let i = 0; i < points.length-1; i++) {
        // console.log ( points.length );

        // let lat = points[i];
        // let lon = points[i+1];
        //
        // var cosLat = Math.cos(lat * Math.PI / 180.0);
        // var sinLat = Math.sin(lat * Math.PI / 180.0);
        // var cosLon = Math.cos(lon * Math.PI / 180.0);
        // var sinLon = Math.sin(lon * Math.PI / 180.0);
        // var rad = 40.0;
        let x = coordinates1[skipper+i].x;
        let y = coordinates1[skipper+i].y;
        let z = coordinates1[skipper+i].z;

        // for(let u = 0; u < key.length; u++) {
        // }
        // console.log( "x: "+coordinates1[data.integrated[key].length+i].x+" y: "+coordinates1[data.integrated[key].length+i].y+" z: "+coordinates1[data.integrated[key].length+i].z);
        console.log( coordinates1[skipper+i] );
        geometry.vertices.push( new THREE.Vector3( x, y, z) );
        // console.log("mesh: "+mesh);
        i++;
      }
      // console.log( points);
      skipper += points.length;
      // console.log( "skipper: "+skipper );
      line.setGeometry( geometry );

      // console.log("index: "+index%projectColors.length);

      var splineMat = new MeshLineMaterial( {
        // map: strokeTexture,
        useMap: params.strokes,
        color: new THREE.Color( projectColors[index%projectColors.length] ),
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

  });
}

let connectionIndex = 0;
function connectToCenter() {
  lbu.onData( ( data ) => {
    // console.log( data );
    // console.log( Object.keys(data.integrated).length ); // number of current paths in dataset
    // console.log( data.updated ); // last updated path
    // console.log( data.integrated[data.updated] ); // stream of points of last updated path
    // console.log( data.integrated ); // current data

    // console.log( data.integrated );
    let skipper = 0;
    for (let key of Object.keys(data.integrated)) {
      let points = data.integrated[key];
      var line = new MeshLine();
      let geometry = new THREE.Geometry();

      let lat = points[points.length-2];
      let lon = points[points.length-1];

      var cosLat = Math.cos(lat * Math.PI / 180.0);
      var sinLat = Math.sin(lat * Math.PI / 180.0);
      var cosLon = Math.cos(lon * Math.PI / 180.0);
      var sinLon = Math.sin(lon * Math.PI / 180.0);
      var rad = 40.0;
      let x = rad * cosLat * cosLon;
      let y = rad * cosLat * sinLon;
      let z = rad * sinLat;

      let center = new THREE.Vector3( 0, 0, 0);

      // let point = new THREE.Vector3( coordinates1[connectionIndex+data.integrated[key].length].x, coordinates1[connectionIndex+data.integrated[key].length].y, coordinates1[connectionIndex+data.integrated[key].length].z);
      let point = new THREE.Vector3( coordinates1[skipper].x, coordinates1[skipper].y, coordinates1[skipper].z);
      skipper += points.length;
      // console.log("from: "+center.x+" "+center.y+" "+center.z+" to: "+point.x+" "+point.y+" "+point.z);

      geometry.vertices.push( center );
      geometry.vertices.push( point );

      line.setGeometry( geometry );

      var splineMat = new MeshLineMaterial( {
        // map: strokeTexture,
        useMap: params.strokes,
        color: new THREE.Color( 0xFFFFFF ),
        opacity: 0.9,//params.strokes ? .5 : 1,
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
        alphaTest: params.strokes ? .5 : 0,
        transparent: true,
        side: THREE.DoubleSide
      });

      let mesh = new THREE.Mesh( line.geometry, splineMat );
      lines.push ( mesh );
      scene.add( mesh );

      connectionIndex++;
    }

  });
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
  camera.lookAt(scene.position);

  requestAnimationFrame( loop );

  // animation centerConnection
  // lines.forEach( function( l, i ) {
  //   if (i <= 27) { // TODO: current number of entries here instead of 27
  //     // l.material.uniforms.visibility.value = Math.cos(time/(6000-i));// % 1.0;
  //     l.material.uniforms.visibility.value = Math.abs(Math.cos(speed) * 0.6);
  //     // console.log( l.material.uniforms.visibility.value = Math.abs(Math.cos(speed) * 0.6) );
  //   }
  // } );

  renderer.render( scene, camera );
}

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

  lbu.setupImageSelect({ input: '#exampleFileUpload', background: '.image-upload' }).then(e => {
    // NOTE: this code is run when an image is selected the first time
    // NOTE: 'Choose Photo' input button is hidden
    // document.getElementById("uploadlabel").style.display = "none";
    document.getElementById("uploadlabel").classList.remove("uploadbutton");
    document.getElementById("uploadlabel").classList.add("uploadbuttonSelected");
    document.getElementById("uploadlabel").innerHTML = 'Replace photo...';
    console.log('image selected', e);
  });
}

function initUpload() {
  const log = console.log;

  document.querySelector('.finaluploadbutton').addEventListener('click', e => {
    e.preventDefault();

    log('UPLOAD STARTED');
    document.getElementById("MissingFile").style.display = "none";
    document.getElementById("InvalidFileParameter").style.display = "none";
    document.getElementById("InvalidFileType").style.display = "none";
    document.getElementById("InvalidFileSize").style.display = "none";
    document.getElementById("InvalidCodeFormat").style.display = "none";
    document.getElementById("GeolocationUnsupported").style.display = "none";
    document.getElementById("GeolocationDenied").style.display = "none";
    document.getElementById("GeolocationUnavailable").style.display = "none";
    document.getElementById("GeolocationTimeout").style.display = "none";
    document.getElementById("InvalidCode").style.display = "none";
    document.getElementById("UploadSize").style.display = "none";
    document.getElementById("UploadError").style.display = "none";


    lbu.upload({
      file: document.querySelector('#exampleFileUpload').files[0],
      code: document.querySelector('#code').value,
      message: document.querySelector('.messageupload textarea').value,
      onProgress: status => {
        log('PROGRESS', status);
      },
      onLocation: loc => {
        log('LOCATION', loc);
      },
    }).then(_res => {
      document.getElementById("keypad").style.display = "none";
      document.getElementById("afterupload").style.display = "block";
      log('SUCCESS');
    }).catch(err => {
      // log('ERROR', err);
      //   { name:'MissingFile',            message:'No file provided' }
      //   { name:'InvalidFileParameter',   message:'Invalid file parameter' }
      //   { name:'InvalidFileType',        message:'Invalid file type. Please select PNG, JPEG or WEBP' }
      //   { name:'InvalidFileSize',        message:'File size exeeds upload limit' }
      //   { name:'InvalidCodeFormat',      message:'Invalid code format' }
      //   { name:'GeolocationUnsupported', message:'Geolocation feature unsupported in browser' }
      //   { name:'GeolocationDenied',      message:'Geolocation denied by user or browser settings' }
      //   { name:'GeolocationUnavailable', message:'Geolocation (temporarily) unavailable' }
      //   { name:'GeolocationTimeout',     message:'Geolocation timeout' }
      //   { name:'InvalidCode',            message:'Invalid upload code provided' }
      //   { name:'UploadSize',             message:'Upload size limit exeeded' }
      //   { name:'UploadError',            message:'Error while uploading file', errorObject }
      if(err.name == 'MissingFile') { document.getElementById("MissingFile").style.display = "block"; }
      if(err.name == 'InvalidFileParameter') { document.getElementById("InvalidFileParameter").style.display = "block"; }
      if(err.name == 'InvalidFileType') { document.getElementById("InvalidFileType").style.display = "block"; }
      if(err.name == 'InvalidFileSize') { document.getElementById("InvalidFileSize").style.display = "block"; }
      if(err.name == 'InvalidCodeFormat') { document.getElementById("InvalidCodeFormat").style.display = "block"; }
      if(err.name == 'GeolocationUnsupported') { document.getElementById("GeolocationUnsupported").style.display = "block"; }
      if(err.name == 'GeolocationDenied') { document.getElementById("GeolocationDenied").style.display = "block"; }
      if(err.name == 'GeolocationUnavailable') { document.getElementById("GeolocationUnavailable").style.display = "block"; }
      if(err.name == 'GeolocationTimeout') { document.getElementById("GeolocationTimeout").style.display = "block"; }
      if(err.name == 'InvalidCode') { document.getElementById("InvalidCode").style.display = "block"; }
      if(err.name == 'UploadSize') { document.getElementById("UploadSize").style.display = "block"; }
      if(err.name == 'UploadError') { document.getElementById("UploadError").style.display = "block"; }
      if(err.name == 'MissingCode') { document.getElementById("MissingCode").style.display = "block"; }
      throw err.message;
    });
  });
}
