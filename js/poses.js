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


let video,
    poseNet,
    poseReady, // a pose has been detected with necessary keypoints
    poses = [];

// saving only the horizontal coordinates of shoulders
let poseSmoothing = 30, // how many poses to keep
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

let avg = (array) => array.reduce((a, b) => a + b) / array.length;

function setup() {
    const videoCanvas = createCanvas(600, 400);
    videoCanvas.parent("#video-container")
    videoCanvas.scale(0.5)
    background(51)
    frameRate(30)
    video = createCapture(VIDEO);
    video.size(width, height);

    poseNet = ml5.poseNet(video, modelReady);


    // Hide the video element, and just show the canvas
    video.hide();
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
            leftShoulder_smoothed = avg(savedLeftShoulders)
        }

        // check if right shoulder confidence is high enough
        if (pose.keypoints[6].score > 0.5) {
            savedRightShoulders.push(pose.keypoints[6].position.x)
            if (savedRightShoulders.length > poseSmoothing) {
                savedRightShoulders.shift()
            }
            rightShoulder_smoothed = avg(savedRightShoulders)

        }

        distanceBetweenShoulders = Math.abs(rightShoulder_smoothed - leftShoulder_smoothed)
        poseReady = true // we have keypoints to proceed
        updateDebug()
    });
}

/*
Write the debug data to the page.
 */
function updateDebug() {
    let str =
        "leftShoulder x: " + leftShoulder_smoothed + "<br>" +
        "distanceBetweenShoulders: " + distanceBetweenShoulders

    select("#poseDebug").html(str)

}

function modelReady() {
    console.log("Model loaded")
    select('#status').html('Model Loaded');
    setPoseListeners()
}

/*
draw()

Draws the webcam video and the keypoints overlaid
 */
function draw() {
    translate(width,0);
    scale(-1.0,1.0);    // flip x-axis backwards
    image(video, 0, 0, 600, 400);


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