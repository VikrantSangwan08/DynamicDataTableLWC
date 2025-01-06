import { LightningElement, wire, api, track } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getObjectMetadata from '@salesforce/apex/DynamicDataTableController.getObjectMetadata';
import getOpps from '@salesforce/apex/DynamicDataTableController.getRecords';
import getPicklistValues from '@salesforce/apex/DynamicDataTableController.getPicklistValues';
import getCurrentUserId from '@salesforce/apex/DynamicDataTableController.getCurrentUserId'; // New import
//vikk
import { notifyRecordUpdateAvailable } from "lightning/uiRecordApi";
// import imageCell from 'c/imageCell'; // Import the imageCell component
import deleteRecords from '@salesforce/apex/DynamicDataTableController.deleteRecords';
import updateRecords from '@salesforce/apex/DynamicDataTableController.updateRecords';
import getAccessibleFields from '@salesforce/apex/DynamicDataTableController.deleteRecords';
import getFieldTypes from '@salesforce/apex/FieldTypeController.getFieldTypes';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';


export default class DynamicDataTable extends NavigationMixin (LightningElement)  {
    
    
    @track value;
    //vik
    //@api recordId;
   // @track mapForFieldsUrl = new Map();
   @track formulaField;
    @track parentURLFields=[];
    @api PageCount = 10;
    @track typeClickable;
    @track fields = []; // Stores dynamic field API names
    @track error;
    @track selectedRecords =[];
    @api refreshTable
    @track modal1 = false;x
   // @track sortBy = null; 
    @track isModal1 = false;
   // @track data;
    @api sortedDirection = 'asc';
    @api sortedBy = 'Name';
    @api searchKey = '';
   // @track sortFields = [];
    result;
    @track sortBy = null; 
    @track sortDirection = 'asc'; 
    @track sortFields = []; 
    @track sortDirections = {}; 
    

    @track allSelectedRows = [];
    @track page = 1;
    @track items = [];
    @track data = [];
    @track columns = [];
    @track startingRecord = 1;
    @track endingRecord = 0;
    //@track PageCount = 5;
    @track totalRecountCount = 0;
    @track totalPage = 0;
    @track isShowModal = false;
    @track filterArr = [];
    @api objAPIName;
    @api objFieldsName;
    @api myPicklistValue;
    @track currentUserId; // New property
    @track fieldLabelMap = {};
    //vik
    @track dataForUrl=[];
    draftValues=[];
    @track filterOptionss=[];
    @track fieldTypeMap = {};
    // @track sortedData = [...this.data];
    @track newButtonVariable=false;
    getobjectName = '';
    getfieldName;
    showFields = false;
    isPageChanged = false;
    initialLoad = true;
    mapoppNameVsOpp = new Map();;
    selectedField;
    getfieldNamenotNull = [];

    filterField = '';
    filterOperator = '';
    filterValue = '';
    @track count = 0;
    @track fieldOptions = [];
    @track picklistValues = [];
    @track isPicklistField = false;
    @track fieldNames = [];
    sortDirectionOptions = [
        { label: 'Ascending', value: 'asc' },
        { label: 'Descending', value: 'desc' }
    ];
    @track operatorOptions = [
        { label: 'equals', value: 'equals' },
        { label: 'not equals to', value: 'not equals to' },
        { label: 'less than', value: 'less than' },
        { label: 'greater than', value: 'greater than' },
        { label: 'less or equal', value: 'less or equal' },
        { label: 'greater or equal', value: 'greater or equal' },
        { label: 'contains', value: 'contains' },
        { label: 'does not contains', value: 'does not contains' },
        { label: 'Start with', value: 'Start with' }
    ];
    @track selectedFilter = 'All'; // Default filter
    @track filterOptions = [
        { label: 'All', value: 'All' },
        { label: 'My', value: 'My' }
    ];
    handleFilterChange(event) {
        this.selectedFilter = event.detail.value;
        this.loadOpps(); // Reload data based on the selected filter
    }
    @wire(getCurrentUserId)
    wiredCurrentUserId({ error, data }) {
        if (data) {
            console.log('currentLog : ');
            this.currentUserId = data;
            console.log('OUTPUT : this.currentUserId',this.currentUserId);
        } else if (error) {
            console.error('Error fetching current user ID:', error);
        }
    }
    @wire(getObjectInfo, { objectApiName: '$objAPIName' })
    objectInfo({ data, error }) {
        if (data) {
            console.log("objAPIName--------",this.objAPIName);
            this.fields = Object.keys(data.fields).filter(field => 
                data.fields[field].updateable && !data.fields[field].calculated
            );
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.fields = [];
            console.error('Error fetching Account object info:', error);
        }
    }

