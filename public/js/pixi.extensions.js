export class SensorSprite extends PIXI.extras.AnimatedSprite {
    constructor(arg){
        super(arg);
        this.info = {
            name: '',
            state: 'DEFAULT'
        };
    }

    getSensorState () {
        return this.sensorState;
    }
}

export class EvacueeSprite extends PIXI.Sprite {
    constructor(){
        super();
    }
}

export class ExitSprite extends PIXI.Sprite {
    constructor(){
        super();
    }
}

export class FireSprite extends PIXI.Sprite {
    constructor(){
        super();
    }
}