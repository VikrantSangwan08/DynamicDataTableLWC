// import { LightningElement, wire, track, api } from 'lwc';
// import { refreshApex } from '@salesforce/apex';
// import getLibraries from '@salesforce/apex/ContentWorkspaceController.getLibraries';
// import deleteLibrary from '@salesforce/apex/ContentWorkspaceController.deleteLibrary';
// import createLibrary from '@salesforce/apex/ContentWorkspaceController.createLibrary';
// import updateLibrary from '@salesforce/apex/ContentWorkspaceController.updateLibrary';
// import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// import { NavigationMixin } from 'lightning/navigation';


// const PAGE_SIZE = 5;

// export default class ContentWorkspaceList extends NavigationMixin(LightningElement) {
// @track columns = [
//     {
//         label: 'Name',
//         fieldName: 'nameOfLibrary',
//         type: 'button',
//             typeAttributes: { 
//                 label: { fieldName: 'Name' }, 
//                 name: 'view_details', // Custom action name
//                 variant: 'base'
//             },
//              cellAttributes: {
//                 iconName: 'doctype:library_folder',
//                 iconPosition: 'left'
//             },
//         // type: 'url',
//         // typeAttributes: {
//         //     label: { fieldName: 'Name' },
//         //     tooltip: { fieldName: 'Name' },
//         //     target: '_self'
//         // },
//         sortable: true
//     },
//     {
//         label: 'Last Activity',
//         fieldName: 'LastWorkspaceActivityDateFormatted',
//         type: 'text',
//         sortable: true
//     },
//     {
//             type: 'action',
//             typeAttributes: { rowActions: this.getRowActions } // Adding row actions
//         },
//     // {
//     //     type: 'action',
//     //     typeAttributes: { rowActions: [{ label: 'Edit', name: 'edit' }, { label: 'Delete', name: 'delete' }] }
//     // }
// ];

//     @track showLibraries = true;
//     @track showNewLibButton = true;
//     @track showContentVersions = false;
//     @track showCreateLibraryInputs = false;
//     @track showEditLibraryInputs = false;
//     @track showFiles = true;
//     @track showModal = false;
//     @track libraryIds = null;
//     @track description = null;
//     @track name = null;
//     @track pageNumber = 1;
//     @track totalPages = 0
//     @track libraries = [];
//     @track filteredLibraries = [];
//     error;
//     sortField = 'Name'; // Default sort field
//     sortDirection = 'asc'; // Default sort direction
//     searchKey = '';
//     wiredLibrariesResult; // To hold the result from @wire

//     @wire(getLibraries)
//     wiredLibraries(result) {
//         this.wiredLibrariesResult = result;
//         const { error, data } = result;
//         if (data) {
//             this.libraries = this.formatLibraries(data);
//             this.filteredLibraries = this.filterLibraries(this.libraries, this.searchKey);
//             this.totalPages = Math.ceil(result.data.length / PAGE_SIZE);
//             this.error = undefined;
//         } else if (error) {
//             this.error = error;
//             this.libraries = [];
//             this.filteredLibraries = [];
//         }
//     }

//     formatLibraries(data) {
//         console.log('data recieved from apex ==-->> ', data)
//         return data.map(library => ({
//             ...library,
//             LastWorkspaceActivityDateFormatted: this.formatDate(library.LastWorkspaceActivityDate),
//             Name: library.Name,
//             // NameLink: `/lightning/r/ContentWorkspace/${library.Id}/view`,

//         }));
//     }

//     formatDate(dateStr) {
//         const date = new Date(dateStr);
//         const adjustedDate = new Date(date.getTime() - (12.5 * 60 * 60 * 1000)); // Adjust for timezone
//         return adjustedDate.toLocaleString('en-US', {
//             year: 'numeric',
//             month: 'numeric',
//             day: 'numeric',
//             hour: 'numeric',
//             minute: 'numeric',
//             hour12: true,
//         });
//     }