    @wire(getObjectMetadata, { objectApiName: '$objAPIName' ,fieldNames:'$objFieldsName'})
    wiredObjectMetadata({ error, data }) {
        if (data) {
            console.log('data ==--> ', data );
            let inAccesableFields = data.inaccessibleFields;
            console.log('inAccesableFields-09000--------',inAccesableFields);
            
            let accesableFields = data.fields;
            this.formulaField = data.formulaFields;
            console.log('formulaField--',this.formulaField);
            
            this.fieldOptions = Object.keys(accesableFields).map(key => ({
                label: key,
                value: accesableFields[key]
            }));
            this.filterOptionss = Object.keys(accesableFields).map(key => ({
                label: key,
                value: key
            }));
            console.log("this.filterOptionss-----------s",this.filterOptionss);
            console.log("this.filterField-----------s",this.filterField);
            this.renderFieldNames(inAccesableFields,this.formulaField);
            
        } else if (error) {
            console.error('Error fetching object metadata:', error);
        }
    }
//     @wire(getObjectMetadata, { objectApiName: '$objAPIName' })
// wiredObjectMetadata({ error, data }) {
//     if (data) {
//         console.log('data ==--> ', data);
        
//         // Prepare field options
//         this.fieldOptions = Object.keys(data).map(key => ({
//             label: data[key], // Use label for display
//             value: key        // Use API name for querying
//         }));

//         this.filterOptionss = Object.keys(data).map(key => ({
//             label: data[key],
//             value: key
//         }));
        
//         console.log("this.filterOptionss-----------s", this.filterOptionss);
//         console.log("this.filterField-----------s", this.filterField);
        
//         this.renderFieldNames();
//     } else if (error) {
//         console.error('Error fetching object metadata:', error);
//     }
// }


    @wire(getPicklistValues, { objectApiName: '$objAPIName', fieldNames: '$filterField' })
    wiredPicklistValues({ error, data }) {
        if (data) {
            this.picklistValues = data[this.filterField] || [];
            this.isPicklistField = this.picklistValues.length > 0;
             console.log("this.picklistValues-----------s",JSON.stringify(this.data));
              console.log("this.filterField-----------s",this.filterField);
               console.log("this.objAPIName-----------s",this.objAPIName);
        } 
        else if (error) {
            console.error('Error fetching picklist values:', error);
        }
    }
    @wire(getFieldTypes, { objectApiName: '$objAPIName' })
    wiredTypes({error, data}) {
        if(data) {
            this.fieldTypeMap = data; 
            this.mergeFieldInfo();
        } else if(error) {
            console.error('Error fetching field types:', error);
        }
    }
    
