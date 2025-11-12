import { createWorker, PSM, type Worker } from 'tesseract.js';

export interface ISICCardData {
  cardNumber: string;
  fullName: string;
  dateOfBirth: string;
  expiryDate: string;
  institution: string;
  cardType: 'physical' | 'digital';
  confidence: number;
}

export interface OCRProgress {
  status: string;
  progress: number;
}

let worker: Worker | null = null;

export async function initializeOCRWorker(
  onProgress?: (progress: OCRProgress) => void
): Promise<void> {
  if (worker) return;

  worker = await createWorker('eng', 1, {
    logger: (m: any) => {
      if (onProgress) {
        onProgress({
          status: m.status,
          progress: m.progress || 0
        });
      }
    }
  });

  await worker.setParameters({
    tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-/:. ',
    tessedit_pageseg_mode: PSM.SPARSE_TEXT
  });
}

export async function terminateOCRWorker(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

export async function extractISICFields(
  imageFile: File,
  onProgress?: (progress: OCRProgress) => void
): Promise<ISICCardData> {
  await initializeOCRWorker(onProgress);

  if (!worker) {
    throw new Error('OCR worker not initialized');
  }

  const { data } = await worker.recognize(imageFile);
  const text = data.text;
  const confidence = data.confidence;

  return {
    cardNumber: parseCardNumber(text) || '',
    fullName: parseFullName(text) || '',
    dateOfBirth: parseDateOfBirth(text) || '',
    expiryDate: parseExpiryDate(text) || '',
    institution: parseInstitution(text) || '',
    cardType: detectCardType(text),
    confidence
  };
}

function parseCardNumber(text: string): string | null {
  const patterns = [
    /\b(\d{8,10})\b/,
    /Card\s*(?:No|Number)[:\s]*(\d{8,10})/i,
    /ISIC[:\s]*(\d{8,10})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  const digitSequences = text.match(/\d{8,10}/g);
  if (digitSequences && digitSequences.length > 0) {
    return digitSequences[0];
  }

  return null;
}

function parseFullName(text: string): string | null {
  const patterns = [
    /Name[:\s]*([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    /([A-Z][A-Z\s]{10,40})/,
    /Student[:\s]*([A-Z][a-z]+\s+[A-Z][a-z]+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.split(/\s+/).length >= 2) {
        return name;
      }
    }
  }

  const allCapsPattern = /\b([A-Z]{2,}\s+[A-Z]{2,})\b/;
  const allCapsMatch = text.match(allCapsPattern);
  if (allCapsMatch && allCapsMatch[1]) {
    return allCapsMatch[1]
      .split(/\s+/)
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  return null;
}

function parseDateOfBirth(text: string): string | null {
  const patterns = [
    /(?:DOB|Date of Birth|Born)[:\s]*(\d{2}[-/.]\d{2}[-/.]\d{4})/i,
    /(?:DOB|Date of Birth|Born)[:\s]*(\d{4}[-/.]\d{2}[-/.]\d{2})/i,
    /\b(\d{2}[-/.]\d{2}[-/.](19|20)\d{2})\b/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return normalizeDateFormat(match[1]);
    }
  }

  return null;
}

function parseExpiryDate(text: string): string | null {
  const patterns = [
    /(?:Valid|Expires|Expiry|Until)[:\s]*(\d{2}[-/.]\d{2}[-/.]\d{4})/i,
    /(?:Valid|Expires|Expiry|Until)[:\s]*(\d{4}[-/.]\d{2}[-/.]\d{2})/i,
    /(?:Valid|Expires)[:\s]*((?:0[1-9]|1[0-2])[-/.](?:20)\d{2})/i,
    /\b(\d{2}[-/.](20)\d{2})\b/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const normalized = normalizeDateFormat(match[1]);
      const expiryYear = parseInt(normalized.split('-')[0]);
      const currentYear = new Date().getFullYear();
      
      if (expiryYear >= currentYear && expiryYear <= currentYear + 10) {
        return normalized;
      }
    }
  }

  return null;
}

function parseInstitution(text: string): string | null {
  const keywords = [
    'University',
    'College',
    'Institute',
    'School',
    'Academy',
    'Университет'
  ];

  const lines = text.split('\n').filter(line => line.trim().length > 0);

  for (const line of lines) {
    for (const keyword of keywords) {
      if (line.includes(keyword)) {
        const cleanLine = line.replace(/\s+/g, ' ').trim();
        if (cleanLine.length > 5 && cleanLine.length < 100) {
          return cleanLine;
        }
      }
    }
  }

  const institutionPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,5}\s+(?:University|College|Institute))/;
  const match = text.match(institutionPattern);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

function detectCardType(text: string): 'physical' | 'digital' {
  const digitalKeywords = ['digital', 'virtual', 'e-card', 'mobile'];
  const textLower = text.toLowerCase();

  for (const keyword of digitalKeywords) {
    if (textLower.includes(keyword)) {
      return 'digital';
    }
  }

  return 'physical';
}

function normalizeDateFormat(dateStr: string): string {
  const parts = dateStr.split(/[-/.]/);

  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }

  if (parts.length === 2) {
    return `${parts[1]}-${parts[0].padStart(2, '0')}-01`;
  }

  return dateStr;
}

export async function preprocessImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      const maxWidth = 1920;
      const maxHeight = 1080;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.filter = 'contrast(1.2) brightness(1.1)';
        ctx.drawImage(img, 0, 0, width, height);

        ctx.filter = 'none';
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = avg;
          data[i + 1] = avg;
          data[i + 2] = avg;
        }

        ctx.putImageData(imageData, 0, 0);
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to process image'));
          }
        },
        'image/png',
        0.9
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}
