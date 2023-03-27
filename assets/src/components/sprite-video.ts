import { ccenum, Component, Sprite, SpriteFrame, _decorator } from 'cc';
import { EventType, VideoMedia } from './video-player-enums';
import { VideoPlayerImplWeb } from './video-player-impl-web';
const { ccclass, property } = _decorator;

export enum ObjectFitType {
    CONTAIN,
    COVER,
    FILL,
    NONE,
}
ccenum(ObjectFitType);

@ccclass('SpriteVideo')
export class SpriteVideo extends Component {
    @property({ type: Boolean, tooltip: '视频加载后是否自动开始播放' })
    public playOnAwake: boolean = true;
    @property({ type: Number, tooltip: '渲染帧率' })
    public frameRate: number = 5;
    @property({ type: Sprite, tooltip: '视频显示容器' })
    public sprite: Sprite;
    @property({ type: ObjectFitType, tooltip: '视频适配模式' })
    public objectFit = ObjectFitType.CONTAIN;

    public debugCanvas = false;
    private _mediaData: VideoMedia;
    private _impl: VideoPlayerImplWeb | null = null;
    private _canvas: HTMLCanvasElement;
    private _context: CanvasRenderingContext2D;
    private _rendererDT: number = 0;

    __preload() {
        this._impl = new VideoPlayerImplWeb(this);
        this._impl.componentEventList.set(EventType.READY_TO_PLAY, this.onReadyToPlay.bind(this));
    }

    onDestroy() {
        if (this._impl) {
            this._impl.destroy();
            this._impl = null;
        }
    }

    update(dt: number) {
        this._rendererDT += dt;
        if (this.isPlaying) {
            if (this._rendererDT > this.frameTime) {
                this._rendererDT = 0;
                this.drawSpriteFrame();
            }
        }
    }

    public set mediaData(media: VideoMedia) {
        this._mediaData = media;
        if (!this._impl) {
            return;
        }

        this._impl.createVideoPlayer(media);
    }

    public get mediaData() {
        return this._mediaData;
    }

    /**
     * 当前视频是否正在播放？
     */
    public get isPlaying() {
        if (!this._impl) {
            return false;
        }
        return this._impl.isPlaying;
    }

    public get frameTime() {
        return 1 / this.frameRate;
    }

    public play() {
        if (this._impl) {
            this._impl.play();
        }
    }

    private onReadyToPlay() {
        if (this.playOnAwake && !this.isPlaying) {
            this.play();
        }
    }

    private _preSpriteFrame: SpriteFrame;
    private drawSpriteFrame() {
        let cw = this._impl.video.clientWidth,
            ch = this._impl.video.clientHeight;
        if (!this._canvas) {
            const canvas = (this._canvas = document.createElement('canvas'));
            canvas.width = cw;
            canvas.height = ch;
            if (this.debugCanvas) {
                canvas.style.width = cw + 'px';
                canvas.style.height = ch + 'px';
                canvas.style.position = 'absolute';
                canvas.style.top = ch + 'px';
                canvas.style.left = '0px';
                document.body.append(canvas);
            }
        }

        if (!this._context) {
            this._context = this._canvas.getContext('2d');
        }

        let sw = this._impl.video.videoWidth,
            sh = this._impl.video.videoHeight,
            sx = 0,
            sy = 0;
        let dw = cw,
            dh = ch,
            dx = 0,
            dy = 0;
        let s_scale = sw / sh;
        let c_scale = cw / ch;

        if (this.objectFit === ObjectFitType.CONTAIN) {
            if (c_scale < s_scale) {
                // 高度溢出，以宽度为准，调整高度
                dy = (dh - dw / s_scale) / 2;
                sh = sw / c_scale;
            } else {
                dx = (dw - dh * s_scale) / 2;
                sw = sh * c_scale;
            }
        } else if (this.objectFit === ObjectFitType.COVER) {
            if (c_scale < s_scale) {
                // 高度溢出，以高度为准，调整宽度（裁剪）
                sx = (sw - sh * c_scale) / 2;
                sw = sh * c_scale;
            } else {
                sy = (sh - sw / c_scale) / 2;
                sh = sw / c_scale;
            }
        } else if (this.objectFit === ObjectFitType.NONE) {
            sx = (sw - cw) / 2;
            sy = (sh - ch) / 2;
            sw = cw;
            sh = ch;
        }

        this._context.drawImage(this._impl.video, sx, sy, sw, sh, dx, dy, dw, dh);
        if (this._preSpriteFrame) this._preSpriteFrame.texture.destroy();
        let spriteFrame = SpriteFrame.createWithImage(this._canvas);
        this._preSpriteFrame = this.sprite.spriteFrame = spriteFrame;
    }
}