    connctedCallBack(){
        console.log("-------------------",this.objAPIName);
        console.log("-------------------",this.objFieldsName);   
    }

//-------------------------//
// renderFieldNames(inAccesableFields) {
//     this.getobjectName = this.objAPIName;
//     this.getfieldName = this.objFieldsName;
//     console.log('inAccesableFields--999', inAccesableFields);
//     console.log("this.getfieldName----------", this.getfieldName);
//     console.log('this.dataForUrl--------------',this.dataForUrl);
    
//     let fileNames = this.getfieldName.split(','); // Split fields into an array

//     // Process lookup fields and regular fields
//     let filteredFields = fileNames.filter(fieldName => {
//         if (fieldName.includes('.')) {
//             // Handle nested fields (e.g., Account.Name)
//             const parentField = fieldName.split('.')[1]; // Get the parent (e.g., Account)
//             return (
//                 !inAccesableFields.includes(parentField) &&
//                 !inAccesableFields.includes(fieldName)
//             );
//         } else {
//             // Handle regular fields
//             return !inAccesableFields.includes(fieldName);
//         }
//     });

//     console.log('Filtered Accessible Fields:', filteredFields);

//     let fieldOptionsMap = new Map();
//     if (this.fieldOptions) {
//         this.fieldOptions.forEach(option => {
//             fieldOptionsMap.set(option.label, option.value);
//         });
//     }
//     console.log('fieldOptionsMap--4567', fieldOptionsMap);

//     let col = [];
//     for (let i = 0; i < filteredFields.length; i++) {
//         let typeAttributes = {};
//         let cellClass = 'slds-truncate';
//         let style = '';
//         let fieldName = filteredFields[i];
//         console.log('fieldTypeMap',JSON.stringify(this.fieldTypeMap));
        
//         if (fieldName==='Picture__c' ) {
//             console.log('imside formulae field check');
            
//             col.push({
//                 label: fieldOptionsMap.get(fieldName) || fieldName, // Column header
//                 fieldName: 'imageurl', // A derived field for the image URL
//                 // sortable:true,
//                 type: 'image', // Custom data type for images
//                 // cellAttributes: {    
//                 //     alignment: 'center', // Center-align images
//                 // },
//                 typeAttributes: {
//                     imageurlvalue: { fieldName: 'imageurl' }
//                     }
//             });
//         }
//        else if (fieldName === 'Name') {
//             this.typeClickable = 'button';
//             typeAttributes = {
//                 label: { fieldName },
//                 target: '_blank',
//                 name: 'view_details',
//                 variant: 'base',
//             };
//             style = 'max-width: fit-content; text-overflow: ellipsis; white-space: nowrap;';
//             cellClass = '';
//         } 
//         else {
//             this.typeClickable = 'text';
//         }

//         if (fieldName.includes('.')) {
//             // Handle nested fields (e.g., Account.Name)
//             const parts = fieldName.split('.'); // Split into ['Account', 'Name']
//             const flattenedFieldName = parts.join(''); // Flatten as AccountName
//             this.parentURLFields.push(flattenedFieldName);
            
//             // if(!this.mapForFieldsUrl.has(parts[0])){
                
//             //     let arr=[];
//             //     this.mapForFieldsUrl.set(parts[0],arr);
//             // }
//             // this.mapForFieldsUrl.get(parts[0])?.push(flattenedFieldName);
            
//             col.push({
//                 label: parts.join(' '), // Format label as "Account Name"
//                 fieldName: flattenedFieldName+'Url', // to show parent field as link.
//                 sortable: true,
//                 type: 'url',
//                 // cellAttributes: {
//                 //     class: cellClass,
//                 //     title: { fieldName: flattenedFieldName },
//                 //     style: style,
//                 //     alignment: 'left',
//                 // },
//                 typeAttributes:{
//                     label:{ fieldName: flattenedFieldName }, //// to show parent field.
//                     target:'_blank',
//                 },
//             });
//         } else {
//             // Handle regular fields (e.g., Name)
//             col.push({
//                 label: fieldOptionsMap.get(fieldName) || fieldName, // Column Header
//                 fieldName,
//                 sortable: true,
//                 type: this.typeClickable,
//                 cellAttributes: {
//                     class: cellClass,
//                     title: { fieldName },
//                     style: style,
//                     alignment: 'left',
//                 },
//                 typeAttributes,
//             });
//         }
//     }

//     // Add row action column
//     col.push({
//         type: 'action',
//         typeAttributes: { rowActions: this.__getRowActions },
//     });

//     console.log('OUTPUT : ``````````````', JSON.stringify(col));
//     this.columns = col;
//     console.log('OUTPUT : ``````````````', JSON.stringify(this.columns));
// }
//-------------------------//
renderFieldNames(inAccesableFields,formulaField) {
    this.getobjectName = this.objAPIName;
    this.getfieldName = this.objFieldsName;
    console.log('inAccesableFields--999', inAccesableFields);
    console.log("this.getfieldName----------", this.getfieldName);
    console.log('this.dataForUrl--------------', this.dataForUrl);
   
    let fileNames = [...new Set(this.getfieldName.split(','))]; // Ensure unique fields

    let filteredFields = fileNames.filter(fieldName => {
        if (fieldName.includes('.')) {
            const parentField = fieldName.split('.')[1];
            return (
                !inAccesableFields.includes(parentField) &&
                !inAccesableFields.includes(fieldName)
            );
        } else {
            return !inAccesableFields.includes(fieldName);
        }
    });

    console.log('Filtered Accessible Fields:', filteredFields);

    let fieldOptionsMap = new Map();
    if (this.fieldOptions) {
        this.fieldOptions.forEach(option => {
            fieldOptionsMap.set(option.label, option.value);
        });
    }
    console.log('fieldOptionsMap--4567', fieldOptionsMap);

    let col = [];
    for (let i = 0; i < filteredFields.length; i++) {
        let typeAttributes = {};
        let cellClass = 'slds-truncate';
        let style = '';
        let fieldName = filteredFields[i];

        if (formulaField.includes(fieldName)) {
            console.log('Handling Picture__c field');
            col.push({
                label: fieldOptionsMap.get(fieldName) || fieldName,
                fieldName: 'imageurl',
                type: 'image',
                typeAttributes: {
                    imageurlvalue: { fieldName: 'imageurl' },
                },
            });
            continue; // Skip further processing for Picture__c
        }

        if (fieldName === 'Name') {
            console.log('Handling Name field as button');
            typeAttributes = {
                label: { fieldName },
                target: '_blank',
                name: 'view_details',
                variant: 'base',
            };
            style = 'max-width: fit-content; text-overflow: ellipsis; white-space: nowrap;';
            cellClass = '';
            col.push({
                label: fieldOptionsMap.get(fieldName) || fieldName, // Column Header
                fieldName,
                sortable: true,
                type: 'button',
                typeAttributes,
                cellAttributes: {
                    class: cellClass,
                    style: style,
                },
            });
            continue; // Skip further processing for Name field
        }        
        if (fieldName.includes('.')) {
            const parts = fieldName.split('.');
            const flattenedFieldName = parts.join('');
            this.parentURLFields.push(flattenedFieldName);

            col.push({
                label: parts.join(' '),
                fieldName: `${flattenedFieldName}Url`,
                sortable: true,
                type: 'url',
                typeAttributes: {
                    label: { fieldName: flattenedFieldName },
                    target: '_blank',
                },
            });
        } else {
            col.push({
                label: fieldOptionsMap.get(fieldName) || fieldName,
                fieldName,
                sortable: true,
                type: 'text',
                cellAttributes: {
                    class: cellClass,
                    title: { fieldName },
                    style: style,
                    alignment: 'left',
                },
            });
        }
    }

    col.push({
        type: 'action',
        typeAttributes: { rowActions: this.__getRowActions },
    });

    console.log('Final Columns:', JSON.stringify(col));
    this.columns = col;
}


async handleSave(event) {
    let updatedFields = event.detail.draftValues;

    updatedFields = updatedFields.map((row) => {
        const flattenedRow = { ...row };

        flattenedRow.attributes = { type: this.objAPIName, url: `/services/data/vXX.X/sobjects/${this.objAPIName}/${row.Id}` };
        for (const field in flattenedRow) {
            if (flattenedRow[field] === "True") {
                flattenedRow[field] = true;
            } else if (flattenedRow[field] === "False") {
                flattenedRow[field] = false;
            }
        }   
        return flattenedRow;
    });

    console.log("Draft values before sending to Apex (with attributes):", JSON.stringify(updatedFields));

    try {
        const result = await updateRecords({
            objectName: this.objAPIName,
            data: JSON.stringify(updatedFields), 
        });

        console.log("Apex update result:", result);

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Records updated successfully',
                variant: 'success',
            })
        );

        //await refreshApex(this.data);
        await this.refreshAndPaginate();
        this.draftValues = []; // Clear draft values
    } catch (error) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error updating records',
                message: error.body ? error.body.message : error.message,
                variant: 'error',
            })
        );
    }
}


    mergeFieldInfo() {
        if (this.fieldOptions && this.fieldOptions.length > 0 && Object.keys(this.fieldTypeMap).length > 0) {
        }
    }
    __getRowActions(row, doneCallback) {
        console.log("__getRowActions insideeeeeee");
        
        let actions = [
                { label: 'View', name: 'View' },
                { label: 'Edit', name: 'Edit' },
                { label: 'Delete', name: 'Delete' },
            ];
            doneCallback(actions);
        }

        handleRowAction(event) {
            const actionName = event.detail.action.name;
            const row = event.detail.row;
            //const nameToChange = event.detail.row.Title;
           // const idOfSelectedRowFile = event.detail.row.Id;
            const recordIdsss = row.ContentDocumentId || row.Id;
            // console.log('content document id of the selected row ==---> ', JSON.stringify(event.detail));
            // console.log('content document id of the selected row ==---> ', contenDocId);
            // console.log('idOfSelectedRowFile ==---> ', idOfSelectedRowFile);
            console.log("event.detail.row-----",event.detail.row);
            
            console.log("actions",event.detail.action.name);
            console.log('Record ID:', recordIdsss);
            
            // Dynamically update selectedRows
            if (!this.selectedRows) {
                this.selectedRows = [];
            }

            // Push the current row into selectedRows if not already present
            if (!this.selectedRows.some(selectedRow => selectedRow.Id === row.Id)) {
                this.selectedRows.push(row);
            }

            console.log("Selected Rows:", JSON.stringify(this.selectedRows));
            console.log("Action Triggered:", actionName);
            console.log("Record ID:", recordIdsss);
            
            switch (actionName) {
                case 'View':
                    this.__viewRecord(recordIdsss);
                    break;
                case 'Delete':
                    // this.selectedRows = [];
                    // console.log('array selected rows ==---> ', this.selectedRows);
                    this.handleDeleteFromAction(recordIdsss);
                    break;
                case 'Edit':
                    console.log('edit is clicked ');
                    this.__editRecord(recordIdsss);
                    break;
                    case 'view_details':
                        this.__viewRecord(recordIdsss);
                        break;                
                default:
                    console.warn(`Action "${actionName}" is not recognized.`);
                    break;
            }
        }
    handleSuccess(event) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Record created successfully!',
                variant: 'success',
            })
        );
        this.newButtonVariable = false;
        const recordId = event.detail.id;
        console.log('record Id -----',recordId);
        // this.page = 1;
        // refreshApex(this.refreshTable);
        this.refreshAndPaginate();
        this.closeModal();
    }
    
    handleRefresh(){
        console.log("handleRefresh--");
        return refreshApex(this.refreshTable);
    }
    handleDeleteFromAction(recordIdsss){
        let arr=[];
        arr.push(recordIdsss);
        deleteRecords({ objectApiName: this.objAPIName, recordIds: arr })
    .then(() => {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: `records are deleted.`,
                variant: 'success',
            })
        );
        this.refreshAndPaginate();
    })
    .catch((error) => {
        let errorMessage = error.body ? error.body.message : JSON.stringify(error);
        let errorParts = errorMessage.split('Your attempt to delete');
        let primaryMessage = errorParts[0].trim();
        let secondaryMessage = errorParts.length > 1 ? `Your attempt to delete ${errorParts[1].trim()}` : '';
        let combinedMessage = primaryMessage;
        if (secondaryMessage) {
            combinedMessage += `\n\nDetails:\n${secondaryMessage}`;
        }

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error while Deleting Records',
                message: combinedMessage,
                variant: 'error',
            })
        );
    });

    }
    __editRecord(recordIdsss){
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordIdsss,
                actionName: 'edit', 
            },
        });
        console.log("this.refreshTable---",this.refreshTable);
        return refreshApex(this.refreshTable);
        
    }

    __viewRecord(recordIdsss){
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordIdsss,
                actionName: 'view',
            },
        });
    }
    
    openModal() {
        this.newButtonVariable = true;
    }

    handleNewClick(){
        console.log("handleNewClick",this.newButtonVariable);  
        this.newButtonVariable = true;
    }
    handleOkay(){
        this.newButtonVariable = false;
    }
    closeModal(){
        this.newButtonVariable = false;
        this.isModal1 = false;
    }
    loadOpps() {
        getOpps({
            objectName: this.getobjectName,
            fieldNames: [this.getfieldName],
            searchKey: this.searchKey,
            // sortBy: this.sortedBy,
            // sortDirection: this.sortedDirection,
            filterArr: this.filterArr,
            filterArr: this.getFilterCriteria(), // Include filter criteria
            //sortFields:this.sortFields
        })
        .then(result => {
            console.log("result------>",result.Records);
            
            this.processRecords(result.Records);
        })
        .catch(error => { 
           
            console.error('Error loading records:', error);
        });
    }
    loadAfterFilter() {
        getOpps({
            objectName: this.getobjectName,
            fieldNames: [this.getfieldName],
            searchKey: this.searchKey,
          //  sortBy: this.sortedBy,
           // sortDirection: this.sortedDirection,
            filterArr: this.filterArr,
            filterArr: this.getFilterCriteria(), // Include filter criteria
            //sortFields:this.sortFields
        })
        .then(result => {
            this.processRecords(result.Records);
            console.log("resssuullttt",result.Records);
            
        })
        .catch(error => { 
            this.data=[];
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Nothing Selected',
                    message:'No Records Available ',
                    variant: 'warning'
                }),
            );
            console.error('Error loading records:', error);
        });
    }

    getFilterCriteria() {
        // Return the filter criteria based on the selected filter
        let filters = [...this.filterArr];
        console.log('currentLog enter1 : ');
        if (this.selectedFilter === 'My' && this.currentUserId) {
            console.log('currentLog enter2 : ',);
            // Assuming the owner field is "OwnerId" and you want to filter by the current user's Id
            filters.push({
                id: this.count++,
                field: 'OwnerId',
                operator: 'equals',
                value: this.currentUserId 
            });
        }
        return filters;
    }

    // recomputeFilterIds() {
    //     this.filterArr = this.filterArr.map((filter, index) => {
    //         return { ...filter, id: index + 1 }; // Reassign IDs
    //     });
    // }
    // getFilterCriteria() {
    //     let filters = [...this.filterArr]; // Clone the current filters array
    
    //     // Check for duplicates before adding a new filter
    //     const existingFilter = filters.find(
    //         (filter) =>
    //             filter.field === 'OwnerId' &&
    //             filter.operator === 'equals' &&
    //             filter.value === this.currentUserId
    //     );
    
    //     if (!existingFilter && this.selectedFilter === 'My' && this.currentUserId) {
    //         // Add the filter only if it doesn't already exist
    //         filters.push({
    //             id: this.filterArr.length + 1, // Ensure consistent numbering based on array size
    //             field: 'OwnerId',
    //             operator: 'equals',
    //             value: this.currentUserId,
    //         });
    //     } else if (existingFilter) {
    //         console.log('Filter already exists:', existingFilter);
    //     }
    
    //     return filters;
    // }
    

    handleFieldChange(event) {
        this.filterField = event.detail.value;
        // Fetch picklist values if the field is a picklist
        this.isPicklistField = this.picklistValues.length > 0;
        if (this.filterField && this.filterField.includes('checkbox')) {
        this.isPicklistField = false; // Disable picklist for boolean fields
    }
    }

    handleSecondChange(event) {
        this.filterOperator = event.detail.value;
    }

    handleInputChange(event) {
        this.filterValue = event.detail.value;
    }
    
    @wire(getOpps, {
        objectName: '$getobjectName',
        fieldNames: '$getfieldName',
        searchKey: '$searchKey',
        filterArr: '$filterArr'
    })
    test(value) {
        this.refreshTable = value;
        const { data, error } = value;

        if (data) {
            
            console.log("Data fetched: ", data);
            this.data = data.Records;
            //this.dataForUrl = this.data;
            //this.dataForUrl = JSON.parse(JSON.stringify(data));
           //console.log('this.dataForUrl',JSON.parse(JSON.stringify(this.dataForUrl)));
           
            this.datainAccessable = data.inaccessibleFields;
            this.processRecords(data.Records);
            this.error = undefined;
        } else if (error) {
            console.error("Error fetching data: ", error);
    
            this.data = undefined;
            this.error = error.body?.message || 'An unexpected error occurred.';
            this.showToast('Error', this.error, 'error');
        }
    }
