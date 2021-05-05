// Copyright (c) 2018 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet example using p5.js
=== */


let video;
let poseNet;
let poses = [];

var poseSmoothing = 20, // how many poses to keep
    savedLeftShoulders = [],
    leftShoulderAvg

var moveThreshold = 100,
    leftMoveRequest = null,
    rightMoveRequest = null,
    lastSuccessTime,
    lastRequest

function setup() {
    const videoCanvas = createCanvas(600, 400);
    videoCanvas.parent("#video-container")
    videoCanvas.scale(0.5)
    background(51)
    frameRate(30)
    video = createCapture(VIDEO);
    video.size(width, height);

    // Create a new poseNet method with a single detection
    poseNet = ml5.poseNet(video, modelReady);
    // This sets up an event that fills the global variable "poses"
    // with an array every time new poses are detected

    //////////////
    /// here is where I have some smoothing and detecting pose info!!!!
    //////////////

    poseNet.on('pose', function(results) {
        poses = results
        if(results.length < 1) { return; }

        let pose = results[0].pose
        if(pose.score < 0.05) { return; }

        poseReady = true
        // check if left shoulder confidence is high enough
        if (pose.keypoints[5].score > 0.5) {
            savedLeftShoulders.push(pose.keypoints[5].position.x)
            if (savedLeftShoulders.length > poseSmoothing) {
                savedLeftShoulders.shift()
            }

            let avg = (array) => array.reduce((a, b) => a + b) / array.length;
            leftShoulderAvg = avg(savedLeftShoulders)
        }
    });
    // Hide the video element, and just show the canvas
    video.hide();
}

function requestLeftMove() {

    console.log("requesting left")
    // save time and current position
    leftMoveRequest = {
        time: Date.now(),
        bodyPos: leftShoulderAvg // we only care about x coord
    }

    select('#current').html('Initial position: ' + leftMoveRequest.bodyPos);

    select('#command').html("Move left!")
}

function requestRightMove() {

    // save time and current position
    rightMoveRequest = {
        time: Date.now(),
        bodyPos: leftShoulderAvg // we only care about x coord
    }

    select('#current').html('Initial position: ' + " " + rightMoveRequest.bodyPos);

    select('#command').html("Move right!")

}
function modelReady() {
    console.log("Model loaded")
    select('#status').html('Model Loaded');
}



function draw() {
    translate(width,0);
    scale(-1.0,1.0);    // flip x-axis backwards
    image(video, 0, 0, 600, 400);


    // We can call both functions to draw all keypoints and the skeletons
    drawKeypoints();
    drawSkeleton();

    ///////////
    /// here is where I have detecting if requirement is satisfied
    //////////

    var lastLag
    const leftShoulder = leftShoulderAvg;
    // check if any current requests
    if (leftMoveRequest) {

        // check if request satisfied
        if (leftShoulder - leftMoveRequest.bodyPos> moveThreshold) { // check the direction!
            lastSuccessTime = Date.now()
            lastRequest = "leftMove"
             lastLag = lastSuccessTime - leftMoveRequest.time
            select('#lag').html('Last elapsed time: ' + lastLag + "ms");
            select('#current').html('Current request: none')
            select('#command').html('')

            leftMoveRequest = null;
        }
    } else if (rightMoveRequest) {

        // check if request satisfied
        if (rightMoveRequest.bodyPos - leftShoulder > moveThreshold) { // check the direction!
            lastSuccessTime = Date.now()
            lastRequest = "rightMove"
             lastLag = lastSuccessTime - rightMoveRequest.time
            select('#lag').html('Last elapsed time: ' + lastLag + "ms");
            select('#current').html('Current request: none')
            select('#command').html('')
            rightMoveRequest = null;

        }
    } else if (frameCount % 120 === 0) {
        newRequest()
    }

}

function newRequest() {
    leftMoveRequest = null;
    rightMoveRequest = null;
    (lastRequest === "leftMove") ? requestRightMove(): requestLeftMove();
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