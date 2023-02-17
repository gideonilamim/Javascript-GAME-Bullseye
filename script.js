//addEventListener('load' --> when the page loads
window.addEventListener("load", function () {
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");

  //set canvas size
  canvas.width = 1280;
  canvas.height = 720;

  ctx.fillStyle = "white";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "white";

  //object player
  class Player {
    constructor(game) {
      //transform the parameter into a property of this class.
      this.game = game;
      //coordinates for the collision circle
      this.collisionX = this.game.width * 0.5;
      this.collisionY = this.game.height * 0.5;
      this.collisionRadius = 30;

      //speed of the player
      this.distanceX = 0;
      this.distanceY = 0;
      this.speedX = 0;
      this.speedY = 0;
      this.speedModifier = 10;
    }

    //this method will draw the player
    draw(context) {
      //beginPath tells Javascript to begin drawing a new shape
      context.beginPath();
      //arc needs 5 arguments: x, y, radius, start angle(rad), end angle
      context.arc(
        this.collisionX,
        this.collisionY,
        this.collisionRadius,
        0,
        Math.PI * 2
      );
      context.save();
      context.globalAlpha = 0.5;
      context.fill();
      context.restore();
      context.stroke();

      //create a line to show the movement of the player
      context.beginPath();
      context.moveTo(this.collisionX, this.collisionY);
      context.lineTo(this.game.mouse.x, this.game.mouse.y);
      context.stroke();
    }

    //update will cause the player to move
    update() {
      //set the player speed
      this.distanceX = this.game.mouse.x - this.collisionX;
      this.distanceY = this.game.mouse.y - this.collisionY;
      //we have to keep a constant speed
      const distanceXY = Math.hypot(this.distanceX, this.distanceY);
      if (distanceXY > this.speedModifier) {
        this.speedX = this.distanceX / distanceXY || 0;
        this.speedY = this.distanceY / distanceXY || 0;
      } else {
        this.speedX = this.distanceX / this.speedModifier;
        this.speedY = this.distanceY / this.speedModifier;
      }

      //create player movement
      this.collisionX += this.speedX * this.speedModifier;
      this.collisionY += this.speedY * this.speedModifier;
    }
  }

  class Obstacle {
    constructor(game) {
      this.game = game;
      this.collisionX = Math.random() * this.game.width;
      this.collisionY = Math.random() * this.game.width;
      this.collisionRadius = 50;
    }

    draw(context) {
      //beginPath tells Javascript to begin drawing a new shape
      context.beginPath();
      //arc needs 5 arguments: x, y, radius, start angle(rad), end angle
      context.arc(
        this.collisionX,
        this.collisionY,
        this.collisionRadius,
        0,
        Math.PI * 2
      );
      context.save();
      context.globalAlpha = 0.5;
      context.fill();
      context.restore();
      context.stroke();
    }
  }

  //the class Game will handle all the game logics
  class Game {
    constructor(canvas) {
      //let's convert canvas into a class property
      this.canvas = canvas;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      //create a player automatically when we create a game
      this.player = new Player(this);
      this.numberOfObstacles = 5;
      this.obstacles = [];
      this.mouse = {
        x: this.width * 0.5,
        y: this.height * 0.5,
        pressed: false,
      };

      //event listeners
      canvas.addEventListener("mousedown", (e) => {
        this.mouse.x = e.offsetX;
        this.mouse.y = e.offsetY;
        this.mouse.pressed = true;
      });
      canvas.addEventListener("mouseup", (e) => {
        this.mouse.x = e.offsetX;
        this.mouse.y = e.offsetY;
        this.mouse.pressed = false;
      });
      canvas.addEventListener("mousemove", (e) => {
        if (this.mouse.pressed) {
          this.mouse.x = e.offsetX;
          this.mouse.y = e.offsetY;
        }
      });
    }

    //the Render method will draw the player
    render(context) {
      //this method will be called over and over again by animate.
      this.player.draw(context);
      this.player.update();
      this.obstacles.forEach((obstacle) => obstacle.draw(context));
    }

    init() {
      //populae the array of obstacles
      for (let i = 0; i < this.numberOfObstacles; i++) {
        //push inserts a new item to the array
        this.obstacles.push(new Obstacle(this));
      }
    }
  }

  //instantiate the Game class
  const game = new Game(canvas);
  game.init();
  console.log(game);

  // we need a loop to animate our game
  function animate() {
    /*comment - cleaRect
    The CanvasRenderingContext2D.clearRect() method of the Canvas 2D API 
    erases the pixels in a rectangular area by setting them to transparent black. 

    Note: Be aware that clearRect() may cause unintended side effects 
    if you're not using paths properly. Make sure to call beginPath() 
    before starting to draw new items after calling clearRect(). 

    Syntax

    clearRect(x, y, width, height)

    (x, y, width, height) to create a rectangle
    */
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.render(ctx);
    /*Comment - requestAnimationFrame
    requestAnimationFrame(function)  this method will tell the browser to repeat the function to create an animation.
    here, it's reapeating the parent function*/
    window.requestAnimationFrame(animate);
  }

  //call animate to start the animation
  animate();
});