@track datainAccessable=[];
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant,
            })
        );
    }    

    


    // @wire(getOpps, {
    //     objectName: '$getobjectName',
    //     fieldNames: '$getfieldName',
    //     searchKey: '$searchKey',
    //     sortBy: '$sortedBy',
    //     sortDirection: '$sortedDirection',
    //     filterArr: '$filterArr' // Pass filterArr to the wire method
    // })
    // wiredAccounts({ error, data }) {
    //     if (data) {
    //         this.processRecords(data);
    //         this.error = undefined;
    //         this.refreshTable = data({ error, data });
    //     } else if (error) {
    //         this.error = error;
    //         this.data = undefined;
    //     }
    // }

//    processRecords(data) {
//     this.items = data.map(record => {
//         Object.keys(record).forEach(field => {
//             // if (typeof record[field] === 'boolean') {
//             //     record[field] = record[field] ? 'Yes' : 'No'; // Display 'Yes' or 'No' for booleans
//             // }
//         });
//         return record;
//     });
//     this.totalRecountCount = this.items.length;
//     this.totalPage = Math.ceil(this.totalRecountCount / this.PageCount);
//     this.data = this.items.slice(0, this.PageCount);
//     this.endingRecord = this.PageCount;
// }
//     processRecords(data) {
//     this.items = data.map(record => {
//         let transformedRecord = { ...record };
//         Object.keys(transformedRecord).forEach(field => {
//             if (this.fieldTypeMap[field] === 'BOOLEAN') {
//                 // Convert true/false to tick/cross
//                 if (transformedRecord[field] === true) {
//                     transformedRecord[field] = '✓';
//                 } else if (transformedRecord[field] === false) {
//                     transformedRecord[field] = '✗';
//                 } else {
//                     transformedRecord[field] = ''; // Handle null
//                 }
//             }
//         });
//         return transformedRecord;
//     });

