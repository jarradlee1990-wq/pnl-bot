const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

class CardGenerator {
  constructor() {
    this.width = 1200;
    this.height = 675;
    this.tempDir = path.join(__dirname, '../temp');
  }

  async drawBackground(ctx, backgroundUrl, backgroundColor) {
    // Default fallback image if no background is provided
    const defaultBackground = 'https://static.vecteezy.com/system/resources/thumbnails/007/685/830/small_2x/colorful-geometric-background-trendy-gradient-shapes-composition-cool-background-design-for-posters-free-vector.jpg';
    
    const urlToLoad = (backgroundUrl && backgroundUrl !== 'none') ? backgroundUrl : defaultBackground;

    try {
        const image = await loadImage(urlToLoad);
        ctx.drawImage(image, 0, 0, this.width, this.height);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, this.width, this.height);
    } catch (error) {
        console.warn('Failed to load background image. Falling back to solid color.', error.message);
        ctx.fillStyle = backgroundColor || '#1a1a2e';
        ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  roundRect(ctx, x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    return this;
  }

  async generateCard(payload) {
    const {
      marketName,
      cost,
      sells,
      profit,
      profitPercent,
      backgroundUrl,
      backgroundColor,
      textColor,
      accentColor,
    } = payload;

    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    await this.drawBackground(ctx, backgroundUrl, backgroundColor);

    // Define Colors
    const isPositive = profit >= 0;
    const greenColor = '#00ff88';
    const redColor = '#ff4444';
    const mainColor = isPositive ? (accentColor || greenColor) : redColor;
    const whiteColor = textColor || '#ffffff';

    ctx.fillStyle = whiteColor;

    // Move everything down (Global Layout Offset)
    // Adjusted: Halfway between previous (200) and last (60) -> ~130
    let currentY = 130; 

    // 1. Separate Overlay Drawing Logic
    await this.drawOverlay(ctx, payload);
    
    // 2. Save frame
    // ... (rest of saving logic)
    const filename = path.join(this.tempDir, `pnl-card-${Date.now()}.png`);
    fs.writeFileSync(filename, canvas.toBuffer('image/png'));
    setTimeout(() => fs.existsSync(filename) && fs.unlinkSync(filename), 60 * 1000);
    return filename;
  }

  async generateAnimatedCard(payload) {
    const { backgroundUrl } = payload;
    const GIFEncoder = require('gif-encoder-2');
    const gifFrames = require('gif-frames');
    const axios = require('axios');

    // 1. Download GIF to buffer
    const response = await axios.get(backgroundUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    // 2. Extract frames
    // Use 'cumulative: true' to handle transparency correctly
    // We fetch ALL frames initially to get the count, but we will skip frames during processing if there are too many.
    const frameData = await gifFrames({ url: buffer, frames: 'all', outputType: 'png', cumulative: true });

    // 3. Setup Encoder
    const encoder = new GIFEncoder(this.width, this.height);
    const filePath = path.join(this.tempDir, `pnl-card-${Date.now()}.gif`);
    const writeStream = fs.createWriteStream(filePath);
    encoder.createReadStream().pipe(writeStream);
    
    encoder.start();
    encoder.setRepeat(0);   
    encoder.setDelay(100);  
    encoder.setQuality(10); 

    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    // Optimization: limit max frames to prevent OOM
    const MAX_FRAMES = 30; 
    const step = Math.ceil(frameData.length / MAX_FRAMES);

    // 4. Process frames with skipping
    for (let i = 0; i < frameData.length; i += step) {
        const frame = frameData[i];
        
        // Convert frame stream to buffer, then to Image
        const frameImage = await new Promise((resolve, reject) => {
            const chunks = [];
            const stream = frame.getImage();
            stream.on('data', chunk => chunks.push(chunk));
            stream.on('end', () => {
                const img = new (require('canvas').Image)();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = Buffer.concat(chunks);
            });
            stream.on('error', reject);
        });
        
        // Draw frame background
        ctx.drawImage(frameImage, 0, 0, this.width, this.height);
        
        // Explicitly nullify the image to help GC
        // frameImage.src = null; // (Not strictly necessary in this scope but good practice if reuse)

        // Darken overlay
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw UI Overlay
        await this.drawOverlay(ctx, payload);

        // Add frame to encoder
        encoder.addFrame(ctx);
    }

    encoder.finish();

    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(filePath));
        writeStream.on('error', reject);
    });
  }

  async drawOverlay(ctx, payload) {
    const {
        marketName,
        cost,
        sells,
        profit,
        profitPercent,
        textColor,
        accentColor
    } = payload;

    const { loadImage } = require('canvas');

    // Define Colors
    const isPositive = profit >= 0;
    const greenColor = '#00ff88';
    const redColor = '#ff4444';
    const mainColor = isPositive ? (accentColor || greenColor) : redColor;
    const whiteColor = textColor || '#ffffff';

    ctx.fillStyle = whiteColor;

    // Move everything down (Global Layout Offset)
    // Adjusted: 115 (Halfway between 100 and 130)
    let currentY = 115; 

    // 1. Draw Logo (Top Right, Mandatory)
    try {
        const logoUrl = 'https://i.imgur.com/B4oNU7G.png';
        const logoSize = 80; 
        const logoPadding = 40;
        const logoX = this.width - logoSize - logoPadding;
        const logoY = 40;

        // Load the logo image (caching would be better but this works)
        const logoImage = await loadImage(logoUrl);

        ctx.save();
        this.roundRect(ctx, logoX, logoY, logoSize, logoSize, 15);
        ctx.clip();
        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
        ctx.restore();
    } catch (e) {
        // Fail silently or draw placeholder
    }

    // 2. Market Title (Word Wrap with max 2 lines)
    ctx.fillStyle = whiteColor;
    ctx.textAlign = 'left';
    ctx.font = 'bold 43px Arial';
    
    const maxTitleWidth = this.width * 0.7; 
    const titleLineHeight = 50; 
    
    const words = marketName.split(' ');
    let line = '';
    let lineCount = 1;
    
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxTitleWidth && i > 0) {
            if (lineCount >= 2) {
                line = line.trim() + '...';
                break; 
            }
            ctx.fillText(line, 50, currentY);
            line = words[i] + ' ';
            currentY += titleLineHeight;
            lineCount++;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, 50, currentY);
    
    currentY += 40;

    // 3. Main PNL Box
    const pnlText = `${isPositive ? '+' : ''}$${Math.abs(profit).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    ctx.font = 'bold 90px Arial';
    const pnlWidth = ctx.measureText(pnlText).width;
    const boxPadding = 20;
    const boxHeight = 110;
    const boxY = currentY;

    ctx.fillStyle = mainColor;
    ctx.fillRect(50, boxY, pnlWidth + (boxPadding * 2), boxHeight);

    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.fillText(pnlText, 50 + boxPadding, boxY + (boxHeight / 2));

    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = whiteColor;

    // 4. Stats List
    // Adjusted gap: 60 (50 + 25% of difference)
    const startY = boxY + boxHeight + 60;
    // Tighter line height (was 45, now 50)
    const lineHeight = 50;
    const labelX = 50;
    const valueX = 400;

    // Bold font for stats
    ctx.font = 'bold 32px Arial';

    ctx.fillText('PNL', labelX, startY);
    ctx.fillStyle = mainColor;
    ctx.fillText(`${isPositive ? '+' : ''}${profitPercent.toFixed(2)}%`, valueX, startY);

    ctx.fillStyle = whiteColor;
    ctx.fillText('Total Bought', labelX, startY + lineHeight);
    ctx.fillText(`$${cost.toLocaleString('en-US', {minimumFractionDigits: 2})}`, valueX, startY + lineHeight);

    ctx.fillText('Total Sold', labelX, startY + (lineHeight * 2));
    ctx.fillText(`$${sells.toLocaleString('en-US', {minimumFractionDigits: 2})}`, valueX, startY + (lineHeight * 2));

    // 5. User Profile (Moved Up)
    if (payload.username) {
        // Calculate position relative to stats instead of bottom margin
        const profileY = startY + (lineHeight * 3) + 40; // 40px gap below last stat line
        const profileX = 50; 
        const avatarSize = 80;
        const textPadding = 20;

        // Draw Avatar
        if (payload.avatarUrl) {
            try {
                const avatarImage = await loadImage(payload.avatarUrl);
                ctx.save();
                this.roundRect(ctx, profileX, profileY - (avatarSize / 2) - 10, avatarSize, avatarSize, 40);
                ctx.clip();
                ctx.drawImage(avatarImage, profileX, profileY - (avatarSize / 2) - 10, avatarSize, avatarSize);
                ctx.restore();
            } catch (e) {
                ctx.fillStyle = '#555555';
                ctx.beginPath();
                ctx.arc(profileX + avatarSize/2, profileY - 10, avatarSize/2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw Username
        ctx.textAlign = 'left';
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = whiteColor;
        
        const textX = payload.avatarUrl ? (profileX + avatarSize + textPadding) : profileX;
        ctx.fillText(`@${payload.username}`, textX, profileY + 10);

        // 6. Footer (Globe + Trade on kalshi.com) - Below Profile
        const footerY = profileY + 60;
        const footerX = profileX;
        
        // Draw Globe Icon (Load Image)
        const globeSize = 24;
        try {
            const globeUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Globe_icon-white.svg/1024px-Globe_icon-white.svg.png';
            const globeImg = await loadImage(globeUrl);
            ctx.drawImage(globeImg, footerX, footerY - globeSize + 5, globeSize, globeSize);
        } catch (e) {
            // Fallback wireframe if load fails
            ctx.strokeStyle = whiteColor;
            ctx.lineWidth = 2;
            const globeRadius = 12;
            const globeX = footerX + globeRadius;
            const globeYPos = footerY - 5;
            ctx.beginPath();
            ctx.arc(globeX, globeYPos, globeRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw Text
        ctx.font = '24px Arial';
        ctx.fillStyle = whiteColor;
        ctx.fillText('Trade on kalshi.com', footerX + globeSize + 10, footerY);
    }
  }
}

module.exports = CardGenerator;


