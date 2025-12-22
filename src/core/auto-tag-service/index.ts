import { config } from '../../utils/config';
import { logger } from '../../utils/logger';

export interface TagResult {
  tags: string[];
  confidence: number;
}

export class AutoTagService {
  private thaiKeywords: Map<string, string[]> = new Map([
    ['องค์กร', ['บริษัท', 'หน่วยงาน', 'สถาบัน', 'มหาวิทยาลัย', 'โรงเรียน']],
    ['เทคโนโลยี', ['AI', 'ปัญญาประดิษฐ์', 'คอมพิวเตอร์', 'ซอฟต์แวร์', 'ระบบ']],
    ['วิจัย', ['งานวิจัย', 'การศึกษา', 'ทดลอง', 'วิเคราะห์', 'พัฒนา']],
    ['สถานที่', ['กรุงเทพ', 'ไทย', 'ประเทศ', 'จังหวัด', 'เมือง', 'ที่ตั้ง']],
    ['บุคคล', ['นาย', 'นาง', 'ดร.', 'ศาสตราจารย์', 'ผู้อำนวยการ']]
  ]);

  private englishKeywords: Map<string, string[]> = new Map([
    ['organization', ['company', 'institution', 'university', 'school', 'agency']],
    ['technology', ['AI', 'artificial intelligence', 'computer', 'software', 'system']],
    ['research', ['study', 'analysis', 'experiment', 'development', 'investigation']],
    ['location', ['Bangkok', 'Thailand', 'country', 'province', 'city', 'place']],
    ['person', ['Dr.', 'Professor', 'Director', 'Manager', 'CEO']]
  ]);

  generateTags(text: string, entityType?: string): TagResult {
    const language = config.tagging.language;
    const mode = config.tagging.mode;
    
    const tags = new Set<string>();
    let confidence = 0.5;

    // Add entity type as tag
    if (entityType) {
      tags.add(entityType.toLowerCase());
      confidence += 0.1;
    }

    switch (mode) {
      case 'basic':
        this.addBasicTags(text, language, tags);
        break;
      case 'advanced':
        this.addAdvancedTags(text, language, tags);
        confidence += 0.2;
        break;
      case 'ml':
        this.addMLTags(text, language, tags);
        confidence += 0.3;
        break;
    }

    const result = {
      tags: Array.from(tags),
      confidence: Math.min(confidence, 1.0)
    };

    logger.debug(`Generated ${result.tags.length} tags for text (${language}, ${mode}):`, result.tags);
    return result;
  }

  private addBasicTags(text: string, language: string, tags: Set<string>): void {
    const keywords = language === 'th' ? this.thaiKeywords : this.englishKeywords;
    const lowerText = text.toLowerCase();

    keywords.forEach((words, category) => {
      const matchCount = words.filter(word => lowerText.includes(word.toLowerCase())).length;
      if (matchCount > 0) {
        tags.add(category);
      }
    });
  }

  private addAdvancedTags(text: string, language: string, tags: Set<string>): void {
    this.addBasicTags(text, language, tags);
    
    // Extract potential proper nouns and technical terms
    const words = text.split(/\s+/);
    
    words.forEach(word => {
      // Capitalized words (likely proper nouns)
      if (/^[A-Z][a-z]+/.test(word) && word.length > 3) {
        tags.add(word.toLowerCase());
      }
      
      // Technical terms (contains numbers or special chars)
      if (/[0-9]/.test(word) || /[A-Z]{2,}/.test(word)) {
        tags.add(word.toLowerCase());
      }
      
      // Thai words (basic detection)
      if (language === 'th' && /[\u0E00-\u0E7F]/.test(word) && word.length > 2) {
        tags.add(word);
      }
    });

    // Domain-specific patterns
    if (text.includes('API') || text.includes('JSON') || text.includes('HTTP')) {
      tags.add('api');
      tags.add('web-service');
    }
    
    if (text.includes('database') || text.includes('ฐานข้อมูล')) {
      tags.add('database');
    }
  }

  private addMLTags(text: string, language: string, tags: Set<string>): void {
    this.addAdvancedTags(text, language, tags);
    
    // Simulate ML-based tagging with more sophisticated patterns
    const sentences = text.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      
      // Intent detection
      if (lowerSentence.includes('research') || lowerSentence.includes('วิจัย')) {
        tags.add('research-project');
      }
      
      if (lowerSentence.includes('develop') || lowerSentence.includes('พัฒนา')) {
        tags.add('development');
      }
      
      if (lowerSentence.includes('analyze') || lowerSentence.includes('วิเคราะห์')) {
        tags.add('analysis');
      }
      
      // Sentiment-based tags
      if (lowerSentence.includes('important') || lowerSentence.includes('สำคัญ')) {
        tags.add('high-priority');
      }
      
      if (lowerSentence.includes('new') || lowerSentence.includes('ใหม่')) {
        tags.add('recent');
      }
    });

    // Entity relationship detection
    if (text.includes('located in') || text.includes('ตั้งอยู่ที่')) {
      tags.add('location-info');
    }
    
    if (text.includes('works at') || text.includes('ทำงานที่')) {
      tags.add('employment');
    }
  }

  filterTags(tags: string[], minLength: number = 2, maxTags: number = 10): string[] {
    return tags
      .filter(tag => tag.length >= minLength)
      .filter(tag => !this.isStopWord(tag))
      .slice(0, maxTags);
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'และ', 'หรือ', 'แต่', 'ใน', 'บน', 'ที่', 'เพื่อ', 'ของ', 'กับ', 'โดย'
    ]);
    
    return stopWords.has(word.toLowerCase());
  }

  mergeTags(existingTags: string[], newTags: string[]): string[] {
    const merged = new Set([...existingTags, ...newTags]);
    return Array.from(merged);
  }
}

export const autoTagService = new AutoTagService();