/*

phaser.js controls the main game scenes

 */

let game;
let gameOptions = {
    startingBalls: 5
}
const width = 1000,
    height = 800

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
    wordWrap: {width: width - 300, useAdvancedWrap: true}
}


const speakStyle = {
    fontFamily: "'Mono-Medium', 'Courier'",
    fontSize: '25px',
    color: 'yellow',
    align: 'center',
    wordWrap: {width: width - 300, useAdvancedWrap: true}
}

window.onload = function () {
    let gameConfig = {
        type: Phaser.AUTO,
        backgroundColor: 0x222222,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "game-container",
            width: width,
            height: height
        },
        scene: [Loading, Intro_1]
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
        let loadingText = this.add.text(width / 2, height / 2, "Loading", {fontSize: '32px', fill: '#FFF'});
        loadingText.setOrigin(0.5, 0.5)
        $(document).on('poseNetReady', function () {
            console.log("received poseNetReady")
            loadingText.setText('Turn your sound on \n Click anywhere to begin ...')

            $(document).on('click', function () {
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
        this.load.image('ball', 'assets/ball.png');
        this.group = this.add.group({key: 'ball'});
        this.load.image('title', 'assets/title.png');
        this.load.image('flares', 'assets/flares.png');
        this.load.audio('ambient', 'assets/crowd-ambient.wav')

    }

    create() {

        if (annyang) {
            console.log("annyang voice recognition enabled")
            // Let's define a command.
            const commands = {
                "lets go": function () {
                    console.log("Let's go")
                    annyang.abort()
                    this.scene.start("Calibrate1")
                }.bind(this)
            }

            annyang.addCommands(commands);
            annyang.start();
        } else {
            console.log("annyang voice recognition not loaded!!")
        }

        this.input.on('pointermove', function (pointer) {
            this.x = pointer.x;
            this.y = pointer.y;
        }, this);

        var music = this.sound.add('ambient', {
            volume: 0.3,
            loop: true,
            mute: false
        });
        music.play();

        var textures = this.textures;
        let title = this.add.image(width / 2, height / 2 - 200, 'title');
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

        var instructions = this.add.text(width / 2, height / 2 + 50,
            "Confident public speaking requires trusting yourself to speak " +
            "up and own the room. \n This game lets you train your instincts for both. \n \n Can you be heard above the crowd?",
            instructionsStyle
        ).setOrigin(0.5)

        var prompt = this.add.text(width / 2, height - 100,
            "Say 'Let's go!' to begin ...",
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
    }

    preload() {
        let instructions = this.add.text(width/2, 50, "Let's calibrate the game. \n Stand 3 feet in front of your computer.",
            instructionsStyle)
        const y = instructions.getBottom()

        let prompt = this.add.text(width/2, y + 40, "Say 'Hi, my name is [your name]. Nice to meet you!" +
            "in your normal speaking voice.", speakStyle)

        if (annyang) {
            console.log("annyang voice recognition enabled")
            // Let's define a command.
            const commands = {
                "my name is": function () {
                    console.log("my name is")
                    annyang.abort()
                    this.calibrateNear()
                    this.calibrateVoice()
                }.bind(this)
            }

            annyang.addCommands(commands);
            annyang.start();
        } else {
            console.log("annyang voice recognition not loaded!!")
        }
    }

    calibrateNear() {

    }

    calibrateVoice() {
       // capture until user stops speaking
        initMic()
       // max = 100%, min = 0%


    }

    create() {
    }

    update(time, delta) {
    }
}

// use create(data){} to receive data from calling scene