import LightningDatatable from 'lightning/datatable';
import { track } from 'lwc';
import imageTableControl from './imageDatatableControla';

export default class DatatableWithImage extends LightningDatatable {
    static customTypes = {
        imageColumn: {
            template: imageTableControl, 
            standardCellLayout: false,
            typeAttributes: ['imageurlvalue'], 
        },
    }; 
    // @track typeAttributes= {imageUrl : 'https://csl-re-usable-dev-ed.develop.lightning.force.com/resource/coldRating',title: 'imageTitle'};
}
