const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Initialize canvas
function initCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}
initCanvas();
window.addEventListener('resize', initCanvas);

// Game Variables
let gameRunning = false;
let gamePaused = false;
let score = 0;
let highScore = localStorage.getItem('asteroidHighScore') || 0;
let level = 1;
let health = 1;
let asteroidsDodged = 0;
let gameSpeed = 2;
let spawnRate = 0.015;

// Spaceship
const spaceship = {
    x: 0,
    y: 0,
    width: 40,
    height: 40,
    speed: 6,
    velX: 0
};

// Game Arrays
let asteroids = [];
let particles = [];
let keys = {};

// Event Listeners
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === ' ') {
        e.preventDefault();
        if (!gameRunning) {
            startGame();
        }
    }

    if (e.key === 'Escape') {
        resetGame();
    }

    if (e.key === 'p' || e.key === 'P') {
        togglePause();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('restartBtn').addEventListener('click', () => {
    resetGame();
    startGame();
});

// Asteroid Class - Geometric Polyhedra Shape
class Asteroid {
    constructor() {
        this.x = Math.random() * (canvas.width - 60) + 30;
        this.y = -60;
        this.width = 50;
        this.height = 50;
        this.speed = gameSpeed + Math.random() * 1.5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.08;
        this.type = Math.floor(Math.random() * 3); // Different polyhedra types
    }

    update() {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        // Glow background
        ctx.fillStyle = 'rgba(0, 255, 136, 0.1)';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw based on type
        if (this.type === 0) {
            this.drawIcosahedron();
        } else if (this.type === 1) {
            this.drawOctahedron();
        } else {
            this.drawCube();
        }

        ctx.restore();
    }

    drawIcosahedron() {
        // Icosahedron-like wireframe
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;

        const vertices = [
            [0, -20], [18, -8], [11, 16], [-11, 16], [-18, -8],
        ];

        // Draw edges
        ctx.beginPath();
        vertices.forEach((v, i) => {
            if (i === 0) ctx.moveTo(v[0], v[1]);
            else ctx.lineTo(v[0], v[1]);
        });
        ctx.closePath();
        ctx.stroke();

        // Inner details
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
        for (let i = 0; i < vertices.length; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(vertices[i][0], vertices[i][1]);
            ctx.stroke();
        }

        // Glow effect
        ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
    }

    drawOctahedron() {
        ctx.strokeStyle = '#0088ff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(18, 0);
        ctx.lineTo(0, 18);
        ctx.lineTo(-18, 0);
        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 136, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(18, 0);
        ctx.lineTo(0, 18);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 136, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCube() {
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 2;

        const s = 12;
        ctx.beginPath();
        ctx.moveTo(-s, -s);
        ctx.lineTo(s, -s);
        ctx.lineTo(s, s);
        ctx.lineTo(-s, s);
        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 102, 0, 0.6)';
        ctx.beginPath();
        ctx.moveTo(-s, -s);
        ctx.lineTo(-s + 8, -s + 8);
        ctx.lineTo(s, -s);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 102, 0, 0.15)';
        ctx.fillRect(-s, -s, s * 2, s * 2);
    }

    isOffScreen() {
        return this.y > canvas.height;
    }

    collidesWith(rect) {
        const dx = (this.x + this.width / 2) - (rect.x + rect.width / 2);
        const dy = (this.y + this.height / 2) - (rect.y + rect.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.width / 2 + rect.width / 2);
    }
}

// Particle Class
class Particle {
    constructor(x, y, color = '#00ff88') {
        this.x = x;
        this.y = y;
        this.velX = (Math.random() - 0.5) * 10;
        this.velY = (Math.random() - 0.5) * 10;
        this.life = 30;
        this.maxLife = 30;
        this.color = color;
    }

    update() {
        this.x += this.velX;
        this.y += this.velY;
        this.velY += 0.2;
        this.life--;
    }

    draw() {
        ctx.fillStyle = this.color.replace('ff', `${Math.round(255 * (this.life / this.maxLife))}`);
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    }
}

