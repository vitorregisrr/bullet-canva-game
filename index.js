const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
const scoreElements = document.querySelectorAll(`[data-content="score-el"]`);
const gameOverPopupElement = document.querySelector(`#game-over-popup`);
const restartButtonElement = document.querySelector(`#restart-button`);
const soundOffEl = document.querySelector("#soundOffEl");
const soundOnEl = document.querySelector("#soundOnEl");
const mouse = {
  down: false,
  x: undefined,
  y: undefined,
};
const sounds = {
  startGame: new Howl({ src: "./audio/startGame.mp3" }),
  enemyHit: new Howl({ src: "./audio/enemyHit.mp3" }),
  enemyEliminated: new Howl({ src: "./audio/enemyEliminated.mp3" }),
  endGame: new Howl({ src: "./audio/endGame.mp3" }),
  obtainPowerUp: new Howl({ src: "./audio/obtainPowerUp.mp3" }),
  shoot: new Howl({ src: "./audio/shoot.mp3" }),
  backgroundMusic: new Audio("./audio/backgroundMusic.mp3"),
};
sounds.backgroundMusic.loop = true;
sounds.backgroundMusic.volume = 0.4;

const scene = {
  active: false,
};

// main player Class
class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.friction = 0.99;
    this.velocity = {
      x: 0,
      y: 0,
    };
    this.powerUp = "";
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }

  shoot(mouse, color = "white") {
    const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
    const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5,
    };
    projectiles.push(new Projectile(this.x, this.y, 5, color, velocity));
    sounds.shoot.play();
  }

  update() {
    this.draw();
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;

    if (
      this.x - this.radius + this.velocity.x > 0 &&
      this.x + this.radius + this.velocity.x < canvas.width
    ) {
      this.x += this.velocity.x;
    } else {
      this.velocity.x = 0;
    }

    if (
      this.y - this.radius + this.velocity.y > 0 &&
      this.y + this.radius + this.velocity.y < canvas.height
    ) {
      this.y += this.velocity.y;
    } else {
      this.velocity.y = 0;
    }
  }
}

// main Projectiles Class
class Projectile {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }

  update() {
    this.draw();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

class Enemy {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.type = "linear";
    this.center = {
      x,
      y,
    };
    this.radians = 0;

    if (Math.random() < 0.25) {
      this.type = "homing";

      if (Math.random() < 0.5) {
        this.type = "spinning";

        if (Math.random() < 0.25) {
          this.type = "homing-spinning";
        }
      }
    }
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }

  update() {
    this.draw();
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    if (this.type === "linear") {
      this.x += this.velocity.x;
      this.y += this.velocity.y;
    } else if (this.type === "homing") {
      this.x += velocity.x;
      this.y += velocity.y;
    } else if (this.type === "spinning") {
      this.radians += 0.05;
      this.center.x += this.velocity.x;
      this.center.y += this.velocity.y;
      this.x = this.center.x + Math.cos(this.radians) * 100;
      this.y = this.center.y + Math.sin(this.radians) * 100;
    } else if (this.type === "homing-spinning") {
      this.radians += 0.05;
      this.center.x += velocity.x;
      this.center.y += velocity.y;
      this.x = this.center.x + Math.cos(this.radians) * 100;
      this.y = this.center.y + Math.sin(this.radians) * 100;
    }
  }
}

const friction = 0.99;
class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
  }

  draw() {
    c.save();
    c.globalAlpha = this.alpha;
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
    c.restore();
  }

  update() {
    this.draw();
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.01;
  }
}

const powerUpImage = new Image();
powerUpImage.src = "./img/lightning.png";
class PowerUp {
  constructor(x, y, velocity) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
    this.width = 14;
    this.height = 18;
    this.radians = 0;
  }

  draw() {
    c.save();
    c.translate(this.x + this.width / 2, this.y + this.height / 2);
    c.rotate(this.radians);
    c.translate(-this.x - this.width / 2, -this.y - this.height / 2);
    c.drawImage(powerUpImage, this.x, this.y, 14, 18);
    c.restore();
  }

  update() {
    this.radians += 0.002;
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class BackgroundParticle {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.initialAlpha = 0.05;
    this.alpha = this.initialAlpha;
  }

  draw() {
    c.save();
    c.globalAlpha = this.alpha;
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
    c.restore();
  }

  update() {
    this.draw();
    // this.alpha -= 0.01;
  }
}

let player = null;
const powerUps = [];
const projectiles = [];
const enemies = [];
const particles = [];
const backgroundParticles = [];
let spawnEnemiesInterval = null;
let spawnPowerUpsInterval = null;

const createFixElements = () => {
  player = new Player(innerWidth / 2, innerHeight / 2, 10, "white");
  backgroundParticles.splice(0, backgroundParticles.length);

  for (let x = 0; x < canvas.width; x += 40) {
    for (let y = 0; y < canvas.height; y += 40) {
      backgroundParticles.push(new BackgroundParticle(x, y, 3, "blue"));
    }
  }
};

