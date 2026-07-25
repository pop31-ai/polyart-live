/**
 * PolyFlow Emergence — Примитивы появления и развития
 * 
 * Каждая иллюстрация — жизненный цикл применения полиномиального арта:
 *   BIRTH → GROWTH → MATURITY → APPLICATION → EXPANSION
 * 
 * Никогда: угасание, исчезновение, упрощение.
 * Всегда: появление, рост, детализация, связывание, расширение.
 */

export class EmergenceEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.elements = [];
    this.connections = [];
    this.time = 0;
    this.phase = 'BIRTH';
  }

  /**
   * BIRTH — из пустоты появляется первый элемент
   */
  spawn(config) {
    const el = {
      id: Math.random().toString(36).substr(2, 9),
      x: config.x * this.canvas.width,
      y: config.y * this.canvas.height,
      targetX: config.x * this.canvas.width,
      targetY: config.y * this.canvas.height,
      size: 0,
      targetSize: config.size || 4,
      opacity: 0,
      targetOpacity: config.opacity || 1,
      hue: config.hue || 210,
      saturation: config.saturation || 90,
      lightness: config.lightness || 70,
      shape: config.shape || 'circle',
      born: this.time,
      age: 0,
      alive: true,
      phase: 'EMERGENCE',
      children: [],
      parent: null,
      trail: [],
      pulse: 0,
      pulseSpeed: config.pulseSpeed || 0.02,
      growthRate: config.growthRate || 0.03
    };
    this.elements.push(el);
    return el;
  }

  /**
   * GROWTH — из элемента вырастает кластер
   */
  bloom(parent, config) {
    const count = config.count || 5;
    const radius = config.radius || 100;
    const children = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (config.offset || 0);
      const dist = radius * (0.5 + Math.random() * 0.5);
      const child = this.spawn({
        x: (parent.x + Math.cos(angle) * dist) / this.canvas.width,
        y: (parent.y + Math.sin(angle) * dist) / this.canvas.height,
        size: config.childSize || parent.targetSize * 0.7,
        hue: parent.hue + (config.hueSpread || 20) * (i - count / 2),
        saturation: parent.saturation,
        lightness: parent.lightness + (Math.random() - 0.5) * 10,
        shape: config.childShape || parent.shape,
        pulseSpeed: parent.pulseSpeed * (0.8 + Math.random() * 0.4),
        growthRate: parent.growthRate * 0.9
      });
      child.parent = parent;
      parent.children.push(child);
      children.push(child);

      this.connections.push({
        from: parent,
        to: child,
        opacity: 0,
        targetOpacity: config.connectionOpacity || 0.2,
        born: this.time,
        thickness: config.connectionThickness || 1
      });
    }

    return children;
  }

  /**
   * MATURITY — элемент обрастает деталями
   */
  evolve(element, config) {
    const layers = config.layers || 3;
    const evolved = [];

    for (let l = 0; l < layers; l++) {
      const subCount = config.subCount || 4;
      for (let i = 0; i < subCount; i++) {
        const angle = (i / subCount) * Math.PI * 2;
        const dist = element.targetSize * (2 + l * 1.5);
        const child = this.spawn({
          x: (element.x + Math.cos(angle) * dist) / this.canvas.width,
          y: (element.y + Math.sin(angle) * dist) / this.canvas.height,
          size: element.targetSize * (0.3 - l * 0.05),
          hue: element.hue + l * 15 + i * 5,
          saturation: element.saturation - l * 5,
          lightness: element.lightness + l * 5,
          shape: config.detailShape || 'circle',
          pulseSpeed: element.pulseSpeed * 1.5,
          growthRate: element.growthRate * 0.7
        });
        child.parent = element;
        element.children.push(child);
        evolved.push(child);

        this.connections.push({
          from: element,
          to: child,
          opacity: 0,
          targetOpacity: 0.15 / (l + 1),
          born: this.time,
          thickness: 0.5
        });
      }
    }

    return evolved;
  }

  /**
   * APPLICATION — элементы связываются в систему
   */
  synthesize(elements, config) {
    const synthesized = [];

    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const dist = Math.hypot(
          elements[i].x - elements[j].x,
          elements[i].y - elements[j].y
        );
        if (dist < (config.maxDist || 300)) {
          const exists = this.connections.some(
            c => (c.from === elements[i] && c.to === elements[j]) ||
                 (c.from === elements[j] && c.to === elements[i])
          );
          if (!exists) {
            this.connections.push({
              from: elements[i],
              to: elements[j],
              opacity: 0,
              targetOpacity: config.connectionOpacity || 0.1,
              born: this.time,
              thickness: config.connectionThickness || 0.5
            });
          }
        }
      }
    }

    return synthesized;
  }

  /**
   * EXPANSION — зрелая система порождает новую
   */
  expand(system, config) {
    const direction = config.direction || Math.random() * Math.PI * 2;
    const dist = config.distance || 200;
    const newCenter = {
      x: system[0].x + Math.cos(direction) * dist,
      y: system[0].y + Math.sin(direction) * dist
    };

    const newSystem = [];
    const count = config.count || system.length;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = config.radius || 50;
      const child = this.spawn({
        x: (newCenter.x + Math.cos(angle) * r) / this.canvas.width,
        y: (newCenter.y + Math.sin(angle) * r) / this.canvas.height,
        size: config.size || 3,
        hue: (system[0].hue + 60) % 360,
        saturation: 80,
        lightness: 60,
        shape: 'circle',
        pulseSpeed: 0.02,
        growthRate: 0.04
      });
      newSystem.push(child);
    }

    // связать новую систему со старой
    this.connections.push({
      from: system[Math.floor(system.length / 2)],
      to: newSystem[0],
      opacity: 0,
      targetOpacity: 0.05,
      born: this.time,
      thickness: 0.3
    });

    return newSystem;
  }

  /**
   * Обновление всех элементов
   */
  update(dt) {
    this.time += dt;

    for (const el of this.elements) {
      el.age = this.time - el.born;
      el.size += (el.targetSize - el.size) * el.growthRate;
      el.opacity += (el.targetOpacity - el.opacity) * 0.05;
      el.pulse += el.pulseSpeed;
      el.x += (el.targetX - el.x) * 0.02;
      el.y += (el.targetY - el.y) * 0.02;

      // trail — след роста
      if (el.size > 0.5) {
        el.trail.push({ x: el.x, y: el.y, age: 0 });
        if (el.trail.length > 30) el.trail.shift();
      }
      for (const t of el.trail) t.age += dt;
    }

    for (const c of this.connections) {
      c.opacity += (c.targetOpacity - c.opacity) * 0.03;
    }
  }

  /**
   * Рендер всех элементов
   */
  render() {
    const { ctx, canvas } = this;

    // связи
    for (const c of this.connections) {
      if (c.opacity < 0.01) continue;
      ctx.strokeStyle = `rgba(255,200,100,${c.opacity})`;
      ctx.lineWidth = c.thickness;
      ctx.beginPath();
      ctx.moveTo(c.from.x, c.from.y);
      ctx.lineTo(c.to.x, c.to.y);
      ctx.stroke();
    }

    // элементы
    for (const el of this.elements) {
      if (el.opacity < 0.01 || el.size < 0.1) continue;

      const pulse = 1 + 0.15 * Math.sin(el.pulse);
      const r = el.size * pulse;

      // след
      if (el.trail.length > 2) {
        ctx.strokeStyle = `hsla(${el.hue},${el.saturation}%,${el.lightness}%,${el.opacity * 0.05})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < el.trail.length; i++) {
          const t = el.trail[i];
          const a = 1 - t.age * 0.01;
          if (a < 0.01) continue;
          i === 0 ? ctx.moveTo(t.x, t.y) : ctx.lineTo(t.x, t.y);
        }
        ctx.stroke();
      }

      // свечение
      const glowR = r * 4;
      const grad = ctx.createRadialGradient(el.x, el.y, 0, el.x, el.y, glowR);
      grad.addColorStop(0, `hsla(${el.hue},${el.saturation}%,${el.lightness}%,${el.opacity * 0.3})`);
      grad.addColorStop(0.5, `hsla(${el.hue},${el.saturation}%,${el.lightness - 10}%,${el.opacity * 0.1})`);
      grad.addColorStop(1, `hsla(${el.hue},${el.saturation}%,${el.lightness - 20}%,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(el.x, el.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // ядро
      ctx.fillStyle = `hsla(${el.hue},${el.saturation}%,${Math.min(95, el.lightness + 20)}%,${el.opacity * 0.9})`;
      ctx.beginPath();
      ctx.arc(el.x, el.y, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Жизненный цикл — автоматическая последовательность
   */
  lifecycle(config) {
    const center = { x: config.centerX || 0.5, y: config.centerY || 0.5 };

    // BIRTH: первая точка
    const root = this.spawn({
      x: center.x,
      y: center.y,
      size: config.rootSize || 5,
      hue: config.hue || 210,
      shape: 'circle'
    });

    // after delay: GROWTH
    setTimeout(() => {
      this.phase = 'GROWTH';
      this.bloom(root, {
        count: config.bloomCount || 5,
        radius: config.bloomRadius || 80,
        hueSpread: config.hueSpread || 20
      });
    }, config.growthDelay || 2000);

    // after delay: MATURITY
    setTimeout(() => {
      this.phase = 'MATURITY';
      for (const child of root.children) {
        this.evolve(child, {
          layers: config.evolveLayers || 2,
          subCount: config.evolveSubCount || 3
        });
      }
    }, config.maturityDelay || 5000);

    // after delay: APPLICATION
    setTimeout(() => {
      this.phase = 'APPLICATION';
      this.synthesize(this.elements, {
        maxDist: config.synthMaxDist || 250
      });
    }, config.applicationDelay || 8000);

    // after delay: EXPANSION
    setTimeout(() => {
      this.phase = 'EXPANSION';
      this.expand(root.children.slice(0, 3), {
        distance: config.expandDistance || 200,
        count: config.expandCount || 4,
        radius: config.expandRadius || 40
      });
    }, config.expansionDelay || 12000);
  }
}
