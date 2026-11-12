// Consts for main canvas and tools
const gameCanvas = document.getElementById("gameCanvas");
const canvas = gameCanvas.getContext("2d");

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

// Image files storage and Audio
const imageAssets = {};
const loseLifeSound = new Audio("Assets/lose_life.mp3");

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

// Start the game loop for Solo or Versus mode
function startGame(selectedMode) {
    gameMode = selectedMode;
    gameCanvas.width = 700;
    gameCanvas.height = 700;
    birdsList = [];

    if (gameMode === "solo") {
        playersList = [createNewPlayer({ left: ["a", "arrowleft"], right: ["d", "arrowright"] }, 700)];
        hudTitleP1.textContent = "Score";
        hudP1.style.width = "100%";
        hudP2.classList.add("hidden");
    } else {
        playersList = [
            createNewPlayer({ left: ["a"], right: ["d"] }, 350),                   
            createNewPlayer({ left: ["arrowleft"], right: ["arrowright"] }, 350)  
        ];
        hudTitleP1.innerHTML = "<b>Player 1</b> | Score";
        hudP1.style.width = "350px";
        hudP2.style.width = "350px";
        hudP2.classList.remove("hidden");
    }

    playersList.forEach(resetPlayerStats);
    menuScreen.classList.add("hidden");
    endScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    lastTime = 0;
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Listen for keyboard button presses
window.addEventListener("keydown", function(e) {
    let pressedKey = e.key.toLowerCase();
    playersList.forEach(function(player) {
        handlePlayerInput(player, pressedKey);
    });
});

/* Gemini, "Update my input handler so that the player moves to certain points on the platforms based on their input.", 12/11/26, 9:05pm */
function handlePlayerInput(player, key) {
    if (!player.alive || player.win || player.moving) return;

    let nextIndex = player.idx + 1;
    if (nextIndex >= 300) return;

    generatePlatforms(player, nextIndex + 5);
    let nextPlatform = player.plats[nextIndex];

    let wantsLeft = player.controls.left.includes(key);
    let wantsRight = player.controls.right.includes(key);

    if (!wantsLeft && !wantsRight) return;

    let isCorrectMove = (wantsLeft && nextPlatform.side === "left") || (wantsRight && nextPlatform.side === "right");
    if (!isCorrectMove) return;

    player.idx = nextIndex;
    player.targetX = nextPlatform.x + (PLATFORM_WIDTH - PLAYER_SIZE) / 2;
    player.targetY = nextPlatform.y - PLAYER_SIZE;
    player.facing = wantsLeft ? "left" : "right";
    player.moving = true;
    player.score++;

    nextPlatform.visited = true;
    nextPlatform.timer = Math.max(800, 1800 - (player.level * 300));

    player.level = (player.score >= 200) ? 3 : ((player.score >= 100) ? 2 : 1);
}

// Main game loop running constantly
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    playersList.forEach(function(player) {
        if (!player.alive || player.win) return;

        if (player.moving) {
            player.x += (player.targetX - player.x) * 0.25;
            player.y += (player.targetY - player.y) * 0.25;
            if (Math.abs(player.targetY - player.y) < 1) {
                player.y = player.targetY;
                player.x = player.targetX;
                player.moving = false;
            }
        }

        /* Gemini, "How can I make the game a vertical scroller moving with the player?", 12/11/26, 9:21pm */
        player.camY += ((player.y - 385) - player.camY) * 0.1; // Only this line

        /* Gemini, "How do I write the platform disappearing timer, obstacle movement, and player collision logic?", 12/11/26, 9:21pm */
        player.plats.forEach(function(platform) {  //Start of code
            if (platform.visited && !platform.disappeared && platform.timer !== null) {
                platform.timer -= deltaTime;
                if (platform.timer <= 0) {
                    platform.disappeared = true;
                }
            }
        });

        let currentPlatform = player.plats[player.idx];
        if (currentPlatform.disappeared && !currentPlatform.handled) {
            currentPlatform.handled = true;
            player.lives--;

            // Play life loss sound effect
            loseLifeSound.currentTime = 0;
            loseLifeSound.play();

            if (player.lives <= 0) {
                player.alive = false;
            } else {
                player.idx++;
                if (player.idx < player.plats.length) {
                    let newPlatform = player.plats[player.idx];
                    newPlatform.disappeared = false;
                    newPlatform.visited = true;
                    newPlatform.timer = 1500;
                    player.targetX = newPlatform.x + (PLATFORM_WIDTH - PLAYER_SIZE) / 2;
                    player.targetY = newPlatform.y - PLAYER_SIZE;
                    player.moving = true;
                }
            }
        }

        generatePlatforms(player, player.idx + 8);
        if (player.score >= 300) {
            player.win = true;
        }
    });

    birdsList.forEach(function(bird) {
        bird.x += bird.speed;
        if (bird.x < bird.minX || bird.x > bird.maxX) {
            bird.speed *= -1;
        }
    });

    playersList.forEach(function(player) {
        if (player.level >= 2 && player.alive && !player.win) {
            birdsList.forEach(function(bird) {
                if (bird.colWidth === player.colWidth) {
                    let birdScreenY = bird.y - player.camY;
                    if (!player.moving && Math.abs(player.x - bird.x) < 40 && Math.abs((player.y - player.camY) - birdScreenY) < 40) {
                        player.lives--;

                        // Play life loss sound effect
                        loseLifeSound.currentTime = 0;
                        loseLifeSound.play();

                        bird.x = -500;
                        if (player.lives <= 0) {
                            player.alive = false;
                        }
                    }
                }
            });
        }
    }); 
    //END of generated code

    if (gameMode === "versus") {
        let p1 = playersList[0];
        let p2 = playersList[1];
        if ((!p1.alive || p1.win) && (!p2.alive || p2.win)) {
            cancelAnimationFrame(animationFrameId);
            endScreen.classList.remove("hidden");
            gameScreen.classList.add("hidden");
            let endImg = document.getElementById("endImage");
            let resultText = "";

            if (p1.win && !p2.win) {
                resultText = "Player 1 Wins! Reached the chopper!";
                endImg.src = imageAssets.helicopter.src;
                endImg.classList.remove("hidden");
            } else if (p2.win && !p1.win) {
                resultText = "Player 2 Wins! Reached the chopper!";
                endImg.src = imageAssets.helicopter.src;
                endImg.classList.remove("hidden");
            } else if (p2.score > p1.score) {
                resultText = "Player 2 Wins! Beat Player 1's score of " + p1.score + " with " + p2.score + "!";
                endImg.classList.add("hidden");
            } else if (p1.score > p2.score) {
                resultText = "Player 1 Wins! Higher score (" + p1.score + " vs " + p2.score + ")";
                endImg.classList.add("hidden");
            } else {
                resultText = "It's a Tie! Both got score " + p1.score;
                endImg.classList.add("hidden");
            }

            document.getElementById("endTitle").textContent = "Game Over / Results";
            document.getElementById("endMessage").textContent = resultText;
            return;
        }
    } else {
        let p1 = playersList[0];
        if (!p1.alive || p1.win) {
            cancelAnimationFrame(animationFrameId);
            endScreen.classList.remove("hidden");
            gameScreen.classList.add("hidden");
            let endImg = document.getElementById("endImage");
            if (p1.win) {
                endImg.src = imageAssets.helicopter.src;
                endImg.classList.remove("hidden");
                document.getElementById("endTitle").textContent = "You Escaped!";
            } else {
                endImg.classList.add("hidden");
                document.getElementById("endTitle").textContent = "Game Over";
            }
            document.getElementById("endMessage").textContent = "Final Score: " + p1.score;
            return;
        }
    }

    canvas.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    playersList.forEach(function(player, index) {
        canvas.save();
        let currentViewportWidth = (gameMode === "solo") ? 700 : 350;

        if (gameMode === "versus") {
            let xOffset = (index === 0) ? 0 : 350;
            canvas.translate(xOffset, 0);
            canvas.beginPath();
            canvas.rect(0, 0, 350, 700);
            canvas.clip();
        }

        let currentBg = imageAssets["bg" + player.level];
        drawBackgroundCover(currentBg, 0, 0, currentViewportWidth, 700);

        if (player.level >= 2 && imageAssets.bird) {
            birdsList.forEach(function(bird) {
                if (bird.colWidth === currentViewportWidth) {
                    let birdScreenY = bird.y - player.camY;
                    if (birdScreenY > -70 && birdScreenY < 770) {
                        canvas.save();
                        if (bird.speed > 0) {
                            canvas.translate(bird.x + 70, birdScreenY);
                            canvas.scale(-1, 1);
                            canvas.drawImage(imageAssets.bird, 0, 0, 70, 50);
                        } else {
                            canvas.drawImage(imageAssets.bird, bird.x, birdScreenY, 70, 50);
                        }
                        canvas.restore();
                    }
                }
            });
        }

        player.plats.forEach(function(platform) {
            let platformScreenY = platform.y - player.camY;
            if (!platform.disappeared && platformScreenY > -120 && platformScreenY < 820) {
                let platformImage = imageAssets.platform1;
                if (player.score >= 100) platformImage = imageAssets.platform2;
                if (player.score >= 200) platformImage = imageAssets.platform3;
                if (platformImage) {
                    canvas.drawImage(platformImage, platform.x, platformScreenY, PLATFORM_WIDTH, PLATFORM_HEIGHT);
                }
            }
        });

        if (player.alive) {
            if (player.moving) {
                player.timeTracker++;
                if (player.timeTracker % 8 === 0) {
                    player.frameCounter++;
                    if (player.frameCounter > 5) player.frameCounter = 1;
                }
            } else {
                player.frameCounter = 1;
            }

            let runnerImage = imageAssets["runner" + player.frameCounter] || imageAssets.runner1;
            canvas.save();
            if (player.facing === "left") {
                canvas.translate(player.x + PLAYER_SIZE, player.y - player.camY);
                canvas.scale(-1, 1);
                canvas.drawImage(runnerImage, 0, 0, PLAYER_SIZE, PLAYER_SIZE);
            } else {
                canvas.drawImage(runnerImage, player.x, player.y - player.camY, PLAYER_SIZE, PLAYER_SIZE);
            }
            canvas.restore();
        }

        canvas.restore();
    });

    scoreDisplayP1.textContent = playersList[0].score;
    livesDisplayP1.textContent = "❤️".repeat(Math.max(0, playersList[0].lives)) + "🖤".repeat(Math.max(0, 3 - playersList[0].lives));
    levelDisplayP1.textContent = playersList[0].level;

    if (gameMode === "versus" && playersList[1]) {
        scoreDisplayP2.textContent = playersList[1].score;
        livesDisplayP2.textContent = "❤️".repeat(Math.max(0, playersList[1].lives)) + "🖤".repeat(Math.max(0, 3 - playersList[1].lives));
        levelDisplayP2.textContent = playersList[1].level;
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

document.getElementById("singlePlayerBtn").addEventListener("click", function() {
    startGame("solo");
});
document.getElementById("twoPlayerBtn").addEventListener("click", function() {
    startGame("versus");
});
document.getElementById("restartBtn").addEventListener("click", function() {
    endScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
});