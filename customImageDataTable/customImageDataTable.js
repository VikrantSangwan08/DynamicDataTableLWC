import { api, track } from 'lwc';
import LightningDatatable from 'lightning/datatable';
import imageTableControl from './imageTableControl.html';

export default class SalesforceCodexDataTable extends LightningDatatable  {
    static customTypes = {
        image: {
            template: imageTableControl,
            typeAttributes: ['imageurlvalue'],
        }
    };
    // connectedCallback() {
    //     console.log('OUTPUT : imageurlvalue',customTypes);
    // }
}