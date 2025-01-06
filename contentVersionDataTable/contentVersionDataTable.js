import { LightningElement, wire, track, api } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getContentVersions from '@salesforce/apex/ContentVersionController.getContentVersions';
import renameContentVersion from '@salesforce/apex/ContentVersionController.renameContentVersion';
import deleteContentVerson from '@salesforce/apex/ContentVersionController.deleteContentVersion';
import createNewFolder from '@salesforce/apex/ContentVersionController.createNewFolder';
import deleteContentFolder from '@salesforce/apex/ContentVersionController.deleteContentFolder';
import renameContentFolder from '@salesforce/apex/ContentVersionController.renameContentFolder';
import showRelatedContentVersion from '@salesforce/apex/ContentVersionController.showRelatedContentVersion';
import createNewFolderInFolder from '@salesforce/apex/ContentVersionController.createNewFolderInFolder';
import uploadFiles from '@salesforce/apex/ContentVersionController.uploadFiles';
import uploadFileOnFolder from '@salesforce/apex/ContentVersionController.uploadFileInFolder';
import { NavigationMixin } from 'lightning/navigation';

const PAGE_SIZE = 10;

export default class ContentVersionTable extends NavigationMixin(LightningElement) {
    @track showFiles = true;
    @track showModal = false;
    @track showRenameFields = false;
    @track showCreateNewFolderFields = false;
    @track showContentShareModal = false;
    @track isLoading = false;
    @track idOfContentVersion = null;
    @track contentFolderId = null;
    @track contVersionId = null;
    @track fileType = null;
    @track shareFileId = null;
    @track fileCount = 0;
    @track sortBy = 'LastModifiedDate';
    @track sortDirection = 'desc';
    @track tempSortDirection = '';
    @track modalHeading = 'New Folder';
    @track data = [];
    @track arrayOfIds = [];
    @track arrayOfTypes = [];
    @track pageNumber = 1;
    @track totalPages = 1;
    @api searchKey;
    @api libraryId;
    @track name = '';
    @track breadcrumbs = [];
    wiredContentVersionsResult;

    @api showContentVersionComp;
    @api libraryName;

    @track columns = [
        {
            label: 'Title', fieldName: 'id', type: 'button', sortable: true,
            initialWidth: 1000,
            typeAttributes: {
                label: { fieldName: 'Title' },
                value: { fieldName: 'Id' },
                name: 'view_details',
                variant: 'base',
                tooltip: '' 
            },
            cellAttributes: { iconName: { fieldName: 'IconName' }, iconPosition: 'left' }
        },
        { label: 'File Type', fieldName: 'FileType', type: 'text', initialWidth: 200, },
        {
            label: 'Owner',
            fieldName: 'OwnerNameLink',
            type: 'url',
            initialWidth: 200,
            typeAttributes: { label: { fieldName: 'OwnerName' }, target: '_blank' },
        },
        {
            label: 'Last Modified By',
            fieldName: 'LastModifiedByName',
            type: 'text',
            initialWidth: 300,
        },
        {
            label: 'LastModified Date',
            fieldName: 'LastModifiedDate',
            type: 'date',
            initialWidth: 200,
            typeAttributes: {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            },
            sortable: true
        },
        {
            label: 'Created Date',
            fieldName: 'CreatedDate',
            type: 'date',
            initialWidth: 150,
            typeAttributes: {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            },
            sortable: true
        },
        {
            label: 'File Size (kb)',
            fieldName: 'ContentSize',
            type: 'number',
            initialWidth: 150,
            sortable: true
        },
        {
            type: 'action',
            typeAttributes: { rowActions: this.__getRowActions }
        }
    ];

    get sortedBy() {
        return this.sortBy1 || this.sortBy;
    }

    get sortedDirection() {
        return this.sortDirection1 || this.sortDirection || 'asc';
    }

