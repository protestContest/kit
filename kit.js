document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('kitRoot');
  window.Kit = new Kit(canvas);
});

class Kit {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.dotSpacing = 20;

    this.shapes = [];

    this.resize = this.resize.bind(this);
    this.mousedown = this.mousedown.bind(this);
    this.mouseup = this.mouseup.bind(this);
    this.mousemove = this.mousemove.bind(this);
    this.update = this.update.bind(this);
    this.clear = this.clear.bind(this);
    this.commit = this.commit.bind(this);

    this.tool = new Compass(this.commit);

    this.resize();
    this.drawBackground();

    window.addEventListener('resize', this.resize);
    this.canvas.addEventListener('mousedown', this.mousedown);
    this.canvas.addEventListener('mouseup', this.mouseup);
    this.canvas.addEventListener('mousemove', this.mousemove);
    window.requestAnimationFrame(this.update);
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    const oldBuffer = this.buffer || null;

    this.buffer = document.createElement('canvas');
    this.buffer.width = this.canvas.width;
    this.buffer.height = this.canvas.height;
    this.bufferContext = this.buffer.getContext('2d');

    if (oldBuffer) {
      this.bufferContext.drawImage(oldBuffer, 0, 0);
    }

    this.drawBackground();
  }

  mousedown(event) {
    this.tool.onMouseDown(event);
  }

  mouseup(event) {
    this.tool.onMouseUp(event);
  }

  mousemove(event) {
    this.tool.onMouseMove(event);
  }

  commit() {
    const shape = this.tool.getShape();
    shape.draw(this.bufferContext);
    this.shapes.push(shape);

  }

  drawBackground() {
    this.context.fillStyle = '#aaa';
    for (let x = this.dotSpacing; x < this.canvas.width; x += this.dotSpacing) {
      for (let y = this.dotSpacing; y < this.canvas.height; y += this.dotSpacing) {
        this.context.fillRect(x, y, 1, 1);
      }
    }
  }

  clear() {
    this.context.save();
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.restore();
  }

  update() {
    this.clear();
    this.drawBackground();
    this.context.drawImage(this.buffer, 0, 0);

    this.tool.draw(this.context);

    requestAnimationFrame(this.update);
  }
}

class Tool {
  constructor(done) {
    this.params = {};
    this.mode = 'initial';
    this.done = done;
  }
}

class Compass extends Tool {
  constructor(done) {
    super(done);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  onMouseDown(event) {
    if (this.mode === 'initial') {
      this.mode = 'radius';
      this.params.origin = { x: event.x, y: event.y };
      this.params.radiusDest = { x: event.x, y: event.y };
    }
  }

  onMouseMove(event) {
    if (this.mode === 'radius') {
      this.params.origin = { x: event.x, y: event.y };
      this.params.radius = Math.sqrt(Math.pow(this.params.radiusDest.x - this.params.origin.x, 2) + Math.pow(this.params.radiusDest.y - this.params.origin.y, 2));
    } else if (this.mode === 'arc') {
      this.params.endAngle = Math.atan2(event.y - this.params.origin.y, event.x - this.params.origin.x);
      this.params.angleDest = {
        x: this.params.origin.x + this.params.radius * Math.cos(this.params.endAngle),
        y: this.params.origin.y + this.params.radius * Math.sin(this.params.endAngle)
      };
    }
  }

  onMouseUp(event) {
    if (this.mode === 'radius') {
      this.mode = 'arc';
      this.params.radius = Math.sqrt(Math.pow(this.params.radiusDest.x - this.params.origin.x, 2) + Math.pow(this.params.radiusDest.y - this.params.origin.y, 2));
      this.params.startAngle = Math.atan2(this.params.radiusDest.y - this.params.origin.y, this.params.radiusDest.x - this.params.origin.x);

      this.params.angleDest = { x: this.params.radiusDest.x, y: this.params.radiusDest.y };
      this.params.endAngle = this.params.startAngle;
    } else if (this.mode === 'arc') {
      this.mode = 'initial';
      this.done();
    }
  }

  getShape() {
    return new Arc(this.params);
  }

  draw(context) {
    if (this.mode === 'radius') {
      context.strokeStyle = 'black';
      context.fillStyle = 'black';
      context.beginPath();
      context.moveTo(this.params.origin.x, this.params.origin.y);
      context.lineTo(this.params.radiusDest.x, this.params.radiusDest.y);
      context.stroke();
      context.beginPath();
      context.strokeStyle = '#ddd';
      context.arc(this.params.origin.x, this.params.origin.y, this.params.radius, 0, 2*Math.PI);
      context.stroke();

      const dist = Math.sqrt(Math.pow(this.params.radiusDest.x - this.params.origin.x, 2) + Math.pow(this.params.radiusDest.y - this.params.origin.y, 2));
      context.fillStyle = 'black';
      context.fillText(Math.round(dist), this.params.origin.x, this.params.origin.y);
    } else if (this.mode === 'arc') {
      const startDeg = this.params.startAngle * 180 / Math.PI;
      const endDeg = this.params.endAngle * 180 / Math.PI;

      context.beginPath();
      context.strokeStyle = '#ddd';
      context.arc(this.params.origin.x, this.params.origin.y, this.params.radius, 0, 2*Math.PI);
      context.moveTo(this.params.origin.x, this.params.origin.y);
      context.lineTo(this.params.radiusDest.x, this.params.radiusDest.y);
      context.moveTo(this.params.origin.x, this.params.origin.y);
      context.lineTo(this.params.angleDest.x, this.params.angleDest.y);
      context.stroke();
      context.strokeStyle = 'black';
      context.beginPath();
      context.arc(this.params.origin.x, this.params.origin.y, this.params.radius, this.params.startAngle, this.params.endAngle);
      context.stroke();
      context.fillStyle = 'black';
      let degrees = (this.params.endAngle - this.params.startAngle) * 180 / Math.PI;
      if (degrees < 0) degrees += 360;
      context.fillText(Math.round(degrees) + '°', this.params.origin.x, this.params.origin.y);
    }
  }
}

class Shape {
  constructor(params) {
    this.params = params || {};
  }
}

class Arc extends Shape {
  draw(context) {
    context.strokeStyle = 'black';
    context.beginPath();
    context.arc(
      this.params.origin.x, this.params.origin.y,
      this.params.radius,
      this.params.startAngle, this.params.endAngle);

    context.stroke();
  }
}
