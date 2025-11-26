const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function downloadLogo() {
    const url = 'https://upload.wikimedia.org/wikipedia/en/thumb/9/98/Discord_logo.svg/2048px-Discord_logo.svg.png';
    const writer = fs.createWriteStream(path.join(__dirname, 'assets/discord_logo.png'));

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

downloadLogo().then(() => console.log('Logo downloaded')).catch(err => console.error(err));
