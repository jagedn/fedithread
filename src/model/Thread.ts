import Toot from '@/model/Toot';
import {createRestAPIClient} from "masto";
import Media from '@/model/Media';

export default class Thread{

    public toots : Toot[];

    instance : string;

    public tags : string = '';

    constructor(instance: string) {
        this.instance = instance;
        this.toots = [];
        this.newToot();
    }

    parseJSON( json : string){
        this.toots = []
        const map = JSON.parse(json)
        this.tags = map.tags || '';
        for (const t in map.toots) {
            const toot = this.newToot();
            toot.message = map.toots[t].text;
            for (const i in map.toots[t].files) {
                const e = map.toots[t].files[i];
                const media = new Media(e.id, e.preview)
                media.description = e.description;
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
            toots: new Array(),
            tags: this.tags || '',
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
                    description: media.description,
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
        toot.message = '';
        this.toots.push(toot);
        return toot;
    }
    newTootAfter(parent: Toot){
        const toot = new Toot(this.toots.length);
        toot.message = '';
        this.toots.splice(parent.index+1, 0, toot);
        return toot;
    }

    async publish(accessToken : string){

        const masto = createRestAPIClient({
            url: this.instance,
            accessToken: accessToken,
        });

        let replyTo = '';
        let counter = 1;
        for(const t in this.toots){
            const toot = this.toots[t]
            for(const fi in toot.files){
                const file = toot.files[fi];
                await masto.v1.media.$select(file.id).update({
                    description: file.description
                })
            }
            const mediaIds = toot.files.map(f=>f.id)
            const status = await masto.v1.statuses.create({
                status: `${counter}/${this.toots.length}\n${toot.message}\n${this.tags}`,
                visibility: "public",
                inReplyToId: replyTo,
                mediaIds:mediaIds
            });
            replyTo = status.id;
            counter++;
        }
    }

    async uploadFile(accessToken : string, file :any, toot:Toot){
        const masto = createRestAPIClient({
            url: this.instance,
            accessToken: accessToken,
        });
        const response = await masto.v1.media.create({
            file: file,
        })
        const media = new Media(response.id, response.previewUrl)
        toot.files.push(media)
        return true
    }

    setImgDescription(toot:Toot, imgIdx: number, description: string){
        toot.files[imgIdx].description = description;
    }

    setTags(tag: string){
        this.tags = tag || '';
    }

}