//     this.totalRecountCount = this.items.length;
//     this.totalPage = Math.ceil(this.totalRecountCount / this.PageCount);
//     this.data = this.items.slice(0, this.PageCount);
//     console.log('this.data 789==--->> ', this.data);
//     this.endingRecord = this.PageCount;
// }
processRecords(data) {
    
    if(data.length==0) return;
   

    this.items = data.map(record => {
        let transformedRecord = { ...record };
        console.log('data inside pprosecc ------- ',data);
        console.log('object.keys',Object.keys(record));

        Object.keys(record).forEach(field => {
           

            if (typeof record[field] === 'object' && record[field] !== null) {
                // Handle nested fields
                Object.keys(record[field]).forEach(nestedKey => {
                    const flattenedField = `${field}${nestedKey}`; 
                    // show parent field 
                    transformedRecord[flattenedField] = record[field][nestedKey];
                    //show parent field as link
                    transformedRecord[flattenedField+'Url']='/'+transformedRecord[field].Id;
                });
            } 
            // else if (field === 'Name') {
            //     // Transform Name into a URL
            //     transformedRecord.nameUrl = '/' + record.Id; // Construct URL using record ID
            // }

            if (this.fieldTypeMap[field] === 'BOOLEAN' && typeof transformedRecord[field] === 'boolean') {
                transformedRecord[field] = transformedRecord[field] === true ? '✓' : '✗';
            }
            
           // Dynamic extraction for Picture__c
            if (this.formulaField.includes(field) && typeof record[field] === 'string') {
                const imgSrcMatch = record[field].match(/<img[^>]*src=["']([^"']+)["']/i);
                if (imgSrcMatch && imgSrcMatch[1]) {
                    transformedRecord.imageurl = imgSrcMatch[1]; // Extract the src attribute value
                } else {
                    transformedRecord.imageurl = null; // Fallback if no match found
                }
            }
        
        });

        return transformedRecord;
    });

    console.log("Transformed Records:", this.items);

    this.totalRecountCount = this.items.length;
    this.totalPage = Math.ceil(this.totalRecountCount / this.PageCount);
    this.data = this.items.slice(0, this.PageCount);
    this.endingRecord = Math.min(this.PageCount, this.totalRecountCount);
    console.log("Final this.data:", JSON.stringify(this.data));
}



    previousHandler() {
        this.isPageChanged = true;
        if (this.page > 1) {
            this.page = this.page - 1;
            this.displayRecordPerPage(this.page);
        }
        this.updateSelectedRows();
    }

    nextHandler() {
        this.isPageChanged = true;
        if ((this.page < this.totalPage) && this.page !== this.totalPage) {
            this.page = this.page + 1;
            this.displayRecordPerPage(this.page);
        }
        this.updateSelectedRows();
    }

    displayRecordPerPage(page) {
        this.startingRecord = ((page - 1) * this.PageCount);
        this.endingRecord = (this.PageCount * page);
        this.endingRecord = (this.endingRecord > this.totalRecountCount) ? this.totalRecountCount : this.endingRecord;
        this.data = this.items.slice(this.startingRecord, this.endingRecord);
        this.startingRecord = this.startingRecord + 1;
        console.log("Updated this.data for page:", this.data);
    }
    async refreshAndPaginate() {
        try {
            await refreshApex(this.refreshTable);
            this.processRecords(this.items);
            this.totalPage = Math.ceil(this.totalRecountCount / this.PageCount);       
            if (isNaN(this.totalPage) || this.totalPage < 1) {
                this.totalPage = 1;
            }
    
            if (this.page > this.totalPage) {
                this.page = this.totalPage;
            }
            this.displayRecordPerPage(this.page);
        } catch (error) {
            console.error("Error refreshing data:", error);
        }
    }
    
    onRowSelection(event) {
        let selectedRows = JSON.parse(JSON.stringify(event.detail.selectedRows));
        this.recordsCount = event.detail.selectedRows.length;
        
        console.log('selectedRows-----',selectedRows);
        
        this.selectedRecords = [];
        for(let i = 0 ; i<selectedRows.length;i++){
            this.selectedRecords.push(selectedRows[i].Id);

        }
        console.log('this.selectedRecords------',this.selectedRecords);
        

        if (!this.isPageChanged || this.initialLoad) {
            if (this.initialLoad) this.initialLoad = false;
            this.processSelectedRows(event.detail.selectedRows);
        } else {
            this.isPageChanged = false;
            this.initialLoad = true;
        }
    }

    handleDeleteClick(){
        console.log("this.selectedRows------",this.selectedRows);
        console.log('this.objAPIName',);
        
        console.log('this.selectedRecords-----',this.selectedRecords);
        //let recordIdsToDelete = [];
        if(this.selectedRecords && this.selectedRecords.length>0){
            
            deleteRecords({objectApiName: this.objAPIName,recordIds : this.selectedRecords}).then(()=>{
                this.dispatchEvent(
                    new ShowToastEvent({
                        title:'Success!!',
                        message:this.recordsCount + 'records are deleted.',
                        variant:'success'
                    })
                );
                this.template.querySelector('lightning-datatable').selectedRows =[];
                this.selectedRecords = [];
                this.recordsCount = 0;
                // this.page = 1;
                // refreshApex(this.refreshTable);
                this.refreshAndPaginate();
            }).catch((error) => {
                let errorMessage = error.body ? error.body.message : JSON.stringify(error);
        
                // Split error message into main and additional details
                let errorParts = errorMessage.split('Your attempt to delete');
                let primaryMessage = errorParts[0].trim();
                let secondaryMessage = errorParts.length > 1 ? `Your attempt to delete ${errorParts[1].trim()}` : '';
        
                // Combine into a single formatted message
                let combinedMessage = primaryMessage;
                if (secondaryMessage) {
                    combinedMessage += `\n\nDetails:\n${secondaryMessage}`;
                }
        
                // Show single toast message
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error while Deleting Records',
                        message: combinedMessage,
                        variant: 'error',
                    })
                );
            });

        }else{ this.dispatchEvent(
            new ShowToastEvent({
                title: 'Nothing Selected',
                message:' Please select Records to be deleted',
                variant: 'warning'
            }),
        );

        }
    }

    processSelectedRows(selectedOpps) {
        var newMap = new Map();
        for (var i = 0; i < selectedOpps.length; i++) {
            if (!this.allSelectedRows.includes(selectedOpps[i])) {
                this.allSelectedRows.push(selectedOpps[i]);
            }
            this.mapoppNameVsOpp.set(selectedOpps[i].Name, selectedOpps[i]);
            newMap.set(selectedOpps[i].Name, selectedOpps[i]);
        }
        for (let [key, value] of this.mapoppNameVsOpp.entries()) {
            if (newMap.size <= 0 || (!newMap.has(key) && this.initialLoad)) {
                const index = this.allSelectedRows.indexOf(value);
                if (index > -1) {
                    this.allSelectedRows.splice(index, 1);
                }
            }
        }
    }

    handleKeyChange(event) {
        this.searchKey = event.target.value;
        this.loadOpps(); // Reload with search key
    }

    showModalBox() {
        this.isShowModal = true;
    }
    hideModalCancledBox() {
        console.log("hideModalCancledBox");
        this.isShowModal = false;
        
    }

    hideModalBox() {
    if (this.filterField && this.filterOperator) { // Check if both filterField and filterOperator are not empty
        const existingFilterIndex = this.filterArr.findIndex(
                        (filter) => filter.field == this.filterField
                    );
       if (existingFilterIndex === -1) {
        this.filterArr.push({
            id: ++this.count,
            field: this.filterField,
            operator: this.filterOperator,
            value: this.filterValue
        });
    }else {
                    // If the field already exists, update the existing filter
                    this.filterArr[existingFilterIndex] = {
                        id: this.count, // Increment count for unique id
                        field: this.filterField,
                        operator: this.filterOperator,
                        value: this.filterValue
                    };
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Updated',
                            message: 'Filter updated successfully!',
                            variant: 'success',
                        })
                    );
                }
}
    console.log('this.filterArr',this.filterArr);
    this.showFields = false;
}

