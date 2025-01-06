import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadStyle } from 'lightning/platformResourceLoader';
import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getLibraries from '@salesforce/apex/ContentWorkspaceController.getLibraries';
import deleteLibrary from '@salesforce/apex/ContentWorkspaceController.deleteLibrary';
import createLibrary from '@salesforce/apex/ContentWorkspaceController.createLibrary';
import updateLibrary from '@salesforce/apex/ContentWorkspaceController.updateLibrary';
import getRecentFiles from '@salesforce/apex/CustomLibraries.getRecentFiles';
import updateFiles from '@salesforce/apex/CustomLibraries.updateFiles';
import getSearchfile from '@salesforce/apex/CustomLibraries.getSearchfile';
import getDownloadUrl from '@salesforce/apex/CustomLibraries.getDownloadUrl';
import getFilesSharedWithMe from '@salesforce/apex/CustomLibraries.getFilesSharedWithMe';
import deleteFiles from '@salesforce/apex/CustomLibraries.deleteContentDocuments';
import getFilesOnTheBasisOfUsers from '@salesforce/apex/CustomLibraries.getFilesOnTheBasisOfUsers';
import FileUploadCSS from '@salesforce/resourceUrl/FileUploadCSS';
import USER_ID from '@salesforce/user/Id';
const PAGE_SIZE = 10;


export default class FileExplorer extends NavigationMixin(LightningElement) {

    @track allVariables = {
        isOwnedByMeDataVisible: true, showLibraries: true, showFiles: true, showNewUploadButton: true, getPagination: true, libraries: false,
        isShareVisible: false, showContentVersions: false, showOwnedModal: false, showNewFolderButton: false, showCreateLibraryInputs: false,
        showEditLibraryInputs: false, showModal: false, showNewDeleteButton: false, showManageMembers: false, showContentShareModal: false,
        libraryIds: null, description: null, name: null, shareFileId: null, libraryModalHeading: null, files: [], libraries: [], filteredLibraries: [],
        getAllSelectedRows: [], pageNumber: 1, totalPages: 1, sortBy: 'LastModifiedDate', error: null, recordContentId: null, sortField: null,
        isParentModVisible: false, librariesData: false, label: 'Owned by Me', sortDirection: 'desc', searchKey: '', fileCount: 0, libName: '',
        breadCrumb: [], isContentVersionsVisible: false, isLoading: false, tempSortDirection: '', isCheckBoxHidden: true, label:'Files', hideNextPrev : false
    };
    sharedFileWithMeRes;
    wiredLibrariesResult;
    wiredRecentFiles;
    wiredFilesResult;

