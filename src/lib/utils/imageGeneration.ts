import { toPng, toBlob } from 'html-to-image';

type CardFormat = 'story' | 'square' | 'landscape';

const DIMENSIONS: Record<CardFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1920, height: 1080 },
};

interface GenerateOptions {
  pixelRatio?: number;
  backgroundColor?: string;
}

/**
 * Generate a PNG blob from an HTML element
 */
export async function generateCardBlob(
  element: HTMLElement,
  format: CardFormat,
  options: GenerateOptions = {}
): Promise<Blob> {
  const { width, height } = DIMENSIONS[format];
  const { pixelRatio = 2, backgroundColor = '#ffffff' } = options;

  const blob = await toBlob(element, {
    width,
    height,
    pixelRatio,
    backgroundColor,
    cacheBust: true,
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top left',
    },
  });

  if (!blob) {
    throw new Error('Failed to generate image blob');
  }

  return blob;
}

/**
 * Generate a data URL from an HTML element
 */
export async function generateCardDataUrl(
  element: HTMLElement,
  format: CardFormat,
  options: GenerateOptions = {}
): Promise<string> {
  const { width, height } = DIMENSIONS[format];
  const { pixelRatio = 2, backgroundColor = '#ffffff' } = options;

  const dataUrl = await toPng(element, {
    width,
    height,
    pixelRatio,
    backgroundColor,
    cacheBust: true,
  });

  return dataUrl;
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download a card image
 */
export async function downloadCard(
  element: HTMLElement,
  format: CardFormat,
  valueName: string
): Promise<void> {
  const blob = await generateCardBlob(element, format);
  const filename = `${valueName.toLowerCase().replace(/\s+/g, '-')}-values-${format}.png`;
  downloadBlob(blob, filename);
}

/**
 * Share image using Web Share API (mobile)
 */
export async function shareCard(
  element: HTMLElement,
  format: CardFormat,
  title: string,
  url?: string
): Promise<boolean> {
  // Check if Web Share API is available
  if (!navigator.share || !navigator.canShare) {
    return false;
  }

  try {
    const blob = await generateCardBlob(element, format);
    const file = new File([blob], 'my-values.png', { type: 'image/png' });

    const shareData: ShareData = {
      title,
      files: [file],
    };

    if (url) {
      shareData.url = url;
    }

    // Check if we can share files
    if (!navigator.canShare(shareData)) {
      // Fallback to sharing without image
      await navigator.share({
        title,
        url,
      });
      return true;
    }

    await navigator.share(shareData);
    return true;
  } catch (error) {
    // User cancelled or share failed
    if ((error as Error).name !== 'AbortError') {
      console.error('Share failed:', error);
    }
    return false;
  }
}

/**
 * Copy link to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}