    __getRowActions(row, doneCallback) {
        let actions = [];
        if (row.FileType == 'Folder') {
            actions = [
                { label: 'Rename', name: 'rename' },
                { label: 'Move', name: 'move' },
                { label: 'Delete', name: 'delete' },
            ];
        } else {
            actions = [
                { label: 'Download', name: 'Download' },
                { label: 'Share', name: 'Share' },
                { label: 'View File Details', name: 'viewFileDetails' },
                { label: 'Edit File Details', name: 'rename' },
                { label: 'Move', name: 'move' },
                { label: 'Delete', name: 'delete' },
            ];
        }
        doneCallback(actions);
    }

    connectedCallback() {
        // this.refreshTable();
        this.addEventListener('openmodal', this.openModal.bind(this));
        console.log('library id in child ==--> ', this.libraryId);
        if (this.arrayOfIds.length == 0) {
            this.arrayOfIds.push(this.libraryId);
        }
    }

    renderedCallback() {
        if (this.data.length > 0) {
            const dataEvent = new CustomEvent('senddata', {
                detail: this.data
            });
            this.dispatchEvent(dataEvent);
        }
    }

    @wire(getContentVersions, { sortBy: 'CreatedDate', sortDirection: 'desc', searchKey: '$searchKey', libraryId: '$libraryId', })
    wiredContentVersions(result) {
        this.wiredContentVersionsResult = result;
        this.isLoading = true;
        if (result.data) {
            console.log('data recieved without stringify ==-->', result.data);
            this.fileCount = result.data.length;
            console.log('filecount in wire in child ==---->> ', this.fileCount);
            this.dispatchEvent(new CustomEvent('handlefilecountfromcv',
                {
                    detail: {
                        fileCount: this.fileCount,
                    }
                }));
            console.log('result.data.length child ==-->', this.fileCount);
            if (result.data.length > 0) {
                this.totalPages = Math.ceil(result.data.length / PAGE_SIZE);
                this.data = this.__paginateData(result.data);
            } else {
                this.totalPages = 1;
                this.data = [];
            }
            this.isLoading = false;
        } else if (result.error) {
            console.error('Error fetching content versions:', result.error);
            this.isLoading = false;
        }
    }

    @api getContentVersion() {
        console.log('in child for delete');
        let id = this.arrayOfIds.length - 1;
        console.log('inside == 1', this.arrayOfIds[id]);
        if (this.arrayOfIds.length == 1) {
            console.log('inside length == 1', this.arrayOfIds[id]);
            refreshApex(this.wiredContentVersionsResult);
        } else {
            console.log('inside else == 1', this.arrayOfIds[id]);
            this.__showRelatedContentVersions(this.arrayOfIds[id], '');
        }
    }

    openModal() {
        this.showModal = true;
        this.showCreateNewFolderFields = true;
    }

    closeModal() {
        this.showModal = false;
        this.showCreateNewFolderFields = false;
    }

    @api handleUploadFinish(event) {
        const uploadedFiles = event.detail.files;
        console.log('file upload initiated : ', JSON.stringify(uploadedFiles));
        console.log('event.detail.files ==--> ', event.detail.files);
        console.log('event.detail ==--> ', event.detail);

        console.log('document id  ===-->', uploadedFiles[0].documentId);
        const fileName = [];
        const base64Data = [];
        const contentType = [];

        uploadedFiles.forEach(file => {
            fileName.push(file.name);
            base64Data.push(file.documentId);
            contentType.push(file.mimeType);
        });

        this.isLoading = true;
        console.log('this.library id ==---> ', this.libraryId);
        uploadFiles({ libraryId: this.libraryId, fileName, base64Data, contentType })
            .then(() => {
                refreshApex(this.wiredContentVersionsResult);
                this.__showToast('Success', 'File uploaded successfully', 'success');
            })
            .catch(error => {
                console.log('error uploding : ', error);
                console.log('error uploding : ', error.body);
                let errorMessage = this.__handleError(error);
                if (errorMessage) {
                    this.__showToast('Error', errorMessage, 'error');
                } else {
                    this.__showToast('Error', 'Error uploading', 'error');
                }
            }).finally(() => {
                this.isLoading = false;
            });

        if (this.arrayOfIds.length > 1) {
            let lastIndex = this.arrayOfIds.length - 1;
            let contentfolderId = this.arrayOfIds[lastIndex];
            console.log('contentfolderId in upload ==--> ', contentfolderId);
            uploadFileOnFolder({ contentfolderId: contentfolderId, contentDocumentId: base64Data })
                .then(result => {
                    console.log('Result :: ', result);
                    this.__showRelatedContentVersions(contentfolderId, '');
                    this.__showToast('Success', 'File uploaded successfully', 'success');
                })
                .catch(error => {
                    console.error('Error :: ', error);
                    let errorMessage = this.__handleError(error);
                    if (errorMessage) {
                        this.__showToast('Error', errorMessage, 'error');
                    } else {
                        this.__showToast('Error', 'Error uploading', 'error');
                    }

                }).finally(() => {
                    this.isLoading = false;
                });
        }

    }

