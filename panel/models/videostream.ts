import * as p from "@bokehjs/core/properties"
import {Widget, WidgetView} from "@bokehjs/models/widgets/widget"

export class VideoStreamView extends WidgetView {
  model: VideoStream
  protected videoEl: HTMLVideoElement
  protected canvasEl: HTMLCanvasElement
  protected constraints = {
    'audio': false,
    'video': true
  }
  protected timer: any

  initialize(): void {
    super.initialize()
    if (this.model.timeout !== null) {
      this.set_timeout()
    }
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.snapshot.change, () => this.set_timeout())
    this.connect(this.model.properties.snapshot.change, () => this.snapshot())
    this.connect(this.model.properties.paused.change, () => this.model.paused ? this.videoEl.pause() : this.videoEl.play())
  }

  set_timeout(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.model.timeout !== null) {
      this.timer = setInterval(() => this.snapshot(), this.model.timeout);
    }
  }

  snapshot(): void{
    this.canvasEl.width = this.videoEl.videoWidth
    this.canvasEl.height = this.videoEl.videoHeight
    const context = this.canvasEl.getContext('2d')
    if (context)
      context.drawImage(this.videoEl, 0, 0, this.canvasEl.width, this.canvasEl.height)
    this.model.value = this.canvasEl.toDataURL("image/"+this.model.format, 0.95)
  }

  remove(): void {
    super.remove()
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  render(): void {
    super.render()
    if (this.videoEl)
      return
    this.videoEl = document.createElement('video')
    if (!this.model.sizing_mode || this.model.sizing_mode === 'fixed') {
	  if (this.model.height)
	    this.videoEl.height = this.model.height;
	  if (this.model.width)
	    this.videoEl.width = this.model.width;
	}
	this.videoEl.style.objectFit = 'fill'
	this.videoEl.style.minWidth = '100%';
    this.videoEl.style.minHeight = '100%';
    this.canvasEl = document.createElement('canvas')
    this.el.appendChild(this.videoEl)
    if (navigator.mediaDevices.getUserMedia){
      navigator.mediaDevices.getUserMedia(this.constraints)
      .then(stream => {
        this.videoEl.srcObject = stream
        if (!this.model.paused){
          this.videoEl.play()
        }
      })
      .catch(console.error)
    }
  }
}

export namespace VideoStream {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Widget.Props & {
    format: p.Property<string>
    paused: p.Property<boolean>
    snapshot: p.Property<boolean>
    timeout: p.Property<number|null>
    value: p.Property<any>
  }
}

export interface VideoStream extends VideoStream.Attrs {}

export abstract class VideoStream extends Widget {
  properties: VideoStream.Props

  constructor(attrs?: Partial<VideoStream.Attrs>) {
    super(attrs)
  }

  static __module__ = "panel.models.widgets"

  static init_VideoStream(): void {
    this.prototype.default_view = VideoStreamView

    this.define<VideoStream.Props>({
      format:   [ p.String, 'png'  ],
      paused:   [ p.Boolean, false ],
      snapshot: [ p.Boolean, false ],
      timeout:  [ p.Number,  null  ],
      value:    [ p.Any,           ]
    })

    this.override({
      height: 240,
      width: 320
    });
  }
}
