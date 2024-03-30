import Media from '@/model/Media';

export default class Toot{

    public index: number;
    public message: string = '';
    public files : Media[];

    constructor(index: number) {
        this.index = index;
        this.files=[];
    }

    removeImage(idx:number){
        this.files.splice(idx,1);
    }
}