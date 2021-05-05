
var sprite1,
    sprite2,
    lag1,
    lag2,
    sprite1On = true,
    sprite2On = false,
    moveThreshold = 50,
    leftMoveRequest = null,
    lastSuccessTime

export let app;
import {getLeftShoulder, poseReady} from "./ml.js";

(function() {

    console.log('ml5 version:', ml5.version);

    app = new PIXI.Application({
        width:1080,
        height:700,
            antialias: true,    // default: false
            transparent: false, // default: false
            resolution: 1       // default: 1
        }
    );
    document.body.appendChild(app.view);

    app.renderer.view.style.position = "absolute"
    app.renderer.view.style.display = "block";

    //To change the background color
    app.renderer.backgroundColor = 0x1099bb;

    // make sprite1
    const style = new PIXI.TextStyle({

        fontFamily: 'Arial',
        fontSize: 36,
        fontStyle: 'italic',
        fontWeight: 'bold',
        fill: ['#ffffff', '#00ff99'], // gradient
        stroke: '#4a1850',
        strokeThickness: 5,
    });
    sprite1 = new PIXI.Text('move left!', style);
    sprite1.x = 50;
    sprite1.y = 100;
    app.stage.addChild(sprite1);

    const lagStyle = new PIXI.TextStyle({

        fontFamily: 'Arial',
        fontSize: 28,
        fontWeight: 'bold',
        fill: ['#ffffff'], // gradient
    });
    lag1 = new PIXI.Text('last lag:', lagStyle);
    app.stage.addChild(lag1)
    lag1.visible = true;

    sprite2 = new PIXI.Text('move right!', style);
    sprite2.x = 450;
    sprite2.y = 100;
    app.stage.addChild(sprite2);

    app.ticker.add(delta => gameLoop(delta));

    if (poseReady && getLeftShoulder()) {
        requestLeftMove()
    }
})(); // init

function gameLoop(delta){
    sprite1.visible = sprite1On
    sprite2.visible = sprite2On;

    // check if any current requests

    if (leftMoveRequest) {
        const leftShoulder = getLeftShoulder()[0];

        // check if request satisfied
        if (leftMoveRequest.bodyPos - leftShoulder > moveThreshold) { // check the direction!
            leftMoveRequest = null;
            lastSuccessTime = Date.now()
            lag1.text = "Last lag: " + (leftMoveRequest.time.getTime() - lastSuccessTime.time.getTime())
            lag1.visible = true
            sprite1.visible = false
        }
    }

}

export function getPose(pose) {
    return pose
}

function requestLeftMove() {
    // turn on sprite
    sprite1On = true

    // save time and current position
    leftMoveRequest = {
        time: Date.now(),
        bodyPos: getLeftShoulder()[0] // we only care about x coord
    }
    console.log("leftMoveRequest: ", leftMoveRequest)
}

function requestRightMove() {
    // turn on sprite
    // toggle waiting for right move


}