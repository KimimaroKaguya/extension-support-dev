const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Cyberpunk black background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, size, size);
  
  // Yellow border with glow effect
  ctx.strokeStyle = '#f7d000';
  ctx.lineWidth = size * 0.06;
  ctx.strokeRect(size * 0.08, size * 0.08, size * 0.84, size * 0.84);
  
  // Inner cyan accent line
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = size * 0.02;
  ctx.strokeRect(size * 0.15, size * 0.15, size * 0.7, size * 0.7);
  
  // Draw vault/lock icon
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Lock body (rectangle)
  const lockWidth = size * 0.4;
  const lockHeight = size * 0.3;
  const lockX = centerX - lockWidth / 2;
  const lockY = centerY - lockHeight / 2 + size * 0.08;
  
  // Draw lock body - yellow
  ctx.fillStyle = '#f7d000';
  ctx.fillRect(lockX, lockY, lockWidth, lockHeight);
  
  // Lock shackle (arc) - cyan
  ctx.beginPath();
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = size * 0.06;
  ctx.lineCap = 'round';
  ctx.arc(centerX, lockY, size * 0.12, Math.PI, 0, false);
  ctx.stroke();
  
  // Keyhole - black
  ctx.beginPath();
  ctx.arc(centerX, lockY + lockHeight * 0.35, size * 0.045, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0a';
  ctx.fill();
  
  // Keyhole bottom
  ctx.beginPath();
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(centerX - size * 0.02, lockY + lockHeight * 0.35, size * 0.04, lockHeight * 0.4);
  
  return canvas.toBuffer('image/png');
}

const sizes = [16, 48, 128];

sizes.forEach(size => {
  const buffer = drawIcon(size);
  const filePath = path.join(__dirname, `icon${size}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`Created ${filePath}`);
});

console.log('DevVault Cyberpunk icons generated!');
