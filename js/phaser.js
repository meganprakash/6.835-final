/*

phaser.js controls the main game scenes

 */

let game;
let gameOptions = {
    startingBalls: 5
}
window.onload = function() {
    let gameConfig = {
        type: Phaser.AUTO,
        backgroundColor:0x222222,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "game-container",
            width: 1200,
            height: 800
        },
        scene: Example
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
}

class Example extends Phaser.Scene
{
    constructor ()
    {
        super();
        this.move = 0;
        this.x = 0;
        this.y = 0;
    }

    preload ()
    {
        this.load.image('ball', 'assets/ball.png');
    }

    create ()
    {

        this.group = this.add.group({ key: 'ball'});

        this.input.on('pointermove', function (pointer) {
            this.x = pointer.x;
            this.y = pointer.y;
        }, this);
    }

    update (time, delta)
    {
            Phaser.Actions.ShiftPosition(this.group.getChildren(), this.x, this.y);
    }
}
