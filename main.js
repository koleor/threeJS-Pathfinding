import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as PF from 'pathfinding';

// const THREE = require('three');
// const PF = require('pathfinding');
// const OrbitControls = require('three/examples/jsm/controls/OrbitControls.js');

let renderer, scene, camera, lineID, exitX, exitZ, exitID, enterX, enterZ;
let objects = [];
let matrix = [];

intit();    


function intit(){

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFFFFF);
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
    const orbit = new OrbitControls(camera, renderer.domElement);
    camera.position.set(10, 15, 22);
    orbit.update();

    const planeMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            color:0x8B7123,
        })
    );
    planeMesh.rotateX(-Math.PI / 2);
    planeMesh.position.set(0,-0.01,0);
    scene.add(planeMesh);

    let grid = new THREE.GridHelper(40, 40);
    scene.add(grid);
    const highlightMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            transparent: true
        })
    );
    highlightMesh.rotateX(-Math.PI / 2);
    highlightMesh.position.set(0.5, 0, 0.5);
    scene.add(highlightMesh);

    const mousePosition = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    let intersects;

    const wallGeometry = new THREE.BoxGeometry(1,1,1);
    const wallMaterial = new THREE.MeshBasicMaterial( { 
        color: 0xCCCCCC,
        opacity: 0.2,
        transparent:true,
    });
    const wall = new THREE.Mesh( wallGeometry, wallMaterial );

    const exitMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF0000,
        opacity: 0.5,
        transparent:true,
    });
    const exit = new THREE.Mesh(wallGeometry, exitMaterial);
    
    const enterMaterial = new THREE.MeshBasicMaterial({
        color: 0x00FF00,
        opacity: 0.5,
        transparent:true,
    })
    const enter = new THREE.Mesh(wallGeometry, enterMaterial);
    enterX = -0.5;
    enterZ = -0.5;
    enter.position.set (enterX, 0.5, enterZ);
    scene.add(enter);
    
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x0000ff
    });
    
    window.addEventListener("mousemove", function(e) {
        mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
        mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mousePosition, camera);
        intersects = raycaster.intersectObject(planeMesh);

        if(intersects.length > 0) {  
            const intersect = intersects[0];
            const highlightPos = new THREE.Vector3().copy(intersect.point).floor().addScalar(0.5);
            highlightMesh.position.set(highlightPos.x, 0, highlightPos.z);
            const objectExist = objects.find(function(object) {
                return (object.position.x === highlightMesh.position.x)
                && (object.position.z === highlightMesh.position.z)
            });

            if(!objectExist){
            highlightMesh.material.color.setHex(0xFFFFFF);
            }else{
            highlightMesh.material.color.setHex(0xFF0000);
            }
        }
    });

    window.addEventListener("mousedown", function() {
        
        const objectExist = objects.find(function(object) {
            return (object.position.x === highlightMesh.position.x)
            && (object.position.z === highlightMesh.position.z)
        });
        
        if(!objectExist) {
            if(intersects.length > 0) {
                const wallClone = wall.clone();
                wallClone.position.x = highlightMesh.position.x;
                wallClone.position.z = highlightMesh.position.z;
                wallClone.position.y = 0.5 ;
                scene.add(wallClone);
                objects.push(wallClone);
                highlightMesh.material.color.setHex(0xFF0000);
            }
        }

        
});

    window.addEventListener( "keydown", function ( event ) {
        const intersects = raycaster.intersectObjects( objects, false );
        switch ( event.keyCode ) {
            case 104: //NUM 8 - эатаж выше
                planeMesh.position.y += 1;
                console.log(highlightMesh.up.y);
                grid.position.y += 1;
                highlightMesh.up.y += 1;
                
            break;

            case 98: //NUM 2 - этаж ниже
                planeMesh.position.y -= 1    ;
                grid.position.y -= 1;
                highlightMesh.position.y -= 1;
            break;

            case 81: // q - удалить объект
                if ( intersects.length > 0 ) {
                    const intersect = intersects[ 0 ];
                    scene.remove( intersect.object );
                    objects.splice( objects.indexOf( intersect.object ),1 );
                }
            break; 

            case 69: //E - выход
                const objectExist = objects.find(function(object) {
                    return (object.position.x === highlightMesh.position.x)
                    && (object.position.z === highlightMesh.position.z)
                });
            

                if(!objectExist) {
                    let oldExit = scene.getObjectById(exitID);
                    const exitClone = exit.clone();
                    exitClone.position.x = highlightMesh.position.x;
                    exitClone.position.z = highlightMesh.position.z;
                    exitClone.position.y = 0.5 ;
                    scene.remove(oldExit);
                    // objects.splice( objects.indexOf( exitClone ), 1 );
                    scene.add(exitClone);
                    exitID = exitClone.id;
                    //objects.push(exitClone);
                    highlightMesh.material.color.setHex(0xFF0000);
                    exitX = exitClone.position.x;
                    exitZ = exitClone.position.z; 
                }
            break;

            case 83: // S - сохранить сцену
                scene.remove(highlightMesh);
                let savedScene = JSON.stringify (scene);
                downloadSavedScene(savedScene,"savedScene.json");
                scene.add(highlightMesh);
            break;

            case 76: // L - загрузить сцену
                const loader = new THREE.ObjectLoader();
                loader.load(
                // resource URL
                "saves/savedScene.json",
                function ( obj ) {             
                        for (let i = 3; i < obj.children.length - 1; i++){
                            const objectExist = objects.find(function(object) {
                                return (object.position.x === obj.children[i].position.x)
                                && (object.position.z === obj.children[i].position.z)
                            });
                            if (!objectExist){
                                const wallClone = wall.clone();
                                wallClone.position.x = obj.children[i].position.x;
                                wallClone.position.z = obj.children[i].position.z;
                                wallClone.position.y = 0.5 ;
                                scene.add(wallClone);
                                objects.push(wallClone);
                            }
                        }    
                },
                function ( xhr ) {
                    console.log( (xhr.loaded / xhr.total * 100) + "% loaded" );
                },
                function ( err ) {
                    console.error( "An error happened" );
                }   
                );
            break;

            case 70: //F - найти путь
            try {
                let oldLine = scene.getObjectById(lineID);
                let objectMinX = objects[0].position.x;
                    for (let i = 1; i < objects.length; i++){    
                        if (objects[i].position.x < objectMinX){
                            objectMinX = objects[i].position.x;
                        }
                    }

                let objectMinZ = objects[0].position.z;
                    for (let i = 1; i < objects.length; i++){    
                        if (objects[i].position.z < objectMinZ){
                            objectMinZ = objects[i].position.z;
                        }
                    } 
                let objectMaxX = objects[0].position.x;
                    for (let i = 1; i < objects.length; i++){    
                        if (objects[i].position.x > objectMaxX){
                            objectMaxX = objects[i].position.x;
                        }
                    }      
                let objectMaxZ = objects[0].position.z;
                    for (let i = 1; i < objects.length; i++){    
                        if (objects[i].position.z > objectMaxZ){
                            objectMaxZ = objects[i].position.z;
                        }
                    } 
                let objectsPositions = objects.map(function(object){
                    return object.position
                })

                //Матрица
                for (let i = 0; i <= objectMaxZ - objectMinZ; i++){
                    matrix[i] = [];
                    for (let j = 0; j <= objectMaxX - objectMinX; j++){
                        matrix[i][j] = 0;
                    }
                }

                //Перевод карты из 3D в матрицу
                objectsPositions.forEach(function(object){  
                    for (let i = 0; i <= objectMaxZ - objectMinZ; i++ ){
                        for (let j = 0; j <= objectMaxX - objectMinX; j++){
                            if( j == object.x - objectMinX && i == object.z - objectMinZ){
                                matrix[i][j] = 1;
                            }
                        }
                    }
                    
                })

                console.log(matrix);
                //Нахождение пути
                let gridPF = new PF.Grid(matrix);
                let finder = new PF.AStarFinder();
                let path = finder.findPath(exitX - objectMinX, exitZ - objectMinZ, enterX - objectMinX, enterZ - objectMinZ, gridPF);
                const points = [];
                for (let i = 0; i < path.length;i++){
                    points.push(new THREE.Vector3(path[i][0] + objectMinX, 0.1, path[i][1] + objectMinZ))
                }
                const geometry = new THREE.BufferGeometry().setFromPoints( points );
                const line = new THREE.Line( geometry, lineMaterial );
                scene.remove(oldLine);
                scene.add(line);
                lineID = line.id;   
            }catch{
                this.alert("Постройте какой-либо объект и задайте точку выхода");
            }
            break;
        }
    });
}

window.addEventListener("resize", function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}); 

let clock = new THREE.Clock();
let delta = 0;
// 30 fps
let interval = 1 / 30;

function update() {
  requestAnimationFrame(update);
  delta += clock.getDelta();

   if (delta  > interval) {
       render();
       delta = delta % interval;
   }
}

function downloadSavedScene(text, name) {
    const a = document.createElement("a");
    const type = name.split(".").pop();
    a.href = URL.createObjectURL( new Blob([text], { type:`text/${type === "txt" ? "plain" : type}` }) );
    a.download = name;
    a.click();
}

function render (){
    renderer.render( scene, camera );
}



update();
