/**
 * PolyFlow — Движок сценариев для полиномиального арта
 * 
 * Концепция: каждая иллюстрация — это живая сцена с фазами:
 *   1. PROLOGUE   — предыстория, контекст, «зачем это нужно»
 *   2. DISCOVERY  — первое появление объекта, «что это?»
 *   3. EXPLORE    — интерактивное исследование, «как это работает?»
 *   4. CREATE     — пользователь создаёт свой вариант
 *   5. APPLY      — применение знания в реальном мире
 *   6. EPILOGUE   — после-история, «что дальше?»
 * 
 * Каждая фаза имеет:
 *   - narrative: текст рассказа
 *   - visual: параметры визуализации
 *   - interaction: что может делать пользователь
 *   - transition: условия перехода к следующей фазе
 */

export const FlowPhase = {
  PROLOGUE: 'prologue',
  DISCOVERY: 'discovery',
  EXPLORE: 'explore',
  CREATE: 'create',
  APPLY: 'apply',
  EPILOGUE: 'epilogue'
};

export const PhaseOrder = [
  FlowPhase.PROLOGUE,
  FlowPhase.DISCOVERY,
  FlowPhase.EXPLORE,
  FlowPhase.CREATE,
  FlowPhase.APPLY,
  FlowPhase.EPILOGUE
];

/**
 * Базовый класс сценария
 */
export class FlowScenario {
  constructor(config) {
    this.id = config.id;
    this.title = config.title;
    this.subtitle = config.subtitle || '';
    this.phases = config.phases;
    this.currentPhaseIndex = 0;
    this.state = {};
    this.listeners = [];
  }

  get currentPhase() {
    return this.phases[PhaseOrder[this.currentPhaseIndex]];
  }

  get phaseName() {
    return PhaseOrder[this.currentPhaseIndex];
  }

  get progress() {
    return (this.currentPhaseIndex + 1) / PhaseOrder.length;
  }

  get isComplete() {
    return this.currentPhaseIndex >= PhaseOrder.length - 1;
  }

  advance() {
    if (!this.isComplete) {
      this.currentPhaseIndex++;
      this.emit('phaseChange', { phase: this.phaseName, scenario: this });
    }
  }

  goTo(phaseName) {
    const idx = PhaseOrder.indexOf(phaseName);
    if (idx >= 0) {
      this.currentPhaseIndex = idx;
      this.emit('phaseChange', { phase: this.phaseName, scenario: this });
    }
  }

  set(key, value) {
    this.state[key] = value;
    this.emit('stateChange', { key, value, scenario: this });
  }

  on(event, fn) {
    this.listeners.push({ event, fn });
  }

  emit(event, data) {
    this.listeners.filter(l => l.event === event).forEach(l => l.fn(data));
  }
}

/**
 * UI-обёртка: рендерит фазу как оверлей на canvas
 */
export class FlowRenderer {
  constructor(canvas, scenario) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scenario = scenario;
    this.panelHeight = 160;
    this.animFrame = null;
    this.typewriterText = '';
    this.typewriterIdx = 0;
    this.typewriterTimer = null;
    this.buttons = [];
    this.onAction = null;
  }

  resize() {
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = this.canvas.parentElement.clientHeight;
  }

  start() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.showPhase();
  }

  stop() {
    if (this.typewriterTimer) clearInterval(this.typewriterTimer);
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }

  showPhase() {
    const phase = this.scenario.currentPhase;
    this.typewriterText = phase.narrative;
    this.typewriterIdx = 0;
    this.buttons = phase.actions || [];

    if (this.typewriterTimer) clearInterval(this.typewriterTimer);
    this.typewriterTimer = setInterval(() => {
      if (this.typewriterIdx < this.typewriterText.length) {
        this.typewriterIdx++;
      } else {
        clearInterval(this.typewriterTimer);
      }
      this.renderPanel();
    }, 20);
  }

  renderPanel() {
    const { ctx, canvas } = this;
    const h = this.panelHeight;
    const y = canvas.height - h;

    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, y, canvas.width, h);

    ctx.strokeStyle = 'rgba(255,200,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();

    const phaseLabels = {
      prologue: 'ПРЕДЫСТОРИЯ',
      discovery: 'ОТКРЫТИЕ',
      explore: 'ИССЛЕДОВАНИЕ',
      create: 'СОЗДАНИЕ',
      apply: 'ПРИМЕНЕНИЕ',
      epilogue: 'ПРОДОЛЖЕНИЕ'
    };

    ctx.fillStyle = '#ff0';
    ctx.font = 'bold 10px Segoe UI';
    ctx.fillText(phaseLabels[this.scenario.phaseName] || '', 20, y + 20);

    const progress = this.scenario.progress;
    ctx.fillStyle = 'rgba(255,200,0,0.15)';
    ctx.fillRect(20, y + 28, canvas.width - 40, 3);
    ctx.fillStyle = 'rgba(255,200,0,0.6)';
    ctx.fillRect(20, y + 28, (canvas.width - 40) * progress, 3);

    ctx.fillStyle = '#ccc';
    ctx.font = '13px Segoe UI';
    const text = this.typewriterText.substring(0, this.typewriterIdx);
    const lines = this.wrapText(text, canvas.width - 40);
    lines.forEach((line, i) => {
      ctx.fillText(line, 20, y + 50 + i * 18);
    });

    this.buttons = [];
    const phase = this.scenario.currentPhase;
    if (phase.actions) {
      let bx = 20;
      phase.actions.forEach((action, i) => {
        const tw = ctx.measureText(action.label).width + 20;
        const by = y + h - 40;
        const bh = 26;

        ctx.fillStyle = 'rgba(255,200,0,0.1)';
        ctx.strokeStyle = 'rgba(255,200,0,0.4)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, bx, by, tw, bh, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ff0';
        ctx.font = '10px Segoe UI';
        ctx.fillText(action.label, bx + 10, by + 17);

        this.buttons.push({ x: bx, y: by, w: tw, h: bh, action });
        bx += tw + 10;
      });
    }

    if (this.typewriterIdx >= this.typewriterText.length && !phase.actions?.length) {
      ctx.fillStyle = 'rgba(255,200,0,0.15)';
      ctx.strokeStyle = 'rgba(255,200,0,0.3)';
      this.roundRect(ctx, canvas.width - 160, y + h - 40, 140, 26, 4);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff0';
      ctx.font = '10px Segoe UI';
      ctx.fillText('ДАЛЕЕ →', canvas.width - 148, y + h - 23);
      this.buttons.push({ x: canvas.width - 160, y: y + h - 40, w: 140, h: 26, action: { type: 'next' } });
    }
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const btn of this.buttons) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        if (btn.action.type === 'next') {
          this.scenario.advance();
          this.showPhase();
        } else if (btn.action.type === 'jump') {
          this.scenario.goTo(btn.action.phase);
          this.showPhase();
        } else if (btn.action.type === 'set') {
          this.scenario.set(btn.action.key, btn.action.value);
          if (btn.action.next) {
            this.scenario.advance();
            this.showPhase();
          }
        } else if (this.onAction) {
          this.onAction(btn.action);
        }
        break;
      }
    }
  }

  wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line + (line ? ' ' : '') + word;
      if (this.ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}
