
// imports
const easystarjs = require('easystarjs');
const moment = require('moment');
const Rainbow = require('rainbowvis.js');
const rainbow = new Rainbow();

import {
    loadProgressHandler,
    createGroupedArray,
    scaleSpread,
    scaleConcat,
    msgConsole,
    msgTicker,
    scaleApply
} from './utils'

// util function

Number.prototype.roundTo = function(num) {
    let resto = this%num;
    if (resto <= (num/2)) {
        return this-resto;
    } else {
        return this+num-resto;
    }
};


$(document).ready(()=>{

    // ------------------------------------------------------------------  logging console

    let log = new msgConsole({
        id:'messages',
        timeClass: 'mc-cursor-time',
        animated: false,
        animateCssClass: 'fadeIn',
        showTime: true
    });

    let tkr = new msgTicker({
        id:'info-feed',
        animated: true,
        animateCssClass: 'fadeIn',
    });

    setInterval(()=>{
        $('.mc-cursor-time').html(moment().format('HH:mm:ss'));
    },1000);


    // ------------------------------------------------------------------  viewport

    console.log(`Window Height:${window.innerHeight}, Width:${window.innerWidth}`);
    const esmWidth = 0.8 * window.innerHeight;
    esmWidth.roundTo(10);
    log.msg(`calculated esmWidth:${log.clr(esmWidth,'monopink')}`);
    const rs = esmWidth/50;
    log.msg(`calculated rs:${log.clr(rs,'monopink')}`);
    tkr.msg('viewport initialised');

    // ---------------------------------------------------------------- PIXI init
    //Aliases
    const Application = PIXI.Application,
        loader = PIXI.loader,
        resources = PIXI.loader.resources,
        Sprite = PIXI.Sprite,
        Texture = PIXI.Texture,
        Container = PIXI.Container,
        ParticleContainer = PIXI.particles.ParticleContainer,
        AnimatedSprite = PIXI.extras.AnimatedSprite,
        Ticker = PIXI.ticker.Ticker,
        InteractionManager = PIXI.interaction.InteractionManager,
        Graphics = PIXI.Graphics;

    //Create a Pixi Application
    const app = new Application({
            width: esmWidth,
            height: esmWidth,
            antialias: true,
            transparent: true,
            resolution: 1
        }
    );

    // --------------------------------------------------------------- GLOBAL VARS
    // global vars for setup and gameloop
    let es_sprites, fire_sprites;
    const t = new Tink(PIXI, app.renderer.view);
    const easystar = new easystarjs.js();
    const b = new Bump(PIXI);

    // grids
    let mainGrid = Array(50).fill().map(() => Array(50).fill(0)); // 50 x 50
    let subGrid = []; // 200 x 200
    let subGridCurr = [];
    const subGridScale = 4;

    let mainGridNum = {floor: 0, evacuee: 2, exit: 4, wall: 8, sensor: 6,};
    let objectSel = 'cursor';
    let wallsObj = {start:{x:0, y:0, done:false}, end:{x:1, y:1, done:false}};

    // hazards globals
    let hazStart=[]; // starting pos
    let hazardInterval, detectionInterval, fireHazardContainer;
    let fireHazardCount = 0;
    let fireHazardArr = Array(200).fill().map(()=> []);
    let fireColorArr = getSpectrum();
    console.log('fireColorArr',fireColorArr);

    // STAGES
    // create containers
    let wallContainer, evacueeContainer, sensorContainer, exitContainer, pathContainer;

    // Arrays to keep tracks of display objects
    let evacueesArr = [],
        sensorsArr = [],
        sensorRangeArr = [],
        exitArr = [];

    let evacueesCount = 0,
        sensorCount = 0,
        sensorRangeCount = 0,
        exitCount = 0;

    function initContainers ()
    {
        wallContainer = new Container();
        evacueeContainer = new Container();
        sensorContainer = new Container();
        exitContainer = new Container();
        pathContainer = new Container();
        fireHazardContainer = new ParticleContainer(1000000);
        fireHazardContainer.alpha = 0.5;
        fireHazardContainer.autoResize = true;

        // Add containers to root stage
        app.stage.addChild(wallContainer);
        app.stage.addChild(evacueeContainer);
        app.stage.addChild(sensorContainer);
        app.stage.addChild(exitContainer);
        app.stage.addChild(pathContainer);
        app.stage.addChild(fireHazardContainer);
    }

    function clearContainers () {
        // reset global vars
        objectSel = 'cursor';
        evacueesCount = 0;
        sensorCount = 0;
        sensorRangeCount = 0;
        exitCount = 0;
        mainGrid = Array(50).fill().map(() => Array(50).fill(0));
        evacueesArr = [];
        sensorsArr = [];
        sensorRangeArr = [];
        exitArr = [];
        fireHazardArr = Array(200).fill().map(()=> []);
        hazStart = [];
        // Clear containers from root stage
        app.stage.removeChild(wallContainer);
        app.stage.removeChild(evacueeContainer);
        app.stage.removeChild(sensorContainer);
        app.stage.removeChild(exitContainer);
        app.stage.removeChild(pathContainer);
        app.stage.removeChild(fireHazardContainer);
    }



    // ---------------------------------------------------------- View loading

    //Add the canvas that Pixi automatically created for you to the HTML document
    $('#app-render').append(app.view);

    //load an image and run the `setup` function when it's done
    loader
        .add('images/es_floor_1.png')
        .add('images/es_sprites.json')
        .add('images/fireburn.png')
        .add('images/fireburn.json')
        .on('progress', loadProgressHandler)
        .load(setup);

    // ----------------------------------------------------------- Pixi SETUP FUNCTION



    function setup() {

        console.log('All files loaded');
        log.msg(`all pixi resources loaded`);

        initContainers(); // Initialize containers
        log.msg(`containers initialised`);tkr.msg(`containers initialised`);

        // Draw 50 x 50 grid to canvas
        // only pass one length (len) for now since im starting with square maps
        // TODO: Rectangular maps that take two args (len and width)
        drawGrid({
            len: esmWidth,
            size: rs,
            color: 0xFFFFFF,
            alpha: 0.3,
            width: 1
        });
        log.msg(`grid drawn`);

        // TODO: Add multiple evacuees
        // load sprite sheets
        es_sprites = resources['images/es_sprites.json'].textures;
        fire_sprites = resources['images/fireburn.json'].textures;

        // click events on grid
        let pointer = t.makePointer();
        pointer.tap = () => {
            console.log('Pointer xy',pointer.x/rs ,pointer.y/rs);
            switch(objectSel) {
                case 'cursor':
                    console.log('objectSel',objectSel);
                    log.msg(`[X,Y] => [${parseInt(pointer.x/rs)},${parseInt(pointer.y/rs)}]`);
                    break;
                case 'remove':
                    console.log('objectSel',objectSel);
                    log.msg(`remove obj at [${parseInt((pointer.x - pointer.x%rs - .5)/rs)}, ${parseInt((pointer.y - pointer.y%rs- .5)/rs)}]`);

                    mainGrid[parseInt(pointer.y/rs)][parseInt(pointer.x/rs)] = mainGridNum.floor; // wall
                    break;
                case 'evacuee':
                    console.log('objectSel',objectSel);
                    evacueesArr[evacueesCount] = new Sprite(es_sprites['person_16x16_red_000.png']);
                    evacueesArr[evacueesCount].scale.x = rs/16;
                    evacueesArr[evacueesCount].scale.y = rs/16;
                    evacueesArr[evacueesCount].x = pointer.x - pointer.x%rs + 0.5*rs - .5;
                    evacueesArr[evacueesCount].y = pointer.y - pointer.y%rs + 0.5*rs - .5;
                    evacueesArr[evacueesCount].anchor.set(0.5, 0.5);
                    evacueeContainer.addChild(evacueesArr[evacueesCount]);
                    log.msg(`Evacuee ${evacueesCount} added at [${parseInt(evacueesArr[evacueesCount].x/rs)}, ${parseInt(evacueesArr[evacueesCount].y/rs)}] `);
                    evacueesCount++;
                    break;
                case 'wall':
                    console.log('objectSel',objectSel);
                    drawTile({
                        resetStage: false,
                        len: rs,
                        pointerY:pointer.y,
                        pointerX:pointer.x,
                        x: pointer.x - pointer.x%rs - .5,
                        y: pointer.y - pointer.y%rs- .5,
                        line:{width:1, color:0xC2C2C2, alpha:1},
                        fill:{color:0xFFFFFF, alpha:1}
                    });
                    break;
                case 'walls':
                    console.log('objectSel',objectSel);
                    // console.log(wallsObj);
                    if (!wallsObj.start.done) {
                        wallsObj.start.x = pointer.x;
                        wallsObj.start.y = pointer.y;
                        wallsObj.start.done = true;
                        wallsObj.end.done = false;
                    } else if (wallsObj.start.done && !wallsObj.end.done) {
                        wallsObj.start.done = !wallsObj.start.done;
                        wallsObj.end.x = pointer.x;
                        wallsObj.end.y = pointer.y;
                        drawWallLine(wallsObj, rs);
                        // reset
                        wallsObj.start.done = false;
                        wallsObj.end.done = false;
                    }
                    break;
                case 'sensor':
                    console.log('objectSel', objectSel);
                    newSensor({x:pointer.x - pointer.x%rs, y:pointer.y - pointer.y%rs});
                    mainGrid[parseInt(pointer.y/rs)][parseInt(pointer.x/rs)] = mainGridNum.sensor; // sensor
                    log.msg(`Added sensor. sensor count: ${sensorCount}`);
                    break;
                case 'exit':
                    drawExit({
                        resetStage: false,
                        len: rs,
                        pointerY:pointer.y,
                        pointerX:pointer.x,
                        x: pointer.x - pointer.x%rs - .5,
                        y: pointer.y - pointer.y%rs- .5,
                        line:{width:1, color:0x00FF00, alpha:0.5},
                        fill:{color:0x00FF00, alpha:0.5}
                    });
                    console.log('exit selected!');
                    break;
                case 'fire':
                    // set hazStart
                    hazStart.push({
                        x: pointer.x - pointer.x%rs - .5,
                        y: pointer.x - pointer.x%rs - .5
                    });
                    mainGrid[parseInt(pointer.y/rs)][parseInt(pointer.x/rs)] = 10;
                    console.log('Fire started!');
                    break;
                case 'info':
                    console.log('info selected!');
                    break;
                default:
                    break;
            }
        };

        // start simulation
        $('.sim-control').on('submit', (e) => {
            e.preventDefault();
            log.msg(`running simulation ... `);
            // start fire and wait for detection
            // calculate paths and evacuate
            if(hazStart.length > 0) { // hazStart X Y should already be set
                startHazard();
            }
            // evacuate();
        });

        app.ticker.add(delta => gameLoop(delta));

    }

    // ----------------------------------------------------------- Pixi gameLoop
    function gameLoop(delta) { // 60fps
        t.update();
    }


    // --------------------------------------------------------------   FUNCTIONS

    function updateGlobalPosArrs () {

    }

    // path

    function findPath (startX, startY, endX, endY) {
        return new Promise ((resolve, reject) =>{
            console.log('path find init:',startX, startY, endX, endY);
            easystar.findPath(startX, startY, endX, endY, function( path ) {
                if (path === null) {
                    console.log("Path was not found.");
                    resolve([]);
                } else {
                    console.log("Path was found.");
                    resolve(path);
                }
            });
        });

    }

    function drawPathLine (arr, width, color, alpha) {
        let line = new Graphics();
        line.lineStyle(width, color, alpha);
        arr.forEach((el,i) => {
            line.moveTo(el.x * rs/4, el.y * rs/4);
            if(i !== arr.length - 1) {
                line.lineTo(arr[i+1].x * rs/4, arr[i+1].y * rs/4);
            }
        });
        pathContainer.addChild(line);
    }

    // hazards

    function startHazard () {
        subGrid = scaleConcat(mainGrid, subGridScale);
        // loops
        detectionInterval = setInterval(()=>{
            sensorHazardDetection();
        },500);
        hazardInterval = setInterval(()=>{
            subGridCurr = subGrid.map(function(arr) {return arr.slice();});
            simulateFire();
        },5000); // 10 secs fire spread speed
        
        function simulateFire() {
            for(let y=0; y< subGrid.length; y++) {
                for(let x=0; x < subGrid[y].length; x++) {
                    let intensity = subGridCurr[y][x];
                    if(intensity >= 10 && intensity < 40) {
                        findingNeighbors(y, x);
                    }
                }
            }
        }

        function findingNeighbors(i, j) {
            let rowLimit = subGrid.length-1;
            let columnLimit = subGrid[0].length-1;
            let neighborArr = [];

            for(let y = Math.max(0, i-1); y <= Math.min(i+1, rowLimit); y++) {
                for(let x = Math.max(0, j-1); x <= Math.min(j+1, columnLimit); x++) {
                    neighborArr.push({y:y,x:x});
                }
            }
            increaseIntensity(neighborArr);
        }

        function increaseIntensity (neighborArr) {
            neighborArr.forEach((cell)=>{
                let val = subGrid[cell.y][cell.x];
                subGrid[cell.y][cell.x] = val === 0 ? 10 :
                    val >= 10 && val < 40 ? ++val:
                        val;
                drawFireSprite(cell.y, cell.x, subGrid[cell.y][cell.x]);
            });
        }
    }

    function drawFireSprite (y,x, intensity) {
        if (fireHazardArr[y][x] === undefined) {
            fireHazardArr[y][x] = new Sprite(Texture.WHITE);
            fireHazardArr[y][x].tint = intensityColor(intensity);
            fireHazardArr[y][x].width = rs/subGridScale;
            fireHazardArr[y][x].height = rs/subGridScale;
            fireHazardArr[y][x].y = y * rs/subGridScale;
            fireHazardArr[y][x].x = x * rs/subGridScale;
            fireHazardContainer.addChild(fireHazardArr[y][x]);
        } else {
            fireHazardArr[y][x].tint = intensityColor(intensity);
        }

    }

    function intensityColor (intensity) {
        return parseInt(fireColorArr[intensity - 10], 16);
    }

    function getSpectrum() {
        let num = 30;
        let colorArr = [];
        rainbow.setNumberRange(1, num);
        rainbow.setSpectrum('yellow', 'red','black');

        for(let i = 0; i < num; i++ ) {
            let color = rainbow.colourAt(i);
            colorArr.push(`${color}`);
        }

        for(let i = 0; i < num; i++ ) {
            let color = rainbow.colourAt(i);
            colorArr.push(`${color}`);
        }
        return colorArr;
    }

    // sensor functions

    function sensorHazardDetection () {
        // run a loop that checks if the sensorRange has detected any hazards
        let hazardDetectedArr=[];
        sensorRangeArr.forEach((sensorRange, i)=>{
            let hazardDetected = b.hit(
                sensorRange,
                fireHazardContainer.children,
                false, false, true,
                function(collision, hazardSprite){
                    console.log('hazardSprite');
                    console.log(hazardSprite);
                }
            );
            if(hazardDetected) {
                hazardDetectedArr.push(i);
            }
        });
        tkr.msg(`hazard detected by sensor: ${hazardDetectedArr.toString()}`);
    }

    function disableSensorNetwork () {
        sensorsArr.forEach((sensor,i) => {
            sensor.removeChildren();
        });
    }

    function enableSensorNetwork () {
        sensorsArr.forEach((sensor, i) => {
            sensor.addChild(sensorRangeArr[i]);
        });
    }

    function changeSensorState (sensorNum, state) {
        console.log(`sensor: ${sensorNum}, state: ${state}`);
        switch(state) {
            case 'clearAll':
            case'cla':
                sensorsArr.forEach((el,i) => {
                    stateChange(i,0x0000FF, 0.4);
                });
                break;
            case 'clear':
            case'clr':
                stateChange(sensorNum,0x0000FF, 0.4);
                break;
            case 'warnLow':
            case'wl':
                stateChange(sensorNum,0xFFD700, 1);
                break;
            case 'warnMid':
            case 'wm':
                stateChange(sensorNum,0xFFA500, 1);
                break;
            case 'warnHigh':
            case 'wh':
                stateChange(sensorNum,0xFF8C00, 1);
                break;
            case 'hazardLow':
            case 'hl':
                stateChange(sensorNum,0xFF6347, 1);
                break;
            case 'hazardMid':
            case 'hm':
                stateChange(sensorNum,0xFF4500, 1);
                break;
            case 'hazardHigh':
            case 'hh':
                stateChange(sensorNum,0xFF0000, 1);
                break;
            default:
                stateChange(sensorNum,0x0000FF, 0.4);
                break;
        }

        function stateChange (num, color,alpha) {
            console.log('srstate change num:',num);
            console.log(`srstate change color: ${color}`);
            sensorsArr[num].removeChildren();
            sensorRangeArr[num] = drawSensorRange(esmWidth/4, color, alpha, num);
            sensorsArr[num].addChild(sensorRangeArr[num]);
        }
    }

    function newSensor (loc) {
        sensorsArr[sensorCount] = new AnimatedSprite(animFrameSetter('hazard_sensor_16x16_on', 2)); // on state
        sensorsArr[sensorCount].interactive = true;
        sensorsArr[sensorCount].animationSpeed = 0.3;
        sensorsArr[sensorCount].play();

        let temp = `sensorsArr[${sensorCount}]`;
        sensorsArr[sensorCount].name = temp;
        sensorsArr[sensorCount].on('mousedown',() => {
            if (objectSel === 'remove') {
                setTimeout(function () {
                    sensorContainer.removeChild(sensorContainer.getChildByName(temp));
                    sensorCount--;
                }, 1);
            }
        });
        sensorsArr[sensorCount].x = loc.x + 0.5*rs - .5;
        sensorsArr[sensorCount].y = loc.y + 0.5*rs - .5;
        sensorsArr[sensorCount].scale.x = rs/16;
        sensorsArr[sensorCount].scale.y = rs/16;
        sensorsArr[sensorCount].anchor.set(0.5, 0.5);
        sensorRangeArr[sensorCount] = drawSensorRange(esmWidth/4, 0x0000FF, 0.4, sensorCount);
        sensorsArr[sensorCount].addChild(sensorRangeArr[sensorCount]);
        sensorContainer.addChild(sensorsArr[sensorCount]);
        sensorCount++;
    }

    function drawSensorRange (radius, color, alpha, sensorCount) {
        let rangeCircle = new PIXI.Graphics();
        rangeCircle.lineStyle(1, color, 0);
        rangeCircle.beginFill(color, 0);
        rangeCircle.drawCircle(0, 0, radius);
        rangeCircle.endFill();
        let animSensorRange = drawAnimSensorRange(radius, color, alpha/10, sensorCount);
        rangeCircle.addChild(animSensorRange);
        return rangeCircle;
    }

    function drawAnimSensorRange (radius, color, alpha, sensorCount) {
        let rangeCircle = new PIXI.Graphics();
        rangeCircle.beginFill(color, alpha);
        rangeCircle.drawCircle(0, 0, radius/10);
        rangeCircle.endFill();
        let tempRadius = radius;
        setInterval(()=>{
            rangeCircle.width++ ; //console.log('rangeCircle.width',rangeCircle.width);
            rangeCircle.height++ ;
            if(rangeCircle.width >= tempRadius * 2) {
                rangeCircle.width = 0;
                rangeCircle.height = 0;
            }
        },10);
        return rangeCircle;
    }

    function loadNewStage (obj) {
        // console.log('loadNewStage', obj);
        clearContainers (); log.msg(`scenario cleared`);
        initContainers(); log.msg(`new scenario initialised`);

        let newArr = JSON.parse(obj.sceneArr);
        mainGrid = newArr.data;

        mainGrid.forEach((el, j)=>{
            el.forEach((el, i)=>{
               if(el === mainGridNum.sensor ) {
                   newSensor({x:i*rs, y: j*rs});
               }
               if(el === mainGridNum.wall) {
                   newWalls({x:i, y: j});
               }
                if(el === mainGridNum.exit) {
                    newExit({x:i, y: j});
                }
            });
        });
        tkr.msg('scene loaded successfully');
    }

    // evacuee functions

    function evacuate ()  {
        // scale mainGrid Arr
        subGrid = scaleConcat(mainGrid, subGridScale);
        let destArr = [];

        // find exit points
        for(let y = 0; y < mainGrid.length; y++) {
            for(let x = 0; x < mainGrid[y].length; x++) {
                if (mainGrid[y][x] === mainGridNum.exit){
                    destArr.push({x:x,y:y});
                    log.msg(`exit at x:${log.clr(x,'monoorange')},y:${log.clr(y,'monoorange')} sourced`);
                }
            }
        }

        // get top left corner location in destArr
        destArr.forEach((loc)=>{
            loc.x *= subGridScale;
            loc.y *= subGridScale;
            log.msg(`scaled exit at x:${log.clr(loc.x,'monoorange')},y:${log.clr(loc.y,'monoorange')}`);
        });

        if (destArr.length > 0) { // if there are any exits on the map
            easystar.setGrid(JSON.parse(JSON.stringify(subGrid))); log.msg(`pathfinding set up with pathArr`);
            easystar.setAcceptableTiles([0,4]); log.msg(`pathfinding walkable tiles: 0 `);
            easystar.enableDiagonals();

            if (evacueesArr.length > 0) {
                evacueesArr.forEach((evacuee, i)=>{
                    // console.log(`evacuate fn: evacuee x:${parseInt(evacuee.x/rs)*subGridScale},y:${parseInt(evacuee.y/rs)*subGridScale}`);
                    findEvacPath(i, parseInt(evacuee.x/rs * subGridScale) , parseInt(evacuee.y/rs * subGridScale) , destArr);
                });
                easystar.calculate();
            } else {
                log.msg(`${log.clr('No people to evacuate!','monoorange')}`);
            }

        } else {
            log.msg(`${log.clr('No exits found!','red')}`);
        }


    }

    function findEvacPath (index, x, y, destArr) {
        // let promiseArr = [];
        Promise.all(
            destArr.map(o => findPath(x, y, o.x, o.y))
        ).then(values => {
            console.log(`All Paths for Evacuee ${index + 1}:`);
            console.log(values);
            // sort values ascending order
            values.sort(function (a, b) {
                return b.length - a.length;
            }).reverse();
            // draw paths
            values.forEach((path, i) => {
                if (i === 0) {
                    drawPathLine(path,2,0x00FF00,1);
                    moveEvacuee(index, path);
                } else {
                    drawPathLine(path,4,0x2196F3,0.3);
                }
            })
        });
    }

    function moveEvacuee(index, pathArr) {
        let counter = 0;
        let i = setInterval(() => {
            evacueesArr[index].x = pathArr[counter].x *rs/4;
            evacueesArr[index].y = pathArr[counter].y *rs/4;
            counter++;
            if(counter === pathArr.length) {
                clearInterval(i);
                evacueeContainer.removeChild(evacueesArr[index]);
            }
        },50);
    }

    // exits, walls, grids

    function newExit (loc) {
        drawExit({
            resetStage: true,
            len: rs,
            pointerY:loc.y,
            pointerX:loc.x,
            x: loc.x * rs - .5,
            y: loc.y * rs- .5,
            line:{width:1, color:0x00FF00, alpha:0.5},
            fill:{color:0x00FF00, alpha:0.5}
        });
    }

    function drawExit (options) {
        exitArr[exitCount] = new Graphics();
        exitArr[exitCount].lineStyle(options.line.width, options.line.color, options.line.alpha);
        exitArr[exitCount].beginFill(options.fill.color,options.fill.alpha);
        exitArr[exitCount].drawRect(options.x, options.y, options.len, options.len);
        exitArr[exitCount].endFill();
        exitArr[exitCount].interactive = true;
        exitContainer.addChild(exitArr[exitCount]);

        // save new block to array
        if (!options.resetStage) {
            mainGrid[parseInt(options.pointerY/rs)][parseInt(options.pointerX/rs)] = mainGridNum.exit; // exit
        }
        // add mouse event
        exitArr[exitCount].on('mousedown',() => {
            if (objectSel === 'remove') {
                setTimeout(function () {
                    console.log('Exit removed!');
                    exitContainer.removeChild(exitArr[exitCount]);
                }, 1);
            }
        });
        exitCount++;
    }

    function newWalls (loc) {
        drawTile({
            resetStage: true,
            len: rs,
            pointerY:loc.y,
            pointerX:loc.x,
            x: loc.x * rs - .5,
            y: loc.y  * rs- .5,
            line:{
                width:1,
                color:0xC2C2C2,
                alpha:1
            },
            fill:{
                color:0xFFFFFF,
                alpha:1
            }
        });
    }

    function drawTile (options) {
        let wallTile = new Graphics();
        wallTile.lineStyle(options.line.width, options.line.color, options.line.alpha);
        wallTile.beginFill(options.fill.color,options.fill.alpha);
        wallTile.drawRect(options.x, options.y, options.len, options.len);
        wallTile.endFill();
        wallTile.interactive = true;
        wallContainer.addChild(wallTile);

        // save new block to array
        if (!options.resetStage) {
            mainGrid[parseInt(options.pointerY/rs)][parseInt(options.pointerX/rs)] = mainGridNum.wall; // wall
        }

        // add mouse event
        wallTile.on('mousedown',() => {
            if (objectSel === 'remove') {
                setTimeout(function () {
                    console.log('Tile removed!');
                    wallContainer.removeChild(wallTile);
                }, 1);
            }
        });
    }

    function drawGrid (obj) {
        let {len, size, color, alpha, width} = obj;
        console.log(len, size, color, alpha, width);
        let lines = new Graphics();
        lines.lineStyle (width, color, alpha);
        lines.moveTo(0, 0);
        lines.lineTo(0, len);
        lines.moveTo(0, 0);
        lines.lineTo(len, 0);
        for (let i = 0; i < len; i++) {
            lines.moveTo(size + size * i - .5, 0);
            lines.lineTo(size + size * i - .5, len);
            lines.moveTo(0, size + size * i - .5);
            lines.lineTo(len, size + size * i - .5);
        }
        app.stage.addChild(lines);
    }

    function drawWallLine (obj,size) {
        // this is one of those functions where i'm not going to be able to really remember what i did lol

        if(obj.start.x > obj.end.x){
            let temp = obj.start.x;
            obj.start.x = obj.end.x;
            obj.end.x = temp;
        }

        if(obj.start.y > obj.end.y){
            let temp = obj.start.y;
            obj.start.y = obj.end.y;
            obj.end.y = temp;
        }

        // Determine whether line is to be drawn horizontally or vertically
        // if abs(x2-x1) is larger than abs(y2-y1) then horizontal else vertical
        // assign len the the actual length of line
        let len = Math.abs(obj.end.x - obj.start.x) > Math.abs(obj.end.y - obj.start.y)
            ? obj.end.x - obj.start.x
            : obj.end.y - obj.start.y;
        // console.log('drawWallLine', len);

        // same as above. If direction is horizontal, mx = 1 and my = 0 and vice versa
        // this to be used to determine the polarity of size
        let mx = Math.abs(obj.end.x - obj.start.x) > Math.abs(obj.end.y - obj.start.y) ? 1 : 0;
        let my = Math.abs(obj.end.x - obj.start.x) < Math.abs(obj.end.y - obj.start.y) ? 1 : 0;
        // console.log("mx, my", mx, my);

        // Get polarity of size. +size is going down or right while -size is going up or left
        if (mx === 1) {
            size = obj.end.x - obj.start.x >= 0 ? size : size * -1;
        }
        if (my === 1) {
            size = obj.end.y- obj.start.y >= 0 ? size : size * -1;
        }

        // console.log('size', size);

        // If going down or right then
        if (size >=0 ) {
            for (let i = 0; i < Math.abs(len); i+=size) {
                drawTile({
                    resetStage: false,
                    len: rs,
                    pointerY: obj.start.y - obj.start.y%rs + i * my,
                    pointerX: obj.start.x - obj.start.x%rs + i * mx,
                    x: obj.start.x - obj.start.x%rs - .5 + i * mx,
                    y: obj.start.y - obj.start.y%rs - .5 + i * my,
                    line:{
                        width:1,
                        color:0xC2C2C2,
                        alpha:1
                    },
                    fill:{
                        color:0xFFFFFF,
                        alpha:1
                    }
                });
            }
        } else { // if going up or left
            for (let i = Math.abs(len); i > 0; i+=size) {
                drawTile({
                    resetStage: false,
                    len: rs,
                    pointerY: obj.start.y - obj.start.y%rs + i * my,
                    pointerX: obj.start.x - obj.start.x%rs + i * mx,
                    x: obj.start.x - obj.start.x%rs - .5 + i * mx,
                    y: obj.start.y - obj.start.y%rs - .5 + i * my,
                    line:{
                        width:1,
                        color:0xC2C2C2,
                        alpha:1
                    },
                    fill:{
                        color:0xFFFFFF,
                        alpha:1
                    }
                });
            }
        }

    }

    // misc

    function animFrameSetter (frameTitle, num) {
        let arr = [];
        for (let i = 0; i < num; i++) {
            arr.push(PIXI.Texture.fromFrame(`${frameTitle}_00${i}.png`));
        }
        return arr;
    }

    function addTable(dataArray, id) {
        $(`#${id}`)
            .empty()
            .append(`<table id="scene-arr-table"></table>`);
        dataArray.forEach((el)=>{
            let row = $(`<tr></tr>`);
            $(`#scene-arr-table`).append(row);
            el.forEach((el)=>{
                let bgColor =
                    el === 2 ? 'red' :
                        el === 4 ? 'green' :
                            el === 8 ? 'orange' :
                                el === 6 ? 'blue' :
                                    'transparent';
                $(row).append(`<td style="background: ${bgColor}">${el}</td>`)
            });

        });
    }


    // -------------------------------------------------------------  EVENTS (general)
    //------------------------------------------ Menu Events

    // console events
    $('#mc-input').on('keypress', function (e) {
        if(e.which === 13){
            let val = $(this).val();
            log.msg(`cmd: ${log.clr(val,'yellow')}`);
            console.log('console input:', val);
            $('#mc-input').val('');
            let tempStr = val;
            val = val.includes("srstate") || val.includes("srs") ? 'srstate' : val;

            switch (val) {
                case 'dis_net':
                case 'disable_network':
                    disableSensorNetwork();
                    log.msg(`sensor network:${log.clr('disabled','indianred')}`);
                    break;
                case 'enb_net':
                case 'enable_network':
                    enableSensorNetwork();
                    log.msg(`sensor network:${log.clr('enabled','limegreen')}`);
                    break;
                case 'globals':
                    log.msg(`
                    objectSel:${log.clr(objectSel,'monopink')}<br>
                    evacuees:${log.clr(evacueesCount,'monopink')}<br>
                    evacueesArr.len:${log.clr(evacueesArr.length,'monopink')}<br>
                    sensors:${log.clr(sensorCount,'monopink')}<br>
                    sensorsArr.len:${log.clr(sensorsArr.length,'monopink')}<br>
                    exits:${log.clr(exitCount,'monopink')}<br>
                    exitArr.len:${log.clr(exitArr.length,'monopink')}
                    `);
                    break;
                case 'srstate' :
                        console.log('sensor state cmd');
                        let strVal = tempStr.split('-');
                        console.log(strVal);
                        changeSensorState(parseInt(strVal[1]),strVal[2]);
                    break;
                case 'stop_haz':
                    clearInterval(hazardInterval);
                    break;
                case 'stop_det':
                    clearInterval(detectionInterval);
                    break;
                default:
                    log.msg(`cmd: ${log.clr('erronous cmd!','red')}`);
                    break;
            }
        }
    });

    // reset simulation
    $('#reset-sim').on('click', (e) => {
        e.preventDefault();
        // clear all paths
        pathContainer.removeChildren();
        // clear evacuees and count
        evacueesArr = [];evacueesCount = 0;
        log.msg(`RESET: all paths cleared!`);
    });


    // load & save
    $('.esm-btn').on('click', (e) => {
        // event.preventDefault();
        console.log(e.target.id);
        switch (e.target.id) {
            case 'save-btn':
                // console.log("save-btn clicked!");
                $('#save-modal').iziModal('open');

                break;
            case 'load-btn':
                // console.log("load-btn clicked!");
                $('#load-modal').iziModal('open');

                break;
            default:
                break;
        }
    });

    // Check for object select change
    $('.esm-radio-option').click(function(e) {
        $('.esm-radio-option').removeClass("focus-esm");
        let val = $(this).children()[0].value;
        // console.log('val', val);
        switch (val) {
            case 'cursor':
                $(this).addClass("focus-esm");
                objectSel = 'cursor';
                // console.log('pointer selected!');
                break;
            case 'remove':
                $(this).addClass("focus-esm");
                objectSel = 'remove';
                // console.log('remove selected!');
                break;
            case 'evacuee':
                $(this).addClass("focus-esm");
                objectSel = 'evacuee';
                // console.log('evacuee selected!');
                break;
            case 'wall':
                $(this).addClass("focus-esm");
                objectSel = 'wall';
                // console.log('wall selected!');
                break;
            case 'walls':
                $(this).addClass("focus-esm");
                objectSel = 'walls';
                // console.log('walls selected!');
                break;
            case 'sensor':
                $(this).addClass("focus-esm");
                objectSel = 'sensor';
                // console.log('sensor selected!');
                break;
            case 'fire':
                $(this).addClass("focus-esm");
                objectSel = 'fire';
                // console.log('fire selected!');
                break;
            case 'exit':
                $(this).addClass("focus-esm");
                objectSel = 'exit';
                // console.log('exit selected!');
                break;
            case 'info':
                $(this).addClass("focus-esm");
                objectSel = 'info';
                // console.log('info selected!');
                // console.log('mainGrid', mainGrid);
                $("#info-modal").iziModal('open');
                break;
            default:
                break;
        }
    });

    // -------------------------------------------------------------------  Models
    // init models
    $("#save-modal").iziModal({
        headerColor: 'rgb(0,0,0,0.6)',
        background: 'rgba(255,255,255,0.8)',
        borderBottom: false,
        onOpened: () => {
            $('#scene-save-form').submit((e) => {
                e.preventDefault();
                if ($('#inlineFormInputText').val() !== "") {
                    let value = $('#inlineFormInputText').val();
                    // console.log(value);
                    $.ajax({
                        url: "/save-scene",
                        type: "POST",
                        data: {filename : value, sceneArr:JSON.stringify({data:mainGrid})},
                        dataType: "json",
                        success: (res)=>{
                            // console.log(res);
                            $("#save-modal").iziModal('close');
                        },
                        error: (err) => {
                            console.log(err);
                        }
                    });
                } else {
                    console.log('No input!');
                }
            });
        }
    });

    $("#info-modal").iziModal({
        headerColor: 'rgb(0,0,0,0.6)',
        background: 'rgba(255,255,255,0.8)',
        borderBottom: false,
        width:1200,
        onOpened: () => {
            addTable(mainGrid, 'disp-scene-arr');
        }
    });

    $("#load-modal").iziModal({
        headerColor: 'rgb(0,0,0,0.6)',
        background: 'rgba(255,255,255,0.8)',
        borderBottom: false,
        width:800,
        onOpened: () => {
            $('#filename-disp').empty();
            $.ajax({
                url: "/load-scene",
                type: "POST",
                data: {action: 'files'},
                dataType: "json",
                success: (dataArr)=>{
                    // console.log('dataArr',dataArr);
                    if (dataArr.length > 0) {
                        let table = $('#load-data-table').DataTable({
                            "paging": false,
                            "ordering": false,
                            "info": false,
                            "searching":false,
                            "bDestroy": true,
                            "data": dataArr,
                            "columns": [
                                { "data": "id" },
                                { "data": "filename" },
                                { "data": "createdAt" }
                            ]
                        });

                        let idToFind;

                        $('#load-data-table tbody tr').on('click', (e) => {
                            $('#filename-disp').empty();
                            idToFind = e.currentTarget.children[0].innerText * 1;
                            let filename = e.currentTarget.children[1].innerText;
                            $('#filename-disp').text(filename);
                        });

                        $('#load-scene-btn').on('click',() => {
                            if ($('#filename-disp').text() !== '') {
                                dataArr.forEach((el)=>{
                                   if(el.id === idToFind) {
                                       loadNewStage(el);
                                   }
                                });
                                $("#load-modal").iziModal('close');
                            } else {
                                $('#err-hint').css('visibility','visible');
                                setTimeout(()=>{
                                    $('#err-hint').css('visibility','hidden');
                                },10000);
                            }
                        });

                        $('#del-scene-btn').on('click',() => {
                            if ($('#filename-disp').text() !== '') {
                                $.ajax({
                                    url: "/del-scene",
                                    type: "POST",
                                    data: {id: idToFind ,action: 'delete'},
                                    dataType: "json",
                                    success: (dataArr2)=>{
                                        // console.log('del msg', dataArr2);
                                        $('#filename-disp').empty();
                                        $("#load-data-table").DataTable().ajax.reload();
                                    }
                                });
                                // $("#load-modal").iziModal('close');
                            } else {
                                $('#err-hint').css('visibility','visible');
                                setTimeout(()=>{
                                    $('#err-hint').css('visibility','hidden');
                                },10000);
                            }
                        })
                    } else {
                        console.log('no data to load!');
                    }
                },
                error: (err) => {
                    console.log(err);
                }
            });
        }
    });


});





