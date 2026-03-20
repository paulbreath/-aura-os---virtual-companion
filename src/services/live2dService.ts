// Live2D Service - Dynamic Character Animation
// Documentation: https://github.com/guansss/pixi-live2d-display

import * as PIXI from 'pixi.js';
import { Live2DModel, Cubism4ModelSettings } from 'pixi-live2d-display';

// 配置 Cubism Core 运行时路径
// 注意：需要在 public 目录下放置 Cubism Core 文件
// 从 https://live2d.github.io/cubism-core/ 下载
declare global {
  interface Window {
    Live2DCubismCore: any;
  }
}

// Live2D 表情/动作映射
export interface Live2DExpression {
  id: string;
  name: string;
  description: string;
  motionGroup?: string;
  motionIndex?: number;
}

// 成人内容专用表情和动作
export const ADULT_EXPRESSIONS: Live2DExpression[] = [
  // 基础表情
  { id: 'happy', name: '开心', description: '愉悦的表情', motionGroup: 'Happy', motionIndex: 0 },
  { id: 'shy', name: '害羞', description: '害羞的表情', motionGroup: 'Shy', motionIndex: 0 },
  { id: 'flirty', name: '调情', description: '挑逗的表情', motionGroup: 'Flirty', motionIndex: 0 },
  { id: 'excited', name: '兴奋', description: '兴奋的表情', motionGroup: 'Excited', motionIndex: 0 },
  { id: 'seductive', name: '诱惑', description: '诱惑的表情', motionGroup: 'Seductive', motionIndex: 0 },
  
  // 亲密表情
  { id: 'aroused', name: '动情', description: '情动的表情', motionGroup: 'Aroused', motionIndex: 0 },
  { id: 'pleasure', name: '享受', description: '享受的表情', motionGroup: 'Pleasure', motionIndex: 0 },
  { id: 'ecstasy', name: '高潮', description: '高潮的表情', motionGroup: 'Ecstasy', motionIndex: 0 },
  { id: 'breathless', name: '喘息', description: '喘息的表情', motionGroup: 'Breathless', motionIndex: 0 },
  
  // 动作
  { id: 'wave', name: '挥手', description: '打招呼', motionGroup: 'TapBody', motionIndex: 0 },
  { id: 'nod', name: '点头', description: '同意', motionGroup: 'TapBody', motionIndex: 1 },
  { id: 'shake', name: '摇头', description: '拒绝', motionGroup: 'TapBody', motionIndex: 2 },
  { id: 'lean_forward', name: '前倾', description: '靠近', motionGroup: 'TapBody', motionIndex: 3 },
  { id: 'lean_back', name: '后仰', description: '放松', motionGroup: 'TapBody', motionIndex: 4 },
];

// 服装状态
export type ClothingState = 'dressed' | 'lingerie' | 'topless' | 'nude';

class Live2DService {
  private app: PIXI.Application | null = null;
  private model: any = null;
  private container: HTMLElement | null = null;
  private isInitialized = false;
  private currentExpression = 'happy';
  private clothingState: ClothingState = 'dressed';

