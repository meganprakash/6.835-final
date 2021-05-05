const videoElement = document.querySelector("video");

var videoSprite, videoRatio
var poseSmoothing = 600, // how many poses to keep
    savedLeftShoulders = [],
    leftShoulderAvg

export var poseReady

import {app} from "./main.js"

// Get access to webcam
(() => {
    const constraints = {
        video: {
            facingMode: "user"
        },
        audio: false
    }
    // Get access to the camera!
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
            .then((stream)=>{
                gotStream(stream)
            }).catch(err=>{
            alert(err)
        });
    }
})();

function handleError(error) {
    console.error('Error: ', error);
}

const options = {
    imageScaleFactor: 0.3,
    outputStride: 16,
    flipHorizontal: true,
    minConfidence: 0.5,
    maxPoseDetections: 3,
    scoreThreshold: 0.5,
    nmsRadius: 20,
    detectionType: 'single',
    multiplier: 0.75,
}

// Create a new poseNet method

let poseNet
const poseNetINIT = ()=> {
    poseNet = ml5.poseNet(videoElement,options, modelLoaded);
}
// When the model is loaded
function modelLoaded() {
    console.log("Model Loaded!");
    poseNet.on("pose", function(results) {
        if(!results) { return; }

        let pose = results[0].pose
        if(pose.score < 0.05) { return; }
        console.log(pose.keypoints[5])

        poseReady = true
        // check if left shoulder confidence is high enough
        if (pose.keypoints[5].score > 0.5) {
            savedLeftShoulders.push(pose.keypoints[5])
            if (savedLeftShoulders.length > poseSmoothing) {
                savedLeftShoulders.shift()
            }

            leftShoulderAvg = (savedLeftShoulders) => savedLeftShoulders.reduce((a, b) => a + b) / savedLeftShoulders.length;
        }

    });
}

export function getLeftShoulder() {
    return leftShoulderAvg
}

function gotStream(stream) {

    videoElement.srcObject = stream;

    let b = setInterval(()=>{

        if(videoElement.readyState >= 3){

            var vidTexture = PIXI.Texture.from(videoElement);
            videoSprite = new PIXI.Sprite(vidTexture);
            videoRatio = videoElement.offsetWidth/videoElement.offsetHeight
            videoSprite.scale.x = -1

            if(window.innerWidth/window.innerHeight < videoRatio){
                videoSprite.width = window.innerHeight*videoRatio;
                videoSprite.height = window.innerHeight;
            }else{
                videoSprite.width = window.innerWidth;
                videoSprite.height = window.innerWidth/videoRatio;
            }

            videoSprite.position.x = videoSprite.width/2
            videoSprite.position.y = videoSprite.height/2
            videoSprite.zIndex = -1;
            videoSprite.alpha = 0.1
            //sprite to canvas
            app.stage.addChild(videoSprite);

            poseNetINIT()

            //stop checking every half second
            clearInterval(b);

        }

    },500);

}
