/*

gameplay.js

Draws game area with fabric.js and handles gameplay logic.
Shows calibration screen and prompts in the instruction div.
Then triggers game mode with K number of challenges and background music.

Initialize the gameplay interface on startup, and say "loading posenet"

Then call setup_game() from the setup() in poses.js, so that the game begins when
posenet is ready.

 */

let micRatio = 0,
    posX = 0,
    posY = 0

let challengeVol = Infinity,
    challengeX = Infinity,
    challengeY = Infinity

let waitingMic = false,
    waitingPos = false

let micHistory = [] // append to a certain length to verify something said


/*
 setup_game()

 initializes fabric_js gameplay space. Called from poses.js setup()
 */
function setup_game() {
    // draw board
    

    // calibration phase
}

function addCalibrationListeners() {
    // new mic val, are we waiting for mic? if so, add to micHistory
    //  and see if we have enough. if so, clear micHistory and turn off waiting.
    // also, redraw mic cursor

    // new pose val, are we waiting for pos? if so, add to posX and posY, then turn
    //  off waiting.
    // also, redraw pos cursor
}

function calibrationPhase() {

    // ask for near, say "Hi, my name is"
    // wait for enough input

    // ask for far, say "Ready to play"
    // wait for enough input

    // removes listeners for calibration and adds the ones for game

    // then start game
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

}

function drawCursor(x, y, currentVol) {

    // circle with center at location of player

    // ring showing smoothed mic volume
    // max radius corresponds to the upper volume threshold
    // min radius is still > 0 and is near the min threshold

}

function drawChallenge(x, y, promptText, promptVol) {

}

function checkChallenge() {
    // check position

    // if position, check volume
}