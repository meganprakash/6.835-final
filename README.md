# Take Up Space!
By Megan Prakash

6.835 Intelligent Multimodal User Interfaces (Spring 2021)

## How to play
Please go to https://meganprakash.github.io/6.835-final/ to play the game. It requires webcam and microphone access, as well as an approximately 8' x 8' space in front of your computer to move around in. It has been tested in Google Chrome on a Mac, which causes the game to use Google Chrome's native speech recognition. It has not been tested in other environments.

## Contents
* **assets/**: Fonts and audio tracks used in the game.
* **js/**: My code for the game.
  * **calibration.js**: Stores the data collected in the game calibration phase. Contains methods for getting user's *normalized* position and volume during gameplay.
  * **phaser.js**: Contains the primary gameplay logic. It uses the game framework [Phaser](https://phaser.io) for drawing the game and progressing through the scenes. When relevant, it listens for user input events emitted by poses.js.
  * **poses.js**: Connects to the computer's webcam and microphone. Continually processes webcam input with PoseNet using [ml5.js](https://github.com/ml5js/ml5-library), emitting "newPose" events on each new pose detected. Additionally, continually processes mic input and emits "newSound" events when there is valid mic input.
  * *gameplay.js: deprecated from when I used fabric.js as the frontend.*
  * *mic.js: deprecated*
* **index.html**: Entry point for game site, published to https://meganprakash.github.io/6.835-final/
