import * as util from './util.js';
// import * as data from '../data/random_on_land_000.json';

const W = 1280;
const H = 800;

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars
//let coordinates = 'data/random_on_land_000.json';


(function main() {

  setup(); // set up scene
  loop(); // start game loop

})();


function setup() {

  let coordinates = [];

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
  var data = JSON.parse(request.responseText);

  // console.log(data.length);

  for(let u = 0; u < data.length; u++){

    let lat = data[u][0];
    let lon = data[u][1];

    var cosLat = Math.cos(lat * Math.PI / 180.0);
    var sinLat = Math.sin(lat * Math.PI / 180.0);
    var cosLon = Math.cos(lon * Math.PI / 180.0);
    var sinLon = Math.sin(lon * Math.PI / 180.0);
    var rad = 40.0;
    let x = rad * cosLat * cosLon;
    let y = rad * cosLat * sinLon;
    let z = rad * sinLat;

    coordinates.push( {x: x, y: y, z: z} );
  }

  console.log(coordinates);


  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize( W, H );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setClearColor(0xFFFFFF);
  document.body.appendChild( renderer.domElement );

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, W / H, 0.01, 1000 );
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  camera.position.z = 100;

  // let geo = new THREE.SphereGeometry( 3, 4, 4 );
  // let mat = new THREE.MeshBasicMaterial({ color: 0x1e90ff, wireframe: true });
  // let mesh = new THREE.Mesh( geo, mat );
  // scene.add( mesh );

  for(let i = 0; i < coordinates.length; i++){
    let dotGeo = new THREE.SphereGeometry( 1, 2, 2 );
    let mat = new THREE.MeshBasicMaterial({ color: 0x1e90ff, wireframe: false });
    let mesh = new THREE.Mesh( dotGeo, mat );
    mesh.position.set(coordinates[i].x, coordinates[i].y, coordinates[i].z);
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
