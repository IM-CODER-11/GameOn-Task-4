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

// Get text displays for scores and lives
const scoreDisplayP1 = document.getElementById("scoreP1");
const livesDisplayP1 = document.getElementById("livesP1");
const levelDisplayP1 = document.getElementById("levelP1");

const scoreDisplayP2 = document.getElementById("scoreP2");
const livesDisplayP2 = document.getElementById("livesP2");
const levelDisplayP2 = document.getElementById("levelP2");

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
let playersList = [];
let birdsList = [];
let animationFrameId = 0;
let lastTime = 0;

/* Gemini, "Create an image loading function that doesn't glitch out", 12/11/26, 8:01pm */
for (let key in filePaths) {
    let img = new Image();
    img.onload = function() {
        imagesLoadedCount++;
        if (imagesLoadedCount === Object.keys(filePaths).length) {
            document.getElementById("loadingText").classList.add("hidden");
            document.getElementById("singlePlayerBtn").disabled = false;
            document.getElementById("twoPlayerBtn").disabled = false;
        }
    };
    img.onerror = function() {
        imagesLoadedCount++;
    };
    img.src = filePaths[key];
    imageAssets[key] = img;
}

document.getElementById("singlePlayerBtn").disabled = true;
document.getElementById("twoPlayerBtn").disabled = true;

/* Gemini, "Simplify background cover creation", 12/11/26, 8:01pm */
function drawBackgroundCover(img, x, y, width, height) {
    if (!img || !img.complete || img.naturalWidth === 0) return;
    let imgRatio = img.naturalWidth / img.naturalHeight;
    let targetRatio = width / height;
    let sourceWidth = img.naturalWidth;
    let sourceHeight = img.naturalHeight;
    let sourceX = 0;
    let sourceY = 0;

    if (imgRatio > targetRatio) {
        sourceWidth = sourceHeight * targetRatio;
        sourceX = (img.naturalWidth - sourceWidth) / 2;
    } else {
        sourceHeight = sourceWidth / targetRatio;
        sourceY = (img.naturalHeight - sourceHeight) / 2;
    }

    canvas.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

const PLATFORM_WIDTH = 120;
const PLATFORM_HEIGHT = 55;
const PLAYER_SIZE = 55;

// Create a player object with controls and screen column width
function createNewPlayer(controlsConfig, columnWidth) {
    return {
        controls: controlsConfig,
        colWidth: columnWidth,
        plats: [],
        score: 0,
        lives: 3,
        level: 1,
        idx: 0,
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        camY: 0,
        facing: "right",
        frameCounter: 1,
        timeTracker: 0,
        moving: false,
        alive: true,
        win: false
    };
}

/* Gemini, "Edit my code to have platforms creating with specific distance and in the same x-axis line", 12/11/26, 8:26pm */
function generatePlatforms(player, upToLimit) {
    while (player.plats.length <= upToLimit && player.plats.length < 300) {
        let index = player.plats.length;
        let chosenSide = "right";

        if (index === 0) {
            chosenSide = "right";
        } else if (index < 3) {
            // If we don't have 3 previous platforms yet, just pick randomly
            chosenSide = (Math.random() < 0.5) ? "left" : "right";
        } else {
            // Now it's safe to look back 3 platforms because we know they exist
            let lastSide = player.plats[index - 1].side;
            let secondLastSide = player.plats[index - 2].side;
            let thirdLastSide = player.plats[index - 3].side;

            chosenSide = (lastSide === secondLastSide && secondLastSide === thirdLastSide) 
                ? ((lastSide === "left") ? "right" : "left") 
                : ((Math.random() < 0.5) ? "left" : "right");
        }

        let platformY = 550 - (index * 110);
        let platformX = (chosenSide === "left") ? 40 : player.colWidth - PLATFORM_WIDTH - 40;

        player.plats.push({
            index: index,
            side: chosenSide,
            x: platformX,
            y: platformY,
            visited: index === 0,
            timer: null,
            disappeared: false,
            handled: false
        });

        // Spawn flying birds safely
        if (index > 10 && index % 4 === 0) {
            let birdSide = (Math.random() < 0.5) ? "left" : "right";
            let birdX = (birdSide === "left") ? 50 : player.colWidth - 120;
            let birdSpeed = (2.2 + Math.random() * 1.0) * ((birdSide === "left") ? 1 : -1);

            birdsList.push({
                colWidth: player.colWidth,
                x: birdX,
                y: platformY - 30,
                minX: 20,
                maxX: player.colWidth - 60,
                speed: birdSpeed
            });
        }
    }
}

// Reset player stats back to default when starting a game
function resetPlayerStats(player) {
    player.score = 0;
    player.lives = 3;
    player.level = 1;
    player.idx = 0;
    player.plats = [];
    player.camY = 0;
    player.alive = true;
    player.win = false;

    generatePlatforms(player, 15);
    let startingPlatform = player.plats[0];
    if (startingPlatform) {
        player.x = startingPlatform.x + (PLATFORM_WIDTH - PLAYER_SIZE) / 2;
        player.y = startingPlatform.y - PLAYER_SIZE;
        player.targetX = player.x;
        player.targetY = player.y;
    }
}