    __showContentVersionsRelatedToLibrary() {
        console.log('inside show content version related to library parent');
        console.log('this.libraryId ==---> ', this.libraryId);
        this.isLoading = true;
        getContentVersions({ sortBy: this.sortBy, sortDirection: this.sortDirection, searchKey: this.searchKey, libraryId: this.libraryId })
            .then(result => {
                console.log('Result :: parent ::: ---->', result);

                if (result.length > 0) {
                    this.totalPages = Math.ceil(result.length / PAGE_SIZE);
                    this.data = this.__paginateData(result);
                } else {
                    this.totalPages = 1;
                    this.data = [];

                }
            })
            .catch(error => {
                console.error('Error:', error);
                let errorMessage = this.__handleError(error);
                if (errorMessage) {
                    this.__showToast('Error', errorMessage, 'error');
                } else {
                    this.__showToast('Error', 'Error', 'error');
                }
            }).finally(() => {
                this.isLoading = false;
            });
        refreshApex(this.wiredContentVersionsResult);
    }

    __showRelatedContentVersions(idOfContentFolder, title) {
        console.log('inside the content version under folders folder', idOfContentFolder, " " + title);
        this.isLoading = true;
        showRelatedContentVersion({ contentFolderId: idOfContentFolder, title: title, sortBy: this.sortBy, sortDirection: this.sortDirection })
            .then(result => {
                
                console.log('result ==-->> ', result);
                this.fileCount = result.length;
                console.log('file count in child ==----> ', this.fileCount);
                if (result.length > 0) {
                    this.totalPages = Math.ceil(result.length / PAGE_SIZE);
                    this.data = this.__paginateData(result);
                    console.log('the data ;;;; ', this.data);
                } else {
                    this.totalPages = 1;
                    this.data = [];
                }
                this.dispatchEvent(new CustomEvent('handlefilecountfromcv',
                    {
                        detail: {
                            fileCount: this.fileCount,
                        }
                    }));
                // refreshApex(this.wiredContentVersionsResult);
            })
            .catch(error => {
                console.error('Error:', error);
                let errorMessage = this.__handleError(error);
                if (errorMessage) {
                    this.__showToast('Error', errorMessage, 'error');
                } else {
                    this.__showToast('Error', 'Error', 'error');
                }
            }).finally(() => {
                this.isLoading = false;
            });
    }

    showRelatedCVFromChild(e) {
        let conFolderId = e.detail.contentFolderId;
        this.__showRelatedContentVersions(conFolderId, '');
    }

    refreshRelatedCV() {
        console.log('refresh the related library condition');
        // refreshApex(this.wiredContentVersionsResult);
        this.__showContentVersionsRelatedToLibrary();
    }

    handleRenameFolder(e) {
        this.name = e.target.value;
    }

    handleRowSelection(event) {
        const selectedRows = JSON.parse(JSON.stringify(event.detail.selectedRows));
        console.log(selectedRows.length, 'select Rows child -- ', selectedRows);
        const sendSelectedRows = new CustomEvent('selectedrowsoncontentversion', {
            detail: { selectedRows: selectedRows, show: true }
        });
        this.dispatchEvent(sendSelectedRows);
    }

