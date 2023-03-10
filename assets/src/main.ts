import { Component, VideoClip, _decorator } from 'cc';
import { SpriteVideo } from './components/sprite-video';
const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Component {
    @property(VideoClip)
    videoClip!: VideoClip;
    @property(SpriteVideo)
    spriteVideo!: SpriteVideo;

    onLoad() {
        this.spriteVideo.mediaData = this.videoClip;
    }
}