const spawnEnemies = () => {
  spawnEnemiesInterval = setInterval(() => {
    const radius = Math.random() * (30 - 4) + 4;
    const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
    let x, y;

    if (Math.random < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }

    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };
    enemies.push(new Enemy(x, y, radius, color, velocity));
  }, 1000);
};

const spawnPowerUps = () => {
  spawnPowerUpsInterval = setInterval(() => {
    let x;
    let y;

    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - 7 : canvas.width + 7;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? 0 - 9 : canvas.height + 9;
    }

    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);

    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    powerUps.push(new PowerUp(x, y, velocity));
  }, 15000);
};

let score = 0;
frame = 0;
const increaseScore = (newScore, labelPos) => {
  const scoreLabel = document.createElement("label");
  scoreLabel.innerHTML = "+" + newScore;
  document.body.appendChild(scoreLabel);
  scoreLabel.style.fontFamily = "Trebuchet MS";
  scoreLabel.style.fontSize = "14px";
  scoreLabel.style.position = `absolute`;
  scoreLabel.style.zIndex = `20`;
  scoreLabel.style.color = `#fff`;
  scoreLabel.style.userSelect = `none`;
  scoreLabel.style.top = labelPos.y + "px";
  scoreLabel.style.left = labelPos.x + "px";
  sounds.enemyHit.play();

  gsap.to(scoreLabel, {
    opacity: 0,
    transform: `translateX(-20px)`,
    duration: 1.2,
    onComplete: () => {
      scoreLabel.parentNode.removeChild(scoreLabel);
    },
  });

  score += newScore;
  scoreElements.forEach((el) => (el.innerHTML = score));
};

const resetScore = () => {
  score = 0;
  scoreElements.forEach((el) => (el.innerHTML = 0));
};

const callGameOver = () => {
  setTimeout(() => {
    cancelAnimationFrame(animationId);
    gameOverPopupElement.setAttribute("data-visible", "true");
    sounds.endGame.play();
    scene.active = false;
  }, 0);
};

const restartGame = () => {
  gameOverPopupElement.setAttribute("data-visible", "false");
  enemies.splice(0, enemies.length);
  projectiles.splice(0, projectiles.length);
  particles.splice(0, particles.length);
  backgroundParticles.splice(0, backgroundParticles.length);
  powerUps.splice(0, powerUps.length);
  if (spawnEnemiesInterval) {
    clearInterval(spawnEnemiesInterval);
  }
  if (spawnPowerUpsInterval) {
    clearInterval(spawnPowerUpsInterval);
  }
  createFixElements();
  resetScore();
  animate();
  spawnEnemies();
  spawnPowerUps();
  scene.active = true;
  sounds.backgroundMusic.currentTime = 170;
  sounds.backgroundMusic.play();
  sounds.startGame.play();
};
restartButtonElement.addEventListener("click", () => restartGame());

let animationId;
const animate = () => {
  frame++;
  animationId = requestAnimationFrame(animate);
  c.fillStyle = "rgba(0, 0, 0, 0.1)";
  c.fillRect(0, 0, canvas.width, canvas.height);
  player.update();

  particles.forEach((particle, index) => {
    if (particle.alpha <= 0) {
      particles.splice(index, 1);
    } else {
      particle.update();
    }
  });

  backgroundParticles.forEach((backgroundParticle, index) => {
    backgroundParticle.update();

    const dist = Math.hypot(
      player.x - backgroundParticle.x,
      player.y - backgroundParticle.y
    );

    const hideRadius = 100;
    if (dist < hideRadius) {
      if (dist < 70) {
        backgroundParticle.alpha = 0;
      } else {
        backgroundParticle.alpha = 0.25;
      }
    } else if (
      dist >= hideRadius &&
      backgroundParticle.alpha < backgroundParticle.initialAlpha
    ) {
      backgroundParticle.alpha += 0.005;
    } else if (
      dist >= hideRadius &&
      backgroundParticle.alpha > backgroundParticle.initialAlpha
    ) {
      backgroundParticle.alpha -= 0.005;
    }
  });

  projectiles.forEach((projectile, index) => {
    projectile.update();

    if (
      projectile.x + projectile.radius < 0 ||
      projectile.x + projectile.radius > canvas.width ||
      projectile.y + projectile.radius < 0 ||
      projectile.y + projectile.radius > canvas.height
    ) {
      projectiles.splice(index, 1);
    }
  });

  enemies.forEach((enemy, enemyIndex) => {
    enemy.update();

    // user vs enemies touch check
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (dist - enemy.radius - player.radius < 1) {
      callGameOver();
    }

    // projectiles vs enemies touch check
    projectiles.forEach((projectile, projectileIndex) => {
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

      if (dist - enemy.radius - projectile.radius < 0.25) {
        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * 2,
              enemy.color,
              {
                x: (Math.random() - 0.5) * (Math.random() * 6),
                y: (Math.random() - 0.5) * (Math.random() * 6),
              }
            )
          );
        }

        if (enemy.radius - 10 > 10) {
          increaseScore(50, { x: enemy.x, y: enemy.y });
          gsap.to(enemy, {
            radius: enemy.radius - 10,
          });
          setTimeout(() => {
            projectiles.splice(projectileIndex, 1);
          }, 0);
        } else {
          increaseScore(100, { x: enemy.x, y: enemy.y });
          setTimeout(() => {
            const enemyFound = enemies.find((enemyValue) => {
              return enemyValue === enemy;
            });

            if (enemyFound) {
              enemies.splice(enemyIndex, 1);
              sounds.enemyEliminated.play();
              projectiles.splice(projectileIndex, 1);
            }
          }, 0);

          // change backgroundParticle colors
          backgroundParticles.forEach((backgroundParticle) => {
            backgroundParticle.color = enemy.color;
            gsap.to(backgroundParticle, {
              alpha: 0.5,
              duration: 0.015,
              onComplete: () => {
                gsap.to(backgroundParticle, {
                  alpha: backgroundParticle.initialAlpha,
                  duration: 0.03,
                });
              },
            });
          });
        }
      }
    });
  });

  if (player.powerUp === "Automatic" && mouse.down) {
    if (frame % 4 === 0) {
      player.shoot(mouse, "#FFF500");
    }
  }

  powerUps.forEach((powerUp, index) => {
    const dist = Math.hypot(player.x - powerUp.x, player.y - powerUp.y);

    // gain the automatic shooting ability
    if (dist - player.radius - powerUp.width / 2 < 1) {
      player.color = "#FFF500";
      player.powerUp = "Automatic";
      powerUps.splice(index, 1);
      sounds.obtainPowerUp.play();

      setTimeout(() => {
        player.powerUp = null;
        player.color = "#FFFFFF";
      }, 5000);
    } else {
      powerUp.update();
    }
  });
};

