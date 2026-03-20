// SpicyAPI Service - Adult Content Video Generation
// Documentation: https://www.spicyapi.com/docs

const SPICY_API_BASE = 'https://api.spicyapi.com/v1';

interface SpicyAPIConfig {
  apiKey: string;
  clientId: string;
}

interface VideoGenerationRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_frames?: number;
  guidance_scale?: number;
  seed?: number;
}

interface ImageGenerationRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
}

interface GenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  output?: string[];
  error?: string;
}

class SpicyAPIService {
  private config: SpicyAPIConfig | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    const apiKey = import.meta.env.VITE_SPICY_API_KEY;
    const clientId = import.meta.env.VITE_SPICY_CLIENT_ID;
    
    if (apiKey && clientId) {
      this.config = { apiKey, clientId };
      console.log('✅ SpicyAPI configured');
    } else {
      console.warn('⚠️ SpicyAPI not configured - set VITE_SPICY_API_KEY and VITE_SPICY_CLIENT_ID');
    }
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  // Generate video from text prompt
  async generateVideo(request: VideoGenerationRequest): Promise<GenerationResponse | null> {
    if (!this.config) {
      console.error('SpicyAPI not configured');
      return null;
    }

    try {
      const response = await fetch(`${SPICY_API_BASE}/text-to-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          prompt: request.prompt,
          negative_prompt: request.negative_prompt || 'low quality, blurry, distorted',
          width: request.width || 512,
          height: request.height || 512,
          num_frames: request.num_frames || 16,
          guidance_scale: request.guidance_scale || 7.5,
          seed: request.seed,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('SpicyAPI video generation failed:', error);
        return null;
      }

      const data = await response.json();
      console.log('🎬 SpicyAPI video generation started:', data.id);
      return data;
    } catch (error) {
      console.error('SpicyAPI video generation error:', error);
      return null;
    }
  }

  // Generate image from text prompt
  async generateImage(request: ImageGenerationRequest): Promise<GenerationResponse | null> {
    if (!this.config) {
      console.error('SpicyAPI not configured');
      return null;
    }

    try {
      const response = await fetch(`${SPICY_API_BASE}/text-to-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          prompt: request.prompt,
          negative_prompt: request.negative_prompt || 'low quality, blurry, distorted',
          width: request.width || 512,
          height: request.height || 512,
          num_inference_steps: request.num_inference_steps || 25,
          guidance_scale: request.guidance_scale || 7.5,
          seed: request.seed,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('SpicyAPI image generation failed:', error);
        return null;
      }

      const data = await response.json();
      console.log('🖼️ SpicyAPI image generation started:', data.id);
      return data;
    } catch (error) {
      console.error('SpicyAPI image generation error:', error);
      return null;
    }
  }

  // Check generation status
  async getStatus(generationId: string): Promise<GenerationResponse | null> {
    if (!this.config) {
      console.error('SpicyAPI not configured');
      return null;
    }

    try {
      const response = await fetch(`${SPICY_API_BASE}/status/${generationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('SpicyAPI status check failed:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('SpicyAPI status check error:', error);
      return null;
    }
  }

  // Wait for generation to complete
  async waitForCompletion(generationId: string, maxWaitTime: number = 300000): Promise<GenerationResponse | null> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getStatus(generationId);
      
      if (!status) {
        console.error('Failed to get generation status');
        return null;
      }

      if (status.status === 'completed') {
        console.log('✅ Generation completed:', generationId);
        return status;
      }

      if (status.status === 'failed') {
        console.error('❌ Generation failed:', status.error);
        return status;
      }

      console.log(`⏳ Generation ${status.status}... waiting ${pollInterval/1000}s`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    console.error('⏰ Generation timeout');
    return null;
  }

  // Generate video with automatic waiting
  async generateVideoAndWait(request: VideoGenerationRequest): Promise<string | null> {
    const generation = await this.generateVideo(request);
    
    if (!generation) {
      return null;
    }

    const result = await this.waitForCompletion(generation.id);
    
    if (result && result.status === 'completed' && result.output && result.output[0]) {
      return result.output[0];
    }

    return null;
  }

  // Generate image with automatic waiting
  async generateImageAndWait(request: ImageGenerationRequest): Promise<string | null> {
    const generation = await this.generateImage(request);
    
    if (!generation) {
      return null;
    }

    const result = await this.waitForCompletion(generation.id);
    
    if (result && result.status === 'completed' && result.output && result.output[0]) {
      return result.output[0];
    }

    return null;
  }

  // Generate adult video with optimized prompts
  async generateAdultVideo(
    content: string,
    options: {
      quality?: 'low' | 'medium' | 'high';
      duration?: 'short' | 'medium' | 'long';
    } = {}
  ): Promise<string | null> {
    const qualitySettings = {
      low: { width: 256, height: 256, num_frames: 8 },
      medium: { width: 512, height: 512, num_frames: 16 },
      high: { width: 768, height: 768, num_frames: 24 },
    };

    const durationSettings = {
      short: { num_frames: 8 },
      medium: { num_frames: 16 },
      long: { num_frames: 24 },
    };

    const settings = {
      ...qualitySettings[options.quality || 'medium'],
      ...durationSettings[options.duration || 'medium'],
    };

    // Enhance prompt for better adult content
    const enhancedPrompt = this.enhanceAdultPrompt(content);

    return this.generateVideoAndWait({
      prompt: enhancedPrompt,
      negative_prompt: 'clothing, censoring, mosaic, blur, ugly, deformed, low quality, child, underage',
      ...settings,
      guidance_scale: 8.0,
    });
  }

  // Enhance prompt for adult content
  private enhanceAdultPrompt(content: string): string {
    const enhancements = [
      'cinematic lighting',
      'professional photography',
      'high detail',
      'smooth motion',
      'realistic skin texture',
      'intimate atmosphere',
    ];

    const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
    
    return `${content}, ${randomEnhancement}, 8K quality`;
  }
}

// Export singleton instance
export const spicyAPI = new SpicyAPIService();

// Export types
export type { VideoGenerationRequest, ImageGenerationRequest, GenerationResponse };