    @track columns = [
        {
            label: 'Title', fieldName: 'Id', type: 'button', sortable: true,
            initialWidth: 900,
            typeAttributes: {
                label: { fieldName: 'Title' },
                target: '_blank',
                value: { fieldName: 'Id' },
                name: 'view_details',
                variant: 'base'
            },
            cellAttributes: { iconName: { fieldName: 'IconName' }, iconPosition: 'left' }

        },
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

    @track columns1 = [
        {
            label: 'Title', fieldName: 'Id', type: 'button', sortable: true,
            initialWidth: 1000,
            typeAttributes: {
                label: { fieldName: 'Title' },
                target: '_blank',
                value: { fieldName: 'Id' },
                name: 'view_details',
                variant: 'base'
            },
            cellAttributes: { iconName: { fieldName: 'IconName' }, iconPosition: 'left' }
        },
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
    @track columns2 = [
        {
            label: 'Library Name',
            fieldName: 'Name',
            type: 'button',
            initialWidth: 850,
            typeAttributes: {
                label: { fieldName: 'Name' },
                name: 'view_details',
                variant: 'base'
            },
            cellAttributes: {
                iconName: 'doctype:library_folder',
                iconPosition: 'left'
            },
            sortable: true
        },
        {
            label: 'Last Modified By',
            fieldName: 'lastModifiedByName',
            type: 'text',
            initialWidth: 300,
        },
        {
            label: 'Last Activity',
            fieldName: 'lastWorkspaceActivityDate',
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
            label: 'Last ModifiedDate',
            fieldName: 'lastModifiedDate',
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
            type: 'action',
            typeAttributes: { rowActions: this.getRowLibActions }
        },
    ];

    @track columns3 = [
        {
            label: 'Title', fieldName: 'Id', type: 'button', sortable: true,
            initialWidth: 1000,
            typeAttributes: {
                label: { fieldName: 'Title' },
                target: '_blank',
                value: { fieldName: 'Id' },
                name: 'view_details',
                variant: 'base'
            },
            cellAttributes: { iconName: { fieldName: 'IconName' }, iconPosition: 'left' }
        },
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
            // typeAttributes: { rowActions: this.getRowActions }
            typeAttributes: { rowActions: this.__getRowActions }
        }
    ];

    __getRowActions(row, doneCallback) {
        let actions = [];
        if (row.FileType == 'SNOTE') {
            actions = [
                { label: 'Delete', name: 'Delete' }
            ];
        }
        if (row.ProfileType == "System Administrator" || row.OwnerId == USER_ID) {
            actions = [
                { label: 'Download', name: 'Download' },
                { label: 'Share', name: 'Share' },
                { label: 'View File Details', name: 'View' },
                { label: 'Edit File Details', name: 'Edit' },
                { label: 'Delete', name: 'Delete' }
            ];
        } else {
            actions = [
                { label: 'Download', name: 'Download' },
                { label: 'Share', name: 'Share' },
                { label: 'View File Details', name: 'View' },
            ];
        }
        doneCallback(actions);
    }

    getRowLibActions(row, doneCallback) {
        let actions = [];
        if (row.TypeOfAccess == "Library Administrator") {
            actions = [
                { label: 'Manage Members', name: 'Share' },
                { label: 'Edit Library Details', name: 'Edit' },
                { label: 'Delete', name: 'Delete' },
            ];
        } else{
            actions = [
                { label: 'Manage Members', name: 'Share' },
                { label: 'Edit Library Details', name: 'Edit' },
            ];
        }
        doneCallback(actions);
    }

    connectedCallback() {
        loadStyle(this, FileUploadCSS)
            .then(() => {
                console.log('Styles loaded successfully');
            })
            .catch((error) => {
                console.log('Error loading styles', error);
            });
    }

    get isButtonDisabled() {
        return !this.allVariables.name || !this.allVariables.name || this.allVariables.name.trim() === '';
    }

    // @wire(getRecentFiles)
    // wiredRecentFiles(result) {
    //     this.allVariables.files = []
    //     console.log('wired is triggered recent');
    //     this.wiredRecentFiles = result;
    //     this.allVariables.isLoading = true;
    //     if (result.data) {
    //         const res = result.data;
    //         this.__manageWiredResult(res);
    //     } else if (result.error) {
    //         if (result.error.message) {
    //             this.allVariables.error = result.error.message;
    //         } else {
    //             this.allVariables.error = 'Nothing found';
    //         }
    //         this.allVariables.isLoading = false;
    //     }
    // }

    @wire(getFilesOnTheBasisOfUsers, { userId: USER_ID })
    wiredFiles(result) {
        this.allVariables.files = []
        this.allVariables.ownedFiles = [];
        console.log('wired is triggered owned');
        this.wiredFilesResult = result;
        this.allVariables.isLoading = true;
        if (result.data) {
            const res = result.data;
            this.__manageWiredResult(res);
        } else if (result.error) {
            if (result.error.message) {
                this.allVariables.error = result.error.message;
            } else {
                this.allVariables.error = 'Nothing found';
            }
            this.allVariables.isLoading = false;
        }
    }

    __manageWiredResult(res) {
        this.allVariables.isLoading = false;
        console.log('result ==---> ', res);
        this.allVariables.fileCount = res.length;
        console.log('this.allVariables.totalPages wire for recent files ==--- > ', this.allVariables.totalPages);
        let paginatedFiles = [];
        if (this.allVariables.fileCount > 0) {
            this.allVariables.totalPages = Math.ceil(res.length / PAGE_SIZE);
            paginatedFiles = this.__paginateData(res);
        } else {
            this.allVariables.totalPages = 1;
        }
        if(res.length > 0 && res[0].ProfileType == "System Administrator"){
            this.allVariables.isCheckBoxHidden = false;
        } else{
            this.allVariables.isCheckBoxHidden = true;
        }
        console.log('paginated files ==--- > ', paginatedFiles);
        console.log('value in files in wire ==--->> ', this.allVariables.files);
        if (paginatedFiles != null && paginatedFiles != undefined && paginatedFiles.length > 0) {
            this.allVariables.files = paginatedFiles.map(file => ({
                ...file,
                OwnerNameLink: '/lightning/r/User/' + file.OwnerId + '/view',
                OwnerName: file.OwnerName,
                downloadUrl: '',
                id: file.Id,
                fileType: file.FileType,
                IconName: this.__getIconName(file.FileType),
            }));
            console.log('this.allVariables.files ===___----> ', this.allVariables.files);
        }
    }

    __getIconName(fileType) {
        let fileTypeIconMap = new Map();
        fileTypeIconMap = {
            'Folder': 'doctype:folder',
            'PDF': 'doctype:pdf',
            'WORD': 'doctype:word',
            'WORD_X': 'doctype:excel',
            'SNOTE': 'doctype:note',
            'PNG': 'doctype:image',
            'JPEG': 'doctype:image',
            'JPG': 'doctype:image',
            "WEBP": "doctype:image",
            "RAW": "doctype:image",
            "GIF": "doctype:image",
            "BMP": "doctype:image",
            "EPS": "doctype:image",
            "TIFF": "doctype:image",
            "OTF": "doctype:image",
            "TTF": "doctype:css",
            "CSV": "doctype:csv",
            "XML": "doctype:xml",
            "HTML": "doctype:html",
            "TXT": "doctype:txt",
            "JSON": "doctype:txt",
            "DOC": "doctype:word",
            "DOCX": "doctype:word",
            "XLS": "doctype:excel",
            "XLSX": "doctype:excel",
            "PPT": "doctype:ppt",
            "PPTX": "doctype:ppt",
            "ZIP": "doctype:zip",
            "RAR": "doctype:rar",
            "BIN": "doctype:Bin",
            "EXE": "doctype:exe",
            "MPEG": "doctype:audio",
            "OGG": "doctype:audio",
            "WAV": "doctype:audio",
            "MP4": "doctype:mp4",
            "AVI": "doctype:video",
            "WEBM": "doctype:video",
            "3GPP": "doctype:video",
            'SNOTE': 'doctype:unknown',
            'UNKNOWN': 'doctype:unknown',
        };
        if (fileTypeIconMap[fileType]) {
            return fileTypeIconMap[fileType];
        } else {
            return fileTypeIconMap['UNKNOWN'];
        }
    }
    __fetchFiles(){
         this.allVariables.files = [];
        this.allVariables.isLoading = true;
        getSearchfile({ userId: USER_ID, title: this.allVariables.searchKey, sortBy: this.allVariables.sortBy, sortDirection: this.allVariables.sortDirection })
            .then(result => {
                console.log(result);
                let alteredData =  result.filter(item => item.FileType !=='SNOTE');
                // alteredData.sort((a,b)=>{
                //     return a.Title.localeCompare(b.Title);
                // });
                console.log("alteredData-->",alteredData);
                this.__manageWiredResult(alteredData);
                this.allVariables.error = null;
            })
            .catch(error => {
                if (error.message) {
                    this.allVariables.error = error.message;
                } else {
                    this.allVariables.error = 'Nothing found';
                }
            }).finally(() => {
                this.allVariables.isLoading = false;
            });
    }
    __fetchOwnedFiles() {
        this.allVariables.files = [];
        this.allVariables.isLoading = true;
        getSearchfile({ userId: USER_ID, title: this.allVariables.searchKey, sortBy: this.allVariables.sortBy, sortDirection: this.allVariables.sortDirection })
            .then(result => {
                this.__manageWiredResult(result);
                this.allVariables.error = null;
            })
            .catch(error => {
                if (error.message) {
                    this.allVariables.error = error.message;
                } else {
                    this.allVariables.error = 'Nothing found';
                }
            }).finally(() => {
                this.allVariables.isLoading = false;
            });
    }

    __fetchSharedFiles() {
        this.allVariables.files = [];
        this.allVariables.isLoading = true;
        getFilesSharedWithMe({ userId: USER_ID, title: this.allVariables.searchKey, sortBy: this.allVariables.sortBy, sortDirection: this.allVariables.sortDirection })
            .then(result => {
                this.__manageWiredResult(result);
                this.allVariables.error = null;
                this.allVariables.isShareVisible = true;
            })
            .catch(error => {
                console.error('Error retrieving shared files:', error);
            }).finally(() => {
                this.allVariables.isLoading = false;
            });
    }

    __fetchRecentFiles() {
        this.allVariables.files = [];
        this.allVariables.isLoading = true;
        console.log('entered feth files method');
        getRecentFiles({ userId: USER_ID, title: this.allVariables.searchKey, sortBy: this.allVariables.sortBy, sortDirection: this.allVariables.sortDirection })
            .then(result => {
                console.log('entered the fetc recent file condition');
                this.__manageWiredResult(result);
                this.allVariables.error = null;
            })
            .catch(error => {
                if (error.message) {
                    this.allVariables.error = error.message;
                } else {
                    this.allVariables.error = 'Nothing found';
                }
            }).finally(() => {
                this.allVariables.isLoading = false;
            });
    }
    handleFilesClick(e){ 
        this.allVariables.label = 'Files';
        this.allVariables.owned = e.target.value;
        this.allVariables.isOwnedByMeDataVisible = true;
        this.allVariables.librariesData = false;
        this.allVariables.showNewLibButton = false;
        this.allVariables.isParentModVisible = false;
        this.allVariables.showNewUploadButton = true;
        this.allVariables.showContentVersions = false;
        this.allVariables.showNewFolderButton = false;
        this.allVariables.showNewDeleteButton = false;
        this.allVariables.getPagination = true;
        this.allVariables.isShareVisible = false;
        this.allVariables.sortDirection = 'desc';
        this.allVariables.sortBy = 'CreatedDate';
        this.__fetchFiles();
        this.allVariables.pageNumber = 1;
        this.allVariables.libName = '';
        this.allVariables.breadCrumb = [];
        this.allVariables.hideNextPrev=false;
        }
    handleOwnedClick(e) {
        this.allVariables.label = 'Owned by Me';
        this.allVariables.owned = e.target.value;
        this.allVariables.isOwnedByMeDataVisible = true;
        this.allVariables.librariesData = false;
        this.allVariables.showNewLibButton = false;
        this.allVariables.isParentModVisible = false;
        this.allVariables.showNewUploadButton = true;
        this.allVariables.showContentVersions = false;
        this.allVariables.showNewFolderButton = false;
        this.allVariables.showNewDeleteButton = false;
        this.allVariables.getPagination = true;
        this.allVariables.isShareVisible = false;
        this.allVariables.sortDirection = 'desc';
        this.allVariables.sortBy = 'CreatedDate';
        this.__fetchOwnedFiles();
        this.allVariables.pageNumber = 1;
        this.allVariables.libName = '';
        this.allVariables.breadCrumb = [];
        this.allVariables.hideNextPrev=false;
    }

    handleSharedClick(e) {
        this.allVariables.label = 'Shared with me';
        this.allVariables.isOwnedByMeDataVisible = false;
        this.allVariables.librariesData = false;
        this.allVariables.showNewLibButton = false;
        this.allVariables.isParentModVisible = false;
        this.allVariables.showContentVersions = false;
        this.allVariables.showNewFolderButton = false;
        this.allVariables.showNewUploadButton = true;
        this.allVariables.isShareVisible = true;
        this.allVariables.showNewDeleteButton = false;
        this.allVariables.getPagination = true;
        this.allVariables.sortDirection = 'desc';
        this.allVariables.sortBy = 'CreatedDate';
        this.__fetchSharedFiles();
        this.allVariables.pageNumber = 1;
        this.allVariables.libName = '';
        this.allVariables.breadCrumb = [];
        this.allVariables.hideNextPrev=false;
    }

    handlRecentClick(e) {
        this.allVariables.label = 'Recent';
        this.allVariables.isOwnedByMeDataVisible = false;
        this.allVariables.librariesData = false;
        this.allVariables.isParentModVisible = true;
        this.allVariables.showNewUploadButton = true;
        this.allVariables.showContentVersions = false;
        this.allVariables.showNewFolderButton = false;
        this.allVariables.showNewLibButton = false;
        this.allVariables.isShareVisible = false;
        this.allVariables.showNewDeleteButton = false;
        this.allVariables.getPagination = true;
        this.allVariables.pageNumber = 1;
        this.allVariables.sortDirection = 'desc';
        this.allVariables.sortBy = 'CreatedDate';
        this.__fetchRecentFiles();
        // refreshApex(this.wiredRecentFiles);
        this.allVariables.libName = '';
        this.allVariables.breadCrumb = [];
        this.allVariables.hideNextPrev=false;
    }

    handLibraryleClick(e) {
        console.log('inside library ');
        this.allVariables.label = 'Libraries';
        this.allVariables.librariesData = true;
        this.allVariables.isOwnedByMeDataVisible = false;
        this.allVariables.isParentModVisible = false;
        this.allVariables.showNewUploadButton = false;
        this.allVariables.showNewLibButton = true;
        this.allVariables.showContentVersions = false;
        this.allVariables.showNewFolderButton = false;
        this.allVariables.isShareVisible = false;
        this.allVariables.showNewDeleteButton = false;
        this.allVariables.getPagination = true;
        this.allVariables.isContentVersionsVisible = false;
        this.allVariables.sortDirection = 'desc';
        this.allVariables.sortBy = 'CreatedDate';
        this.__fetchLibraries();
        this.allVariables.pageNumber = 1;
        this.allVariables.libName = '';
        this.allVariables.breadCrumb = [];
        this.allVariables.hideNextPrev=false;
    }

    handleBreadCrumb(e) { //called from parent when file or folder is viewed
        console.log('length of breadcrumb :: ', this.allVariables.breadCrumb.length);
        this.allVariables.isContentVersionsVisible = true;
        this.allVariables.searchKey = '';
        this.template.querySelector(".search").value = '';
        console.log('this.allVariables.searchKey in breadCrumb ===-- > ', this.allVariables.searchKey);
        if (this.allVariables.breadCrumb.length < 6) {
            this.allVariables.breadCrumb.push(e.detail.names);
        }
        console.log('this.allVariables.breadCrumb ==--> ', this.allVariables.breadCrumb);
    }

    handleBreadCumBackCLick(e) {
        console.log('back is clicked');
        this.allVariables.breadCrumb.pop();
        this.allVariables.isContentVersionsVisible = false;
        this.allVariables.searchKey = '';
    }

    __filterLibraries(libraries, searchKey) {
        const lowercasedSearchKey = searchKey.toLowerCase();
        return libraries.filter(library =>
            library.Name.toLowerCase().includes(lowercasedSearchKey)
        );
    }

    // handleSearchChange(event) {
    //     let searchKey = event.target.value.trim().toLowerCase();
    //     console.log('the search key name =---> ', searchKey);
    //     console.log('this.allVariables.isContentVersionsVisible =---> ', this.allVariables.isContentVersionsVisible);

    //     this.allVariables.pageNumber = 1;
    //     if (this.allVariables.isContentVersionsVisible) {
    //         this.template.querySelector("c-content-version-data-table").handleSearchChange(searchKey);
    //     } else {
    //         this.allVariables.searchKey = searchKey;
    //         console.log('this.allVariables.searchKey in parent else condition =-->  ::: ', this.allVariables.searchKey);

    //         console.log('searchkey==>', this.allVariables.searchKey);
    //         if (['Owned by Me', 'Recent', 'Shared with me', 'Libraries'].includes(this.allVariables.label.trim())) {
    //             console.log('this.allVariables.label ===>', this.allVariables.label);

    //             switch (this.allVariables.label.trim()) {
    //                 case 'Owned by Me':
    //                     this.__fetchOwnedFiles();
    //                     break;
    //                 case 'Recent':
    //                     this.__fetchRecentFiles();
    //                     break;
    //                 case 'Shared with me':
    //                     this.__fetchSharedFiles();
    //                     break;
    //                 case 'Libraries':
    //                     console.log('inside the library condition on search handler');
    //                     this.__fetchLibraries();
    //                     break;
    //                 default:
    //                     console.log('Unknown label');
    //                     break;
    //             }
    //         } else {
    //             this.allVariables.filteredLibraries = this.__filterLibraries(this.allVariables.libraries, this.allVariables.searchKey);
    //         }
    //     }
    // }

    handleSearchChange(event) {
        const searchKey = event.target.value.trim().toLowerCase();
        const { isContentVersionsVisible, label, libraries, pageNumber } = this.allVariables;
        // Reset the page number
        this.allVariables.pageNumber = 1;

        // Log search key for debugging
        console.log('Search key:', searchKey);
        console.log('isContentVersionsVisible key:', isContentVersionsVisible);
        this.allVariables.hideNextPrev=false;
        // If content versions are visible, handle search within that component
        if (isContentVersionsVisible) {
            this.template.querySelector("c-content-version-data-table").handleSearchChange(searchKey);
        } else {
            this.allVariables.searchKey = searchKey;
            console.log('Updated searchKey in else :', this.allVariables.searchKey);
            // List of valid labels
            const VALID_LABELS = ['Files','Owned by Me', 'Recent', 'Shared with me', 'Libraries'];

            const trimmedLabel = label.trim();

            if (VALID_LABELS.includes(trimmedLabel)) {
                console.log('Label matched:', trimmedLabel);
                switch (trimmedLabel) {
                    case 'Files':
                    console.log('Fetching Files on search');
                        this.__fetchFiles();
                        break;
                    case 'Owned by Me':
                        this.__fetchOwnedFiles();
                        break;
                    case 'Recent':
                        this.__fetchRecentFiles();
                        break;
                    case 'Shared with me':
                        this.__fetchSharedFiles();
                        break;
                    case 'Libraries':
                        console.log('Fetching libraries on search');
                        this.__fetchLibraries();
                        break;
                    default:
                        console.error('Unhandled label:', trimmedLabel);
                        break;
                }
            } else {
                this.allVariables.filteredLibraries = this.__filterLibraries(libraries, searchKey);
                console.log('Filtered libraries:', this.allVariables.filteredLibraries);
            }

        }

    }

    handleRowLibAction(event) {
        const actionName = event.detail.action.name;
        const libraryId = event.detail.row.Id;
        const folderToEditName = event.detail.row.Name;
        this.allVariables.libName = folderToEditName;
        console.log('folder to edit name ==-> ', folderToEditName);
        console.log('library id ==--> ', libraryId);
        console.log('event.detail ==--> ', JSON.stringify(event.detail));
        this.allVariables.libraryIds = libraryId;
        this.allVariables.hideNextPrev=false;
        switch (actionName) {
            case 'Edit':
                this.allVariables.name = folderToEditName;
                this.__editLibrary(this.allVariables.libraryIds);
                this.allVariables.searchKey = '';
                break;
            case 'Share':
                this.handleManageMembers();
                this.allVariables.searchKey = '';
                break;
            case 'Delete':
                this.__deleteLibrary(this.allVariables.libraryIds);
                this.allVariables.searchKey = '';
                break;
            case 'view_details':
                this.__showRelatedContentVersion();
                this.allVariables.searchKey = '';
                break;
            default:
                console.warn(`Action "${actionName}" is not recognized.`);
                break;
        }
    }

    handleNewLibraryClick() {
        this.allVariables.showModal = true;
        this.allVariables.showOwnedModal = false;
        this.allVariables.showEditLibraryInputs = false;
        this.allVariables.showCreateLibraryInputs = true;
        this.allVariables.libraryModalHeading = 'New Library';
    }

    __editLibrary(libraryId) {
        this.allVariables.showModal = true;
        this.allVariables.showOwnedModal = false;
        this.allVariables.showEditLibraryInputs = true;
        this.allVariables.showCreateLibraryInputs = false;
        this.allVariables.libraryIds = libraryId;
        this.allVariables.libraryModalHeading = 'Edit Library';
    }

    hideModalBox() {
        this.allVariables.showModal = false;
        this.allVariables.showOwnedModal = false;
        this.allVariables.name = null;
        this.allVariables.description = null;
        this.allVariables.showCreateLibraryInputs = false;
    }

    handleNameChange(event) {
        this.allVariables.name = event.target.value;
    }

    handleDescriptionChange(event) {
        this.allVariables.description = event.target.value;
    }

    handleSaveLibrary() {
        if (!this.allVariables.showEditLibraryInputs) {
            this.allVariables.isLoading = true;
            createLibrary({ name: this.allVariables.name, description: this.allVariables.description })
                .then(result => {
                    console.log('result', result);
                    this.allVariables.filteredLibraries = [];
                    this.__fetchLibraries();
                    this.__showToast('Success', 'Library created', 'success');
                })
                .catch(error => {
                    console.log('error occured =-> ', error);
                    console.log('error occured 2 =-> ', JSON.stringify(error));
                    let errorMessage = this.__handleError(error);
                    if (errorMessage) {
                        this.__showToast('Error', errorMessage, 'error');
                    } else {
                        this.__showToast('Error', 'Error creating library', 'error');
                    }
                }).finally(() => {
                    this.allVariables.isLoading = false;
                });
        } else {
            this.allVariables.isLoading = true;
            updateLibrary({ libraryId: this.allVariables.libraryIds, name: this.allVariables.name, description: this.allVariables.description })
                .then(result => {
                    this.__fetchLibraries();
                    this.__showToast('Success', 'Library updated', 'success');
                })
                .catch(error => {
                    this.__showToast('Error', error.body.pageErrors[0].message, 'error');
                }).finally(() => {
                    this.allVariables.isLoading = false;
                });
        }

        this.allVariables.showModal = false;
        this.allVariables.showOwnedModal = false;
        this.allVariables.name = null;
        this.allVariables.description = null;
        this.allVariables.showCreateLibraryInputs = false;
        this.allVariables.showEditLibraryInputs = false;
    }

    handleSave() {
        console.log(" content record id ==---> ", this.allVariables.recordContentId);
        this.allVariables.isLoading = true;
        updateFiles({ contentDocumentId: this.allVariables.recordContentId, newTitle: this.allVariables.name, description: this.allVariables.description })
            .then(result => {
                console.log('result : ', result);
                this.allVariables.showOwnedModal = false;
                if (this.allVariables.label === 'Recent') {
                    console.log('recent condition');
                    refreshApex(this.wiredRecentFiles);
                }
                else if (this.allVariables.label === 'Shared with me') {
                    this.__fetchSharedFiles();
                    console.log('shared WIth me condition');
                }
                else if (this.allVariables.label === 'Owned By Me') {
                    this.__fetchOwnedFiles();
                    console.log('fetch owned file condition');
                }else if(this.allVariables.label === 'Files'){
                    this.__fetchFiles();
                    console.log('fetch owned file condition');
                } else {
                    console.log('else condition');
                    refreshApex(this.wiredFilesResult);
                }
                this.__showToast('Success', 'File Updated', 'success');
            })
            .catch(error => {
                this.__showToast('Error', error.body.pageErrors[0].message, 'error');
            }).finally(() => {
                this.allVariables.isLoading = false;
            });
        this.allVariables.name = null;
    }

    __deleteLibrary(libraryId) {
        this.allVariables.isLoading = true;
        deleteLibrary({ libraryId })
            .then(() => {
                this.allVariables.filteredLibraries = [];
                this.__fetchLibraries();
                this.__showToast('Success', 'Library deleted', 'success');
            })
            .catch(error => {
                let errorMessage = this.__handleError(error);
                if (errorMessage) {
                    this.__showToast('Error', errorMessage, 'error');
                } else {
                    this.__showToast('Error', 'Error deleting', 'error');
                }
            }).finally(() => {
                this.allVariables.isLoading = false;
            });
    }

    __showRelatedContentVersion() {
        this.allVariables.showLibraries = false;
        this.allVariables.showNewLibButton = false;
        this.allVariables.showContentVersions = true;
        this.allVariables.showNewFolderButton = true;
        this.allVariables.librariesData = false;
        this.allVariables.isParentModVisible = false;
        this.allVariables.isOwnedByMeDataVisible = false;
        this.allVariables.showFiles = true;
        this.allVariables.getPagination = false;
    }

    handleFileCountOnParent(e) {
        this.allVariables.fileCount = e.detail.fileCount;
        console.log('this.allVariables.fileCount on parent ==---> ', this.allVariables.fileCount);
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        const nameToChange = event.detail.row.Title;
        const idOfSelectedRowFile = event.detail.row.Id;
        this.allVariables.shareFileId = idOfSelectedRowFile;

        const contenDocId = event.detail.row.ContentDocumentId;

        console.log('content document id of the selected row ==---> ', JSON.stringify(event.detail));
        console.log('content document id of the selected row ==---> ', contenDocId);
        console.log('idOfSelectedRowFile ==---> ', idOfSelectedRowFile);

        switch (actionName) {
            case 'view_details':
                if (contenDocId != undefined || contenDocId != ' ' && contenDocId != null) {
                    this.previewHandler(contenDocId);
                } else {
                    this.previewHandler(idOfSelectedRowFile);
                }
                this.allVariables.searchKey = '';
                break;
            case 'View':
                this.viewFile(row.ContentDocumentId || row.Id);
                this.allVariables.searchKey = '';
                break;
            case 'Delete':
                this.__handleDeleteContentVersions(row.ContentDocumentId || row.Id);
                this.allVariables.searchKey = '';
                break;
            case 'Download':
                this.downloadFile(row.ContentDocumentId || row.Id);
                this.allVariables.searchKey = '';
                break;
            case 'Edit':
                this.allVariables.name = nameToChange;
                console.log('edit is clicked ', this.allVariables.name);
                this.__editFile(row.ContentDocumentId || row.Id);
                this.allVariables.searchKey = '';
                break;
            case 'Share':
                this.__handleShareFile(row.ContentDocumentId || row.Id);
                this.allVariables.searchKey = '';
                break;
            default:
                console.warn(`Action "${actionName}" is not recognized.`);
                break;
        }
    }

    __handleShareFile(fileId) {
        console.log('taking off to share modal');
        this.allVariables.showContentShareModal = true;
    }

    closeShareModal() {
        this.allVariables.showContentShareModal = false;
    }

    previewHandler(id) {
        console.log('idOfSelectedRowFile1 ==---> ', id);


        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state: {
                selectedRecordId: id,
            }
        })
    }

    async downloadFile(ContentDocumentId) {
        try {
            console.log('id---->', ContentDocumentId);
            const downloadUrl = await getDownloadUrl({ ContentDocumentId });
            console.log('downloadUrl', downloadUrl);
            window.open(downloadUrl, '_blank');
        } catch (error) {
            console.error('Error downloading file', error);
        }
    }

    viewFile(contentDocumentId) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: contentDocumentId,
                objectApiName: 'ContentDocument',
                actionName: 'view',
            },
        });
    }

    __editFile(contentDocumentId) {
        console.log('id---->', contentDocumentId);
        this.allVariables.recordContentId = contentDocumentId;
        this.allVariables.showOwnedModal = true;
    }

    handleUploadFinished(event) {
        if (['Files','Owned by Me', 'Recent', 'Shared with me', 'Libraries'].includes(this.allVariables.label.trim())) {
            console.log('this.allVariables.label ===>', this.allVariables.label);

            switch (this.allVariables.label.trim()) {
                case 'Owned by Me':
                    console.log('entered upload');
                    refreshApex(this.wiredFilesResult);
                    break;
                case 'Files':
                    console.log('Files---->');
                    this.__fetchFiles();
                    this.allVariables.label = 'Owned By Me';
                    break; 
                case 'Recent':
                    this.__fetchRecentFiles();
                    this.allVariables.label = 'Owned By Me';
                    break;
                case 'Shared with me':
                    refreshApex(this.wiredFilesResult);
                    this.allVariables.label = 'Owned By Me';
                    break;
                case 'Libraries':
                    this.__uploadFilesOnLibrary(event);
                    break;
                default:
                    console.log('Unknown label');
                    break;
            }
        } else {
            this.allVariables.filteredLibraries = this.__filterLibraries(this.allVariables.libraries, this.allVariables.searchKey);
        }
    }

    handleManageMembers() {
        this.allVariables.showManageMembers = true;
    }

    closeMemberModal() {
        this.allVariables.showManageMembers = false;
    }

    __uploadFilesOnLibrary(event) {
        const uploadedFiles = event.detail.files;
        console.log('file upload initiated : ', JSON.stringify(uploadedFiles));
        this.template.querySelector("c-content-version-data-table").handleUploadFinish(event);
    }

    __fetchLibraries() {
        this.allVariables.isLoading = true;
        console.log('fetchLibraries');
        getLibraries({ userId: USER_ID, title: this.allVariables.searchKey, sortBy: this.allVariables.sortBy, sortDirection: this.allVariables.sortDirection })
            .then((result) => {
                // let alteredData = result;
                //  alteredData.sort((a,b)=>{
                //     return a.Title.localeCompare(b.Title);
                // });alteredData.sort((a,b)=>{
                //     return a.Title.localeCompare(b.Title);
                // });
                //console.log('alteredData >>> ', alteredData);

                // Sort the result alphabetically by the Name field
                let sortedLibraries = (result || []).sort((a, b) => {
                    return a.Name.localeCompare(b.Name); // Assuming 'Name' is the field to sort by
                });
                result = sortedLibraries;
                console.log('result in fetchlib == >>> ', result);
                let res = result ? result : [];
                this.allVariables.fileCount = res.length;
                console.log('this.allVariables.fileCount in fetchLibrary ==----->> ', this.allVariables.fileCount);
                if (res.length > 0) {
                    this.allVariables.totalPages = Math.ceil(res.length / PAGE_SIZE);
                } else {
                    this.allVariables.totalPages = 1;
                }
                console.log('this.allVariables.totalPages fetch library ==--- > ', this.allVariables.totalPages);
                
                this.allVariables.libraries = this.__paginateData(res);
                this.allVariables.filteredLibraries = this.__filterLibraries(this.allVariables.libraries, this.allVariables.searchKey);
                this.allVariables.error = null;
                this.allVariables.hideNextPrev=true;
            })
            .catch((error) => {
                if (error.message) {
                    this.allVariables.error = error.message;
                } else {
                    this.allVariables.error = 'Nothing found';
                }
                this.allVariables.libraries = [];
                this.allVariables.filteredLibraries = [];
            }).finally(() => {
                this.allVariables.isLoading = false;
            });
    }

    handleSort(event) {
        const { fieldName: field, sortDirection } = event.detail;
        console.log('sort==> 1', { fieldName: field, sortDirection });

        this.allVariables.sortBy = (field === 'Id') ? 'Title' : field;

        if (this.allVariables.tempSortDirection == this.allVariables.sortDirection) {
            this.allVariables.sortDirection = (this.allVariables.sortDirection === 'asc') ? 'desc' : 'asc';
        } else {
            this.allVariables.sortDirection = sortDirection;
        }

        this.allVariables.tempSortDirection = this.allVariables.sortDirection;

        switch (this.allVariables.label.trim()) {
            case 'Files' :
                this.__fetchFiles();
                console.log('Fetching files...');
                break;
            case 'Owned by Me':
                this.__fetchOwnedFiles();
                console.log('Fetching owned files...');
                break;
            case 'Recent':
                this.__fetchRecentFiles();
                console.log('Fetching recent files...');
                break;
            case 'Shared with me':
                this.__fetchSharedFiles();
                break;
            case 'Libraries':
                console.log('sort==> 2', this.allVariables.sortBy);
                console.log('sort==> 3', this.allVariables.sortDirection);
                this.__fetchLibraries();
                break;
            default:
                console.log('Unknown label');
                break;
        }
    }

    handleRowSelection(event) {
        console.log('entered the parent component');
        const selectedRows = JSON.parse(JSON.stringify(event.detail.selectedRows));
        let show = false;
        if (event.detail.show != null && event.detail.show != undefined) {
            show = JSON.parse(JSON.stringify(event.detail.show));
        }
        console.log(selectedRows.length, 'select Rows parent -- ', selectedRows);
        console.log('select show parent -- ', show);
        if (selectedRows.length > 0) {
            console.log('inside if condition');
            this.allVariables.showNewDeleteButton = true;
            this.allVariables.showNewFolderButton = false;
            this.allVariables.showNewUploadButton = false;
            this.allVariables.showNewLibButton = false;
            this.allVariables.getAllSelectedRows = selectedRows;
        } else if (this.allVariables.label == 'Libraries' && show == true) {
            this.allVariables.showNewFolderButton = true;
            this.allVariables.showNewDeleteButton = false;
            show = false;
        } else if (this.allVariables.label != 'Libraries') {
            console.log('inside if condition 2');
            this.allVariables.showNewDeleteButton = false;
            this.allVariables.showNewUploadButton = true;
            this.allVariables.showNewLibButton = false;
            show = false;
        } else if (this.allVariables.label == 'Libraries') {
            console.log('inside if condition 3');
            this.allVariables.showNewDeleteButton = false;
            this.allVariables.showNewUploadButton = false;
            this.allVariables.showNewLibButton = true;
            show = false;
        }
    }

    handleDeleteClick() {
        let tempSetIds = new Set();
        let tempSetLibIds = new Set();
        let tempSetFolders = new Set();
        if (confirm('Are you sure you want to delete this file?')) {
            if (this.allVariables.getAllSelectedRows.length > 0) {
                this.allVariables.getAllSelectedRows.forEach(element => {
                    console.log('element ;;;_----> ', element);
                    if (element.ContentDocumentId) {
                        tempSetIds.add(element.ContentDocumentId);
                    }
                    if (element.FileType == 'Folder') {
                        console.log('entered element.filetype cond ');
                        tempSetFolders.add(element.Id);
                    } else {
                        let sanitizedId = element.Id.replace('/', '');
                        tempSetLibIds.add(sanitizedId);
                    }
                });
                let contentDocumentIds = Array.from(tempSetIds);
                let libraryIds = Array.from(tempSetLibIds);
                let folderIds = Array.from(tempSetFolders);
                console.log('libraryIds===>', libraryIds);
                console.log('folderIds ===>', folderIds);
                console.log('contentDocumentIds ===>', contentDocumentIds);
                if (contentDocumentIds.length > 0) {

                    this.__handleDeleteContentVersions(contentDocumentIds);

                }
                if (folderIds.length > 0) {
                    console.log('inside the folder condition for multi delete');
                    this.template.querySelector("c-content-version-data-table").deleteContentFolders(folderIds);
                } else if (libraryIds.length > 0) {
                    this.allVariables.isLoading = true;
                    deleteLibrary({ libraryId: libraryIds })
                        .then(() => {
                            console.log('delete library document condition');
                            this.__showToast('Success', 'File deleted successfully', 'success');
                            this.__fetchLibraries();
                        })
                        .catch(error => {
                            let errorMessage = this.__handleError(error);
                            if (errorMessage) {
                                this.__showToast('Error', errorMessage, 'error');
                            } else {
                                this.__showToast('Error', 'Error deleting', 'error');
                            }
                        }).finally(() => {
                            this.allVariables.isLoading = false;
                        });
                }
            }
        }
    }

    __handleDeleteContentVersions(contentDocumentIds) {
        console.log('entered contentversion delete');
        this.allVariables.isLoading = true;
        deleteFiles({ contentDocumentIds })
            .then(() => {
                console.log('deletefiles condition');
                if (this.allVariables.label === 'Recent') {
                    this.__fetchRecentFiles();
                } else if (this.allVariables.label === 'Shared with me') {
                    console.log('entered the label condition in delete : ', this.allVariables.label);
                    this.__fetchSharedFiles()
                    refreshApex(this.sharedFileWithMeRes);
                } else if (this.allVariables.label === 'Owned by Me') {
                    this.__fetchOwnedFiles();
                } else if(this.allVariables.label === 'Files'){
                    this.__fetchFiles();  
                }else {
                    console.log('entered else of else condition delete ', this.allVariables.libraryIds);
                    this.template.querySelector("c-content-version-data-table").getContentVersion(this.allVariables.libraryIds);
                }
                this.__showToast('Success', 'File deleted successfully', 'success');
            })
            .catch(error => {
                let errorMessage = this.__handleError(error);
                if (errorMessage) {
                    this.__showToast('Error', errorMessage, 'error');
                } else {
                    this.__showToast('Error', 'Error deleting', 'error');
                }
            }).finally(() => {
                this.allVariables.isLoading = false;
            });
    }



    __paginateData(data) {
        console.log('*****jshglshgljdfh*********===--->> ', data);
        let startIndex = (this.allVariables.pageNumber - 1) * PAGE_SIZE;
        let endIndex = startIndex + PAGE_SIZE;
        console.log('id substring ==---> ', data[0].Id.substring(0, 4));
        if (data[0].Id.substring(0, 4) == '058Q') {   // 05Q8 is id prefix for library
            return data.slice(startIndex, endIndex).map(item => {
                return {
                    ...item,
                    Id: `${item.Id}`,
                    Type: 'library',
                };
            });
        } else {
            console.log('entered else condition in pagination ', data);
            return data.slice(startIndex, endIndex).map(item => {
                console.log('item : ', item);
                return {
                    ...item,
                    Id: `${item.Id}`,
                };
            });
        }
    }

    handlePrevious() {
        if (this.allVariables.pageNumber > 1) {
            this.allVariables.pageNumber--;
            // this.refreshTable();
            if (this.allVariables.label === 'Libraries') {
                this.__fetchLibraries();
            } else if (this.allVariables.label === 'Recent') {
                this.__fetchRecentFiles();
            } else if (this.allVariables.label === 'Shared with me') {
                this.__fetchSharedFiles();
            } else if (this.allVariables.label === 'Owned by Me') {
                console.log('condition Owned by Me');
                this.__fetchOwnedFiles();
            }else if (this.allVariables.label === 'Files'){
                this.__fetchFiles();
            }
        }
    }

    handleNext() {
        if (this.allVariables.pageNumber < this.allVariables.totalPages) {
            this.allVariables.pageNumber++;
            if (this.allVariables.label === 'Libraries') {
                console.log('condition library');
                this.__fetchLibraries();
            } else if (this.allVariables.label === 'Recent') {
                console.log('condition Recent');
                this.__fetchRecentFiles();
            } else if (this.allVariables.label === 'Shared with me') {
                console.log('condition Shared with me');
                this.__fetchSharedFiles();
            } else if (this.allVariables.label === 'Owned by Me') {
                console.log('condition Owned by Me');
                this.__fetchOwnedFiles();
            } else if (this.allVariables.label === 'Files') {
                console.log('condition Files');
                this.__fetchFiles();
            }
        }
    }

    handleData(event) {
        const receivedData = event.detail;
        if (receivedData) {
            this.allVariables.totalPages = Math.ceil(receivedData.length / PAGE_SIZE);
            this.allVariables.data = this.__paginateData(receivedData);
        }
        console.log('Data received from child:', JSON.parse(JSON.stringify(receivedData)));
    }

    handlCreateNewFolder() {
        console.log('clicked')
        const openModalEvent = new CustomEvent('openmodal');
        this.template.querySelector('c-content-version-data-table').dispatchEvent(openModalEvent);
    }

    handleOpenModal() {
        console.log('Modal opening event captured in parent');
    }

    __handleError(error) {
        let errorMessage = error.body.message;
        console.log('error : =--> ', error);
        let keyword1 = "DEPENDENCY_EXISTS";
        let keyword2 = "DUPLICATE_VALUE";
        let keyword3 = "INSUFFICIENT_ACCESS_OR_READONLY";

        if (errorMessage.includes(keyword1)) {
            let specificMessage = errorMessage.substring(errorMessage.indexOf(keyword1));
            console.log(specificMessage.trim());
            return specificMessage;
        } else if (errorMessage.includes(keyword2)) {
            let specificMessage = errorMessage.substring(errorMessage.indexOf(keyword2));
            console.log(specificMessage.trim());
            return specificMessage;
        } else if (errorMessage.includes(keyword3)) {
            let specificMessage = errorMessage.substring(errorMessage.indexOf(keyword3));
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
}