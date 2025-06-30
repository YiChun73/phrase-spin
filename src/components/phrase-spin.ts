// phrase-spin.ts
import { LitElement, css, html, TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

// 定義插件選項介面
export interface PhraseSpinOptions {
  phrases: string[]
  animation?: string    // CSS 動畫名稱
  speed?: number        // 旋轉速度（毫秒）
}

/**
 * phrase-spin Web Component 元件
 * 說明：
 *  - 用來展示文字短語輪播的插件
 *  - 使用者可透過 HTML 屬性設定，也可以 JavaScript 動態指定
 */
@customElement('phrase-spin')
export class PhraseSpinElement extends LitElement {
  // 設定預設屬性與型別
  @property({ type: Array })
  phrases: string[] = []

  @property({ type: String })
  animation: string = 'bounceIn'

  @property({ type: Number })
  speed: number = 2000

  // 將 currentIndex 標記為反應性狀態
  @state()
  private currentIndex: number = -1

  // 存放動畫輪詢的 timer id
  private intervalId?: number

  // 使用 native CSS 實作基本動畫，這裡可根據需求自訂動畫
  static styles = css`
    :host {
      display: inline-block;
    }
    .animated {
      display: inline-block;
    }
    /* 範例動畫：bounceIn */
    @keyframes bounceIn {
      from,
      20%,
      40%,
      60%,
      80%,
      to {
        animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
      }

      0% {
        opacity: 0;
        transform: scale3d(0.3, 0.3, 0.3);
      }

      20% {
        transform: scale3d(1.1, 1.1, 1.1);
      }

      40% {
        transform: scale3d(0.9, 0.9, 0.9);
      }

      60% {
        opacity: 1;
        transform: scale3d(1.03, 1.03, 1.03);
      }

      80% {
        transform: scale3d(0.97, 0.97, 0.97);
      }

      to {
        opacity: 1;
        transform: scale3d(1, 1, 1);
      }
    }
    .bounceIn {
      animation: bounceIn 1s;
    }
    /* 你可以根據需要加入其他動畫 */
  `

  // 當元件連線到 DOM 時，開始動畫並讀取 HTML 屬性設定
  connectedCallback(): void {
    super.connectedCallback()

    // 讀取 HTML 屬性並設定對應值
    const attrPhrases = this.getAttribute('phrases')
    if (attrPhrases) {
      // 支援 JSON 格式或逗號分隔
      try {
        const parsed = JSON.parse(attrPhrases)
        if (Array.isArray(parsed)) {
          this.phrases = parsed.map((p) => String(p))
        } else if (typeof parsed === 'string') {
          this.phrases = parsed.split(',').map(p => p.trim()) // <== 使用 parsed 而不是 attrPhrases
        } else {
          this.phrases = []
        }
      } catch {
        this.phrases = attrPhrases.split(',').map(p => p.trim())
      }
    }
    const attrAnimation = this.getAttribute('animation')
    if (attrAnimation) {
      this.animation = attrAnimation
    }
    const attrSpeed = this.getAttribute('speed')
    if (attrSpeed) {
      const parsedSpeed = parseInt(attrSpeed, 10)
      if (!isNaN(parsedSpeed)) {
        this.speed = parsedSpeed
      }
    }
    this.stop() // 先清除舊的 interval
    this.start() // 啟動動畫
  }

  // 當元件脫離 DOM 時，清除定時器
  disconnectedCallback(): void {
    this.stop()
    super.disconnectedCallback()
  }

  /**
   * 啟動動畫輪詢
   */
  public start(): void {
    this.stop() // 先清除舊的 interval
    // 立即顯示第一個短語
    this.playAnimation()
    // 每隔 speed 時間輪播
    this.intervalId = window.setInterval(() => this.playAnimation(), this.speed)
  }

  /**
   * 停止動畫
   */
  public stop(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  /**
   * 切換短語並觸發動畫
   * 符合單一職責原則：該方法僅負責更新狀態及通知監聽者
   */
  private playAnimation(): void {
    if (!this.phrases || this.phrases.length === 0) {
      return
    }
    this.currentIndex = (this.currentIndex + 1) % this.phrases.length
    // 僅用事件通知
    this.dispatchEvent(new CustomEvent('animation-complete', {
      detail: { phrase: this.phrases[this.currentIndex] },
      bubbles: true,
      composed: true
    }))
  }

  /**
   * 當元件更新後，重新觸發動畫
   */
  protected updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('currentIndex')) {
      const span = this.shadowRoot?.querySelector('span')
      if (span) {
        // 移除動畫類別，強制重排，再重新加上動畫類別
        span.classList.remove(this.animation)
        void span.offsetWidth
        span.classList.add(this.animation)
      }
    }
  }

  /**
   * 渲染模板，回傳一個包含動畫與目前短語的 TemplateResult
   */
  protected render(): TemplateResult {
    const phrase: string = this.phrases[this.currentIndex] ?? ''
    return html`
      <span class="animated ${this.animation}">${phrase}</span>
    `
  }
}