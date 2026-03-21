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

// Live2D 表情
export interface Live2DExpression {
  id: string;
  name: string;
  description: string;
  type: 'expression' | 'motion';
  motionGroup?: string;
  motionIndex?: number;
}

// Epsilon 模型表情 (基于 .exp3.json 文件)
export const EXPRESSIONS: Live2DExpression[] = [
  { id: 'Normal', name: '普通', description: '普通表情', type: 'expression' },
  { id: 'Smile', name: '微笑', description: '微笑表情', type: 'expression' },
  { id: 'Angry', name: '生气', description: '生气表情', type: 'expression' },
  { id: 'Sad', name: '难过', description: '难过表情', type: 'expression' },
  { id: 'Surprised', name: '惊讶', description: '惊讶表情', type: 'expression' },
  { id: 'Blushing', name: '害羞', description: '脸红表情', type: 'expression' },
];

// Epsilon 模型动作 (基于 motion3.json 文件)
export const MOTIONS: Live2DExpression[] = [
  { id: 'Idle', name: '待机', description: '空闲动作', type: 'motion', motionGroup: 'Idle' },
  { id: 'Tap', name: '轻触', description: '点击动作', type: 'motion', motionGroup: 'Tap' },
  { id: 'FlickUp', name: '上滑', description: '向上轻弹', type: 'motion', motionGroup: 'FlickUp' },
  { id: 'FlickDown', name: '下滑', description: '向下轻弹', type: 'motion', motionGroup: 'FlickDown' },
  { id: 'Flick', name: '轻弹', description: '左右轻弹', type: 'motion', motionGroup: 'Flick' },
  { id: 'Shake', name: '摇头', description: '摇头动作', type: 'motion', motionGroup: 'Shake' },
];

// 兼容旧代码
export const ADULT_EXPRESSIONS = [...EXPRESSIONS, ...MOTIONS];

// 服装状态
export type ClothingState = 'dressed' | 'lingerie' | 'topless' | 'nude';

class Live2DService {
  private app: PIXI.Application | null = null;
  private model: any = null;
  private container: HTMLElement | null = null;
  private isInitialized = false;
  private currentExpression = 'Normal';
  private clothingState: ClothingState = 'dressed';