    handleSort(event) {
        const { fieldName: field, sortDirection } = event.detail;
        console.log('sort==> 1', { fieldName: field, sortDirection });

        this.sortBy = (field === 'Id') ? 'Title' : field;

        if (this.tempSortDirection == this.sortDirection) {
            this.sortDirection = (this.sortDirection === 'asc') ? 'desc' : 'asc';
        } else {
            this.sortDirection = sortDirection;
        }

        this.tempSortDirection = this.sortDirection;

        
        console.log('sort direction ', this.sortDirection);
        console.log('sort sortBy title ', this.sortBy);
        console.log('sort sortBy tempSortDirection ', this.tempSortDirection);


        if(this.arrayOfIds.length == 1){
            this.__showContentVersionsRelatedToLibrary();
            console.log('content version related to lib loading.....');
        } else {
            console.log('content version related to folders loading.....');
            let len = this.arrayOfIds.length - 1;
            let id = this.arrayOfIds[len];
            this.__showRelatedContentVersions(id, '');
        }
    }

    @api handleSearchChange(searchTitle) {
        console.log('handle search change in child');
        this.pageNumber = 1;
        if (this.arrayOfIds.length == 1) {
            console.log('when length of array is 1')
            refreshApex(this.wiredContentVersionsResult);
        } else {
            console.log('when length of array is more than 1', searchTitle);
            let len = this.arrayOfIds.length - 1;
            let id = this.arrayOfIds[len];
            this.__showRelatedContentVersions(id, searchTitle);
        }
        console.log('entered search change this.pageNumber ==--> ', this.pageNumber);
    }

