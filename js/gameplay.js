/*

gameplay.js

Draws game area with fabric.js and handles gameplay logic.
Shows calibration screen and prompts in the instruction div.
Then triggers game mode with K number of challenges and background music.

Initialize the gameplay interface on startup, and say "loading posenet"

Then call setup_game() from the setup() in poses.js, so that the game begins when
posenet is ready.

 */

let canvas,
    posCursor,
    volCursor,
    challengePosCursor,
    challengeVolCursor,
    canvasWidth = 800,
    canvasHeight = 600

let micRatio = 0,
    posX = 0,
    posY = 0

let challengeVol = Infinity,
    challengeX = Infinity,
    challengeY = Infinity

let waitingMic = 0, // how many samples do we want?
    waitingPos = 0

let micHistory = [] // append to a certain length to verify something said

let canvas_d = document.getElementById("game-canvas")


/*
 setup_game()

 initializes fabric_js gameplay space. Called from poses.js setup()
 */
function setup_game() {
    // draw board
    canvas = new fabric.Canvas("game", {
        backgroundColor: 'rgb(100,100,100)'
    });

    canvas.setHeight(canvasHeight)
    canvas.setWidth(canvasWidth);
    canvas.renderAll()

    document.addEventListener("newSound", setAmbientVol) // wait til there is enough ambient data
}

function setAmbientVol(e) {
    micHistory.push(e.detail.vol)
    if (micHistory.length > 100) {
        console.log("Setting min vol")
        minVol = avg(micHistory)
        micHistory = []
        updateMicDebug()
        document.removeEventListener("newSound", setAmbientVol)
        calibrationPhaseNear()
    }
}

function calibrationPhaseNear() {
    showInstruction("Welcome! This is the calibration phase. Please stand " +
        "4 feet away from your computer, and say 'Hi! My name is [your name]'")

    waitingMic = 90
    waitingPos = 60
    let widthHistory = []
    let maxMic = -Infinity
    // cursor position at center and mic is 0

    let minDistanceCallback = (e) => {
        if (distanceBetweenShoulders) {
            waitingPos -= 1
            widthHistory.push(distanceBetweenShoulders)
            if (waitingPos <= 0) {
                console.log("setting near distance")
                calibrateShoulderDepth(widthHistory, "near")
                widthHistory = []
                document.removeEventListener("newPose", minDistanceCallback)
                calibrationPhaseFar()
            }
        }
    }

    let nearCallback = (e) => {
        if (e.detail.vol > maxMic) { maxMic = e.detail.vol}
        waitingMic -= 1
        if (waitingMic % 1000 === 0) {console.log(waitingMic % 1000)}
        if (waitingMic <= 0) {
            console.log("setting maxVol")
            maxVol = maxMic
            micHistory = []
            waitingMic = 0
            updateMicDebug()
            document.removeEventListener("newSound", nearCallback)
            document.addEventListener("newPose", minDistanceCallback)
        }
    }
    document.addEventListener("newSound", nearCallback)

    // set listener, callback is far
    // ask for near, say "Hi, my name is"
    // wait for enough input


}

function calibrationPhaseFar() {
    showInstruction("Thanks, that was great! Next, please stand 8 feet from your computer." +
        "Then, say 'I'm ready to start!'")
    // ask for far, say "Ready to play"
    // wait for enough input
    waitingMic = 30
    waitingPos = 30
    let widthHistory = []

    let maxDistanceCallback = (e) => {
        if (distanceBetweenShoulders) {
            waitingPos -= 1
            widthHistory.push(distanceBetweenShoulders)
            if (waitingPos <= 0) {
                console.log("setting far distance")
                calibrateShoulderDepth(widthHistory, "far")
                document.removeEventListener("newPose", maxDistanceCallback)
                endCalibration()
            }
        }
    }

    let farCallback = (e) => {
        if (e.detail.vol > minVol + 10) { waitingMic -= 1 }
        if (waitingMic <= 0) {
            console.log("calibrationPhaseFar: heard speech")
            updateMicDebug()
            document.removeEventListener("newSound", farCallback)
            document.addEventListener("newPose", maxDistanceCallback)
        }
    }
    document.addEventListener("newSound", farCallback)

}

function endCalibration() {
    gamePhase()
}

function gamePhase() {
    showInstruction("The cursor onscreen shows your position and volume. To complete the challenges," +
        "walk so your cursor matches the prompt, then speak loudly enough to match the volume circle." +
        "See how many you can get in 2 minutes!")

    posCursor = new fabric.Circle({
        radius: 20, fill: 'white', left: 100, top: 100
    });
    canvas.add(posCursor)

    document.addEventListener("newPose", drawCursor)


    // loop K times to create K challenges
    // challenges request an animation frame?

    // end game
}

function showInstruction(s) {
    // show string s in the instructions div
    document.getElementById("instructions").innerText = s
}

function drawCursor() {
    let x = distanceFromLeft() * canvasWidth
    let y = canvasHeight - distanceFromFront() * canvasHeight
    let v = getVolPct()

    console.log("drawing cursor: " + x + ", " + y + ", " + v)

    posCursor.set({left: x, top: y})

    // ring showing smoothed mic volume
    // max radius corresponds to the upper volume threshold
    // min radius is still > 0 an


    // also show gameplay debug
    let str = "distanceFromFront: " + distanceFromFront() + "<br>"
        + "distanceFromLeft: " + distanceFromLeft() + "<br>"
    + "vol pct" + getVolPct()

    document.getElementById("calibrationDebug").innerHTML = str

}

function drawChallenge() {
    // random x
    // random y
    // random vol %

    canvas.renderAll()
}

function checkChallenge() {
    // check position

    // if position, check volume

    // if both, then draw challenge
}