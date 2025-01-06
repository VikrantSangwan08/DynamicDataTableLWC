import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getContentFoldersRelatedToLibrary from '@salesforce/apex/ContentVersionController.getCFRelToLibOnMove';
import getFoldersRelToFolder from '@salesforce/apex/ContentVersionController.getFoldersRelatedToFolders';
import moveFileWithinFolders from '@salesforce/apex/ContentVersionController.moveFileWithinFolders';
import moveFileToLibrary from '@salesforce/apex/ContentVersionController.moveFileToLibrary';
import moveFolderToLibrary from '@salesforce/apex/ContentVersionController.moveFolderToLibrary';
import moveFolderWithinFolders from '@salesforce/apex/ContentVersionController.moveFolderWithinFolders';


export default class MoveFileAndFolder extends LightningElement {

    @track allVariables = {
        showMoveModal: false, fileName: '', libraryName: '', libraryId: '', contentFolderId: '',
        fileCount: 0, data: [], arrayOfIds: [], contDocId: '', contentFolderToRefresh: '', fileType: '', contFolderToMove: ''
    };

    @track columns2 = [
        {
            label: 'Folders', fieldName: 'Id', type: 'button', sortable: false,
            // initialWidth: 600,
            typeAttributes: {
                label: { fieldName: 'Title' },
                value: { fieldName: 'Id' },
                name: 'view_details',
                variant: 'base'
            }
        }
    ];

    @api handleShowModal(e) {
        console.log('entered move modal condition ==--> ', JSON.stringify(e));
        this.allVariables.showMoveModal = e.showMoveModal;
        this.allVariables.fileName = e.name;
        this.allVariables.fileType = e.fileType;
        this.allVariables.libraryName = e.libName;
        this.allVariables.libraryId = e.libId;
        this.allVariables.contDocId = e.contDocuId; // for type = file, it is cont-Ver-DocumentId, file that is to be moved :::, for type = folder, it is the folder id that is to be refreshed
        this.allVariables.contentFolderToRefresh = e.cfId;
        this.allVariables.contFolderToMove = e.contFolderToMove;
        this.__getFoldersRelToLibrary();
    }

