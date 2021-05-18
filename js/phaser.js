/*

phaser.js controls the main game scenes

 */

let game;
let gameOptions = {
    startingBalls: 5
}
const gameWidth = 1000,
    gameHeight = 800

const textStyle = {
    fontFamily: "'Mono-Regular', 'Courier'",
    fontSize: '14px',
    color: 'white',
    align: 'center',
    originY: 0
}

const instructionsStyle = {
    fontFamily: "'Mono-Regular', 'Courier'",
    fontSize: '25px',
    color: 'white',
    align: 'center',
    wordWrap: {width: gameWidth - 300, useAdvancedWrap: true}
}


const speakStyle = {
    fontFamily: "'Mono-Medium', 'Courier'",
    fontSize: '25px',
    color: 'yellow',
    align: 'center',
    wordWrap: {width: gameWidth - 300, useAdvancedWrap: true}
}

window.onload = function () {
    let gameConfig = {
        type: Phaser.AUTO,
        backgroundColor: 0x222222,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "game-container",
            width: gameWidth,
            height: gameHeight
        },
        scene: [Loading, Intro_1, Calibration1, Calibration2]
    }
    game = new Phaser.Game(gameConfig);
}

/*
Loading scene
 */
class Loading extends Phaser.Scene {
    constructor() {
        super("Loading");
    }

    preload() {
        console.log("preloading Loading scene")
    }

    create() {
        let loadingText = this.add.text(gameWidth / 2, gameHeight / 2, "Loading", {fontSize: '32px', fill: '#FFF'});
        loadingText.setOrigin(0.5, 0.5)
        $(document).on('poseNetReady', function () {
            console.log("received poseNetReady")
            loadingText.setText('Turn your sound on \n Click anywhere to begin ...')

            $(document).on('click', function () {
                this.scene.start("Intro_1")
                $(document).removeEventListener('click')
            }.bind(this));

        }.bind(this));

    }

    update(time, delta) {
    }
}

/*
(ambient crowd noise)

TAKE UP SPACE!
Confident public speaking requires trusting yourself
to speak up and own the room. This game lets you train your instincts for both.

Say "okay!" to continue...

 */
class Intro_1 extends Phaser.Scene {
    constructor() {
        super("Intro_1");
    }

    preload() {
        this.load.image('ball', 'assets/ball.png');
        this.group = this.add.group({key: 'ball'});
        this.load.image('title', 'assets/title.png');
        this.load.image('flares', 'assets/flares.png');
        this.load.audio('ambient', 'assets/crowd-ambient.wav')

        this.music = this.sound.add('ambient', {
            volume: 0.3,
            loop: true,
            mute: false
        });
        this.music.play();

    }

    create() {

        if (annyang) {
            console.log("annyang voice recognition enabled")
            // Let's define a command.
            const commands = {
                "game": function () {
                    annyang.abort()
                    this.music.stopAll()
                    this.scene.start("Calibrate1")
                }.bind(this)
            }

            annyang.addCommands(commands);
            annyang.debug(true)
            annyang.start();
        } else {
            console.log("annyang voice recognition not loaded!!")
        }

        this.input.on('pointermove', function (pointer) {
            this.x = pointer.x;
            this.y = pointer.y;
        }, this);


        var textures = this.textures;
        let title = this.add.image(gameWidth / 2, gameHeight / 2 - 200, 'title');
        title.displayWidth = game.config.width * .5;
        title.scaleY = title.scaleX

        var origin = title.getTopLeft();
        var titleSource = {
            getRandomPoint: function (vec) {
                do {
                    var x = Phaser.Math.Between(0, title.displayWidth - 1);
                    var y = Phaser.Math.Between(0, title.displayHeight - 1);
                    var pixel = textures.getPixel(x, y, 'title');
                } while (pixel.alpha < 255);

                return vec.setTo(x + origin.x, y + origin.y);
            }
        };

        var particles = this.add.particles('flares');

        particles.createEmitter({
            x: 0,
            y: 0,
            lifespan: 1000,
            gravityY: 10,
            scale: {start: 0, end: 0.25, ease: 'Quad.easeOut'},
            alpha: {start: 1, end: 0, ease: 'Quad.easeIn'},
            blendMode: 'ADD',
            emitZone: {type: 'random', source: titleSource}
        });

        var instructions = this.add.text(gameWidth / 2, gameHeight / 2 + 50,
            "Confident public speaking requires trusting yourself to speak " +
            "up and own the room. \n This game lets you train your instincts for both. \n \n Can you be heard above the crowd?",
            instructionsStyle
        ).setOrigin(0.5)

        var prompt = this.add.text(gameWidth / 2, gameHeight - 100,
            "Say 'Start the game' to begin ...",
            speakStyle
        ).setOrigin(0.5)
    }

    update(time, delta) {
        Phaser.Actions.ShiftPosition(this.group.getChildren(), this.x, this.y);
    }

}

/*
Calibration1 scene
 */
class Calibration1 extends Phaser.Scene {

    constructor() {
        super("Calibration1");
        this.calibratingPose = false
        this.calibratingSound = false
        this.widthHistory = []
        this.startTime = new Date()
        this.waitTime = 2500 // waiting for user to speak more
        this.waitingPos = 30

        this.newPoseCallback = () => {
            if (this.calibratingPose && distanceBetweenShoulders) {
                this.waitingPos -= 1
                this.widthHistory.push(distanceBetweenShoulders)
            }
        }

        this.newSoundCallback = (e) => {
            if(!this.calibratingSound) {return}
            if(e.detail.vol > maxVol) { maxVol = e.detail.vol }
            if(e.detail.vol < minVol) { minVol = e.detail.vol }
        }
    }

