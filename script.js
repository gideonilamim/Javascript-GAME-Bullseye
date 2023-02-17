//addEventListener('load' --> when the page loads
window.addEventListener("load", function () {
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");

  //set canvas size
  canvas.width = 1280;
  canvas.height = 720;

  //object player
  class Player {
    constructor(game) {
      this.game = game;
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
    }
  }

  // we need a loop to animate our game
  function animate() {}
});
