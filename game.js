// Consts for main canvas and tools
const gameCanvas = document.getElementById("gameCanvas");
const canvas = document.getElementById("2d");

// Menu and Screen
const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");
const endScreen = document.getElementById("endScreen");
const hudP1 = document.getElementById("hudP1");
const hudP2 = document.getElementById("hudP2");
const hudTitleP1 = document.getElementById("hudTitleP1");

let gameMode = "solo";
let animationFrameId = 0;
let lastTime = 0;