    preload() {
        console.log("preload Calibration1")
        let instructions = this.add.text(gameWidth / 2, 50, "Let's calibrate the game. \n Stand 3 feet in front of your computer.",
            instructionsStyle)
        const y = instructions.getBottom()

        let prompt = this.add.text(gameWidth / 2, y + 40, "Say 'Hi, my name is [your name]. Nice to meet you!" +
            "in your normal speaking voice.", speakStyle)

        if (annyang) {
            console.log("annyang voice recognition enabled")
            const commands = {
                "my name is": function () {
                    alert("my name is")
                    annyang.abort()
                    initMic()
                    this.calibratingSound = true
                    this.calibratingPose = true
                }.bind(this)
            }

            annyang.addCommands(commands);
            annyang.start();
        } else {
            console.log("annyang voice recognition not loaded!!")
        }
    }

    // Listen for new pose and new sound events. update() checks if conditions met
    create() {
        annyang.trigger("my name is")

        minVol = Infinity
        maxVol = -Infinity
        this.startTime = new Date()

        document.addEventListener("newPose", this.newPoseCallback)
        document.addEventListener("newSound", this.newSoundCallback)
    }


    update(time, delta) {
        // check if voice countdown done
        if (this.calibratingSound) {
            let currentTime = new Date()
            let diff = (this.startTime - currentTime) / 1000
            if (diff >= this.waitTime) {
                console.log("calibrateVoice: setting volume threshold after waiting")
                micHistory = []
                waitingMic = 0
                this.calibratingSound = false
                updateMicDebug()
                document.removeEventListener("newSound", this.newSoundCallback)
            }
        }
        if (this.calibratingPose && this.waitingPos <= 0) {
            console.log("setting near distance")
            calibrateShoulderDepth(widthHistory, "near")
            document.removeEventListener("newPose", this.newPoseCallback)
            this.calibratingPose = false
        }

        if (!this.calibratingSound && !this.calibratingPose) {
            this.scene.start("Calibration2")
        }

    }
}

// on "I'm ready to start!" get shoulder width then next scene
class Calibration2 extends Phaser.Scene {
    constructor() {
        super("Calibration2");

        this.widthHistory = []
        this.waitingPos = 30
        this.calibratingPose = false

        this.newPoseCallback = () => {
            if (this.calibratingPose && distanceBetweenShoulders) {
                this.waitingPos -= 1
                console.log("far calibration waitingPos = " + this.waitingPos)
                this.widthHistory.push(distanceBetweenShoulders)
            }
        }
    }

    preload() {
        let instructions = this.add.text(gameWidth / 2, 50, "Awesome! Now, please take 3 steps back.",
            instructionsStyle)
        const y = instructions.getBottom()

        let prompt = this.add.text(gameWidth / 2, y + 40, "Say 'Hey! I'm over here!'", speakStyle)


        if (annyang) {
            console.log("annyang voice recognition enabled")
            const commands = {
                "over": function () {
                    alert("over")
                    annyang.abort()
                    this.calibratingPose = true
                }.bind(this)
            }
            annyang.addCommands(commands);
            annyang.start();
        } else {
            console.log("annyang voice recognition not loaded!!")
        }
    }

    create() {
        annyang.trigger("over")
        document.addEventListener("newPose", this.newPoseCallback)
    }

    update() {
        if (this.calibratingPose && this.waitingPos <= 0) {
            console.log("setting far distance")
            calibrateShoulderDepth(widthHistory, "far")
            document.removeEventListener("newPose", this.newPoseCallback)
            this.calibratingPose = false
            this.scene.start("GameIntro")
        }
    }
}

class GameIntro extends Phaser.Scene {
    constructor() {
        super("GameIntro");
        endCalibration()

        // cursor vals
        this.x = 0;
        this.y = 0;
        this.vol = 0;
        this.cursorSize = 45 // px

        this.newPoseCallback = () => {
            // change this.x and this.y
        }
        this.newSoundCallback = () => {
            // change this.vol
        }
    }

    preload() {
        document.addEventListener("newPose", this.newPoseCallback)
        document.addEventListener("newSound", this.newSoundCallback)

        let instructions = this.add.text(gameWidth / 2, 50, "Hey, it's you! It's time to walk and talk. When the targets" +
            "appear, match your cursor to the target and say the prompt word.",
            instructionsStyle)
        const y = instructions.getBottom()

        let prompt = this.add.text(gameWidth / 2, y + 40, "Say 'I'm ready to play!' to begin.", speakStyle)

        if (annyang) {
            console.log("annyang voice recognition enabled")
            const commands = {
                "ready": function () {
                    alert("ready")
                    annyang.abort()
                    initMic()
                    // TODO start game scene
                }.bind(this)
            }
            annyang.addCommands(commands);
            annyang.start();
        } else {
            console.log("annyang voice recognition not loaded!!")
        }
    }

    create() {
        // create ya cursor
        this.volCursor = this.add.circle(gameWidth/2, gameHeight/2, this.cursorSize, 0xefc53f);
        this.posCursor = this.add.circle(gameWidth/2, gameHeight/2, this.cursorSize, 0x6666ff);

    }

    update() {
        // draw ya cursor


    }


}