    __getFoldersRelToLibrary() {
        getContentFoldersRelatedToLibrary({ libraryId: this.allVariables.libraryId, })
            .then(result => {
                console.log('Result  :: ', result);
                this.allVariables.data = result;

            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    hideModalBox() {
        this.allVariables.showMoveModal = false;
        this.allVariables.contentFolderId = '';
        this.allVariables.arrayOfIds = [];
        this.allVariables.data = [];
        this.allVariables.libraryId = '';
        this.allVariables.contentFolderId = '';
        this.allVariables.contentFolderToRefresh = '';
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        this.fileType = event.detail.row.FileType;
        console.log('fileType *****************==--> ', JSON.stringify(event.detail));

        let contentFolderId = event.detail.row.Id;
        this.allVariables.contentFolderId = contentFolderId;
        const title = event.detail.row.Title;

        console.log('title ==--->', title);
        switch (actionName) {
            case 'view_details':
                console.log('view detail clicked');
                this.allVariables.arrayOfIds.push(contentFolderId);
                this.__getFoldersRelatedToFolders(contentFolderId);
                break;
        }
    }

    __getFoldersRelatedToFolders(contentFolderId) {
        getFoldersRelToFolder({ contentFolderId: contentFolderId })
            .then(result => {
                console.log('Result', result);
                if (result) {
                    this.allVariables.data = result;
                } else {
                    this.allVariables.data = [];
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    handleBackButton() {
        console.log('id array ==--> ', JSON.stringify(this.allVariables.arrayOfIds));
        let id = this.allVariables.arrayOfIds.length - 2;
        if (this.allVariables.arrayOfIds.length > 1) {
            console.log('len = ', id);
            let cfId = this.allVariables.arrayOfIds[id];
            // console.log('cfId =--->> ', this.allVariables.arrayOfIds[id]);
            console.log('cfId =--->> ', cfId);
            this.__getFoldersRelatedToFolders(cfId);
            this.allVariables.arrayOfIds.pop();
        } else if (this.allVariables.arrayOfIds.length == 1) {
            console.log('entered length == 1 condition');
            this.__getFoldersRelToLibrary();
            this.allVariables.arrayOfIds.pop();
        }
        else {
            console.log('no value to pop');
        }
    }

    handleTestBAck() {
        console.log('id array ==--> ', JSON.stringify(this.allVariables.arrayOfIds));
    }

    handleMove() {
        if (this.allVariables.fileType == 'Folder') {
            this.__moveFolder();
        } else {
            this.__moveFile();
        }
    }

    __moveFolder() {
       
        if (this.allVariables.arrayOfIds.length > 0) {
            console.log('inside the else condition to move folder');
            this.dispatchEvent(new CustomEvent('showspinner',));
            let len = this.allVariables.arrayOfIds.length;
            let id = this.allVariables.arrayOfIds[len - 1];
            console.log('id of the current folder that is to be moved == -> ', this.allVariables.contFolderToMove);
            console.log('parent folder id == -> ', id);
            moveFolderWithinFolders({ folderId: this.allVariables.contFolderToMove, parentFolderId: id })
                .then(result => {
                    console.log('Result', result);
                    if (this.allVariables.contDocId) {
                        this.dispatchEvent(new CustomEvent('handlecontentversionwithinfolders', {
                            detail: {
                                contentFolderId: this.allVariables.contDocId
                            }
                        }));
                    } else {
                        console.log('no cont doc id, entered else condition for refresh');
                        this.dispatchEvent(new CustomEvent('refreshcvinlibrary',));
                    }
                    this.hideModalBox();
                    this.__showToast('Success', 'File Moved Successfully', 'success');
                })
                .catch(error => {
                    this.__showError(error);
                }).finally(() => {
                    this.dispatchEvent(new CustomEvent('hidespinner'));
                });
        } else {
            console.log('inside the move folder to library condition');
            this.dispatchEvent(new CustomEvent('showspinner'));
            console.log('id of the current folder that is to be moved == -> ', this.allVariables.contFolderToMove);
            moveFolderToLibrary({ libraryId: this.allVariables.libraryId, folderId: this.allVariables.contFolderToMove })
                .then(result => {
                    console.log('Result', result);
                    // this.dispatchEvent(new CustomEvent('refreshcvinlibrary',));
                    this.dispatchEvent(new CustomEvent('handlecontentversionwithinfolders', {
                        detail: {
                            contentFolderId: this.allVariables.contDocId
                        }
                    }));
                    this.hideModalBox();
                    this.__showToast('Success', 'File Moved Successfully', 'success');
                })
                .catch(error => {
                    this.__showError(error);
                }).finally(() => {
                    this.dispatchEvent(new CustomEvent('hidespinner'));
                });
        }
    }

    __moveFile() {
        if (this.allVariables.arrayOfIds.length > 0) {
            this.dispatchEvent(new CustomEvent('showspinner',));
            moveFileWithinFolders({ docId: this.allVariables.contDocId, parentFolderId: this.allVariables.contentFolderId })
                .then(result => {
                    console.log('Result', result);
                    if (this.allVariables.contentFolderToRefresh) {
                        this.dispatchEvent(new CustomEvent('handlecontentversionwithinfolders', {
                            detail: {
                                contentFolderId: this.allVariables.contentFolderToRefresh
                            }
                        }));
                    } else {
                        this.dispatchEvent(new CustomEvent('refreshcvinlibrary',));
                    }
                    this.hideModalBox();
                    this.__showToast('Success', 'File Moved Successfully', 'success');
                })
                .catch(error => {
                    this.__showError(error);
                }).finally(() => {
                    this.dispatchEvent(new CustomEvent('hidespinner'));
                });
        } else {
            console.log('in else condition');
            this.dispatchEvent(new CustomEvent('showspinner',));
            moveFileToLibrary({ libraryId: this.allVariables.libraryId, contDocId: this.allVariables.contDocId })
                .then(result => {
                    console.log('Result', result);
                    this.dispatchEvent(new CustomEvent('handlecontentversionwithinfolders', {
                        detail: {
                            contentFolderId: this.allVariables.contentFolderToRefresh
                        }
                    }));
                    this.hideModalBox();
                    this.__showToast('Success', 'File Moved Successfully', 'success');
                })
                .catch(error => {
                    this.__showError(error);
                }).finally(() => {
                    this.dispatchEvent(new CustomEvent('hidespinner'));
                });

        }
    }

    __showError(error) {
        console.error('Error:', error);
        let eror = '';
        if (error.body.message) {
            eror = error.body.message;
        }
        else if (error.body.pageErrors) {
            error.body.pageErrors.forEach(error => {
                eror += error.statusCode + ' ' + error.message + '\n';
            });
        }
        this.__showToast('Error', eror, 'error');
    }


    __showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant,
            })
        );
    }
}