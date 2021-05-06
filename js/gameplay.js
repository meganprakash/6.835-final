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
    challengeVolCursor

let micRatio = 0,
    posX = 0,
    posY = 0

let challengeVol = Infinity,
    challengeX = Infinity,
    challengeY = Infinity

let waitingMic = 0, // how many samples do we want?
    waitingPos = 0

let micHistory = [] // append to a certain length to verify something said

let d = document.getElementById("game-canvas")


/*
 setup_game()

 initializes fabric_js gameplay space. Called from poses.js setup()
 */
function setup_game() {
    // draw board
    canvas = new fabric.Canvas("game", {
        backgroundColor: 'rgb(100,100,100)'
    });

    canvas.setHeight(600)
    canvas.setWidth(800);
    canvas.renderAll()

    d.addEventListener("newSound", setAmbientVol) // wait til there is enough ambient data
    d.removeEventListener("newSound", setAmbientVol)

}

function setAmbientVol(e) {
    micHistory.push(e.vol)
    if (micHistory.length > 200) {
        minVol = avg(micHistory)
        micHistory = []
        calibrationPhaseNear()
    }
}

function calibrationPhaseNear() {
    showInstruction("Welcome! This is the calibration phase. Please stand " +
        "4 feet away from your computer, and say 'Hi! My name is [your name]'")

    waitingMic = 10000
    let maxMic = -Infinity
    drawCursor(400, 300, 0)
    // cursor position at center and mic is 0

    let nearCallback = (e) => {
        if (e.vol > maxMic) { maxMic = e.vol}
        waitingMic -= 1
        if (waitingMic % 1000 === 0) {console.log(waitingMic % 1000)}
        if (waitingMic <= 0) {
            maxVol = maxMic
            micHistory = []
            waitingMic = 0
            d.removeEventListener("newSound", nearCallback)
        }
    }
    d.addEventListener("newSound", nearCallback)

    // set listener, callback is far
    // ask for near, say "Hi, my name is"
    // wait for enough input


}

function addNearCalibrationListeners() {
    // new mic val, are we waiting for mic? if so, add to micHistory
    //  and see if we have enough. if so, clear micHistory and turn off waiting.
    // also, redraw mic cursor
    d.addEventListener("newSound", function(event) {
        if (waitingMic) {
            micHistory.push(event.vol)
            if (micHistory)
        }
    })


    // new pose val, are we waiting for pos? if so, add to posX and posY, then turn
    //  off waiting.
    // also, redraw pos cursor
    d.addEventListener("newPose", function() {


    })


}


function calibrationPhaseFar() {
    // ask for far, say "Ready to play"
    // wait for enough input

    // removes listeners for calibration and adds the ones for game

    // then start game
}

function endCalibration() {
    showInstruction("The game board is set up. Let's play!")
    gamePhase()
}

function addGameListeners() {
    // TBD, might not need this
    // new mic val, updates mic ratio, redraws mic cursor, checks challenge

    // new pose val, updates cursor position, redraws cursor, checks challenge
}

function gamePhase() {
    // start game

    // loop K times to create K challenges
    // challenges request an animation frame?

    // end game
}

function showInstruction(s) {
    // show string s in the instructions div
    document.getElementById("instructions").innerText = s

}

function drawCursor(x, y, currentVol) {

    // circle with center at location of player

    // ring showing smoothed mic volume
    // max radius corresponds to the upper volume threshold
    // min radius is still > 0 and is near the min threshold

    canvas.renderAll()

}

function drawChallenge(x, y, promptText, promptVol) {

    canvas.renderAll()
}

function checkChallenge() {
    // check position

    // if position, check volume
}