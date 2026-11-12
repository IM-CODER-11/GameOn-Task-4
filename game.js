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

// Image files storage
const imageAssets = {};
const filePaths = {
    bg1: "Assets/Bg_1.png", 
    bg2: "Assets/Bg_2.png", 
    bg3: "Assets/Bg_3.png",
    platform1: "Assets/platform_1.png",
    platform2: "Assets/platform_2.png",
    platform3: "Assets/platform_3.png",
    bird: "Assets/bird.png",
    helicopter: "Assets/helicopter.png",
    runner1: "Assets/runner_1.png",
    runner2: "Assets/runner_2.png",
    runner3: "Assets/runner_3.png",
    runner4: "Assets/runner_4.png",
    runner5: "Assets/runner_5.png"
};

let imagesLoadedCount = 0;
let gameMode = "solo";
let animationFrameId = 0;
let lastTime = 0;