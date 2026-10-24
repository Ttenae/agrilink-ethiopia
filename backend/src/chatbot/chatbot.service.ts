import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketService } from '../market/market.service';
import { WeatherService } from '../weather/weather.service';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private prisma: PrismaService,
    private marketService: MarketService,
    private weatherService: WeatherService,
  ) {}

  async handleMessage(userId: string, message: string, lang: string) {
    const lowerMsg = message.toLowerCase();
    
    // 1. Save User Message
    await this.prisma.chatMessage.create({
      data: { userId, role: 'user', content: message, language: lang },
    });

    let reply = '';

    try {
      // --- WEATHER INTENT ---
      if (lowerMsg.includes('weather') || lowerMsg.includes('የአየር ሁኔታ') || lowerMsg.includes('haala qilleensaa')) {
        const weather = await this.weatherService.getWeatherByRegion('Addis Ababa');
        const temp = Math.round(weather.current.temperature);
        
        if (lang === 'am') reply = `የአሁኑ የአየር ሁኔታ በአዲስ አበባ፡ ${temp}°C ነው። ሁኔታው፡ ${weather.current.condition}።`;
        else if (lang === 'om') reply = `Haalli qilleensaa ammaa Finfinnee keessatti: ${temp}°C. Haala: ${weather.current.condition}.`;
        else reply = `Current weather in Addis Ababa: ${temp}°C, ${weather.current.condition}.`;
      } 
      
      // --- MARKET INTENT ---
      else if (lowerMsg.includes('price') || lowerMsg.includes('market') || lowerMsg.includes('ዋጋ') || lowerMsg.includes('gatii')) {
        const prices = await this.marketService.getLatestPrices();
        const coffee = prices.find(p => p.commodity === 'Coffee');
        const priceStr = coffee ? coffee.price.toLocaleString() : 'N/A';
        
        if (lang === 'am') reply = `የቡና ዋጋ በአሁኑ ጊዜ በኩንታል ${priceStr} ብር ነው።`;
        else if (lang === 'om') reply = `Gatiin buna yeroo ammaa kuintaalitti qarshii ${priceStr} dha.`;
        else reply = `The current price of Coffee is ${priceStr} ETB per Quintal.`;
      } 
      
      // --- DISEASE INTENT ---
      else if (lowerMsg.includes('disease') || lowerMsg.includes('sick') || lowerMsg.includes('በሽታ') || lowerMsg.includes('dhukkuba')) {
        if (lang === 'am') reply = 'እባክዎ የተበላሸውን ቅጠል ፎቶ በ "AI Detection" ገጽ ላይ ይስቀሉ። እኛ በሽታውን እናውቃለን።';
        else if (lang === 'om') reply = 'Maaloo suuraa baala dhukkubsate "AI Detection" fuula irratti ol kaa\'aa. Nuti dhukkuba sana beekna.';
        else reply = 'Please upload a photo of the sick leaf on the "AI Detection" page. We will identify the disease.';
      } 
      
      // --- GREETING ---
      else if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('ሰላም') || lowerMsg.includes('akkam')) {
        if (lang === 'am') reply = 'ሰላም! እንኳን ደህና መጡ። ዛሬ በምን ልርዳዎት?';
        else if (lang === 'om') reply = 'Akkam! Baga nagaan dhuftan. Har\'a maal si gargaaruu danda\'a?';
        else reply = 'Hello! Welcome. How can I help you today?';
      }

      // --- FALLBACK ---
      else {
        if (lang === 'am') reply = 'ይቅርታ፣ ይህንን አልገባኝም። ስለ ዋጋ፣ የአየር ሁኔታ ወይም በሽታ መጠየቅ ይችላሉ።';
        else if (lang === 'om') reply = 'Dhiifama, kana hin hubanne. Waa\'ee gatii, haala qilleensaa yookaan dhukkubaa gaafachuu dandeessu.';
        else reply = 'Sorry, I didn\'t understand that. You can ask about prices, weather, or crop diseases.';
      }

    } catch (error) {
      this.logger.error(`Chatbot error: ${error.message}`);
      reply = lang === 'am' ? 'ይቅርታ፣ ስህተት ተፈጥሯል። እባክዎ ቆይተው ይሞክሩ።' : 
              lang === 'om' ? 'Dhiifama, dogoggorri uumameera. Maaloo booda yaalaa.' : 
              'Sorry, an error occurred. Please try again later.';
    }

    // 2. Save Assistant Message
    const savedReply = await this.prisma.chatMessage.create({
      data: { userId, role: 'assistant', content: reply, language: lang },
    });

    return savedReply;
  }

  async getHistory(userId: string) {
    return this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
  }
}