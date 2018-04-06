
// imports
const easystarjs = require('easystarjs');
import {
    loadProgressHandler,
    outerZones,
    createGroupedArray,
    scaledMatrixArray,
    scaleArray
} from './utils'
// load pixi jsons
const level = require('./pixi-jsons/es_floor_1.json');

$(document).ready(()=>{
// Get viewport
    console.log(`Window Height:${window.innerHeight}, Width:${window.innerWidth}`);
    let esmWidth = 0.8 * window.innerHeight;
    let rs = esmWidth/50;

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

//Aliases
    let Application = PIXI.Application,
        loader = PIXI.loader,
        resources = PIXI.loader.resources,
        Sprite = PIXI.Sprite,
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

// global vars for setup and gameloop
    let floorGrid, evacuee, id;
    let t = new Tink(PIXI, app.renderer.view);
    let easystar = new easystarjs.js();
    let mainGrid = Array(50).fill().map(() => Array(50).fill(0));
    // let subGrid = Array(200).fill().map(() => Array(200).fill(0));

    let mainGridNum = {
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

//Add the canvas that Pixi automatically created for you to the HTML document
// document.body.appendChild(app.view);
$('#app-render').append(app.view);

//load an image and run the `setup` function when it's done
    loader
        .add('images/es_floor_1.png')
        .add('images/es_sprites.json')
        .on('progress', loadProgressHandler)
        .load(setup);

    function setup() {

        console.log('All files loaded');

        // Get 2D array of floor including walls and outer area
        let preArr = createGroupedArray(level.layers[0].data,50);

        // scaled array
        let mainArr = scaleArray(preArr, 4);
        // console.log('mainArr',mainArr);

        // Create grid
        drawGrid({
            len: esmWidth,
            size: rs,
            color: 0xFFFFFF,
            alpha: 0.3,
            width: 1
        });

        // set up easy star
        easystar.setGrid(mainArr);
        easystar.setAcceptableTiles([0]);


        //Add the evacuees to the stage
        id = resources['images/es_sprites.json'].textures;
        evacuee = new Sprite(id['person_16x16_red_000.png']);
        evacuee.scale.x = rs/16;
        evacuee.scale.y = rs/16;
        app.stage.addChild(evacuee);


        // click events
        let pointer = t.makePointer();
        pointer.tap = () => {
            console.log('Pointer xy',pointer.x/rs ,pointer.y/rs);
            switch(objectSel) {
                case 'cursor':
                    console.log('objectSel',objectSel);
                    console.log('pointer', pointer);
                    console.log('Cursor xy',pointer.x - pointer.x%rs - .5, pointer.y - pointer.y%rs- .5);
                    break;
                case 'remove':
                    console.log('objectSel',objectSel);
                    console.log('remove xy',pointer.x - pointer.x%rs - .5, pointer.y - pointer.y%rs- .5);
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

                    // save new block to array
                    mainGrid[parseInt(pointer.y/rs)][parseInt(pointer.x/rs)] = mainGridNum.wall; // wall
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
                        drawWallLine(wallsObj, 16);

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

// gameLoop
    function gameLoop(delta){

        //Move the cat 1 pixel
        // evacuee.x += 1;
        t.update();
        easystar.calculate();
        easystar.enableDiagonals();
    }

// ------------------------------------  EVENTS
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

                break;
            default:
                break;
        }
    });

    // Check for object select change
    $('input[type=radio][name=objectsel]').change(function() {
        $('.esm-radio-option').removeClass("focus-esm");
        switch (this.value) {
            case 'cursor':
                $(this).parent().addClass("focus-esm");
                objectSel = 'cursor';
                console.log('pointer selected!');
                break;
            case 'remove':
                $(this).parent().addClass("focus-esm");
                objectSel = 'remove';
                console.log('remove selected!');
                break;
            case 'evacuee':
                $(this).parent().addClass("focus-esm");
                objectSel = 'evacuee';
                console.log('evacuee selected!');
                break;
            case 'wall':
                $(this).parent().addClass("focus-esm");
                objectSel = 'wall';
                console.log('wall selected!');
                break;
            case 'walls':
                $(this).parent().addClass("focus-esm");
                objectSel = 'walls';
                console.log('walls selected!');
                break;
            case 'sensor':
                $(this).parent().addClass("focus-esm");
                objectSel = 'sensor';
                console.log('sensor selected!');
                break;
            case 'fire':
                $(this).parent().addClass("focus-esm");
                objectSel = 'fire';
                console.log('fire selected!');
                break;
            default:
                break;
        }
    });



// -----------------------------------   FUNCTIONS

    // draw wall line

    function drawWallLine (obj,size) {
        let len = Math.abs(obj.end.x - obj.start.x) > Math.abs(obj.end.y - obj.start.y)
            ? obj.end.x - obj.start.x
            : obj.end.y - obj.start.y;
            console.log('drawWallLine', len);

            let mx = Math.abs(obj.end.x - obj.start.x) > Math.abs(obj.end.y - obj.start.y) ? 1 : 0;
            let my = Math.abs(obj.end.x - obj.start.x) < Math.abs(obj.end.y - obj.start.y) ? 1 : 0;
            console.log("mx, my", mx, my);

            if (mx === 1) {
                size = obj.end.x - obj.start.x >= 0 ? size : size * -1;
            }
            if (my === 1) {
                size = obj.end.y- obj.start.y >= 0 ? size : size * -1;
            }

            console.log('size', size);
            if (size >=0 ) {
                for (let i = 0; i < Math.abs(len); i+=size) {
                    drawTile({
                        len: rs,
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
            } else {
                for (let i = Math.abs(len); i > 0; i+=size) {
                    drawTile({
                        len: rs,
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

});





