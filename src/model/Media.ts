export default class Media{
    public id: string = '';
    public preview: string = '';
    public description: string = '';

    constructor(id:string, preview : string) {
        this.id=id;
        this.preview = preview;
    }

}