    handlePrevious() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            if (this.arrayOfIds.length == 1) {
                console.log('when length of array is 1 in previous')
                this.__refreshTable();
            } else {
                console.log('when length of array is more than 1 in previous');
                let len = this.arrayOfIds.length - 1;
                let id = this.arrayOfIds[len];
                this.__showRelatedContentVersions(id, '');
            }
        }
    }

    handleNext() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            if (this.arrayOfIds.length == 1) {
                console.log('when length of array is 1 in handleNext')
                this.__refreshTable();
            } else {
                console.log('when length of array is more than 1 in handleNext');
                let len = this.arrayOfIds.length - 1;
                let id = this.arrayOfIds[len];
                this.__showRelatedContentVersions(id, '');
            }
        }
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        this.fileType = event.detail.row.FileType;
        console.log('fileType *****************==--> ', JSON.stringify(event.detail));
        console.log('fileType *****************==--> ', this.fileType);

        if (this.fileType == "Folder") {
            console.log('entered the folder condition');
            this.contentFolderId = event.detail.row.Id;
            const title = event.detail.row.Title;

            console.log('content folder id ==--->', this.contentFolderId);
            switch (actionName) {
                case 'delete':
                    this.deleteContentFolders(this.contentFolderId);
                    break;
                case 'rename':
                    this.__renameContentFolders(this.contentFolderId, title);
                    break;
                case 'move':
                    let len = this.arrayOfIds.length;
                    let idOfFolderToRefresh = '';
                    if ((this.arrayOfIds[len - 1]).substring(0, 3) != '058') {
                        idOfFolderToRefresh = this.arrayOfIds[len - 1];
                    } else {
                        idOfFolderToRefresh = null;
                    }
                    let details = this.__getDetailsForMove(title, idOfFolderToRefresh);
                    console.log('details 121212++----> ', details);
                    this.template.querySelector('c-move-file-and-folder').handleShowModal(details);
                    break;
                case 'view_details':
                    console.log('view detail clicked');
                    this.dispatchEvent(new CustomEvent('handlebreadcrumb',
                        {
                            detail: {
                                names: title,
                            }
                        }));
                    this.__showRelatedContentVersions(this.contentFolderId, '');
                    if (!this.arrayOfIds.includes(this.contentFolderId)) {
                        this.arrayOfIds.push(this.contentFolderId);
                    }
                    console.log('id array 2******************* ==--> ', JSON.stringify(this.arrayOfIds));
                    break;
            }
        } else {
            console.log('entered the else condition', this.fileType);
            const contVersionId = event.detail.row.Id;
            const contDocId = event.detail.row.ContentDocumentId;
            const title = event.detail.row.Title;
            console.log('content version id ==--->', contVersionId);
            switch (actionName) {
                case 'delete':
                    this.__deleteContentVersion(contVersionId);
                    break;
                case 'rename':
                    this.__handleRenameContentVersion(contVersionId, title);
                    break;
                case 'Download':
                    console.log('download condition initiated');
                    this.downloadFile(contDocId);
                    break;
                case 'view_details':
                    this.__previewFile(contDocId);
                    break;
                case 'viewFileDetails':
                    this.__viewFileDetailsHandler(contDocId);
                    break;
                case 'Share':
                    this.shareFileId = contVersionId;
                    this.__handleShareFile();
                    break;
                case 'move':
                    let details = this.__getDetailsForMove(title, contDocId);
                    this.template.querySelector('c-move-file-and-folder').handleShowModal(details);
                    this.__handleMoveFile(title, contDocId);
                    break;
            }
        }
    }

    __handleMoveFile(title, contDocId) {
        console.log('title of the modal ', title);
        console.log('contDocId ', contDocId);
        this.name = title;
    }

    __getDetailsForMove(title, contDocuId) {
        let contFoldId = '';
        if(this.arrayOfIds.length > 1){
            let indx = this.arrayOfIds.length - 1;
            contFoldId = this.arrayOfIds[indx];
        }
        let detail = {
            showMoveModal: true,
            name: title,
            libName: this.libraryName,
            libId: this.libraryId,
            cfId: contFoldId,
            fileType: this.fileType,
            contDocuId: contDocuId,
            contFolderToMove: this.contentFolderId
        };
        return detail;
    }

    __handleShareFile() {
        console.log('taking off to share modal');
        this.showContentShareModal = true;
    }

    closeShareModal() {
        this.showContentShareModal = false;
    }

    async downloadFile(contentDocumentId) {
        try {
            console.log('id ++++++=======---->', contentDocumentId);
            let downloadUrl = `/sfc/servlet.shepherd/document/download/${contentDocumentId}`;
            window.open(downloadUrl, '_blank');
        } catch (error) {
            console.error('Error downloading file', error);
        }
    }

    __viewFileDetailsHandler(conDoc) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: conDoc,
                objectApiName: 'ContentDocument',
                actionName: 'view',
            },
        });
    }

    __previewFile(docId) {
        console.log('idOfSelectedRowFile1 ==---> ', docId);
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state: {
                selectedRecordId: docId,
            }
        })
    }

    __handleRenameContentVersion(contVersionId, title) {
        this.showModal = true;
        this.showRenameFields = true;
        this.name = title;
        this.idOfContentVersion = contVersionId;
        this.modalHeading = `Rename File ${title}`;
        console.log('content version id on rename ', this.idOfContentVersion);
    }

    hideModalBox() {
        this.showModal = false;
        this.showRenameFields = false;
        this.showCreateNewFolderFields = false;
        this.name = null;
        this.idOfContentVersion = null;
        this.modalHeading = 'New Folder';
    }

    handleNameChange(event) {
        console.log('handleNameChange===>')
        this.name = event.target.value;
    }

    get isButtonDisabled() {
        return !this.name || !this.name || this.name.trim() === '';
    }


    handleSave() {
        console.log('inside handle save', this.contentFolderId);
        if (this.showCreateNewFolderFields == false && this.showRenameFields == true) {
            if (this.fileType == "Folder") {
                console.log('inside rename folder condition');
                this.isLoading = true;
                renameContentFolder({ contentFolderId: this.contentFolderId, contentFolderName: this.name })
                    .then(result => {
                        console.log('Result', result);
                        let len = this.arrayOfIds.length - 1;
                        let id = this.arrayOfIds[len];
                        if (this.arrayOfIds.length == 1) {
                            refreshApex(this.wiredContentVersionsResult);
                        } else {
                            this.__showRelatedContentVersions(id, '');
                        }
                        this.__showToast('Success', 'File Renamed successfully', 'success');
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        let errorMessage = this.__handleError(error);
                        if (errorMessage) {
                            this.__showToast('Error', errorMessage, 'error');
                        } else {
                            this.__showToast('Error', 'Error during renaming', 'error');
                        }
                    }).finally(() => {
                        this.isLoading = false;
                        this.hideModalBox();
                    });
            } else {
                console.log('inside rename content version condition', this.idOfContentVersion);
                this.isLoading = true;
                renameContentVersion({ contVersionId: this.idOfContentVersion, name: this.name })
                    .then(result => {
                        console.log('Result', result);
                        refreshApex(this.wiredContentVersionsResult);
                        this.__showToast('Success', 'File Renamed Successfully', 'success');
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        let errorMessage = this.__handleError(error);
                        if (errorMessage) {
                            this.__showToast('Error', errorMessage, 'error');
                        } else {
                            this.__showToast('Error', 'Error during renaming', 'error');
                        }
                    }).finally(() => {
                        this.isLoading = false;
                        this.hideModalBox();
                    });
            }
        } else if (this.showCreateNewFolderFields == true && this.showRenameFields == false) {
            console.log('inside create new folder condition');
            console.log('library id ==--> ', this.libraryId);
            console.log('this.arrayOfIds in handle save ==--> ', this.arrayOfIds);

            let len = this.arrayOfIds.length;
            let id = this.arrayOfIds[len - 1];
            let idPrefix = id.substring(0, 3);
            console.log('value of len => ', len);
            console.log('value of id => ', id);
            console.log('value of idPrefix => ', idPrefix);

            if (idPrefix == '058') {  //prefix for library id
                console.log('inside the file type library condition ');
                this.isLoading = true;
                createNewFolder({ libraryId: id, name: this.name })
                    .then(result => {
                        console.log('Result', result);
                        refreshApex(this.wiredContentVersionsResult);
                        this.__showToast('Success', 'File Created Successfully', 'success');
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        let errorMessage = this.__handleError(error);
                        if (errorMessage) {
                            this.__showToast('Error', errorMessage, 'error');
                        } else {
                            this.__showToast('Error', 'Error creating new folder', 'error');
                        }
                    }).finally(() => {
                        this.isLoading = false;
                        this.hideModalBox();
                    });
            } else if (idPrefix == '07H') {   //prefix for folder id
                console.log('inside the file type folder');
                this.isLoading = true;
                createNewFolderInFolder({ folderId: id, name: this.name })
                    .then(result => {
                        console.log('Result', result);
                        refreshApex(this.__showRelatedContentVersions(id, ''));
                        this.__showToast('Success', 'Folder Created Successfully', 'success');
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        let errorMessage = this.__handleError(error);
                        if (errorMessage) {
                            this.__showToast('Error', errorMessage, 'error');
                        } else {
                            this.__showToast('Error', 'Error creating new folder', 'error');
                        }
                    }).finally(() => {
                        this.isLoading = false;
                        this.hideModalBox();
                    });
            }
        }
    }

    __deleteContentVersion(contVersionId) {
        console.log('inside deleteContentVersion ', contVersionId);
        this.isLoading = true;
        deleteContentVerson({ contVersionId })
            .then(() => {
                refreshApex(this.wiredContentVersionsResult);
                this.__showToast('Success', 'Content deleted', 'success');
            })
            .catch(error => {
                console.log('OUTPUT :error=== ', error);
                let errorMessage = this.__handleError(error);
                if (errorMessage) {
                    this.__showToast('Error', errorMessage, 'error');
                } else {
                    this.__showToast('Error', 'Error deleting', 'error');
                }
            }).finally(() => {
                this.isLoading = false;
            });
    }

    @api deleteContentFolders(contentFolderId) {
        console.log('inside the folder type folder in child', contentFolderId);
        this.isLoading = true;
        deleteContentFolder({ contentFolderId: contentFolderId })
            .then(result => {
                console.log('Result', result);
                let len = this.arrayOfIds.length - 1;
                let id = this.arrayOfIds[len];
                if (this.arrayOfIds.length == 1) {
                    refreshApex(this.wiredContentVersionsResult);
                } else {
                    this.__showRelatedContentVersions(id, '');
                }
                this.__showToast('Success', 'Folder deleted', 'success');
            })
            .catch(error => {
                console.error('Error:', error);
                let errorMessage = this.__handleError(error);
                if (errorMessage) {
                    this.__showToast('Error', errorMessage, 'error');
                } else {
                    this.__showToast('Error', 'Error deleting', 'error');
                }
            }).finally(() => {
                this.isLoading = false;
            });
    }

    __renameContentFolders(contentFolderId, title) {
        console.log('inside the folder type folder', contentFolderId);
       
        this.name = title;
        this.modalHeading = `Rename Folder ${title}`;
        this.showModal = true;
        this.showRenameFields = true;
    }

    handleBackButton() {
        this.dispatchEvent(new CustomEvent('handlebreadcrumbback', { message: 'delete one element' }));
        console.log('id array ==--> ', JSON.stringify(this.arrayOfIds));
        this.sortBy = 'CreatedDate';
        this.sortDirection = 'desc'
    
        if (this.arrayOfIds.length == 1) {
            console.log('len = 1');
            this.showFiles = false;
            this.dispatchEvent(new CustomEvent('showlibmodal', { detail: true }));

        } else if (this.arrayOfIds.length == 2) {
            console.log('len = 2');
            this.__showContentVersionsRelatedToLibrary();
            this.arrayOfIds.pop();
        } else {
            let id = this.arrayOfIds.length - 2;
            this.__showRelatedContentVersions(this.arrayOfIds[id], '');
            this.arrayOfIds.pop();
            console.log('id array 2 ==--> ', this.arrayOfIds);
        }
    }

    __refreshTable() {
        refreshApex(this.wiredContentVersionsResult).then(() => {
            this.data = this.__paginateData(this.wiredContentVersionsResult.data);
        }).catch(error => {
            console.error('Error refreshing content versions:', error);
        });
    }

    __paginateData(data) {
        console.log('data recieved in pagination', data);
        console.log('pagenumber in pagination ', this.pageNumber);
        let startIndex = (this.pageNumber - 1) * PAGE_SIZE;
        let endIndex = startIndex + PAGE_SIZE;
        return data.slice(startIndex, endIndex).map(item => {
            let iconName = '';
            if (item.FileType == 'Folder') {
                iconName = 'doctype:folder';
            } else if (item.FileType == 'PDF' || item.FileType == 'pdf') {
                iconName = 'doctype:pdf';
            } else if (item.FileType == 'WORD' || item.FileType == 'WORD') {
                iconName = 'doctype:word';
            } else if (item.FileType == 'WORD_X' || item.FileType == 'WORD_X') {
                iconName = 'doctype:excel';
            } else {
                iconName = 'doctype:image';
            }
            return {
                ...item,
                Id: `${item.Id}`,
                ContentDocumentId: item.ContentDocumentId,
                OwnerName: item.OwnerName,
                OwnerNameLink: '/lightning/r/User/' + item.OwnerId + '/view',
                IconName: iconName,
            };
        });
    }

    __handleError(error) {
        let errorMessage = error.body.message;
        let keyword1 = "DUPLICATE_VALUE"
        let keyword2 = "first error:";

        if (errorMessage.includes(keyword1)) {
            let specificMessage = errorMessage.substring(errorMessage.indexOf(keyword1));
            console.log(specificMessage.trim());
            return specificMessage;
        } else if(errorMessage.includes(keyword2)) {
            let specificMessage = errorMessage.substring(errorMessage.indexOf(keyword2));
            console.log(specificMessage.trim());
            return specificMessage;
        } else {
            console.log('Relevant error message not found');
        }
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

    handleHideSpinner() {
        this.isLoading = false;

    }

    handleShowSpinner() {
        this.isLoading = true;
    }
}