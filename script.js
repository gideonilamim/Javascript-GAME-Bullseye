//addEventListener('load' --> when the page loads
window.addEventListener("load", function () {
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");

  //FPS correction
  const fps = 120;
  let timer = 0;
  const interval = 1000 / fps; //1000 milliseconds divided by 20 fps

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
      this.collisionX = this.game.width * 0.5; //initial position
      this.collisionY = this.game.height * 0.5; //initial position
      this.collisionRadius = 30;

      //player's movement upper limit
      this.upperLimit = 270;

      //speed of the player
      this.distanceX = 0;
      this.distanceY = 0;
      this.speedX = 0;
      this.speedY = 0;
      this.speedModifier = 5;

      //spriteSheet
      this.image = document.getElementById("bull");
      this.image.style.zIndex = "990";
      this.spriteWidth = 255;
      this.spriteHeight = 256;
      this.spriteSheetWidth = this.image.naturalWidth; // size of the entire sprite sheet X
      this.spriteSheetHeight = this.image.naturalHeight; // size of the entire sprite sheet Y
      this.columns = this.spriteSheetWidth / this.spriteWidth;
      this.rows = this.spriteSheetHeight / this.spriteHeight;
      //animate the player sprite sheet
      this.column = 0;
      //image crop selector
      this.cropAtX = this.column * this.spriteWidth;
      this.cropAtY = 0;
      //image position
      this.spriteX;
      this.spriteY;
      this.negative = false;
      this.angleOfTravel = 180;
    }

    //this method will draw the player
    draw(context) {
      /*drawImage needs at least 3 arguments: the image, the x coordinate and the y coordinate
      we can also add the width and the height

      to crop the image to get only the obstacle we need, we need to add 4 arguments:
        the start x and y
        the end x and y


      drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      
      https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
      */
      //image position

      context.drawImage(
        this.image,
        this.cropAtX,
        this.cropAtY,
        this.spriteWidth,
        this.spriteHeight,
        this.spriteX,
        this.spriteY,
        this.spriteWidth,
        this.spriteHeight
      );

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

    spriteSheetCropper() {
      //finding the angle
      const distanceX = this.game.mouse.x - this.collisionX;
      const distanceY = this.game.mouse.y - this.collisionY;
      const distanceXY = Math.hypot(distanceX, distanceY);
      /* to find the angle we need a little bit of calculations
      
      S=O/H C=A/H T=O/A
      the tangent is the relationship between the adjacent and the opposite sides of the triangle
      the inverse tangent will give us the angle in radians

      https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan
      */

      const sin = distanceX / distanceXY;
      const cos = distanceY / distanceXY;
      if (distanceXY) {
        //sin greater than zero = angle between 0 180
        if (sin < 0) {
          this.angleOfTravel = Math.acos(cos) + Math.PI;
        } else {
          this.angleOfTravel = Math.acos(cos * -1);
        }
      }

      //choose direction
      const row = Math.floor((this.angleOfTravel * 9) / (2 * Math.PI));
      this.cropAtY = row < 8 ? this.spriteHeight * row : 0;

      //animate the image along its X axis
      if (this.column > this.columns - 2) {
        this.negative = true;
      } else if (this.column <= 0) {
        this.negative = false;
      }
      if (this.negative) {
        this.column--;
      } else {
        this.column++;
      }
      this.cropAtX = this.column * 255;
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

      this.collisionX += this.speedX * this.speedModifier;

      if (this.collisionY > this.upperLimit || this.speedY > 0) {
        this.collisionY += this.speedY * this.speedModifier;
      }

      //sprite sheet animation
      this.spriteSheetCropper();

      //sprite image position relative to the player
      this.spriteX = this.collisionX - 0.5 * this.spriteWidth;
      this.spriteY = this.collisionY - this.spriteWidth + this.collisionRadius;

      //as the player moves, we need to check for collision with the obstacles
      this.game.obstacles.forEach((obstacle) => {
        //let's use object deestructuring to get the values from  checkCollision()
        /*basically here, I'm asking javascript to create 5 variables
        
          const obj = { a: 1, b: 2 };
          const { a, b } = obj;

           is equivalent to:
           const a = obj.a;
           const b = obj.b;
        */
        let { collision, sumOfRadii, distanceXY, distanceX, distanceY } =
          this.game.checkCollision(this, obstacle);

        if (collision) {
          /*to avoid the player to move into the obstacle, 
          the player will be always pushed away from the obstacle by 1 pixel

          collisionX and collisionY are the players coordinates at X and Y

          unit_x will cause to move the player left or right whether it's negative or positive
          unit_y will cause to move the player up or down whether it's negative or positive

          sumOfRadii makes sure the player and obstacle don't overlap
        
          */
          const unit_x = distanceX / distanceXY;
          const unit_y = distanceY / distanceXY;
          this.collisionX = obstacle.collisionX + (sumOfRadii + 1) * unit_x;
          this.collisionY = obstacle.collisionY + (sumOfRadii + 1) * unit_y;
        }
      });
    }
  }

  class Obstacle {
    constructor(game) {
      this.game = game;
      this.collisionRadius = 40;

      //obstacle frame inside the canvas
      this.frameXstart = this.collisionRadius;
      this.frameYstart = 300; //top margin
      this.frameXend = this.game.width - this.frameXstart * 2;
      this.frameYend =
        this.game.height - this.frameYstart - this.collisionRadius;

      //collision circle random coordinates inside the obstacle rendering frame
      this.collisionX = this.frameXstart + Math.random() * this.frameXend;
      this.collisionY = this.frameYstart + Math.random() * this.frameYend;

      //spriteSheet
      this.image = document.getElementById("obstacles");
      this.image.style.zIndex = "-100";

      this.spriteWidth = 250;
      this.spriteHeight = 250;
      this.spriteSheetWidth = this.image.naturalWidth;
      this.spriteSheetHeight = this.image.naturalHeight;
      this.columns = this.spriteSheetWidth / this.spriteWidth;
      this.rows = this.spriteSheetHeight / this.spriteHeight;

      //random sprite sheet obstacle
      /*the obstacle sprite sheet contains 12 different obstacles. 
        4 X 3
        but I can also add more obstacle types
      we need to randomly pick one of them each time we render an obstacle.
      */

      this.cropAtX = Math.floor(Math.random() * this.columns) * 250;
      this.cropAtY = Math.floor(Math.random() * this.rows) * 250;
      this.spriteX = this.collisionX - 0.5 * this.spriteWidth;
      this.spriteY = this.collisionY - this.spriteWidth + this.collisionRadius;

      this.obstacleType = this.obstacleType();
    }

    draw(context) {
      /*drawImage needs at least 3 arguments: the image, the x coordinate and the y coordinate
      we can also add the width and the height

      to crop the image to get only the obstacle we need, we need to add 4 arguments:
        the start x and y
        the end x and y


      drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      
      https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
      */
      context.drawImage(
        this.image,
        this.cropAtX,
        this.cropAtY,
        this.spriteWidth,
        this.spriteHeight,
        this.spriteX,
        this.spriteY,
        this.spriteWidth,
        this.spriteHeight
      );
      this.game.drawCollisionCircle(this, context);
    }

    obstacleType() {
      //this method returns which type of obstacle it is
      const column = this.cropAtX / this.spriteWidth + 1;
      const row = this.cropAtY / this.spriteHeight;
      const obstacleType = row * 4 + column;

      return obstacleType;
    }

    update() {}
  }

  class Egg {
    constructor(game) {
      this.game = game;
      this.collisionRadius = 45;

      //frame inside the canvas
      this.frameXstart = this.collisionRadius;
      this.frameYstart = 300; //top margin for the eggs
      this.frameXend = this.game.width - this.collisionRadius;
      this.frameYend =
        this.game.height - this.frameYstart - this.collisionRadius;

      //collision circle random coordinates inside the obstacle rendering frame
      this.collisionX = this.frameXstart + Math.random() * this.frameXend;
      this.collisionY = this.frameYstart + Math.random() * this.frameYend;

      //Egg image and position
      this.image = document.getElementById("egg");
      this.spriteWidth = this.image.naturalWidth;
      this.spriteHeight = this.image.naturalHeight;
      this.spriteX = this.collisionX - this.spriteWidth * 0.5;
      this.spriteY = this.collisionY - this.spriteHeight + this.collisionRadius;
    }

    draw(context) {
      // update the position
      this.spriteX = this.collisionX - this.spriteWidth * 0.5;
      this.spriteY = this.collisionY - this.spriteHeight + this.collisionRadius;
      //draw image
      context.drawImage(this.image, this.spriteX, this.spriteY);
      this.game.drawCollisionCircle(this, context);
    }

    update() {
      //to help us, we will create an array to contain all the objects that the egg may collide with.
      // the spread operator (...) will help us to do that
      let collisionObjects = [
        this.game.player,
        ...this.game.eggs,
        ...this.game.obstacles,
        ...this.game.enemies,
      ];
      collisionObjects.forEach((object) => {
        let { collision, sumOfRadii, distanceXY, distanceX, distanceY } =
          this.game.checkCollision(object, this);
        if (collision && object !== this) {
          const unit_x = distanceX / distanceXY;
          const unit_y = distanceY / distanceXY;
          if (
            this.collisionX > this.collisionRadius &&
            this.collisionX < this.frameXend
          ) {
            this.collisionX = object.collisionX - (sumOfRadii + 1) * unit_x;
          }
          if (
            this.collisionY > this.frameYstart &&
            this.collisionY < this.game.height
          ) {
            this.collisionY = object.collisionY - (sumOfRadii + 1) * unit_y;
          }
        }
      });
    }
  }

  class Enemy {
    constructor(game) {
      this.game = game;
      this.collisionRadius = 45;

      //frame inside the canvas
      this.frameXstart = this.collisionRadius;
      this.frameYstart = 300; //top margin for the enemies
      this.frameXend = this.game.width - this.collisionRadius;
      this.frameYend =
        this.game.height - this.frameYstart - this.collisionRadius;

      //collision circle random coordinates inside the obstacle rendering frame
      this.collisionX = this.game.width + 100;
      this.collisionY = this.frameYstart + Math.random() * this.frameYend;

      //target position - where the have to go to
      this.targetX = -2 * this.collisionRadius;
      this.targetY = this.frameYstart + Math.random() * this.frameYend;
      this.speedModifier = this.game.enemySpeed;

      //enemies sprite sheet
      this.image = document.getElementById("toads");
      this.numberOfSprites = 4;
      this.spriteHeight = this.image.naturalHeight / this.numberOfSprites;
      this.spriteWidth = this.image.naturalWidth;
      this.cropAt =
        this.spriteHeight * Math.floor(this.numberOfSprites * Math.random());
    }

    draw(context) {
      // update the position
      this.spriteX = this.collisionX - this.spriteWidth * 0.5;
      this.spriteY = this.collisionY - this.spriteHeight + this.collisionRadius;
      /*drawImage needs at least 3 arguments: the image, the x coordinate and the y coordinate
      we can also add the width and the height

      to crop the image to get only the obstacle we need, we need to add 4 arguments:
        the start x and y
        the end x and y


      drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      
      https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
      */
      context.drawImage(
        this.image,
        0,
        this.cropAt,
        this.spriteWidth,
        this.spriteHeight,
        this.spriteX,
        this.spriteY,
        this.spriteWidth,
        this.spriteHeight
      );
      this.game.drawCollisionCircle(this, context);
    }

    update() {
      //this array will contain all the objects that will be able to push the enemies

      let collisionObjects = [
        this.game.player,
        ...this.game.obstacles,
        ...this.game.enemies,
      ];

      collisionObjects.forEach((object) => {
        let { collision, sumOfRadii, distanceXY, distanceX, distanceY } =
          this.game.checkCollision(object, this);

        if (collision && object != this) {
          const unit_x = distanceX / distanceXY;
          const unit_y = distanceY / distanceXY;

          this.collisionX = object.collisionX - (sumOfRadii + 1) * unit_x;
          this.collisionY = object.collisionY - (sumOfRadii + 1) * unit_y;
        } else {
          this.distanceX = this.targetX - this.collisionX;
          this.distanceY = this.targetY - this.collisionY;

          //set the enemy speed
          //we have to keep a constant speed
          const dXY = Math.hypot(this.distanceX, this.distanceY);
          if (dXY > this.speedModifier) {
            this.speedX = this.distanceX / dXY || 0;
            this.speedY = this.distanceY / dXY || 0;
          } else {
            this.speedX = this.distanceX / this.speedModifier;
            this.speedY = this.distanceY / this.speedModifier;
          }
        }
      });
      this.collisionX += this.speedX * this.speedModifier;

      if (this.collisionY > this.upperLimit || this.speedY > 0) {
        this.collisionY = this.collisionY + this.speedY * this.speedModifier;
      }
    }
  }

  class Larva {
    constructor(game, egg) {
      this.game = game;
      this.egg = egg;
      this.collisionRadius = 40;
      this.speedModifier = 0.5;

      //obstacle frame inside the canvas
      this.frameXstart = this.collisionRadius;
      this.frameYstart = 300; //top margin
      this.frameXend = this.game.width - this.frameXstart * 2;
      this.frameYend =
        this.game.height - this.frameYstart - this.collisionRadius;

      //the collision circle position will match that of the related egg. it will spawn where the eggs was.
      this.collisionX = this.egg.collisionX;
      this.collisionY = this.egg.collisionY;

      //sprite image
      this.image = document.getElementById("larva");
      this.numberOfSprites = 2;
      this.spriteHeight = this.image.naturalHeight / this.numberOfSprites;
      this.spriteWidth = this.image.naturalWidth;
      this.cropAt =
        this.spriteHeight * Math.floor(this.numberOfSprites * Math.random());

      //this will be toggled true if it gets eaten by the enemy
      this.eaten = false;
    }

    draw(context) {
      this.spriteX = this.collisionX - this.spriteWidth * 0.5;
      this.spriteY = this.collisionY - this.spriteHeight * 0.75;
      /*drawImage needs at least 3 arguments: the image, the x coordinate and the y coordinate
      we can also add the width and the height

      to crop the image to get only the obstacle we need, we need to add 4 arguments:
        the start x and y
        the end x and y


      drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      
      https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
      */
      context.drawImage(
        this.image,
        0,
        this.cropAt,
        this.spriteWidth,
        this.spriteHeight,
        this.spriteX,
        this.spriteY,
        this.spriteWidth,
        this.spriteHeight
      );
      //context.drawImage(image);
      this.game.drawCollisionCircle(this, context);
    }

    update() {
      const collisionObjects = [
        this.game.player,
        ...this.game.obstacles,
        ...this.game.eggs,
        ...this.game.larvae,
      ];
      const enemies = this.game.enemies;

      collisionObjects.forEach((object) => {
        let { collision, sumOfRadii, distanceXY, distanceX, distanceY } =
          this.game.checkCollision(object, this);

        if (collision && object != this) {
          const unit_x = distanceX / distanceXY;
          const unit_y = distanceY / distanceXY;

          this.collisionX = object.collisionX - sumOfRadii * unit_x;
          this.collisionY = object.collisionY - sumOfRadii * unit_y;
        }
      });

      this.collisionY = this.collisionY - this.speedModifier;

      enemies.forEach((enemy) => {
        const { collision } = this.game.checkCollision(enemy, this);

        if (collision) {
          this.eaten = true;
        }
      });
    }
  }

  //the class Game will handle all the game logics
  class Game {
    constructor(canvas) {
      //let's convert canvas into a class property
      this.canvas = canvas;
      this.width = this.canvas.width;
      this.height = this.canvas.height;

      //this array will contain all the objects of the game later
      this.objects = [];

      //create a player automatically when we create a game
      this.player = new Player(this);

      this.displayCollisionCircle = false;

      //obstacle properties
      this.numberOfObstacles = 10;
      this.obstacles = [];
      this.spaceBetweenObstacles = 100;

      //eggs
      this.eggs = new Egg(this);
      this.eggs = [];
      this.maxNumberOfEggs = 100;
      this.eggSpawnInterval = 100;
      this.eggSpawnTimer = 100;
      this.eggIncubationTime = 200;
      this.eggIncubationTimer = 0;

      //larvae
      this.larvae = [];
      this.larvaUpperLimit = 220;

      //Enemies
      this.enemies = [];
      this.maxNumberOfEnemies = 5;
      this.enemySpawnInterval = 300;
      this.enemySpawnTimer = 0;
      this.enemySpeed = 1 + 2 * Math.random();

      //player score
      this.score = 0;
      this.runningTime;

      //mouse position
      this.mouse = {
        x: this.width * 0.5,
        y: this.height * 0.5,
        pressed: false,
      };

      //initial time
      this.initialTime = Date.now();
      this.runningTime;

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

    //collision detector
    checkCollision(circleA, circleB, bufferDistance) {
      //for this methiod to be reusable, all objects must have the same properties
      const distanceX = circleA.collisionX - circleB.collisionX;
      const distanceY = circleA.collisionY - circleB.collisionY;
      //get the distance between the circleA and circleB.
      const distanceXY = Math.hypot(distanceY, distanceX);
      //check for collision
      const sumOfRadii = circleA.collisionRadius + circleB.collisionRadius;
      const minDistance = sumOfRadii + (bufferDistance ? bufferDistance : 0);
      const collision = distanceXY - minDistance < 0;

      return {
        collision: collision,
        sumOfRadii: sumOfRadii,
        distanceXY: distanceXY,
        distanceX: distanceX,
        distanceY: distanceY,
      };
    }

    drawCollisionCircle(object, context) {
      //draw collision circle
      if (this.displayCollisionCircle) {
        context.beginPath();
        context.arc(
          object.collisionX,
          object.collisionY,
          object.collisionRadius,
          0,
          2 * Math.PI
        );

        context.save();
        context.globalAlpha = 0.5;
        context.fill();
        context.restore();
        context.stroke();
      }
    }

    //the Render method will draw the player
    render(context) {
      //add the eggs
      this.addEggs();

      //populate the objects array
      this.objects = [
        this.player,
        ...this.obstacles,
        ...this.eggs,
        ...this.enemies,
        ...this.larvae,
      ];

      let sortedObjects = this.objects.sort((a, b) => {
        return a.collisionY - b.collisionY;
      });
      sortedObjects.forEach((object) => {
        object.draw(context);
        object.update();
      });

      //spawn enemies
      this.spawnEnemies();

      //hatch the eggs
      if (this.eggIncubationTimer > this.eggIncubationTime) {
        if (this.eggs[0]) {
          this.hatchEgg(this.eggs[0]);
        }
        this.eggs.shift();
        this.eggIncubationTimer = 0;
      }
      this.eggIncubationTimer++;

      this.updateLarvae();

      //measure the total running time
      this.runningTime = Math.floor((Date.now() - this.initialTime) / 1000);
    }

    addEggs() {
      const newEgg = new Egg(this);
      let collisionWithObstacle = false;
      let collisionWithEgg = false;

      if (this.eggSpawnTimer > this.eggSpawnInterval) {
        if (this.eggs.length <= this.maxNumberOfEggs) {
          this.obstacles.forEach((obstacle) => {
            if (this.checkCollision(obstacle, newEgg).collision) {
              collisionWithObstacle = true;
            }
          });

          this.eggs.forEach((egg) => {
            if (this.checkCollision(egg, newEgg).collision) {
              collisionWithEgg = true;
            }
          });

          if (!collisionWithObstacle && !collisionWithEgg) {
            this.eggs.push(newEgg);
          }
          this.eggSpawnTimer = 0;
        }
      }
      this.eggSpawnTimer++;
    }

    hatchEgg(egg) {
      const newLarva = new Larva(this, egg);
      this.larvae.push(newLarva);
    }

    updateLarvae() {
      this.larvae.forEach((larva) => {
        if (larva.collisionY < this.larvaUpperLimit) {
          this.addScore();
        }
      });
      this.larvae = this.larvae.filter((larva) => {
        return larva.eaten === false;
      });

      this.larvae = this.larvae.filter((larva) => {
        return larva.collisionY > this.larvaUpperLimit;
      });
    }

    spawnEnemies() {
      const newEnemy = new Enemy(this);

      if (
        this.enemies.length < this.maxNumberOfEnemies &&
        this.enemySpawnInterval <= this.enemySpawnTimer
      ) {
        this.enemies.push(newEnemy);
        this.enemySpawnTimer = 0;
      }
      this.enemySpawnTimer++;

      //delete the enemies that have reached their destination
      this.enemies = this.enemies.filter((enemy) => {
        return enemy.collisionX > 0;
      });
      //const index = this.enemies.findIndex((enemy) => (enemy = item));
      //this.enemies.splice(index, index);
    }

    addScore() {
      this.score++;
      console.log(this.score);
    }

    init() {
      //render the obstacles
      let attempts = 0;
      while (
        attempts < this.numberOfObstacles * 100 &&
        this.obstacles.length < this.numberOfObstacles
      ) {
        /*We don't want any overlapping obstacles. let's use brute force to check for empty spaces. That means we're gonna try until we find an empty space*/
        const newObstacle = new Obstacle(this);
        //create the first obstacle
        if (!this.obstacles.length) {
          this.obstacles.push(newObstacle);
        } else {
          //for the others, we need to check for empty spaces
          let emptySpace = true;
          let duplicateType = false;
          this.obstacles.forEach((obstacle) => {
            /*check if the space has been taken already
            get the distance between the new obstacle and an obstacle that is already in the array.
            check the distance between the new obstacle and an obstacle that is already in the array is far enough if it's not, the space is not empty
            */
            const { collision } = this.checkCollision(
              obstacle,
              newObstacle,
              this.spaceBetweenObstacles
            );

            if (collision) {
              emptySpace = false;
            }

            //also look for duplicate obstacles
            if (obstacle.obstacleType === newObstacle.obstacleType) {
              duplicateType = true;
            }
          });

          //if it's ok, push the new obstacle into the array
          if (emptySpace && !duplicateType) {
            this.obstacles.push(newObstacle);
          }

          attempts++;
        }
      }
    }
  }

  //instantiate the Game class
  const game = new Game(canvas);
  game.init();

  // we need a loop to animate our game
  let lastTime = 0;
  function animate(timeStamp) {
    //deltaTime will be used to make sure enough time has past before the game rerender itself. that preventes the game from being too fast
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    if (timer > interval) {
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
      //render player, obstacles, eggs, etc...
      game.render(ctx);

      //reset the timer
      timer = 0;
    }
    timer += deltaTime;

    /*Comment - requestAnimationFrame
    requestAnimationFrame(function)  this method will tell the browser to repeat the function to create an animation.
    here, it's reapeating the parent function*/
    window.requestAnimationFrame(animate);
  }

  //call animate to start the animation
  animate(0);
});