const createProjectile = () => {
  const angle = Math.atan2(
    event.clientY - player.y + 5,
    event.clientX - player.x + 5
  );
  const velocity = {
    x: Math.cos(angle) * 4,
    y: Math.sin(angle) * 4,
  };
  projectiles.push(
    new Projectile(player.x - 5, player.y - 5, 5, "white", velocity)
  );
};

// create projectiles event
window.addEventListener("mousedown", ({ clientX, clientY }) => {
  if (scene.active) {
    mouse.x = clientX;
    mouse.y = clientY;

    mouse.down = true;
  }
});

window.addEventListener("mousemove", ({ clientX, clientY }) => {
  if (scene.active) {
    mouse.x = clientX;
    mouse.y = clientY;
  }
});

window.addEventListener("touchstart", (event) => {
  mouse.x = event.touches[0].clientX;
  mouse.y = event.touches[0].clientY;

  mouse.down = true;
});

window.addEventListener("touchmove", (event) => {
  mouse.x = event.touches[0].clientX;
  mouse.y = event.touches[0].clientY;
});

window.addEventListener("touchend", () => {
  mouse.down = false;
});

soundOffEl.addEventListener("click", () => {
  console.log("mute");
  sounds.backgroundMusic.volume = 0;
  soundOnEl.style.display = "block";
  soundOffEl.style.display = "none";
});

soundOnEl.addEventListener("click", () => {
  console.log("sound on");
  sounds.backgroundMusic.volume = 0.4;
  soundOnEl.style.display = "none";
  soundOffEl.style.display = "block";
});

window.addEventListener("mouseup", () => {
  if (scene.active) {
    mouse.down = false;
  }
});

window.addEventListener("click", ({ clientX, clientY }) => {
  if (scene.active) {
    mouse.x = clientX;
    mouse.y = clientY;
    player.shoot(mouse);
  }
});

// player movement
window.addEventListener("keydown", ({ keyCode }) => {
  if (scene.active) {
    switch (keyCode) {
      case 87:
      case 38:
        console.log("up");
        if (player.velocity.y > -6) {
          if (player.velocity.y > 0) {
            player.velocity.y = 0;
          }
          player.velocity.y -= 1;
        }
        break;

      case 65:
      case 37:
        if (player.velocity.x > -6) {
          if (player.velocity.x > 0) {
            player.velocity.x = 0;
          }
          player.velocity.x -= 1;
        }
        break;

      case 83:
      case 40:
        if (player.velocity.y < 6) {
          if (player.velocity.y < 0) {
            player.velocity.y = 0;
          }
          player.velocity.y += 1;
        }
        break;

      case 68:
      case 39:
        if (player.velocity.x < 6) {
          if (player.velocity.x < 0) {
            player.velocity.x = 0;
          }
          player.velocity.x += 1;
        }
        break;
    }
  }
});

// resize the canvas to fill browser window dynamically
window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  createFixElements();
}

// start the script resizing
resizeCanvas();