// hideModalBox() {
//     // Check if both filterField and filterOperator are not empty
//     if (this.filterField && this.filterOperator) {
//         // Check if a filter with the same field already exists
//         const existingFilterIndex = this.filterArr.findIndex(
//             (filter) => filter.field === this.filterField
//         );

//         if (existingFilterIndex === -1) {
//             // If no existing filter, add a new one
//             this.filterArr.push({
//                 id: ++this.count, // Increment count for unique id
//                 field: this.filterField,
//                 operator: this.filterOperator,
//                 value: this.filterValue
//             });
//             // this.dispatchEvent(
//             //     new ShowToastEvent({
//             //         title: 'Success',
//             //         message: 'Filter added successfully!',
//             //         variant: 'success',
//             //     })
//             // );
//         } else {
//             // If the field already exists, update the existing filter
//             this.filterArr[existingFilterIndex] = {
//                 id: ++this.count, // Increment count for unique id
//                 field: this.filterField,
//                 operator: this.filterOperator,
//                 value: this.filterValue
//             };
//             this.dispatchEvent(
//                 new ShowToastEvent({
//                     title: 'Updated',
//                     message: 'Filter updated successfully!',
//                     variant: 'success',
//                 })
//             );
//         }
//     } else {
//         // If either filterField or filterOperator is missing, show error toast
//         this.dispatchEvent(
//             new ShowToastEvent({
//                 title: 'Error',
//                 message: 'Please select both a filter field and operator.',
//                 variant: 'error',
//             })
//         );
//     }

