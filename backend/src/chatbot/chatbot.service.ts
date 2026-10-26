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
      if (lowerMsg.includes('weather') || lowerMsg.includes('haala qilleensaa')) {
        // Check if they asked for a specific city
        let city = 'Addis Ababa';
        if (lowerMsg.includes('oromia') || lowerMsg.includes('adama')) city = 'Adama';
        else if (lowerMsg.includes('jimma')) city = 'Jimma';
        else if (lowerMsg.includes('hawassa')) city = 'Hawassa';
        else if (lowerMsg.includes('bahir dar')) city = 'Bahir Dar';

        const weather = await this.weatherService.getWeatherByRegion(city);
        const temp = Math.round(weather.current.temperature);
        
        if (lang === 'om') reply = `Haalli qilleensaa ammaa ${city} keessatti: ${temp}°C. Haala: ${weather.current.condition}.`;
        else reply = `Current weather in ${city}: ${temp}°C, ${weather.current.condition}.`;
      } 
      
      // --- MARKET INTENT ---
      else if (lowerMsg.includes('price') || lowerMsg.includes('market') || lowerMsg.includes('cost') || lowerMsg.includes('gatii')) {
        const prices = await this.marketService.getLatestPrices();
        
        // ✅ Smart Crop Detection
        let requestedCrop = 'Coffee'; // Default
        if (lowerMsg.includes('maize') || lowerMsg.includes('corn') || lowerMsg.includes('bofa')) requestedCrop = 'Maize';
        else if (lowerMsg.includes('wheat') || lowerMsg.includes('qamadii')) requestedCrop = 'Wheat';
        else if (lowerMsg.includes('teff') || lowerMsg.includes('xaaﬁi')) requestedCrop = 'Teff';
        else if (lowerMsg.includes('sesame') || lowerMsg.includes('salixa')) requestedCrop = 'Sesame';

        const cropData = prices.find(p => p.commodity.toLowerCase() === requestedCrop.toLowerCase());
        const priceStr = cropData ? cropData.price.toLocaleString() : 'unavailable';
        
        if (lang === 'om') reply = `Gatiin ${requestedCrop} yeroo ammaa kuintaalitti qarshii ${priceStr} ETB dha.`;
        else reply = `The current price of ${requestedCrop} is ${priceStr} ETB per Quintal.`;
      } 
      
      // --- DISEASE INTENT ---
      else if (lowerMsg.includes('disease') || lowerMsg.includes('sick') || lowerMsg.includes('dhukkuba') || lowerMsg.includes('crop')) {
        if (lang === 'om') reply = 'Maaloo suuraa baala dhukkubsate "AI Detection" fuula irratti ol kaa\'aa. Nuti dhukkuba sana beekna.';
        else reply = 'Please upload a photo of the sick leaf on the "AI Detection" page. We will identify the disease.';
      } 
      
      // --- GREETING ---
      else if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey') || lowerMsg.includes('akkam')) {
        if (lang === 'om') reply = 'Akkam! Baga nagaan dhuftan. Har\'a maal si gargaaruu danda\'a?';
        else reply = 'Hello! Welcome. How can I help you today?';
      }

      // --- HOW ARE YOU ---
      else if (lowerMsg.includes('how are you') || lowerMsg.includes('akkam jirta')) {
        if (lang === 'om') reply = 'Ani gaarii dha, galatoomi! Ati hoo? Har\'a maal si gargaaruu danda\'a?';
        else reply = 'I am doing great, thank you! How are you? How can I help you today?';
      }

      // --- FALLBACK ---
      else {
        if (lang === 'om') reply = 'Dhiifama, kana hin hubanne. Waa\'ee gatii, haala qilleensaa yookaan dhukkubaa gaafachuu dandeessu.';
        else reply = 'Sorry, I didn\'t understand that. You can ask about prices, weather, or crop diseases.';
      }

    } catch (error) {
      this.logger.error(`Chatbot error: ${error.message}`);
      reply = lang === 'om' ? 'Dhiifama, dogoggorri uumameera. Maaloo booda yaalaa.' : 'Sorry, an error occurred. Please try again later.';
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