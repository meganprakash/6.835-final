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
    challengeText,
    canvasWidth = 900,
    canvasHeight = 800

let micRatio = 0,
    posX = 0,
    posY = 0

let xPos, yPos, vPos

let challengeVol = Infinity,
    challengeX = Infinity,
    challengeY = Infinity,
    currentChallenge = false,
    currentPosChallenge = false,
    currentVolChallenge = Infinity,
    score = 0

let waitingMic = 0, // how many samples do we want?
    waitingPos = 0

let micHistory = [] // append to a certain length to verify something said

let canvas_d = document.getElementById("game-canvas")

let timer,
    gameRunning = false

let startTime

let words = ["amazement","attention","banana", "blindingly", "conference", "electric",
    "glacier", "horizon", "instrument", "numerous", "photograph", "typical"]


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
        "3 feet away from your computer, and say 'Hi! My name is [your name]'")

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
        if (e.detail.vol > minVol + 15) { waitingMic -= 1 }
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
    showInstruction("Thanks, that was great! Next, take 3 steps back." +
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
        if (e.detail.vol > minVol + 20) { waitingMic -= 1 }
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
    document.getElementById("poseDebug").style.display = "none"
    document.getElementById("micDebug").style.display = "none"
    gameIntro()
}

function gameIntro() {
    showInstruction("The cursor onscreen shows your position and volume." +
        "<br> To play: walk so your cursor matches the prompt, then speak the given word loudly!" +
        "<br> How fast can you get 15? Say \"Let's play\" to begin.")

    waitingMic = 20

    let startCall = (e) => {
        if (e.detail.vol > minVol + 20) { waitingMic -= 1 }
        if (waitingMic <= 0) {
            document.removeEventListener("newSound", startCall)
            gamePhase()
        }
    }
    document.addEventListener("newSound", startCall)
}



function gamePhase() {

    challengePosCursor = new fabric.Circle({
        radius: 100, fill: 'rgba(0,0,0,0)', strokeWidth: 10, stroke: 'rgb(250,250,250)', left:100, top:100
    })
    challengeVolCursor = new fabric.Circle({
        radius: 100, fill: 'rgba(0,0,0,0)', strokeWidth: 10, stroke: 'rgb(200,300,0)', left:100, top:100
    })
    canvas.add(challengeVolCursor, challengePosCursor)

    posCursor = new fabric.Circle({
        radius: 20, fill: 'white', left: 100, top: 100
    });
    volCursor = new fabric.Circle({
        radius: 30, fill: 'rgb(0,160,0)', left: 100, top: 100
    });
    canvas.add(volCursor, posCursor)


    let e = new CustomEvent("timesUp", {
        bubbles: true,
    });
    timer = setTimeout(endGame, 120000)
    document.getElementById("instructions").onclick = () => {clearTimeout(timer); endGame()}

    document.addEventListener("newPose", drawCursor)
    document.addEventListener("newSound", checkChallenge)
    document.addEventListener("newPose", checkChallenge)
    document.addEventListener("timesUp", endGame)

    drawChallenge()
    startTime = new Date();
    gameRunning = true
}

function showInstruction(s) {
    // show string s in the instructions div
    document.getElementById("instructions").innerHTML = s
}

function drawCursor() {
     xPos = Math.max(0, canvasWidth - distanceFromLeft() * canvasWidth)
    yPos = Math.max(0, canvasHeight - distanceFromFront() * canvasHeight)
    vPos = getVolPct()
    xPos = xPos > canvasWidth ? canvasWidth : xPos
    yPos = yPos > canvasHeight ? canvasHeight : yPos


    posCursor.set({left: xPos, top: yPos, originX: 'center', originY: 'center'})
    volCursor.set({left: xPos, top: yPos, radius: (20 + 30*vPos), originX: 'center', originY: 'center'})
    canvas.renderAll();

    // also show gameplay debug
    let str = "distanceFromFront: " + distanceFromFront() + "<br>"
        + "distanceFromLeft: " + distanceFromLeft() + "<br>"
    + "vol pct" + getVolPct()

    document.getElementById("micDebug").style.display = "none"
    document.getElementById("poseDebug").style.display = "none"
    document.getElementById("calibrationDebug").innerHTML = str

}

function drawChallenge() {
    if (score === 15) {endGame()}
    xCh = Math.random() * (canvasWidth - 200) + 100
    yCh = Math.random() * (canvasHeight - 140) + 70
    if (yCh < 250) { xCh = Math.min(xCh, 300)}
    let v = Math.max(0.5, Math.random())
    if (yCh > 450) { v = Math.min(v, 0.7)}

    const randomWord = words[Math.floor(Math.random() * words.length)];

    showInstruction("your word: " + randomWord)

    currentChallenge = true
    currentPosChallenge = true
    currentVolChallenge = v

    challengePosCursor.opacity = 1

    challengePosCursor.set({left: xCh, top: yCh, originX: 'center', originY: 'center'})
    challengeVolCursor.set({left: xCh, top: yCh, radius: (30 + 30*v), originX: 'center', originY: 'center'})
    canvas.renderAll()
}

function checkChallenge() {
    if(currentChallenge) {
        // see if posCursor intersects challengePosCursor
        if(Math.abs(xPos - xCh) < 50 && Math.abs(yPos - yCh) < 50){
            currentPosChallenge = false
            challengePosCursor.opacity = 0
        }

        if(currentPosChallenge === false) {
            let x = canvasWidth - distanceFromLeft() * canvasWidth
            let y = canvasHeight - distanceFromFront() * canvasHeight
            challengeVolCursor.set({left: x, top: y, radius: (30 + 30*currentVolChallenge)})

            if(Math.abs(getVolPct() - currentVolChallenge) < 0.1) {
                currentVolChallenge = Infinity
                currentChallenge = false
                score += 1
                drawChallenge()
            }
        }
        document.getElementById("score").innerText = "score: " + score
    }
}

function endGame() {
    gameRunning = false
    let endTime = new Date();
    let timeDiff = endTime - startTime; //in ms
    // strip the ms
    timeDiff /= 1000;

    // get seconds
    var seconds = Math.round(timeDiff);
    canvas.clear()

    document.removeEventListener("newPose", drawCursor)
    document.removeEventListener("newSound", checkChallenge)
    document.removeEventListener("newPose", checkChallenge)

    showInstruction("Nice work, your time was " + seconds + " seconds.")

}