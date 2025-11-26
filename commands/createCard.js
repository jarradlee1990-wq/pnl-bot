const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const KalshiAPI = require('../utils/kalshiAPI');
const CardGenerator = require('../utils/cardGenerator');
const storage = require('../utils/storage');

const kalshiAPI = new KalshiAPI(process.env.KALSHI_BASE_URL);
const cardGenerator = new CardGenerator();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createcard')
    .setDescription('Generate a PNL share card')
    .addStringOption((option) =>
      option.setName('market').setDescription('Kalshi market code').setRequired(true),
    )
    .addNumberOption((option) =>
      option.setName('cost').setDescription('Your total cost basis').setRequired(true),
    )
    .addNumberOption((option) =>
      option.setName('sells').setDescription('Total sells/returns').setRequired(true),
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const rawMarketCode = interaction.options.getString('market');
    // Clean the input: trim spaces and force uppercase
    const marketCode = rawMarketCode.trim().toUpperCase();
    
    const cost = interaction.options.getNumber('cost');
    const sells = interaction.options.getNumber('sells');
    const profit = sells - cost;
    const profitPercent = cost !== 0 ? (profit / cost) * 100 : 0;

    // Fetch market data
    let marketName = marketCode;
    try {
      console.log(`Attempting to fetch market: ${marketCode}`);
      // 1. Try fetching as a specific market
      let isEvent = false;
      let data = null;

      try {
        const marketRes = await kalshiAPI.getMarketByTicker(marketCode);
        data = marketRes.market || marketRes;
      } catch (err) {
        console.log(`Not a direct market (404 or error): ${err.message}. Trying as Event...`);
        // 2. If market fetch fails, try fetching as an Event directly
        try {
            const eventRes = await kalshiAPI.getEventByTicker(marketCode);
            data = eventRes.event || eventRes;
            isEvent = true;
        } catch (eventErr) {
            console.log(`Not a direct event either: ${eventErr.message}. Trying as Series...`);
            // 3. If event fetch fails, try fetching as a Series directly
            try {
                const seriesRes = await kalshiAPI.getSeriesByTicker(marketCode);
                data = seriesRes.series || seriesRes;
                // Treat series like an event for title extraction
                isEvent = true; 
            } catch (seriesErr) {
                console.log(`Not a series either: ${seriesErr.message}`);
                throw err; // Throw the original market error to trigger search fallback
            }
        }
      }

      if (data) {
        if (isEvent) {
            // It is a direct event
            marketName = data.title;
        } else {
            // It is a market
            if (data.event_ticker) {
                try {
                    const eventRes = await kalshiAPI.getEventByTicker(data.event_ticker);
                    const eventData = eventRes.event || eventRes;
                    marketName = eventData.title || data.title;
                } catch (e) {
                    marketName = data.title || data.ticker;
                }
            } else {
                marketName = data.title || data.ticker;
            }
        }
      }

    } catch (error) {
      console.warn(`Unable to fetch market ${marketCode}: ${error.message}`);
      try {
        const search = await kalshiAPI.searchMarkets(marketCode);
        // Only use search result if it looks relevant (fuzzy match on ticker or exact match)
        if (search.markets?.length) {
           const exactMatch = search.markets.find(m => m.ticker === marketCode || m.event_ticker === marketCode);
           if (exactMatch) {
               marketName = exactMatch.title;
           } else {
               // If no exact match, be careful. The search API might return popular markets.
               // We'll trust the first result ONLY if the user didn't provide a specific-looking ticker code.
               // But since they provided a code, we should probably fail if no exact ticker match.
               console.log(`Search found ${search.markets.length} results but no exact match for ${marketCode}. First result: ${search.markets[0].ticker}`);
               
               // Simple heuristic: if the input looks like a ticker (contains dashes/caps), don't use fuzzy search results
               if (marketCode.includes('-')) {
                   throw new Error('No exact match found for ticker');
               }
               marketName = search.markets[0].title || search.markets[0].ticker || marketName;
           }
        } else {
            throw new Error('No search results');
        }
      } catch (secondary) {
        console.warn(`Fallback search failed: ${secondary.message}`);
        await interaction.editReply({
            content: `Could not find market or event with code: **${marketCode}**. Please check the ticker.`,
            ephemeral: true
        });
        return; // Stop execution
      }
    }

    const userSettings = storage.getUserSettings(interaction.user.id);

    try {
      let cardPath;
      const payload = {
        marketName,
        cost,
        sells,
        profit,
        profitPercent,
        backgroundUrl: userSettings.backgroundUrl,
        backgroundColor: userSettings.backgroundColor,
        textColor: userSettings.textColor,
        accentColor: userSettings.accentColor,
        username: userSettings.username,
        avatarUrl: userSettings.avatarUrl, // Pass avatar URL
      };

      // Check if background is animated
      if (payload.backgroundUrl && (payload.backgroundUrl.endsWith('.gif') || payload.backgroundUrl.includes('.gif'))) {
          await interaction.editReply({ content: `Generating animated card... this might take a moment.` });
          cardPath = await cardGenerator.generateAnimatedCard(payload);
      } else {
          cardPath = await cardGenerator.generateCard(payload);
      }

      const attachment = new AttachmentBuilder(cardPath, { name: cardPath.endsWith('.gif') ? 'pnl-card.gif' : 'pnl-card.png' });

      await interaction.editReply({
        content: `**${marketName}**\nProfit: $${profit.toFixed(
          2,
        )} (${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%)`,
        files: [attachment],
      });
    } catch (error) {
      console.error('Card generation failed:', error);
      await interaction.editReply('Failed to generate card. Please try again later.');
    }
  },
};