//     filterLibraries(libraries, searchKey) {
//         if (!searchKey) {
//             return this.paginateData(libraries);;
//         }
//         const lowercasedSearchKey = searchKey.toLowerCase();
//         return libraries.filter(library =>
//             library.Name.toLowerCase().includes(lowercasedSearchKey)
//         );
//     }

//     handleSearchChange(event) {
//         this.searchKey = event.target.value;
//         this.filteredLibraries = this.filterLibraries(this.libraries, this.searchKey);
//     }

//     handleSort(event) {
//         const { fieldName: field, sortDirection } = event.detail;
//         this.sortField = field;
//         this.sortDirection = sortDirection;

//         this.filteredLibraries = this.sortData(this.filteredLibraries, this.sortField, this.sortDirection);
//     }

//     handlePrevious() {
//         if (this.pageNumber > 1) {
//             this.pageNumber--;
//             this.refreshTable();
//         }
//     }

//     handleNext() {
//         if (this.pageNumber < this.totalPages) {
//             this.pageNumber++;
//             this.refreshTable();
//         }
//     }

//     refreshTable() {
//         refreshApex(this.wiredLibrariesResult).then(() => {
//             this.filteredLibraries = this.paginateData(this.wiredLibrariesResult.data);
//         }).catch(error => {
//             console.error('Error refreshing content versions:', error);
//         });
//     }

//     paginateData(data) {
//         let startIndex = (this.pageNumber - 1) * PAGE_SIZE;
//         let endIndex = startIndex + PAGE_SIZE;
//         return data.slice(startIndex, endIndex).map(item => {
//             return {
//                 ...item,
//                 Id: `/${item.Id}` // Constructing Salesforce record URL
//             };
//         });
//     }

//     sortData(data, field, direction) {
//         const reverse = direction === 'asc' ? 1 : -1;
//         return [...data].sort((a, b) => {
//             let aValue = a[field] || '';
//             let bValue = b[field] || '';
//             if (typeof aValue === 'string') {
//                 aValue = aValue.toLowerCase();
//                 bValue = bValue.toLowerCase();
//             }
//             return (aValue > bValue ? 1 : -1) * reverse;
//         });
//     }
//      getRowActions(row, doneCallback) {
//         const actions = [
//             // { label: 'Download', name: 'Download' },
//             { label: 'Manage Members', name: 'Share' },
//             // { label: 'View File Details', name: 'View' },
//             // { label: 'Upload New Version', name: 'Version' },
//             { label: 'Edit Library Details', name: 'Edit' }, // Changed 'view' to 'Edit'
//             // { label: 'Delete', name: 'Delete' }
//         ];
//         doneCallback(actions);
//     }

//     handleRowAction(event) {
//         const actionName = event.detail.action.name;
//         console.log('type of library ==---> ', event.detail);
//            const libraryId = event.detail.row.Id.replace(/^\//, '');
//         console.log('library id ==--> ', libraryId);
//         console.log('event.detail ==--> ', event.detail);
//         this.libraryIds = libraryId;
//         switch (actionName) {
//              case 'edit':
//                 this.editLibrary(libraryId);
//                 break;
//             case 'View':
//                 this.showRelatedContentVersion(row);
//                 break;
//             case 'Delete':
//                 this.deleteLibrary(this.libraryIds);
//                 break;
//             default:
//                 console.warn(`Action "${actionName}" is not recognized.`);
//                 break;
//         }
//     }


//     // handleRowAction(event) {
//     //     const actionName = event.detail.action.name;

//     //     const libraryId = event.detail.row.Id.replace(/^\//, '');
//     //     console.log('library id ==--> ', libraryId);
//     //     console.log('event.detail ==--> ', event.detail);
//     //     this.libraryIds = libraryId;


//     //     switch (actionName) {
//     //         case 'edit':
//     //             this.editLibrary(libraryId);
//     //             break;
//     //         case 'delete':
//     //             this.deleteLibrary(libraryId);
//     //             break;
//     //         case 'view_details':
//     //             this.showRelatedContentVersion();
//     //             break
//     //     }
//     // }
    
