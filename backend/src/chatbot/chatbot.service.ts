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

  // ✅ Mathematical Typo Checker (Levenshtein Distance)
  private isCloseEnough(word1: string, word2: string): boolean {
    if (word1 === word2) return true;
    if (Math.abs(word1.length - word2.length) > 2) return false;

    let differences = 0;
    let i = 0, j = 0;

    while (i < word1.length && j < word2.length) {
      if (word1[i] !== word2[j]) {
        differences++;
        if (word1.length > word2.length) i++;
        else if (word1.length < word2.length) j++;
        else { i++; j++; }
      } else {
        i++; j++;
      }
      if (differences > 2) return false; // Max 2 typos allowed
    }
    return true;
  }

  private hasWord(text: string, keywords: string[]): boolean {
    const words = text.split(' ');
    return words.some(word => keywords.some(keyword => this.isCloseEnough(word, keyword)));
  }

  async handleMessage(userId: string, message: string, lang: string) {
    const lowerMsg = message.toLowerCase().replace(/[.,?!]/g, '').trim();
    
    await this.prisma.chatMessage.create({
      data: { userId, role: 'user', content: message, language: lang },
    });

    let reply = '';

    try {
      // 1. WEATHER
      if (this.hasWord(lowerMsg, ['weather', 'wheater', 'wether', 'qilleensa', 'qileensa'])) {
        let city = 'Addis Ababa';
        
        // ✅ All cities mapped with their correct English spelling
        if (this.hasWord(lowerMsg, ['adama', 'adaama'])) city = 'Adama';
        else if (this.hasWord(lowerMsg, ['jimma', 'jima'])) city = 'Jimma';
        else if (this.hasWord(lowerMsg, ['hawassa', 'hawasa'])) city = 'Hawassa';
        else if (this.hasWord(lowerMsg, ['bahir', 'bahirdar'])) city = 'Bahir Dar';
        else if (this.hasWord(lowerMsg, ['gondar', 'gonda'])) city = 'Gondar';
        else if (this.hasWord(lowerMsg, ['mekelle', 'mekele'])) city = 'Mekelle';
        else if (this.hasWord(lowerMsg, ['dire', 'diredawa'])) city = 'Dire Dawa';
        else if (this.hasWord(lowerMsg, ['harar', 'hara'])) city = 'Harar';
        else if (this.hasWord(lowerMsg, ['arba', 'arbaminch'])) city = 'Arba Minch';
        else if (this.hasWord(lowerMsg, ['bishof', 'bishoftu'])) city = 'Bishoftu';
        else if (this.hasWord(lowerMsg, ['nekemte', 'nekemt'])) city = 'Nekemte';
        else if (this.hasWord(lowerMsg, ['asosa', 'asos', 'asoosaa'])) city = 'Asosa'; // ✅ Handles asoosaa
        else if (this.hasWord(lowerMsg, ['gambela', 'gambella', 'gambel'])) city = 'Gambela';
        else if (this.hasWord(lowerMsg, ['semera', 'semerra'])) city = 'Semera';

        const weather = await this.weatherService.getWeatherByRegion(city);
        const temp = Math.round(weather.current.temperature);
        
        if (lang === 'om') reply = `Haalli qilleensaa ammaa ${city} keessatti: ${temp}°C. Haala: ${weather.current.condition}.`;
        else reply = `Current weather in ${city}: ${temp}°C, ${weather.current.condition}.`;
      } 

      // 2. MARKET
      else if (this.hasWord(lowerMsg, ['price', 'market', 'cost', 'gatiin', 'gatii', 'gattin'])) {
        const prices = await this.marketService.getLatestPrices();
        
        let requestedCrop = 'Coffee';
        let displayCropOm = 'Buna';

        if (this.hasWord(lowerMsg, ['maize', 'corn', 'boqqolloo', 'boqoloo'])) {
          requestedCrop = 'Maize'; displayCropOm = 'Boqqolloo';
        }
        else if (this.hasWord(lowerMsg, ['wheat', 'qamadii', 'qamadi'])) {
          requestedCrop = 'Wheat'; displayCropOm = 'Qamadii';
        }
        else if (this.hasWord(lowerMsg, ['teff', 'xaafii', 'xafii'])) {
          requestedCrop = 'Teff'; displayCropOm = 'Xaafii';
        }
        else if (this.hasWord(lowerMsg, ['sesame', 'salixa'])) {
          requestedCrop = 'Sesame'; displayCropOm = 'Salixa';
        }
        else if (this.hasWord(lowerMsg, ['coffee', 'buna'])) {
          requestedCrop = 'Coffee'; displayCropOm = 'Buna';
        }

        const cropData = prices.find(p => p.commodity.toLowerCase() === requestedCrop.toLowerCase());
        const priceStr = cropData ? cropData.price.toLocaleString() : 'unavailable';
        
        if (lang === 'om') reply = `Gatiin ${displayCropOm} yeroo ammaa kuintaalitti qarshii ${priceStr} ETB dha.`;
        else reply = `The current price of ${requestedCrop} is ${priceStr} ETB per Quintal.`;
      } 
      
      // 3. DISEASE
      else if (this.hasWord(lowerMsg, ['disease', 'sick', 'dhukkuba', 'dukkuba', 'crop'])) {
        if (lang === 'om') reply = 'Maaloo suuraa baala dhukkubsate "AI Detection" fuula irratti ol kaa\'aa.';
        else reply = 'Please upload a photo of the sick leaf on the "AI Detection" page.';
      } 

      // 4. GREETINGS
      else if (this.hasWord(lowerMsg, ['hello', 'hi', 'hey', 'akkam', 'akam', 'salam', 'selam'])) {
        if (lang === 'om') reply = 'Akkam! Baga nagaan dhuftan. Har\'a maal si gargaaruu danda\'a?';
        else reply = 'Hello! Welcome. How can I help you today?';
      }

      // 5. FALLBACK
      else {
        if (lang === 'om') reply = 'Dhiifama, kana hin hubanne. Waa\'ee gatii, haala qilleensaa yookaan dhukkubaa gaafachuu dandeessu.';
        else reply = 'Sorry, I didn\'t understand that. You can ask about prices, weather, or crop diseases.';
      }

    } catch (error) {
      this.logger.error(`Chatbot error: ${error.message}`);
      reply = 'Sorry, an error occurred.';
    }

    const savedReply = await this.prisma.chatMessage.create({
      data: { userId, role: 'assistant', content: reply, language: lang },
    });

    return savedReply;
  }

  async clearHistory(userId: string) {
    await this.prisma.chatMessage.deleteMany({ where: { userId } });
    return { success: true };
  }

  async getHistory(userId: string) {
    return this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
  }
}