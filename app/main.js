import * as THREE from '../node_modules/three/build/three.module.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { MeshLine, MeshLineMaterial } from './THREE.MeshLine.module.js';
import * as util from './util.js';
import * as lbu from './lbu.js';
// import * as data from '../data/random_on_land_000.json';

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

const W = 1280;
const H = 800;

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars

let objectSize = 0.8;
let centerConnectionWidth = 2.11;
let pathConnectionWidth = 9.5;

var resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );

let projectColors = [ '#ce3b43', '#2452c2', '#f2c200', '#b94db3', '#9bcfe4', '#b7b5a8', '#CCCCCC', '#CCDEFF' ];

let pathMesh;
let pathMeshes = [];
let centerMeshes = [];
let nEnd = 0;
let nMax = 5400;
let nStep = 4; // animation speed

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

(async function main() {

  await setup(); // set up scene
  loop(); // start game loop

})();

async function setup() {

  initLibrary();
  initPageElements();
  initUpload();
}

renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: true,
  preserveDrawingBuffer: true,
  canvas: document.querySelector("canvas")
});

renderer.setSize( W, H );
renderer.setPixelRatio( window.devicePixelRatio );

scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera( 75, W / H, 0.01, 1000 );
controls = new OrbitControls( camera, renderer.domElement );
// camera.position.z = 30;

// always returns a random number between min and max (both included)
function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}