  // 初始化 Live2D
  async initialize(container: HTMLElement): Promise<boolean> {
    try {
      this.container = container;
      
      // 为 Live2D 模型添加 isInteractive 方法 (PixiJS 7 需要)
      const patchLive2D = () => {
        if (typeof window !== 'undefined' && (window as any).Live2DCubismCore) {
          // 在 Live2D 模型原型上添加缺失的方法
          const originalFrom = (window as any).PIXI?.Live2DModel?.from;
          if (originalFrom) {
            const patchedFrom = async function(...args: any[]) {
              const model = await originalFrom.apply(this, args);
              if (model) {
                model.isInteractive = () => false;
                model.eventMode = 'none';
              }
              return model;
            };
            (window as any).PIXI.Live2DModel.from = patchedFrom;
          }
        }
      };
      
      patchLive2D();
      
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

      // 禁用事件系统 (PixiJS 7)
      if ((this.app.renderer as any).events) {
        (this.app.renderer as any).events.destroy();
        (this.app.renderer as any).events = null;
      }

      container.appendChild(this.app.view as HTMLCanvasElement);
      
      // 监听窗口大小变化
      window.addEventListener('resize', this.handleResize.bind(this));
      
      this.isInitialized = true;
      console.log('✅ Live2D initialized with events disabled');
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
      
      // 注册 Ticker (必须在加载模型前)
      Live2DModel.registerTicker(PIXI.Ticker as any);

      // 加载新模型 - 禁用自动交互避免错误
      console.log('🔄 Loading model with autoInteract disabled...');
      this.model = await Live2DModel.from(modelPath, {
        autoInteract: false,
      });

      // 为模型添加 isInteractive 方法 (PixiJS 7 需要)
      if (this.model && !(this.model as any).isInteractive) {
        (this.model as any).isInteractive = () => false;
      }
      // 设置 eventMode 为 none 禁用事件
      if (this.model) {
        (this.model as any).eventMode = 'none';
      }

      // 调试：检查模型信息
      console.log('📊 Model info:', {
        width: this.model.width,
        height: this.model.height,
        internalModel: !!this.model.internalModel,
        coreModel: !!this.model.internalModel?.coreModel,
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

      // 强制更新模型以渲染纹理
      this.model.update(0);

      console.log('✅ Live2D model loaded:', modelPath);
      return true;
    } catch (error) {
      console.error('❌ Failed to load Live2D model:', error);
      return false;
    }
  }

  // 设置交互（禁用以避免 PixiJS 错误）
  private setupInteraction() {
    if (!this.model) return;

    try {
      // 禁用自动交互，只通过控制面板操作
      this.model.autoInteract = false;
      console.log('🔧 Live2D auto interaction disabled');
    } catch (error) {
      console.warn('⚠️ Could not disable auto interaction:', error);
    }
  }

  // 设置表情或动作
  async setExpression(expressionId: string): Promise<boolean> {
    if (!this.model) return false;

    const item = ADULT_EXPRESSIONS.find(e => e.id === expressionId);
    if (!item) {
      console.error('Expression/Motion not found:', expressionId);
      return false;
    }

    try {
      if (item.type === 'expression') {
        // 设置表情文件 (.exp3.json)
        this.model.expression(item.id);
        console.log('😊 Expression set:', item.name);
      } else if (item.type === 'motion' && item.motionGroup) {
        // 播放动作
        this.model.motion(item.motionGroup);
        console.log('🎬 Motion played:', item.name);
      }
      
      this.currentExpression = expressionId;
      return true;
    } catch (error) {
      console.error('Failed to set expression/motion:', error);
      return false;
    }
  }

  // 播放随机动作
  async playRandomMotion(): Promise<void> {
    if (!this.model) return;

    const motions = ['Idle', 'Tap', 'Flick', 'FlickUp', 'FlickDown'];
    const randomMotion = motions[Math.floor(Math.random() * motions.length)];
    
    try {
      this.model.motion(randomMotion);
    } catch (error) {
      console.error('Failed to play motion:', error);
    }
  }

  // 根据文本内容自动选择表情和动作
  async reactToText(text: string): Promise<void> {
    if (!this.model) return;

    const lowerText = text.toLowerCase();
    
    // 评分系统 - 更精确的情感检测
    let scores = {
      happy: 0,
      shy: 0,
      angry: 0,
      sad: 0,
      surprised: 0,
    };

    // 开心/正面 - 加分
    if (/开心|快乐|高兴|好棒|厉害|优秀|完美|太好了|谢谢|感谢|喜欢|爱|❤|💕|😍|😊|😄|哈哈|呵呵|漂亮|美丽|可爱|厉害|棒|赞|不错|好玩|有趣|惊喜/.test(lowerText)) {
      scores.happy += 3;
    }
    if (/笑|哈哈|嘿嘿|嘻嘻|呵呵|欢乐|愉快|幸福|甜蜜/.test(lowerText)) {
      scores.happy += 2;
    }
    if (/好|行|对|是的|没错|同意|支持|加油/.test(lowerText)) {
      scores.happy += 1;
    }

    // 害羞 - 加分
    if (/害羞|不好意思|难为情|脸红|心跳|心动|想你|爱你|喜欢你|抱抱|亲亲|亲|抱|么么|贴贴|撒娇|撩|调情|勾引/.test(lowerText)) {
      scores.shy += 3;
    }
    if(/亲|抱|想|念|爱|甜|蜜/.test(lowerText)) {
      scores.shy += 1;
    }

    // 生气 - 加分
    if (/生气|愤怒|讨厌|恨|烦|滚|闭嘴|混蛋|混球|混账|该死|去死|恶心|呕吐|垃圾|废物|笨蛋|蠢货|傻逼|脑残|白痴/.test(lowerText)) {
      scores.angry += 3;
    }
    if (/差|烂|糟|糟糕|失望|不满|抱怨|骂|责怪|批评/.test(lowerText)) {
      scores.angry += 1;
    }

    // 难过 - 加分
    if (/难过|伤心|悲伤|痛苦|哭泣|哭|泪|眼泪|呜呜|呜|心碎|心痛|心疼|失落|孤独|寂寞|无助|绝望|沮丧|抑郁/.test(lowerText)) {
      scores.sad += 3;
    }
    if (/唉|哎|唉呀|可惜|遗憾|抱歉|对不起|不好意思/.test(lowerText)) {
      scores.sad += 1;
    }

    // 惊讶 - 加分
    if (/哇|天哪|天啊|我的天|不会吧|真的假的|怎么可能|居然|竟然|竟然|没想到|出乎意料|太意外|惊讶|震惊|惊呆|惊吓/.test(lowerText)) {
      scores.surprised += 3;
    }
    if (/什么|啥|咦|啊|噢|哦/.test(lowerText)) {
      scores.surprised += 1;
    }

    // 叹号/问号影响
    if (/!+|！+/.test(text)) {
      scores.surprised += 1;
      scores.happy += 0.5;
    }

    // 找出最高分的情感
    let expressionId = 'Normal';
    let maxScore = 0;
    
    for (const [emotion, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        switch (emotion) {
          case 'happy': expressionId = 'Smile'; break;
          case 'shy': expressionId = 'Blushing'; break;
          case 'angry': expressionId = 'Angry'; break;
          case 'sad': expressionId = 'Sad'; break;
          case 'surprised': expressionId = 'Surprised'; break;
        }
      }
    }

    // 设置表情
    await this.setExpression(expressionId);

    // 根据情感强度决定是否添加动作
    if (maxScore >= 2) {
      setTimeout(() => {
        let motion = 'Tap';
        if (scores.angry > 2) motion = 'Shake';
        else if (scores.surprised > 2) motion = 'FlickUp';
        else if (scores.sad > 2) motion = 'FlickDown';
        else motion = ['Tap', 'Flick', 'FlickUp'][Math.floor(Math.random() * 3)];
        
        this.model?.motion(motion);
      }, 300);
    }

    console.log('🎭 Reacted:', { expressionId, scores, maxScore });
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
      this.clothingState = state;
      console.log('👗 Clothing state set:', state);
      return true;
    } catch (error) {
      console.error('Failed to set clothing state:', error);
      return false;
    }
  }

  // 切换部件可见性
  async togglePartsOpacity(partsId: string): Promise<boolean> {
    if (!this.model) return false;

    try {
      const parts = this.model.internalModel?.coreModel?.getPartsOpacity;
      if (parts !== undefined) {
        const currentOpacity = this.model.internalModel.coreModel.getPartsOpacity(partsId);
        const newOpacity = currentOpacity > 0.5 ? 0 : 1;
        this.model.internalModel.coreModel.setPartsOpacity(partsId, newOpacity);
        console.log('👁️ Toggled parts:', partsId, 'opacity:', newOpacity);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to toggle parts opacity:', error);
      return false;
    }
  }

  // 恢复所有部件可见性
  async restoreAllParts(): Promise<boolean> {
    if (!this.model) return false;

    try {
      const partsIds = [
        'PARTS_01_CLOTHES',
        'PARTS_01_BODY', 
        'PARTS_01_HAIR_FRONT_002',
        'PARTS_01_HAIR_SIDE_002',
        'PARTS_01_HAIR_BACK_002'
      ];
      
      for (const id of partsIds) {
        try {
          this.model.internalModel?.coreModel?.setPartsOpacity(id, 1);
        } catch (e) {}
      }
      
      console.log('✅ Restored all parts');
      return true;
    } catch (error) {
      console.error('Failed to restore parts:', error);
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
