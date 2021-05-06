/*

calibration.js

Backend logic for setting calibration information and returning measurements
during gameplay.

Depth calibration is done by recording shoulder width at 4ft and at 8ft.
Shoulder width is inversely proportional to distance. Return depth
in terms of % distance between min and max shoulder width.

Volume calibration is by asking user to say "Hello, my name is ____" at
their normal speaking volume from 4ft. Volume is inversely proportional
to the square of distance. Measure volume in terms of % of speaking volume.

 */

// need to collect shoulder width over 2 seconds and find geometric mean!!


let maxShoulder; // near distance
let minShoulder; // far distance
let minVol,
    maxVol
let calibrationDebugDiv = document.getElementById("calibrationDebug")

var gmean = function (array) {
   let n = array.length

    console.assert(n > 0)
   let product = array.reduce((a, b) => a * b)
    return Math.pow(product, 1/n)
}

/*
Collect hella vol samples when user is not speaking, use it for the min vol
 */
function setMinVol(array) {
    minVol = avg(array)
}

/*
This is the voice sample from when user was asked to speak
Take all the positive values after subtracting the ambient
Then avg those
 */
function setMaxVol(array) {
    let normalized = array.map((a) => a - minVol)
    let nonzero = normalized.filter((a) => a > 0)
    maxVol = avg(array)
}

/*
Send an array of collected shoulder widths
 */
function calibrateShoulderDepth(widthPxArray, which) {
    if (which === "near") {
        maxShoulder = gmean(widthPxArray)
        calibrationDebugDiv.innerText = "maxShoulder: " + maxShoulder + "<br>"
    } else if (which === "far") {
        minShoulder = gmean(widthPxArray)
        calibrationDebugDiv.innerText += "minShoulder: " + minShoulder
    } else {
        calibrationDebugDiv.innerText = "Error: calibrateShoulder received invalid argument: " + which
    }
}

/*
Return the distance from front, in percentage [0, 100] of distance range
Call this during gameplay
 */
function distanceFromFront() {
    let w = distanceBetweenShoulders
    if (w >= maxShoulder) { return 100 }
    else if (w <= minShoulder) {return 0}

    let range = maxShoulder - minShoulder
    let ratio = (w - minShoulder) / range

    calibrationDebugDiv.innerText = "distanceFromFront: " + ratio*100.0
    return ratio * 100.0
}

/*
Return the distance from the left, in percentage [0, 100] of distance range
xPxArray = collection of x-position samples
 */
function distanceFromLeft() {
    let d = leftShoulder_smoothed
    console.log(d)
    console.log("videoWidth" + videoWidth)
    return d/videoWidth * 100.0
}

function getVolPct() {
    let range = maxVol - minVol
    let ratio = (micVol_positive - minVol) / range
    return ratio*100.0
}