// Spaceship Functions
function drawSpaceship() {
    ctx.save();
    ctx.translate(spaceship.x + spaceship.width / 2, spaceship.y + spaceship.height / 2);

    // Outer glow
    ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();

    // Main body
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(18, 18);
    ctx.lineTo(0, 10);
    ctx.lineTo(-18, 18);
    ctx.closePath();
    ctx.fill();

    // Bright border
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center accent
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#0088ff';
    ctx.beginPath();
    ctx.arc(0, -5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Engine flames
    if (keys['ArrowLeft'] || keys['ArrowRight'] || keys['a'] || keys['d']) {
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(-6, 16);
        ctx.lineTo(6, 16);
        ctx.lineTo(Math.random() * 2 - 1, 26 + Math.random() * 8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(-3, 16);
        ctx.lineTo(3, 16);
        ctx.lineTo(Math.random() - 0.5, 22 + Math.random() * 5);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

function updateSpaceship() {
    // Handle movement
    if (keys['ArrowLeft'] || keys['a']) {
        spaceship.velX = -spaceship.speed;
        showDirectionIndicator('left');
    } else if (keys['ArrowRight'] || keys['d']) {
        spaceship.velX = spaceship.speed;
        showDirectionIndicator('right');
    } else {
        spaceship.velX *= 0.85;
    }

    spaceship.x += spaceship.velX;

    // Boundary checking
    if (spaceship.x < 0) spaceship.x = 0;
    if (spaceship.x + spaceship.width > canvas.width) spaceship.x = canvas.width - spaceship.width;
}

function showDirectionIndicator(direction) {
    const indicator = direction === 'left' ? 
        document.querySelector('.left-arrow') : 
        document.querySelector('.right-arrow');
    
    indicator.classList.add('active');
    setTimeout(() => indicator.classList.remove('active'), 150);
}

// Game Control Functions
function startGame() {
    gameRunning = true;
    gamePaused = false;
    document.getElementById('gameOverScreen').classList.add('hidden');
    spaceship.x = canvas.width / 2 - spaceship.width / 2;
    spaceship.y = canvas.height - 60;
}

function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    const pauseBtn = document.getElementById('pauseBtn');
    pauseBtn.classList.toggle('paused');
}

function resetGame() {
    gameRunning = false;
    gamePaused = false;
    score = 0;
    level = 1;
    health = 1;
    asteroidsDodged = 0;
    gameSpeed = 2;
    spawnRate = 0.015;
    asteroids = [];
    particles = [];
    spaceship.x = canvas.width / 2 - spaceship.width / 2;
    spaceship.y = canvas.height - 60;
    spaceship.velX = 0;
    updateUI();
    document.getElementById('pauseBtn').classList.remove('paused');
}

function updateUI() {
    document.getElementById('score').textContent = String(Math.floor(score)).padStart(5, '0');
    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('asteroidHighScore', highScore);
    }
    document.getElementById('highScore').textContent = String(Math.floor(highScore)).padStart(5, '0');
}

function spawnAsteroid() {
    if (Math.random() < spawnRate && gameRunning && !gamePaused) {
        asteroids.push(new Asteroid());
    }
}

function checkCollisions() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        if (asteroids[i].collidesWith(spaceship)) {
            health--;
            createExplosion(asteroids[i].x + asteroids[i].width / 2, asteroids[i].y + asteroids[i].height / 2);
            asteroids.splice(i, 1);
            updateUI();

            if (health <= 0) {
                endGame();
            }
        }
    }
}

function createExplosion(x, y) {
    for (let i = 0; i < 15; i++) {
        const colors = ['#00ff88', '#0088ff', '#ff6600'];
        particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]));
    }
}

function endGame() {
    gameRunning = false;
    gamePaused = false;
    document.getElementById('finalScore').textContent = String(Math.floor(score)).padStart(5, '0');
    document.getElementById('finalLevel').textContent = level;
    document.getElementById('asteroidsDodged').textContent = asteroidsDodged;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('pauseBtn').classList.remove('paused');
}

function updateDifficulty() {
    const currentLevel = Math.floor(score / 500) + 1;
    if (currentLevel !== level) {
        level = currentLevel;
        gameSpeed = 2 + (level - 1) * 0.6;
        spawnRate = Math.min(0.015 + (level - 1) * 0.004, 0.04);
    }
}

// Draw Functions
function drawBackground() {
    // Don't draw background - let the galaxy image show through
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Animated stars overlay (optional - can be removed)
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
        const x = (canvas.width * i * 73) % canvas.width;
        const y = (canvas.height * i * 97) % canvas.height;
        const brightness = 0.3 + Math.sin(Date.now() * 0.001 + i) * 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.3})`;
        ctx.fillRect(x, y, 1, 1);
    }
}

function drawGameStatus() {
    if (!gameRunning && asteroids.length === 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#00ff88';
        ctx.font = `bold ${canvas.width * 0.04}px Orbitron, Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ff88';
        ctx.fillText('PRESS SPACE TO START', canvas.width / 2, canvas.height / 2);
        ctx.shadowBlur = 0;
    }

    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ff6600';
        ctx.font = `bold ${canvas.width * 0.05}px Orbitron, Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff6600';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
        ctx.shadowBlur = 0;
    }
}

// Main Game Loop
function gameLoop() {
    drawBackground();

    if (gameRunning && !gamePaused) {
        updateSpaceship();
        spawnAsteroid();

        asteroids.forEach(asteroid => asteroid.update());
        particles.forEach(particle => particle.update());

        // Remove off-screen asteroids
        for (let i = asteroids.length - 1; i >= 0; i--) {
            if (asteroids[i].isOffScreen()) {
                asteroids.splice(i, 1);
                asteroidsDodged++;
                score += 15;
                updateUI();
                updateDifficulty();
            }
        }

        // Remove dead particles
        particles = particles.filter(p => p.life > 0);

        // Check collisions
        checkCollisions();

        // Increase score
        score += 0.5;
        updateUI();
    }

    // Draw
    drawGameStatus();
    asteroids.forEach(asteroid => asteroid.draw());
    particles.forEach(particle => particle.draw());
    drawSpaceship();

    requestAnimationFrame(gameLoop);
}

// Initialize
spaceship.x = canvas.width / 2 - spaceship.width / 2;
spaceship.y = canvas.height - 60;
updateUI();
gameLoop();

