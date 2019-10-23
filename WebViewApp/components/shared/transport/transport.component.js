import React from "react";
import { playIcon } from "./play.icon";
import { stopIcon } from "./stop.icon";
import { BaseComponent } from "../base/base.component";


export class TransportComponent extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            position: 0
        }
    }

    onStopClicked() {
        this.sendMessageToHost("player-stop");
    }

    onPlayClicked() {
        this.sendMessageToHost("player-play");
    }

    render() {
        const position = this.props.position || 0;
        return (
            <div>
                <style dangerouslySetInnerHTML={{__html:`
                    .ccontainer {
                        padding: 0px;
                        display: grid;
                        grid-template-rows: 25px 25px;
                        grid-template-columns: 48px 48px auto 45px;
                        grid-template-areas: 
                        "play stop display range-from"
                        "play stop display range-to";
                        width: 300px;
                        font-weight: lighter;
                    }
                    .btn-play {
                        grid-area: play;
                    }
                    
                    .btn-stop {
                        grid-area: stop;
                    }
                    button {
                        cursor: default;
                        font-size: 25px;
                        height: 46px;
                        border: none;
                        margin: 2px 2px 0px 0px;
                        background: #0000;
                    }
                    button svg {
                        position: relative;
                        top: 3px;
                        fill: var(--vscode-editor-foreground);
                    }
                    .display {
                        grid-area: display;
                        font-size: 45px;
                        text-align: right;
                        user-select: none;
                        cursor: default;
                    }
                    .position {
                        margin: 0px;
                        padding-right: 7px;
                        position: relative;
                        top: -10px;
                    }
                    
                `}}></style>
                <div className="ccontainer">
                    {/* <button [hidden]="werck.isPlaying" (click)="play()" class="btn-play"><i class="ion-md-play"></i></button>
                    <button [hidden]="!werck.isPlaying" (click)="pause()" class="btn-play"><i class="ion-md-pause"></i></button> */}

                    {/* <button (click)="stop()" class="btn-stop"><i class="ion-md-square"></i></button> */}
                    <button className="btn-play" onClick={this.onPlayClicked.bind(this)}>
                        {playIcon()}
                    </button>
                    <button className="btn-stop" onClick={this.onStopClicked.bind(this)}>
                        {stopIcon()}
                    </button>                
                    <div className="display">
                        <span>{ position.toFixed(2) }</span>
                    </div>
                </div>
            </div>
        );
    }
}