  // 初始化 Live2D
  async initialize(container: HTMLElement): Promise<boolean> {
    try {
      this.container = container;
      
      // 创建 PIXI 应用
      this.app = new PIXI.Application({
        width: container.clientWidth,
        height: container.clientHeight,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      container.appendChild(this.app.view as HTMLCanvasElement);
      
      // 监听窗口大小变化
      window.addEventListener('resize', this.handleResize.bind(this));
      
      this.isInitialized = true;
      console.log('✅ Live2D initialized');
      return true;
    } catch (error) {
      console.error('❌ Live2D initialization failed:', error);
      return false;
    }
  }

  // 加载模型
  async loadModel(modelPath: string): Promise<boolean> {
    if (!this.app || !this.isInitialized) {
      console.error('Live2D not initialized');
      return false;
    }

    try {
      // 移除旧模型
      if (this.model) {
        if (this.model.parent) {
          this.model.parent.removeChild(this.model);
        }
        this.model.destroy();
      }

      console.log('🔄 Loading Live2D model:', modelPath);
      
      // 加载新模型
      // 注意：pixi-live2d-display 会自动检测模型版本
      this.model = await Live2DModel.from(modelPath, {
        autoInteract: true,
      });

      // 设置模型位置和大小
      this.model.anchor.set(0.5, 0.5);
      this.model.x = this.app.screen.width / 2;
      this.model.y = this.app.screen.height / 2;
      
      // 自适应大小
      const scale = Math.min(
        this.app.screen.width / this.model.width,
        this.app.screen.height / this.model.height
      ) * 0.8;
      this.model.scale.set(scale);

      // 添加到舞台
      this.app.stage.addChild(this.model);

      // 设置交互
      this.setupInteraction();

      console.log('✅ Live2D model loaded:', modelPath);
      return true;
    } catch (error) {
      console.error('❌ Failed to load Live2D model:', error);
      return false;
    }
  }

  // 设置交互
  private setupInteraction() {
    if (!this.model) return;

    // 鼠标跟踪
    this.model.on('pointermove', (event: any) => {
      const point = event.getLocalPosition(this.model);
      this.model.focus(point.x, point.y);
    });

    // 点击触发动作
    this.model.on('pointertap', () => {
      this.playRandomMotion();
    });
  }

  // 播放表情
  async setExpression(expressionId: string): Promise<boolean> {
    if (!this.model) return false;

    const expression = ADULT_EXPRESSIONS.find(e => e.id === expressionId);
    if (!expression) {
      console.error('Expression not found:', expressionId);
      return false;
    }

    try {
      // 尝试播放表情
      if (expression.motionGroup) {
        this.model.motion(expression.motionGroup, expression.motionIndex || 0);
      }
      
      this.currentExpression = expressionId;
      console.log('🎭 Expression set:', expression.name);
      return true;
    } catch (error) {
      console.error('Failed to set expression:', error);
      return false;
    }
  }

  // 播放随机动作
  async playRandomMotion(): Promise<void> {
    if (!this.model) return;

    const motions = ['TapBody', 'Idle', 'Happy', 'Shy'];
    const randomMotion = motions[Math.floor(Math.random() * motions.length)];
    
    try {
      this.model.motion(randomMotion);
    } catch (error) {
      console.error('Failed to play motion:', error);
    }
  }

  // 播放特定动作组
  async playMotion(group: string, index: number = 0): Promise<boolean> {
    if (!this.model) return false;

    try {
      this.model.motion(group, index);
      console.log('🎬 Motion played:', group, index);
      return true;
    } catch (error) {
      console.error('Failed to play motion:', error);
      return false;
    }
  }

  // 设置服装状态
  async setClothingState(state: ClothingState): Promise<boolean> {
    if (!this.model) return false;

    try {
      // 通过切换模型皮肤来实现服装变化
      // 这需要模型支持多个皮肤/服装
      const skinIndex = this.getClothingSkinIndex(state);
      
      // 尝试设置皮肤
      if (this.model.internalModel && this.model.internalModel.coreModel) {
        const coreModel = this.model.internalModel.coreModel;
        if (coreModel && coreModel.setParameterValueById) {
          // 设置服装参数
          coreModel.setParameterValueById('ParamClothing', skinIndex);
        }
      }

      this.clothingState = state;
      console.log('👗 Clothing state set:', state);
      return true;
    } catch (error) {
      console.error('Failed to set clothing state:', error);
      return false;
    }
  }

  // 获取服装皮肤索引
  private getClothingSkinIndex(state: ClothingState): number {
    const mapping: Record<ClothingState, number> = {
      'dressed': 0,
      'lingerie': 1,
      'topless': 2,
      'nude': 3,
    };
    return mapping[state];
  }

  // 设置模型参数
  async setParameter(paramName: string, value: number): Promise<void> {
    if (!this.model || !this.model.internalModel) return;

    try {
      const coreModel = this.model.internalModel.coreModel;
      if (coreModel && coreModel.setParameterValueById) {
        coreModel.setParameterValueById(paramName, value);
      }
    } catch (error) {
      console.error('Failed to set parameter:', error);
    }
  }

  // 获取当前表情
  getCurrentExpression(): string {
    return this.currentExpression;
  }

  // 获取当前服装状态
  getClothingState(): ClothingState {
    return this.clothingState;
  }

  // 是否已初始化
  isReady(): boolean {
    return this.isInitialized && this.model !== null;
  }

  // 处理窗口大小变化
  private handleResize() {
    if (!this.app || !this.container || !this.model) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.app.renderer.resize(width, height);
    
    this.model.x = width / 2;
    this.model.y = height / 2;
    
    const scale = Math.min(
      width / this.model.width,
      height / this.model.height
    ) * 0.8;
    this.model.scale.set(scale);
  }

  // 销毁
  destroy() {
    if (this.model) {
      this.model.destroy();
      this.model = null;
    }
    
    if (this.app) {
      this.app.destroy(true);
      this.app = null;
    }
    
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.isInitialized = false;
    
    console.log('🗑️ Live2D destroyed');
  }
}

// 导出单例
export const live2dService = new Live2DService();