//     this.showFields = false; // Hide the modal box after saving
// }


    deleteFilterFromList(event) {
    // Get the ID of the filter item to delete as a string and convert to number
    // this.count= 0;
    const filterId = Number(event.target.dataset.id);

    // Filter out the item with the matching ID
    this.filterArr = this.filterArr.filter(filter => filter.id !== filterId);
}

doSorting(event) {
    const { fieldName, sortDirection } = event.detail;

    // Update sort fields and directions for multi-column support
    const existingIndex = this.sortFields.indexOf(fieldName);
    if (existingIndex > -1) {
        // Update direction if already in sort fields
        this.sortDirections[fieldName] = sortDirection;
    } else {
        // Add new field to sort fields
        this.sortFields.push(fieldName);
        this.sortDirections[fieldName] = sortDirection;
    }

    // Update single-column sort for arrow display
    this.sortBy = fieldName;
    this.sortDirection = sortDirection;
    this.page = 1;
    this.sortData();
}

sortData() {
    let parseData = JSON.parse(JSON.stringify(this.items));
    console.log("parseData00---->>",parseData);
    
    console.log('OUTPUT : this.sortFields ', this.sortDirections);
    console.log('OUTPUT : this.sortFields ', this.sortFields);
    console.log('OUTPUT : data', this.data);
    parseData.sort((a, b) => {
        for (let field of this.sortFields) {
            const direction = this.sortDirections[field] === 'asc' ? 1 : -1;
            const valueA = (a[field] || '').toString().toLowerCase(); // Handle nulls
            const valueB = (b[field] || '').toString().toLowerCase();

            if (valueA > valueB) return direction;
            if (valueA < valueB) return -direction;
            // Continue to next field if values are equal
        }
        return 0; // All fields are equal
    });

    this.data = parseData;
    console.log("this.data -  - -------?",this.data);
    this.processRecords(parseData);
   
}
// sortData() {
//     // Use the original data (raw values) for sorting
//     let parseData = JSON.parse(JSON.stringify(this.items));
//     console.log("Before Sorting - parseData:", parseData);

