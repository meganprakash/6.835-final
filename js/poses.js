// Copyright (c) 2018 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet example using p5.js
=== */


/* ===

poses.js

Initializes poseNet using the setup() fn of p5.js
Contains methods for handling pose output
Draws video with overlaid pose points

=== */

let ac,
    an,
    source = "",
    buffer,
    scriptProcessorNode

let micVolSmoothing = 5,
    savedVol = [],
    micVol_smoothed,
    micVol_positive

let video,
    videoWidth,
    videoHeight,
    poseNet,
    poseReady, // a pose has been detected with necessary keypoints
    poses = [];

let widthHistory = [];

// saving only the horizontal coordinates of shoulders
let poseSmoothing = 10, // how many poses to keep
    savedLeftShoulders = [],
    leftShoulder_smoothed,
    savedRightShoulders = [],
    rightShoulder_smoothed,
    distanceBetweenShoulders;

let moveThreshold = 100,
    leftMoveRequest = null,
    rightMoveRequest = null,
    lastSuccessTime,
    lastRequest

let vid_d = document.getElementById("video-container")


let avg = (array) => array.reduce((a, b) => a + b) / array.length;

function setup() {

    const videoCanvas = createCanvas(300, 200);
    videoCanvas.parent("#video-container")
    background(51)
    frameRate(30)

    video = createCapture(VIDEO);
    video.size(width, height);
    videoWidth = width
    poseNet = ml5.poseNet(video, "single", modelReady);
    // Hide the video element, and just show the canvas
    video.hide();

    // showInstruction("Click to begin!")
}

function initMic() {
    ac = new AudioContext();
    an = ac.createAnalyser();
    source = "";
    buffer = new Float32Array(an.frequencyBinCount);
    scriptProcessorNode = ac.createScriptProcessor(16384, 1, 1);
    if (navigator.getUserMedia) {
        navigator.getUserMedia(
            {audio:true},
            function(stream) {
                source = ac.createMediaStreamSource(stream);
                source.connect(an);
                requestAnimationFrame(processAudio);
            },
            function(e) {
                alert('Error capturing audio.');
            }
        );
    }

}

function resumeMic() {
    ac.resume()
}

function pauseMic() {
    ac.suspend()
}

function processAudio() {
    if (typeof buffer == 'undefined') {return}
    an.getFloatFrequencyData(buffer);
    let peak = -Infinity;
    for (let i = 0; i < buffer.length; i++) {
        const x = buffer[i];
        if (x > peak) {
            peak = x;
        }
    }
    if (peak > -Infinity) {
        savedVol.push(peak)

        if (savedVol.length > micVolSmoothing) {
            savedVol.shift()
        }
        micVol_smoothed = avg(savedVol)
        micVol_positive = 100 + micVol_smoothed

        let e = new CustomEvent("newSound", {
            bubbles: true,
            detail: {
                vol: micVol_positive
            }
        });
        vid_d.dispatchEvent(e)

        updateMicDebug()
    }

    requestAnimationFrame(processAudio);
}

function updateMicDebug() {
    if (gameRunning) { return; }

    let str = "mic peak: " + micVol_positive.toFixed(2) + "<br>"
    if (typeof minVol !== "undefined") {str += "minVol: " + minVol.toFixed(1) + "<br>"}
    if (typeof maxVol !== "undefined") {str += "maxVol: " + maxVol.toFixed(1) + "<br>"}
    if (typeof waitingMic !== "undefined") {str += "waitingMic: " + waitingMic}

    select("#micDebug").html(str)
}

/*

setPoseListeners()
Listeners for when a pose is detected
Identifies position of left and right shoulders and sets in global var
Calculates distance between shoulders and sets in global var

 */
function setPoseListeners() {

    poseNet.on('pose', function(results) {
        poses = results
        if(results.length < 1) { return; }

        let pose = results[0].pose
        if(pose.score < 0.05) { return; }


        // check if left shoulder confidence is high enough
        if (pose.keypoints[5].score > 0.5) {

            savedLeftShoulders.push(pose.keypoints[5].position.x)
            if (savedLeftShoulders.length > poseSmoothing) {
                savedLeftShoulders.shift()
            }
            leftShoulder_smoothed = gmean(savedLeftShoulders)
        }

        // check if right shoulder confidence is high enough
        if (pose.keypoints[6].score > 0.5) {
            savedRightShoulders.push(pose.keypoints[6].position.x)
            if (savedRightShoulders.length > poseSmoothing) {
                savedRightShoulders.shift()
            }
            rightShoulder_smoothed = gmean(savedRightShoulders)
        }

        if (rightShoulder_smoothed && leftShoulder_smoothed) {
            distanceBetweenShoulders = Math.abs(rightShoulder_smoothed - leftShoulder_smoothed)
        }
            poseReady = true // we have keypoints to proceed
            updatePoseDebug()
            let e = new CustomEvent("newPose", {
                bubbles: true
            });
            vid_d.dispatchEvent(e)

    });
}

/*
Write the debug data to the page.
 */
function updatePoseDebug() {
    if (gameRunning) { return; }
    if(!leftShoulder_smoothed || !distanceBetweenShoulders) {return;}
    let str =
        "leftShoulder x: " + leftShoulder_smoothed.toFixed(2) + "<br>" +
        "distanceBetweenShoulders: " + distanceBetweenShoulders.toFixed(2) + "<br>"

    select("#poseDebug").html(str)
}

function modelReady() {
    console.log("Model loaded")
    select('#status').html('Model Loaded');
    $(document).trigger('poseNetReady');
    setPoseListeners()
}

/*
draw()

Draws the webcam video and the keypoints overlaid
 */
function draw() {
    translate(width,0);
    scale(-1.0,1.0);    // flip x-axis backwards
    image(video, 0, 0, 300, 200);


    // We can call both functions to draw all keypoints and the skeletons
    drawKeypoints();
    drawSkeleton();
}


// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
        // For each pose detected, loop through all the keypoints
        let pose = poses[i].pose;
        for (let j = 0; j < pose.keypoints.length; j++) {
            // A keypoint is an object describing a body part (like rightArm or leftShoulder)
            let keypoint = pose.keypoints[j];
            // Only draw an ellipse is the pose probability is bigger than 0.2
            if (keypoint.score > 0.2) {
                fill(255, 0, 0);
                noStroke();
                ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
            }
        }
    }
}

// A function to draw the skeletons
function drawSkeleton() {
    // Loop through all the skeletons detected
    for (let i = 0; i < poses.length; i++) {
        let skeleton = poses[i].skeleton;
        // For every skeleton, loop through all body connections
        for (let j = 0; j < skeleton.length; j++) {
            let partA = skeleton[j][0];
            let partB = skeleton[j][1];
            stroke(255, 0, 0);
            line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
        }
    }
}