//     handleNewLibraryClick() {
//         // this[NavigationMixin.Navigate]({
//         //     type: 'standard__objectPage',
//         //     attributes: {
//         //         objectApiName: 'ContentWorkspace',
//         //         actionName: 'new'
//         //     }
//         // })
//         // .then(() => { refreshApex(this.wiredLibrariesResult) });

//         this.showModal = true;
//         this.showCreateLibraryInputs = true;
        
//     }

//     hideModalBox(){
//         this.showModal = false;
//         this.name = null;
//         this.description = null;
//         this.showCreateLibraryInputs = false;
//     }

//     handleNameChange(event){
//         this.name = event.target.value;
//     }

//     handleDescriptionChange(event){
//         this.description = event.target.value;
//     }

//     handleSaveLibrary(){
//         if(this.showEditLibraryInputs == false){
//             createLibrary({ name: this.name, description: this.description })
//             .then(result => {
//                 console.log('Result', result);
//                 refreshApex(this.wiredLibrariesResult);
//                 this.dispatchEvent(
//                     new ShowToastEvent({
//                         title: 'Success',
//                         message: 'Library created',
//                         variant: 'success'
//                     })
//                 );
//             })
//             .catch(error => {
//                 console.error('Error:', error);
//                 this.dispatchEvent(
//                     new ShowToastEvent({
//                         title: 'Error',
//                         message: error.body.pageErrors[0].message,
//                         variant: 'error'
//                     })
//                 );
//             });
//         } else if(this.showEditLibraryInputs == false){
//             updateLibrary({ libraryId: this.libraryIds, name: this.name, description: this.description })
//               .then(result => {
//                 console.log('Result', result);
//                 refreshApex(this.wiredLibrariesResult);
//                 this.dispatchEvent(
//                     new ShowToastEvent({
//                         title: 'Success',
//                         message: 'Library Updated',
//                         variant: 'success'
//                     })
//                 );
//               })
//               .catch(error => {
//                 console.error('Error:', error);
//                 this.dispatchEvent(
//                     new ShowToastEvent({
//                         title: 'Error',
//                         message: error.body.pageErrors[0].message,
//                         variant: 'Error'
//                     })
//                 );
//             });
//         }

//         this.showModal = false;
//         this.name = null;
//         this.description = null;
//         this.showCreateLibraryInputs = false;
//         this.showEditLibraryInputs = false;
//     }

//     editLibrary(libraryId) {
//         // this[NavigationMixin.Navigate]({
//         //     type: 'standard__recordPage',
//         //     attributes: {
//         //         recordId: libraryId,
//         //         objectApiName: 'ContentWorkspace',
//         //         actionName: 'edit'
//         //     }
//         // });
//         // refreshApex(this.wiredLibrariesResult);

//         this.showModal = true;
//         this.showEditLibraryInputs = true;
//         this.libraryIds = libraryId;
//     }

//     deleteLibrary(libraryId) {
//         console.log('entered delete library method');
//         deleteLibrary({ libraryId: libraryId })
//         .then(() => {
//             this.dispatchEvent(
//                 new ShowToastEvent({
//                     title: 'Success',
//                     message: 'Library deleted',
//                     variant: 'success'
//                 })
//             );
//             // Refresh the list
//             refreshApex(this.wiredLibrariesResult);
//         })
//         .catch(error => {
//             console.log('OUTPUT :error=== ', error);
//             console.log('BODY :error=== ', error.body.pageErrors[0].message);
//             this.dispatchEvent(
//                 new ShowToastEvent({
//                     title: 'Error deleting library',
//                     message: error.body.pageErrors[0].message,
//                     variant: 'error'
//                 })
//             );
//         });
//     }

    

//     // show library component

//     showRelatedContentVersion(e){
//         this.showLibraries = false;
//         this.showNewLibButton = false;
//         this.showContentVersions = true;
//         this.showFiles = true;
//     }

//     goToHomeScreen(){
//         this.showLibraries = true;
//         this.showNewLibButton = true;
//         this.showContentVersions = false
//         this.showFiles = false;
//         refreshApex(this.wiredLibrariesResult);

//     }
// }