//     parseData.sort((a, b) => {
//         for (let field of this.sortFields) {
//             const direction = this.sortDirections[field] === 'asc' ? 1 : -1;

//             // Handle sorting for BOOLEAN fields: convert '✓'/'✗' back to true/false
//             const valueA = this.fieldTypeMap[field] === 'BOOLEAN' ? !!a[field] : (a[field] || '').toString().toLowerCase();
//             const valueB = this.fieldTypeMap[field] === 'BOOLEAN' ? !!b[field] : (b[field] || '').toString().toLowerCase();

//             if (valueA > valueB) return direction;
//             if (valueA < valueB) return -direction;
//         }
//         return 0; // All fields are equal
//     });

//     console.log("After Sorting - parseData:", parseData);

//     // Reapply processing and update the display data
//     this.processRecords(parseData);
// }
// sortData() {
//     let parseData = JSON.parse(JSON.stringify(this.items));
//     console.log("Before Sorting - parseData:", parseData);

//     parseData.sort((a, b) => {
//         for (let field of this.sortFields) {
//             const direction = this.sortDirections[field] === 'asc' ? 1 : -1;

//             let valueA, valueB;

//             // Check for BOOLEAN fields and map ✓ or ✗ back to true/false
//             if (this.fieldTypeMap[field] === 'BOOLEAN') {
//                 valueA = a[field] === '✓' ? true : false;
//                 valueB = b[field] === '✓' ? true : false;
//             } else {
//                 // Standard string comparison for other fields
//                 valueA = (a[field] || '').toString().toLowerCase();
//                 valueB = (b[field] || '').toString().toLowerCase();
//             }

//             if (valueA > valueB) return direction;
//             if (valueA < valueB) return -direction;
//         }
//         return 0; // All fields are equal
//     });

//     console.log("After Sorting - parseData:", parseData);

//     // Update the data without reprocessing unnecessarily
//     this.processRecords(parseData);
//     this.data = parseData;
//     console.log("Sorted Data:", this.data);
// }



    hideFilterBox() {
        this.showFields = false;
        this.filterField = '';
        this.filterOperator = '';
        this.filterValue = '';
    }
    
    handelAddFilterClick() {
        this.showFields = !this.showFields;
        this.filterField = '';
        this.filterOperator = '';
        this.filterValue = '';
    }

   handleClick(event) {
    this.isShowModal = false;
    this.loadAfterFilter(); // Reload with updated filters
}

    editFilterCriteria(event) {
        // this.filterArr = [];
        this.showFields = true;
        const filterId = event.currentTarget.dataset.id;
        // Logic to edit the selected filter
    }

    updateSelectedRows() {
        var selectedIds = this.allSelectedRows.map(row => row.Id);
        this.template.querySelector('[data-id="table"]').selectedRows = selectedIds;
    }
     handleClearFilters() {
        // Clear the filter array and reset relevant fields
        this.isShowModal = false;
        this.filterArr = [];
        this.filterField = '';
        this.filterOperator = '';
        this.filterValue = '';
        this.loadOpps(); // Reload without filters
    }
}