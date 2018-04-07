
// imports
const easystarjs = require('easystarjs');
const moment = require('moment');
import {
    loadProgressHandler,
    createGroupedArray,
    scaleSpread,
    scaleConcat,
    scaleApply
} from './utils'
// load pixi jsons
const level = require('./pixi-jsons/es_floor_1.json');

$(document).ready(()=>{

    // ------------------------------------------------------------------  viewport

    console.log(`Window Height:${window.innerHeight}, Width:${window.innerWidth}`);
    let esmWidth = 0.8 * window.innerHeight;
    let rs = esmWidth/50;

    // ---------------------------------------------------------------- PIXI init
    //Aliases
    let Application = PIXI.Application,
        loader = PIXI.loader,
        resources = PIXI.loader.resources,
        Sprite = PIXI.Sprite,
        Container = PIXI.Container,
        AnimatedSprite = PIXI.extras.AnimatedSprite,
        Matrix = PIXI.Matrix,
        InteractionManager = PIXI.interaction.InteractionManager,
        Graphics = PIXI.Graphics;

    //Create a Pixi Application
    let app = new Application({
            width: esmWidth,
            height: esmWidth,
            antialias: true,
            transparent: true,
            resolution: 1
        }
    );

    // --------------------------------------------------------------- GLOBAL VARS
    // global vars for setup and gameloop
    let floorGrid, evacuee, es_sprites;
    let t = new Tink(PIXI, app.renderer.view);
    let easystar = new easystarjs.js();
    let mainGrid = Array(50).fill().map(() => Array(50).fill(0)); // 50 x 50
    // let subGrid = Array(200).fill().map(() => Array(200).fill(0)); // 200 x 200

    // STAGES
    let wallsStage = new Container;
    app.renderer.render(wallsStage);
    console.log(app.renderer);

    let mainGridNum = {
        floor: 0,
        wall: 8,
        sensor: 6,
    };

    let objectSel = 'cursor';
    let wallsObj={
        start:{
            x:0,
            y:0,
            done:false
        },
        end:{
            x:1,
            y:1,
            done:false
        }
    };

    // ---------------------------------------------------------- View loading

    //Add the canvas that Pixi automatically created for you to the HTML document
    $('#app-render').append(app.view);

    //load an image and run the `setup` function when it's done
    loader
        .add('images/es_floor_1.png')
        .add('images/es_sprites.json')
        .on('progress', loadProgressHandler)
        .load(setup);

    // ----------------------------------------------------------- Pixi SETUP FUNCTION

    function setup() {

        console.log('All files loaded');

        // Get 2D array of floor including walls and outer area
        let preArr = createGroupedArray(level.layers[0].data,50);
        console.log('preArr', preArr);

        // Set Up EasyStar for Path Finding
        // scale 50 x 50 array by 4 to 200 x 200 array
        let mainArr = scaleConcat(preArr, 16); // convert 50 x 50 to 200 x 200
        console.log('mainArr',mainArr);
        // Easy star will do path finding on 200 x 200 array (subgrid)
        // because hazard tiles will belong to subgrid (they are 4 x 4 size)
        easystar.setGrid(mainArr);
        easystar.setAcceptableTiles([0]);


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


        //Add one evacuee to the stage
        // TODO: Add multiple evacuees
        es_sprites = resources['images/es_sprites.json'].textures;
        evacuee = new Sprite(es_sprites['person_16x16_red_000.png']);
        evacuee.scale.x = rs/16;
        evacuee.scale.y = rs/16;
        app.stage.addChild(evacuee);


        // click events on grid
        let pointer = t.makePointer();
        pointer.tap = () => {
            console.log('Pointer xy',pointer.x/rs ,pointer.y/rs);
            switch(objectSel) {
                case 'cursor':
                    console.log('objectSel',objectSel);
                    console.log('rs',rs);
                    console.log('pointer', pointer);
                    console.log('Cursor xy',pointer.x - pointer.x%rs - .5, pointer.y - pointer.y%rs- .5);
                    console.log(`mainGrid Normal [X,Y] => [${parseInt(pointer.x/rs)},${parseInt(pointer.y/rs)}]`);
                    // console.log(`mainGrid Walls [X,Y] => [${parseInt(pointer.x/rs)},${parseInt(pointer.y/rs)}]`);
                    break;
                case 'remove':
                    console.log('objectSel',objectSel);
                    console.log('remove xy',pointer.x - pointer.x%rs - .5, pointer.y - pointer.y%rs- .5);
                    mainGrid[parseInt(pointer.y/rs)][parseInt(pointer.x/rs)] = mainGridNum.floor; // wall
                    break;
                case 'evacuee':
                    console.log('objectSel',objectSel);
                    evacuee.x = pointer.x - pointer.x%rs - .5;
                    evacuee.y = pointer.y - pointer.y%rs- .5;
                    evacuee.scale.x = rs/16;
                    evacuee.scale.y = rs/16;
                    break;
                case 'wall':
                    console.log('objectSel',objectSel);
                    drawTile({
                        len: rs,
                        pointerY:pointer.y,
                        pointerX:pointer.x,
                        x: pointer.x - pointer.x%rs - .5,
                        y: pointer.y - pointer.y%rs- .5,
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
                    break;
                case 'walls':
                    console.log('objectSel',objectSel);
                    console.log(wallsObj);
                    if (!wallsObj.start.done) {
                        wallsObj.start.x = pointer.x;
                        wallsObj.start.y = pointer.y;
                        wallsObj.start.done = true;
                        wallsObj.end.done = false;
                    } else if (wallsObj.start.done && !wallsObj.end.done) {
                        console.log('pointer', pointer);
                        console.log('wallsObj', wallsObj);
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
                    console.log('objectSel',objectSel);
                    let sensor = new AnimatedSprite(animFrameSetter('hazard_sensor_16x16_on', 2)); // on state
                    sensor.interactive = true;
                    sensor.animationSpeed = 0.3;
                    sensor.play();
                    sensor.on('mousedown',() => {
                        setTimeout(function () {
                            console.log('Sensor Removed!');
                            app.stage.removeChild(sensor);
                        }, 1);
                    });
                    app.stage.addChild(sensor);
                    sensor.x = pointer.x - pointer.x%rs - .5;
                    sensor.y = pointer.y - pointer.y%rs- .5;
                    sensor.scale.x = rs/16;
                    sensor.scale.y = rs/16;
                    mainGrid[parseInt(pointer.y/rs)][parseInt(pointer.x/rs)] = mainGridNum.sensor; // sensor
                    break;

                case 'fire':
                    console.log('Fire selected!');
                    break;
                case 'info':
                    console.log('info selected!');
                    break;
                default:
                    break;
            }

            // console.log(mainGrid);
            // console.log('evacuee xy',parseInt(evacuee.x/4),parseInt(evacuee.y/4));
            // findPath(parseInt(pointer.x/4),parseInt(pointer.y/4),parseInt(evacuee.x/4),parseInt(evacuee.y/4)).then((pathArr)=>{
            //     // console.log('pathArr', pathArr);
            //     drawPath(pathArr, 4);
            // },(err) => {
            //     console.log('No Path found!', err);
            // });
        };

        //Start the game loop by adding the `gameLoop` function to
        //Pixi's `ticker` and providing it with a `delta` argument.
        app.ticker.add(delta => gameLoop(delta));

    }

    // ----------------------------------------------------------- Pixi gameLoop
    function gameLoop(delta) { // 60fps

        // Move the evacuee 1 pixel
        // evacuee.x += 1;
        t.update();
        easystar.calculate();
        easystar.enableDiagonals();
    }

    // -------------------------------------------------------------  EVENTS (general)

    //------------------------------------------ Menu Events
    // Load & save
    $('.esm-btn').on('click', (e) => {
        // event.preventDefault();
        console.log(e.target.id);
        switch (e.target.id) {
            case 'save-btn':
                console.log("save-btn clicked!");
                $('#save-modal').iziModal('open');

                break;
            case 'load-btn':
                console.log("load-btn clicked!");
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
        console.log('val', val);
        switch (val) {
            case 'cursor':
                $(this).addClass("focus-esm");
                objectSel = 'cursor';
                console.log('pointer selected!');
                break;
            case 'remove':
                $(this).addClass("focus-esm");
                objectSel = 'remove';
                console.log('remove selected!');
                break;
            case 'evacuee':
                $(this).addClass("focus-esm");
                objectSel = 'evacuee';
                console.log('evacuee selected!');
                break;
            case 'wall':
                $(this).addClass("focus-esm");
                objectSel = 'wall';
                console.log('wall selected!');
                break;
            case 'walls':
                $(this).addClass("focus-esm");
                objectSel = 'walls';
                console.log('walls selected!');
                break;
            case 'sensor':
                $(this).addClass("focus-esm");
                objectSel = 'sensor';
                console.log('sensor selected!');
                break;
            case 'fire':
                $(this).addClass("focus-esm");
                objectSel = 'fire';
                console.log('fire selected!');
                break;
            case 'info':
                $(this).addClass("focus-esm");
                objectSel = 'info';
                console.log('info selected!');
                console.log('mainGrid', mainGrid);
                $("#info-modal").iziModal('open');
                break;
            default:
                break;
        }
    });




    // --------------------------------------------------------------   FUNCTIONS

    // draw wall line

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

// find path

    function findPath (startX, startY, endX, endY) {
        return new Promise ((resolve, reject) =>{
            easystar.findPath(startX, startY, endX, endY, function( path ) {
                if (path === null) {
                    console.log("Path was not found.");
                    reject(path);
                } else {
                    console.log("Path was found. The first Point is " + path[0].x + " " + path[0].y);
                    resolve(path);
                }
            });
        });

    }

// tile drawing functions

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


    function drawTile (options) {
        let rectangle = new Graphics();
        rectangle.lineStyle(options.line.width, options.line.color, options.line.alpha);
        rectangle.beginFill(options.fill.color,options.fill.alpha);
        rectangle.drawRect(options.x, options.y, options.len, options.len);
        rectangle.endFill();
        rectangle.interactive = true;
        app.stage.addChild(rectangle);

        // save new block to array
        mainGrid[parseInt(options.pointerY/rs)][parseInt(options.pointerX/rs)] = mainGridNum.wall; // wall

        // add mouse event
        rectangle.on('mousedown',() => {
            setTimeout(function () {
                console.log('Tile removed!');
                app.stage.removeChild(rectangle);
            }, 1);
        });
    }


    function drawPathTile (x,y,len) {
        let pathRectangle = new Graphics();
        pathRectangle.lineStyle(1, 0xFF0000, 1);
        pathRectangle.beginFill(0xFF0000);
        pathRectangle.drawRect(x, y, len, len);
        pathRectangle.endFill();
        app.stage.addChild(pathRectangle);
    }

    function drawPath (arr, len) {
        arr.forEach((el) => {
            drawPathTile (el.x*4,el.y*4,len);
        })
    }

    function animFrameSetter (frameTitle, num) {
        let arr = [];
        for (let i = 0; i < num; i++) {
            arr.push(PIXI.Texture.fromFrame(`${frameTitle}_00${i}.png`));
        }
        console.log('frame arr', arr);
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
                    el === 8 ? 'green' :
                    el === 6 ? 'blue' :
                    'transparent';
                $(row).append(`<td style="background: ${bgColor}">${el}</td>`)
            });

        });

    }



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
                    console.log(value);
                    $.ajax({
                        url: "/save-scene",
                        type: "POST",
                        data: {filename : value, sceneArr: JSON.stringify(mainGrid)},
                        dataType: "json",
                        success: (res)=>{
                            console.log(res);
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
            $.ajax({
                url: "/load-scene",
                type: "POST",
                data: {action: 'files'},
                dataType: "json",
                success: (dataArr)=>{
                    // console.log('dataArr',dataArr);
                    if (dataArr.length > 0) {
                        console.log(moment(dataArr[0].createdAt).isValid());
                        $('#example').DataTable( {
                            data: dataArr,
                            columns: [
                                { "data": "id" },
                                { "data": "filename" },
                                { "data": "createdAt" }
                            ]
                        } );
                        // dataArr.forEach((el) => {
                        //     let sceneArr = JSON.parse(el.sceneArr);
                        //     console.log(sceneArr);
                        // });
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





