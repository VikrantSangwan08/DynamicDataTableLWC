import { LightningElement, track } from 'lwc';
import uploadFiles from '@salesforce/apex/FileUploaderController.uploadFiles';

export default class FileUploader extends LightningElement {
    @track files;
    @track uploadSuccess = false;
    @track uploadError = false;
    @track errorMessage;

    handleFileChange(event) {
        this.files = event.target.files;
    }

    handleUpload() {
        if (this.files) {
            uploadFiles({ files: this.files })
                .then(() => {
                    this.uploadSuccess = true;
                    this.uploadError = false;
                })
                .catch(error => {
                    this.errorMessage = error.body.message;
                    this.uploadSuccess = false;
                    this.uploadError = true;
                });
        }
    }
}