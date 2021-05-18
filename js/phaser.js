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
    fontSize: '18px',
    color: 'white',
    align: 'center',
    originY: 0
}

const instructionsStyle = {
    fontFamily: "'Mono-Regular', 'Courier'",
    fontSize: '28px',
    color: 'white',
    align: 'center',
    wordWrap: {width: gameWidth - 300, useAdvancedWrap: true}
}


const speakStyle = {
    fontFamily: "'Mono-Medium', 'Courier'",
    fontSize: '32px',
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
        scene: [Loading, Intro_1, Calibration1, Calibration2, GameIntro, GamePlay, EndGame]
    }
    game = new Phaser.Game(gameConfig);
}

/*
Loading scene
 */
class Loading extends Phaser.Scene {
    constructor() {
        super("Loading");
        this.poseNetReady = false;
    }

    preload() {
        console.log("preloading Loading scene")
    }

    create() {
        this.loadingText = this.add.text(gameWidth / 2, gameHeight / 2, "Loading", {fontSize: '32px', fill: '#FFF'});
        this.loadingText.setOrigin(0.5, 0.5)

        $(document).on('poseNetReady', function ready() {
            console.log("received poseNetReady")
            $(document).off('poseNetReady')
            this.loadingText.setText('Turn your sound on \n Click anywhere to begin ...')

            $(document).on('click', function clicked() {
                $(document).off("click")
                this.scene.start("Intro_1")
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
        this.load.image('title', 'assets/title.png');
        this.load.image('flares', 'assets/flares.png');
        this.load.audio('ambient', 'assets/crowd-ambient.wav')

        $(document).on('click', function clicked() {
            $(document).off("click")
            this.scene.start("Calibration1")
        }.bind(this));

    }

    create() {

        this.music = this.sound.add('ambient', {
            loop: true,
            mute: false
        });
        this.music.setVolume(0.05)
        this.music.play();

        if (annyang) {
            console.log("annyang voice recognition enabled")
            // Let's define a command.
            const commands = {
                "start the game": function () {
                    this.music.stop()
                    annyang.abort()
                    annyang.getSpeechRecognizer().abort()
                    initMic()

                    this.scene.start("Calibration1")
                }.bind(this)
            }

            annyang.addCommands(commands);
            annyang.debug(true)
            annyang.start();
        } else {
            console.log("annyang voice recognition not loaded!!")
        }

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
            "up and own the room. \n This game lets you train your instincts for both. \n - \n Can you be heard above the crowd?",
            instructionsStyle
        ).setOrigin(0.5)

        var prompt = this.add.text(gameWidth / 2, gameHeight - 100,
            "Say 'Start the game' to begin ...",
            speakStyle
        ).setOrigin(0.5)
    }

    update(time, delta) {
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
        this.calibrationDone = false
        this.widthHistory = []
        this.startTime = new Date()
        this.waitTime = 3 // waiting for user to speak more
        this.waitingPos = 30

        this.newPoseCallback = () => {
            if (this.calibratingPose && distanceBetweenShoulders && waitingPos >= 0) {
                this.waitingPos -= 1
                this.widthHistory.push(distanceBetweenShoulders)
                console.log("len widthHistory near: " + this.widthHistory.length)
            }
        }

        this.newSoundCallback = (e) => {
            if(!this.calibratingSound) {return}
            if(e.detail.vol > maxVol) { maxVol = e.detail.vol }
            if(e.detail.vol < minVol) { minVol = e.detail.vol }
        }

    }

    preload() {

        this.load.audio('boop', 'assets/boop.wav')
        console.log("preload Calibration1")
        let instructions = this.add.text(gameWidth / 2, gameHeight/2 - 50, "Let's calibrate the game. \n Stand 3 feet in front of your computer.",
            instructionsStyle).setOrigin(0.5)

        let prompt = this.add.text(gameWidth / 2, gameHeight - 150, "Say 'Hi, my name is [your name],' " +
            " in your normal speaking voice.", speakStyle).setOrigin(0.5)

        if (annyang) {
            console.log("annyang voice recognition enabled")
            const commands = {
                "hi my name is :name": function () {
                    annyang.abort()
                    console.log("Hi!")
                    // this.calibratingSound = true
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

        this.boop = this.sound.add('boop', {
            mute: false
        });
        this.boop.setVolume(0.5)

        minVol = 20
        maxVol = 70
        micVol_positive = 30
        this.startTime = new Date()

        document.addEventListener("newPose", this.newPoseCallback)
        document.addEventListener("newSound", this.newSoundCallback)
    }


    update(time, delta) {

        updateMicDebug()
        // check if voice countdown done
        if (this.calibratingSound) {
            let currentTime = new Date()
            let diff = (currentTime - this.startTime) / 1000
            console.log("diff: " + diff)
            if (diff >= this.waitTime) {
                console.log("calibrateVoice: setting volume threshold after waiting")
                micHistory = []
                waitingMic = 0
                this.calibratingSound = false
                document.removeEventListener("newSound", this.newSoundCallback)
            }
        }
        if (this.calibratingPose && this.waitingPos <= 0) {
            console.log("setting near distance")
            calibrateShoulderDepth(this.widthHistory, "near")
            document.removeEventListener("newPose", this.newPoseCallback)
            this.calibratingPose = false
            this.calibrationDone = true
        }

        if (!this.calibratingSound && !this.calibratingPose && this.waitingPos <= 0) {
            this.boop.play()
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
            if (this.calibratingPose && distanceBetweenShoulders && this.waitingPos >= 0) {
                this.waitingPos -= 1
                console.log("far calibration waitingPos = " + this.waitingPos)
                this.widthHistory.push(distanceBetweenShoulders)
            }
        }
    }

    preload() {

        this.load.audio('boop', 'assets/boop.wav')
        let instructions = this.add.text(gameWidth / 2, gameHeight/2 - 50, "Awesome! Now, please take 5 steps back.",
            instructionsStyle).setOrigin(0.5)

        let prompt = this.add.text(gameWidth / 2, gameHeight-100,
            "Say 'Hey! I'm over here!'", speakStyle).setOrigin(0.5)


        if (annyang) {
            console.log("annyang voice recognition enabled")
            const commands = {
                "hey I'm over here": function () {
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
        this.boop = this.sound.add('boop', {
            mute: false
        });
        this.boop.setVolume(0.5)
        document.addEventListener("newPose", this.newPoseCallback)
    }

    update() {
        if (this.calibratingPose && this.waitingPos <= 0) {
            console.log("setting far distance")
            calibrateShoulderDepth(this.widthHistory, "far")
            document.removeEventListener("newPose", this.newPoseCallback)
            this.calibratingPose = false
            this.boop.play()
            this.scene.start("GameIntro")
        }
    }
}

// Draw cursor demo. The vals are global in poses.js and are retrieved by methods in gameplay.js
class GameIntro extends Phaser.Scene {
    constructor() {
        super("GameIntro");
        // cursor vals
        this.x = 0;
        this.y = 0;
        this.vol = 0;
        this.cursorSize = 30 // px
    }

    preload() {

        this.load.audio('boop', 'assets/boop.wav')

        this.boop = this.sound.add('boop', {
            mute: false
        });
        this.boop.setVolume(0.5)
        let instructions = this.add.text(gameWidth / 2, gameHeight/2 - 100, "Hey, it's you! It's time to walk and talk. When the targets" +
            " appear, match your cursor to the target and say the prompt word.",
            instructionsStyle).setOrigin(0.5)

        let prompt = this.add.text(gameWidth / 2, gameHeight-100,
            "Say 'I'm ready to play!' to begin.", speakStyle).setOrigin(0.5)

        if (annyang) {
            console.log("annyang voice recognition enabled")
            const commands = {
                "I'm ready to play": function () {
                    annyang.abort()
                    this.boop.play()
                    this.scene.start("GamePlay")
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
        const cursorVals = getCursorVals()
        console.log("cursorVals: " + JSON.stringify(cursorVals))
        this.volCursor.setPosition(cursorVals[0], cursorVals[1])
        this.volCursor.setScale(cursorVals[2]+1)
        this.posCursor.setPosition(cursorVals[0], cursorVals[1])
    }
}

// Draw cursor demo. The vals are global in poses.js and are retrieved by methods in gameplay.js
class GamePlay extends Phaser.Scene {
    constructor() {
        super("GamePlay");
        // cursor vals
        this.x = 0;
        this.y = 0;
        this.v = 0;
        this.cursorSize = 30 // px

        this.xc = 0;
        this.yc = 0;
        this.vc = 0;
        this.word = "hello";

        this.score = 0

        this.posChallenge = false;
        this.volChallenge = false;

    }

    preload() {
        this.load.audio('boop', 'assets/boop.wav')

        this.boop = this.sound.add('boop', {
            mute: false
        });
        this.boop.setVolume(0.5)

        let instructions = this.add.text(gameWidth / 2, gameHeight - 100, "Match your cursor to the targets and say " +
            " the prompt word.",
            instructionsStyle).setOrigin(0.5)
    }

    create() {
        // timer

        // this.initialTime = 60;
        // this.timerText = this.add.text(32, 32, 'Countdown: ' + this.formatTime((this.initialTime)));
        // // Each 1000 ms call onEvent
        // this.timedEvent = this.time.addEvent(
        //     { delay: 1000, callback: onTick, callbackScope: this});


        // create ya cursor
        this.volCursor = this.add.circle(gameWidth/2, gameHeight/2, this.cursorSize, 0xefc53f);
        this.posCursor = this.add.circle(gameWidth/2, gameHeight/2, this.cursorSize, 0x6666ff);

        this.posTarget = this.add.circle(600, 200, this.cursorSize*3);
        this.posTarget.setStrokeStyle(4, 0xc496ff);
        this.volTarget = this.add.circle(600, 200, this.cursorSize*2.5);
        this.volTarget.setStrokeStyle(4, 0xc6eb34);

        this.textc = this.add.text(gameWidth / 2, gameHeight / 2, "wordifer", speakStyle).setOrigin(1, 0.5)
        this.textc.alpha = 0
    }

    update() {
        // draw ya cursor
        const cursorVals = getCursorVals()
        this.x = cursorVals[0]
        this.y = cursorVals[1]
        this.v = cursorVals[2]
        // console.log("cursorVals: " + JSON.stringify(cursorVals))
        this.volCursor.setPosition(this.x, this.y)
        this.volCursor.setScale(this.v+1)
        this.posCursor.setPosition(this.x, this.y)

        this.checkChallenge() // draws if we need a new one
    }

    drawChallenge() {
        this.xc = Math.min(Math.random() * (gameWidth-200) + 200)
        this.yc = Math.random() * (gameHeight-160) + 80
        this.vc = Math.max(0.5, Math.random())
        this.word = "hello"
        this.textc.setText(this.word)
        this.textc.setPosition(this.xc+20, this.yc+20)
        this.textc.alpha = 1

        this.posChallenge = true
        this.volChallenge = true
        this.posTarget.setPosition(this.xc, this.yc)
        this.volTarget.setPosition(this.xc, this.yc)
        this.volTarget.setScale(this.vc)
        this.posTarget.alpha = 1
    }

    checkChallenge() {
        console.log("diff: " + (this.xc - this.x) + ", " + (this.yc - this.y))
        if (Math.abs(this.xc - this.x) < 50 && Math.abs(this.yc - this.y) < 50) {
            this.posChallenge = false
            this.posTarget.alpha = 0
        }

        if(this.posChallenge === false) {
            this.volTarget.setPosition(this.x, this.y)

            if(Math.abs(this.vc - this.v) < 0.1) {
                this.vc = Infinity
                this.volChallenge = false
                this.score += 1
                this.boop.play()
                this.drawChallenge()

            }
        }
    }

     formatTime(seconds){
        // Minutes
        var minutes = Math.floor(seconds/60);
        // Seconds
        var partInSeconds = seconds%60;
        // Adds left zeros to seconds
        partInSeconds = partInSeconds.toString().padStart(2,'0');
        // Returns formated time
        return `${minutes}:${partInSeconds}`;
    }


     onTick()
    {
        this.initialTime -= 1; // One second
        this.timerText.setText('Score: ' + score + '\n Countdown: ' + formatTime(this.initialTime));
        if (this.initialTime <= 0) {
           this.scene.start("EndGame")
        }
    }
}

class EndGame extends Phaser.Scene {
    constructor() {
        super("EndGame");
    }

    preload() {
        this.load.image('flares', 'assets/flares.png');
        this.load.audio('ambient', 'assets/applause.wav')

    }

    create() {
        this.music = this.sound.add('ambient', {
            loop: true,
            mute: false
        });
        this.music.setVolume(0.05)
        this.music.play();

        var instructions = this.add.text(gameWidth / 2, gameHeight / 2 + 50,
            "Speaking up isn't easy, but you did it", instructionsStyle
        ).setOrigin(0.5)

        var prompt = this.add.text(gameWidth / 2, gameHeight - 100,
            this.score + " times. \n Great work!",
            speakStyle
        ).setOrigin(0.5)
    }
    update(time, delta) {
    }

}