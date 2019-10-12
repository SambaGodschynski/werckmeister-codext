const WmPlayerPath = "/home/samba/workspace/werckmeister/build/sheetp";
const UDP_PORT = 8080;
import { exec, ChildProcess } from 'child_process';
import * as dgram from 'dgram';
import * as EventEmitter from 'events';
import { ISourceMap } from './SourceMap';
import { throws } from 'assert';


const freeUdpPort = require('udp-free-port');

class Config {
    watch: Boolean = false;
    funkfeuer: Boolean = false;
    sourceMap: Boolean = false;
    port: number = 8080;
    sheetPath: string = "";
};

function getFreeUdpPort(): Promise<number> {
    return new Promise((resolve, reject) => {
        freeUdpPort((err:any, port:number) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(port);
        });  
    });
}

export const OnPlayerMessageEvent = 'OnPlayerMessageEvent';
export const OnPlayerStateChanged = 'OnPlayerStateChanged';

export enum PlayerState {
    Undefined,
    Playing,
    Stopped
}

export class Player {
    socket: dgram.Socket|null = null;
    playerMessage: EventEmitter = new EventEmitter();
    private process: ChildProcess|null = null;
    sourceMap: ISourceMap|null = null;
    currentFile: string|null = null;

    get isPlaying(): boolean {
        return !!this.process;
    }
    startUdpListener(port: number) {
        if (this.socket !== null) {
            return;
        }
        if (this.socket === null) {
            this.socket = dgram.createSocket('udp4');
        }
        this.socket.on('message', (msg) => {
            let object = JSON.parse(msg.toString());
            this.playerMessage.emit(exports.OnPlayerMessageEvent, object);
        });
        this.socket.bind(port);
        console.log(`listen udp messages on port ${port}`);
    }

    stopUdpListener() {
        if (this.socket === null) {
            return;
        }
        this.socket.removeAllListeners();
        this.socket.close();
        this.socket = null;
        console.log('udp listener stopped');
    }
    
    private _execute(cmd:string, callback: (err:any, stdout: any, stderr: any)=>void): ChildProcess {
        console.log(cmd);
        return exec(cmd, callback);
    }

    private updateSourceMap(): Promise<ISourceMap> {
        return new Promise((resolve, reject) => {
            const config = new Config();
            config.sourceMap = true;
            config.sheetPath = this.currentFile as string;
            let cmd = `${WmPlayerPath} ${this.configToString(config)}`;
            this._execute(cmd, (err:any, stdout: any, stderr: any) => {
                if (!!err) {
                    reject(err);
                    return;
                }
                try {            
                    let json = JSON.parse(stdout);
                    resolve(json);
                } catch(ex)  {
                    reject(ex);
                }
            });
        }).then((sourceMap)=>{
            this.sourceMap = sourceMap as ISourceMap;
            this.sourceMap.mainDocument = this.currentFile as string;
            return this.sourceMap;
        });
    }

    async play(sheetPath: string): Promise<void> {
        this.currentFile = sheetPath;
        await this.updateSourceMap();
        return this._startPlayer(sheetPath);
    }

    private async _startPlayer(sheetPath: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (this.isPlaying) {
                await this.stop();
            }
            const nextFreePort = await getFreeUdpPort();
            const config = new Config();
            config.funkfeuer = true;
            config.watch = true;
            config.port = nextFreePort;
            config.sheetPath = sheetPath;
            let cmd = `${WmPlayerPath} ${this.configToString(config)}`;
            setTimeout(this.playerMessage.emit.bind(this.playerMessage, OnPlayerStateChanged, PlayerState.Playing), 10);
            this.process = this._execute(cmd, (err:any, stdout: any, stderr: any) => {
                if (!!err) {
                    reject(stderr);
                    this.process = null;
                    this.currentFile = null;
                    return;
                }
                resolve();
                this.process = null;
                this.currentFile = null;
            });
            this.startUdpListener(config.port);
        });
    }

    stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.isPlaying) {
                resolve();
                return;
            }
            this.stopUdpListener();
            this.process!.kill("SIGINT");
            let waitUntilEnd = () => {
                if (!this.isPlaying) {
                    resolve();
                    this.playerMessage.emit(OnPlayerStateChanged, PlayerState.Stopped);
                    return;
                }
                setTimeout(waitUntilEnd, 100);
            }
            waitUntilEnd();
        });
    }
    private configToString(config: Config) {
        if (!config.sheetPath) {
            throw new Error('missing sheet path');
        }
        let options = [
            config.sheetPath
            ,'--notime'
        ];
        if (config.watch) {
            options.push("--watch");
        }
        if (config.funkfeuer) {
            options.push(`--funkfeuer=localhost:${config.port}`);
        }
        if (config.sourceMap) {
            options.push('--sources');
        }
        return options.join(" ");
    }
}

let globalPlayer: Player;

export function getPlayer(): Player {
    if (!globalPlayer) {
        globalPlayer = new Player();
    }
    return globalPlayer;
}