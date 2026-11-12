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