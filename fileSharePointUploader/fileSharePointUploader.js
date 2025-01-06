import { LightningElement, track } from 'lwc';
import uploadFileToSalesforce from '@salesforce/apex/SharePointIntegration.uploadFileToSalesforce';

export default class FileSharePointUploader extends LightningElement {
    @track uploadSuccess = false;
    @track uploadError = false;
    @track errorMessage;
    file;

    handleFileChange(event) {
        this.file = event.target.files[0];
    }

    handleUpload() {
        if (this.file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const fileContent = reader.result;
                uploadFileToSalesforce({ fileName: this.file.name, fileContent: fileContent })
                    .then(() => {
                        this.uploadSuccess = true;
                        this.uploadError = false;
                    })
                    .catch(error => {
                        this.errorMessage = error.body.message;
                        this.uploadSuccess = false;
                        this.uploadError = true;
                    });
            };
            reader.readAsArrayBuffer(this.file);
        }
    }
}