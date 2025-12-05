import { Game } from './Game.js';

window.addEventListener('DOMContentLoaded', () => {
  console.log('Main.js: DOMContentLoaded');
  const canvas = document.getElementById('gameCanvas');
  const game = new Game(canvas);
  game.start();
});
