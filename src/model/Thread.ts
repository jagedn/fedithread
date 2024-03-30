import Toot from '@/model/Toot';
import {createRestAPIClient} from "masto";
import Media from '@/model/Media';
import {createOAuthAPIClient} from 'masto';

export default class Thread{

    public toots : Toot[];

    instance : string;

    constructor(instance: string) {
        this.instance = instance;
        this.toots = [];
        this.newToot();
    }

    parseJSON( json : string){
        this.toots = []
        const map = JSON.parse(json)
        for (const t in map.toots) {
            const toot = this.newToot();
            toot.message = map.toots[t].text;
            for (const i in map.toots[t].files) {
                const e = map.toots[t].files[i];
                const media = new Media(e.id, e.preview)
                toot.files.push(media);
            }
        }
        if( !this.toots.length ){
            this.newToot()
        }
    }

    toJSON():string{
        const json = {
            createdAt: new Date().toISOString(),
            toots: new Array()
        }
        for (const t in this.toots) {
            const toot = this.toots[t]
            const e = {
                text: toot.message,
                files: new Array()
            }
            for(const f in toot.files){
                const media = toot.files[f];
                e.files.push({
                    id: media.id,
                    preview: media.preview,
                });
            }
            json.toots.push(e);
        }
        return JSON.stringify(json)
    }

    clean(){
        this.toots = [];
        this.newToot();
    }

    remove(toot: Toot){
        this.toots.splice(toot.index, 1);
    }

    newToot(){
        const toot = new Toot(this.toots.length);
        toot.message = '\n\n#FediThread';
        this.toots.push(toot);
        return toot;
    }
    newTootAfter(parent: Toot){
        const toot = new Toot(this.toots.length);
        toot.message = '\n\n#FediThread';
        this.toots.splice(parent.index+1, 0, toot);
        return toot;
    }

    async publish(accessToken : string){

        const masto = createRestAPIClient({
            url: this.instance,
            accessToken: accessToken,
        });

        let replyTo = '';
        for(const t in this.toots){
            const toot = this.toots[t]
            const mediaIds = toot.files.map(f=>f.id)
            const status = await masto.v1.statuses.create({
                status: `${toot.index+1}/${this.toots.length}\n${toot.message}`,
                visibility: "public",
                inReplyToId: replyTo,
                mediaIds:mediaIds
            });
            replyTo = status.id;
        }
    }

    async uploadFile(accessToken : string, file :any, toot:Toot){
        const masto = createRestAPIClient({
            url: this.instance,
            accessToken: accessToken,
        });
        const response = await masto.v1.media.create({
            file: file
        })
        const media = new Media(response.id, response.previewUrl)
        toot.files.push(media)
        return true
    }
}