let noOfPoint = 0;
let coordinatesXYZ = [];
let minLat = 90;
let maxLat = -90;
let minLon = 90;
let maxLon = -90;
let mappedLat = [];
let mappedLon = [];
let mappedLatLon = [];
// get data, copy object for further usage
lbu.onData( ( data ) => {
  // add points of each stream as array to coordinates
  // in data.last sind nur letzten (genauer) -> eventl. nicht verwenden

  // mapping of lat lon
  for (let key of Object.keys(data.integrated)) {
    let points = data.integrated[key];

    for(let u = 0; u < points.length-1; u++) { // for all previous points for each streams
      let lat = data.integrated[key][u];
      let lon = data.integrated[key][u+1];

      if (lat <= minLat) { minLat = lat; }
      if (lat >= maxLat) { maxLat = lat; }

      if (lon <= minLon) { minLon = lon; }
      if (lon >= maxLon) { maxLon = lon; }

      // originalLat.push(lat);
      // originalLon.push(lon);
      //
      // numberOfCoords++;
      u++;
    }
    // console.log("minLat: "+ minLat);
    // console.log("maxLat: "+ maxLat);
    // console.log("minLon: "+ minLon);
    // console.log("maxLon: "+ maxLon);
    // noPointsPerStream[key] = points.length/2;
  }

  let indexOfStream = 0;
  for (let key of Object.keys(data.integrated)) {
    let points = data.integrated[key];
    // let tempMappedLat = [];
    // let tempMappedLon = [];
    let tempMappedLatLon = [];

    for(let t = 1; t < points.length-1; t++) {
      // console.log ( minLat );
      let lat = data.integrated[key][t].map(minLat, maxLat, -90, 90);
      let lon = data.integrated[key][t+1].map(minLon, maxLon, -180, 180);

      // tempMappedLatLon.push();
      tempMappedLatLon.push( data.integrated[key][t].map(minLat, maxLat, -90, 90) );
      tempMappedLatLon.push( data.integrated[key][t+1].map(minLon, maxLon, -180, 180) );
    }

    mappedLatLon.splice(indexOfStream, 0, tempMappedLatLon);
    // mappedLon.splice(indexOfStream, 0, tempMappedLon);
    indexOfStream++;
  }

  // console.log( mappedLatLon );



  // BEGIN using mapped data
  // for (let i = 0; i < mappedLatLon.length-1; i++ ) {
  //   // let points = data.integrated[key]; // array of points for individual stream
  //   let points = mappedLatLon[i];
  //   // console.log( points );
  //
  //
  //   if(points.length > 0) {
  //     // transformation: lat/lon -> x/y/z
  //     let coordinatesOnStream = [];
  //     for(let t = 0; t < points.length-1; t++) {
  //
  //       var lat = points[t];
  //       var lon = points[t+1];
  //
  //       var cosLat = Math.cos(lat * Math.PI / 180.0);
  //       var sinLat = Math.sin(lat * Math.PI / 180.0);
  //       var cosLon = Math.cos(lon * Math.PI / 180.0);
  //       var sinLon = Math.sin(lon * Math.PI / 180.0);
  //       var rad = 40.0;
  //       let x = rad * cosLat * cosLon;
  //       let y = rad * cosLat * sinLon;
  //       let z = rad * sinLat;
  //
  //       coordinatesOnStream.push( {x: x, y: y, z: z} );
  //     }
  //     coordinatesXYZ.splice(noOfPoint, 0, coordinatesOnStream);
  //     noOfPoint++;
  //   }
  // }
  // END MAPPED DATA

  // BEGIN using original data
  for (let key of Object.keys(data.integrated) ) {
    let points = data.integrated[key]; // array of points for individual stream
    // let points = mappedLatLon[i];
    // console.log( points );


    if(points.length > 0) {
      // transformation: lat/lon -> x/y/z
      let coordinatesOnStream = [];
      for(let t = 0; t < points.length-1; t++) {

        var lat = points[t];
        var lon = points[t+1];

        var cosLat = Math.cos(lat * Math.PI / 180.0);
        var sinLat = Math.sin(lat * Math.PI / 180.0);
        var cosLon = Math.cos(lon * Math.PI / 180.0);
        var sinLon = Math.sin(lon * Math.PI / 180.0);
        var rad = 40.0;
        let x = rad * cosLat * cosLon;
        let y = rad * cosLat * sinLon;
        let z = rad * sinLat;

        coordinatesOnStream.push( {x: x, y: y, z: z} );
      }
      coordinatesXYZ.splice(noOfPoint, 0, coordinatesOnStream);
      noOfPoint++;
    }
  }
  // END ORIGINAL DATA

  // console.log( coordinatesXYZ );


  // LAST POINT AS SPHERES
  // last positions sphere: last position is added at end of array
  let indexSpehere = 0;
  for (let key of Object.keys(coordinatesXYZ)) {
    // get last coordinate
    let index = coordinatesXYZ[key].length;
    // coordinatesXYZ[key][index-1].x
    // place sphere
    // console.log( coordinatesXYZ[key].length );
    if((coordinatesXYZ[key].length) > 0){
      let x = coordinatesXYZ[key][index-1].x;
      let y = coordinatesXYZ[key][index-1].y;
      let z = coordinatesXYZ[key][index-1].z;

      // console.log( "x: "+x+" - y: "+y+" - z: "+z );

      let dotGeo = null;
      let mat = null;

      dotGeo = new THREE.SphereGeometry( objectSize/2, 5, 5 );

      mat = new MeshLineMaterial( {
        useMap: params.strokes,
        color: new THREE.Color( projectColors[indexSpehere%projectColors.length] ),
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
      mesh.position.set(x, y, z);
      scene.add( mesh );

      indexSpehere++;

    }
    //

  }

  // VISUALIZE TRAVELLED PATHS
  let indexPaths = 0;
  for (let key of Object.keys(coordinatesXYZ)) {

    // get points on current stream
    let streamPoints = coordinatesXYZ[key];
    let pathPoints = [];

    if(streamPoints.length > 2) {
      for (let i = 0; i < streamPoints.length; i++) {
        let x = streamPoints[i].x;
        let y = streamPoints[i].y;
        let z = streamPoints[i].z;

        pathPoints.push ( new THREE.Vector3(x,y,z) );
        i++;
      }

      // path
      var path = new THREE.CatmullRomCurve3( pathPoints );

      // params
      var pathSegments = 10;
      var tubeRadius = 0.2;
      var radiusSegments = 3;
      var closed = false;

      // geometry
      let tubeGeometry = new THREE.TubeGeometry( path, pathSegments, tubeRadius, radiusSegments, closed );

      // to buffer goemetry
      tubeGeometry = new THREE.BufferGeometry().fromGeometry( tubeGeometry );
      // nMax = tubeGeometry.attributes.position.count;

      var splineMat = new MeshLineMaterial( {
        color: projectColors[indexPaths%projectColors.length],
        side: THREE.DoubleSide,
        transparent: true
        // wireframe: true
      } );

      pathMesh = new THREE.Mesh( tubeGeometry, splineMat );
      pathMeshes.push( pathMesh );
      scene.add( pathMesh );
      indexPaths++;
    }
  }

  // center connections
  //
  let centerIndex = 0;
  for (let key of Object.keys(coordinatesXYZ)) {

    let index = coordinatesXYZ[key].length;
    let pathMeshCenter;

    if((coordinatesXYZ[key].length) > 0){
      let x = coordinatesXYZ[key][index-1].x;
      let y = coordinatesXYZ[key][index-1].y;
      let z = coordinatesXYZ[key][index-1].z;

      let pathPointsCenter = [];

      pathPointsCenter.push ( new THREE.Vector3(x,y,z) );
      pathPointsCenter.push ( new THREE.Vector3(0,0,0) );

      // path
      var centerPath = new THREE.CatmullRomCurve3( pathPointsCenter );

      // params
      // geometry
      let tubeGeometryCenter = new THREE.TubeGeometry( centerPath, 300, 0.05, radiusSegments, closed );

      // to buffer goemetry
      tubeGeometryCenter = new THREE.BufferGeometry().fromGeometry( tubeGeometryCenter );
      // nMax = tubeGeometryCenter.attributes.position.count;
      // console.log( "poly count: "+tubeGeometryCenter.attributes.position.count );

      var splineMatCenter = new MeshLineMaterial( {
        color: projectColors[centerIndex%projectColors.length],
        side: THREE.DoubleSide,
        transparent: true
        // wireframe: true
      } );

      pathMeshCenter = new THREE.Mesh( tubeGeometryCenter, splineMatCenter );
      centerMeshes.push( pathMeshCenter );
      scene.add( pathMeshCenter );

      centerIndex++;
    }
  }

});

let increasing = true;
function loop(time) { // eslint-disable-line no-unused-vars

  //using timer as animation
  var speed = Date.now() * 0.00005;
  camera.position.x = Math.cos(speed) * 60;
  camera.position.z = Math.sin(speed) * 60;
  camera.lookAt(scene.position);

  requestAnimationFrame( loop );
  // console.log( nEnd );

  if(increasing) {
    nEnd = ( nEnd + nStep );
    if(nEnd >= nMax*0.5) {
      increasing = false;
      console.log("max reached");
    }

  } else {
    nEnd = ( nEnd - nStep );
    if(nEnd <= nEnd*0.1) {
      increasing = true;
      console.log("min reached");
    }
  }

  for(let u=0; u < centerMeshes.length; u++){
    centerMeshes[u].geometry.setDrawRange( 0, nEnd+u*2 );
  }

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
        document.getElementById("uploadBar").style.display = "block";
        document.getElementById("progress-meter").style.width = ((status.bytesTransferred/status.totalBytes)*100)+"%";
        log((status.bytesTransferred/status.totalBytes)*100+"%");
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
