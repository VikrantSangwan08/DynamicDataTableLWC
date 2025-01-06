import { LightningElement,api } from 'lwc';
import imageControl from './imageControl';
export default class ImageCell extends LightningDatatable {
    // @api imageUrl;
    // @api imageTitle;
    static customTypes={
        customImage:{
            template: imageControl
        }
    }
}