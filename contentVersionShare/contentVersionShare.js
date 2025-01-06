import { LightningElement , api, wire ,track} from 'lwc';
import getFileAccessRecords from '@salesforce/apex/ContentVersionShareController.getFileAccessRecords';
import removeFileAccess from '@salesforce/apex/ContentVersionShareController.removeFileAccess';
import shareFileWithMultipleUsersOrGroups from '@salesforce/apex/ContentVersionShareController.shareFileWithMultipleUsersOrGroups';
import updateFileAccessLevel from '@salesforce/apex/ContentVersionShareController.updateFileAccessLevel';
import getContentVersionDetails from '@salesforce/apex/ContentVersionShareController.getContentVersionDetails';
import retreiveActiveUsersOrGroups from '@salesforce/apex/LibraryManageMemberController.retreiveActiveUsersOrGroups';
import retreiveActiveAllUsersOrGroups from '@salesforce/apex/LibraryManageMemberController.retreiveActiveAllUsersOrGroups';
import { refreshApex } from '@salesforce/apex';
import Id from "@salesforce/user/Id";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
export default class ContentVersionShare extends NavigationMixin(LightningElement) {

@api contentVersionId;
 @track searchValue = '';
    @track showdropdown = false;
    @track values = [];
    @track selectedvalues = [];
    selectedUsers = [];
    __selectedUsersId = [];
    @track members = [];
    @track check = false;
    @track icon = false;
    @track selectedAccess = 'Viewer';
    showSearchBar = true;
    userOptions = '';
    // showPillContainer = true;
    showPillContainer = false;
    disableShare = true;
    userId = Id;
    selectedType = 'User';
    title = '';
    ownerId = '';
    @track showMembers = false;
     iconName = 'utility:chevronright';
     accessOptions = [
        { label: 'Viewer', value: 'Viewer' },
        { label: 'Collaborator', value: 'Collaborator' }
        
    ];

 accessOptionsForOwner = [
        { label: 'Owner', value: 'Owner' },
        { label: 'Set by Library', value: 'Set by Library' }
        
    ];

     accessOptionsForSetByLib = [
        { label: 'Viewer', value: 'Viewer' },
        { label: 'Collaborator', value: 'Collaborator' },
        { label: 'Set by Library', value: 'Set by Library' }
        
    ];

@wire(getContentVersionDetails, { contentVersionId: '$contentVersionId' })
    wiredTitle({ error, data }) {
        if (data) {
            this.title = data.title;  // Assign the title if the data is returned successfully
            this.ownerId = data.ownerId;
        } else if (error) {
            console.log('OUTPUT :contentVersionId ',this.contentVersionId);
           console.log('OUTPUT :error ',error);
        }
    }

@wire(getFileAccessRecords, { contentVersionId: '$contentVersionId' })
    wiredFileAccessRecords(result) {
        this.wiredResult = result
        if (result.data) {
            this.members = result.data;  // Handle the data response
            let isSetByLibrary = this.members.some(item => item.accessLevel === 'Set by Library');

                // If found, add 'settedbyLibrary' to all objects
                if (isSetByLibrary) {
                    this.members = this.members.map(item => {
                        return {
                            ...item,
                            settedbyLibrary: true
                        };
                    });
                }
            console.log('OUTPUT :this.members fro wire== ', this.members);
        }
    }

    @wire(retreiveActiveUsersOrGroups, { searchKey: '$searchValue', selectedType: '$selectedType' })
    wiredUsers({ error, data }) {
        console.log('OUTPUT wiredUsers called: ',);
        if (data) {
            console.log('OUTPUT wired data: ', data);
            let users = data;
            this.userOptions = data;

            console.log('OUTPUT :this.userOptions ', this.userOptions);
        } else if (error) {
            console.log('OUTPUT error: ', error);
            this.__showToast('Error', 'Error occured while getting active users.');
        }
    }

    connectedCallback() {
        console.log('arrived at share modal contentVersionId==', this.contentVersionId);
        // Add an event listener to the entire document to detect clicks outside the component
        document.addEventListener('click', this.handleClickOutside.bind(this));
    }

    disconnectedCallback() {
        // Remove the event listener when the component is destroyed
        document.removeEventListener('click', this.handleClickOutside.bind(this));
    }

    handleClickOutside(event) {
        const searchInput = this.template.querySelector('.search-input');
        const userOptionsList = this.template.querySelector('.Pravin');
        console.log('OUTPUT handleClickOutside:searchInput== ',searchInput);
        console.log('OUTPUT handleClickOutside:userOptionsList== ',userOptionsList);
       // Check if the click was outside the search input and the user options list
        if (searchInput && userOptionsList) {
        // Check if the click was outside the search input and the user options list
        if (!searchInput.contains(event.target) && !userOptionsList.contains(event.target)) {
            this.userOptions = []; // Clear userOptions when clicking outside
        }
    } else {
        console.log('One of the elements (searchInput or userOptionsList) is null.');
    }

    }

     toggleMembersVisibility() {
        this.iconName = this.iconName === 'utility:chevrondown' ? 'utility:chevronright' : 'utility:chevrondown';
        this.showMembers = !this.showMembers; // Toggle the boolean value

    }

    // handleIconclick() {
    //     console.log('handleIconclick called===', this.check);
    //     if (this.check == false) {
    //         this.check = true;
    //     } else {
    //         this.check = false;

    //     }
    // }

    // handleselect(e) {
    //     console.log(e.currentTarget.dataset.name);
    //     if (e.currentTarget.dataset.name == 'User') {
    //         this.icon = true;
    //         this.selectedType = 'User';
    //     } else {
    //         this.icon = false;
    //         this.selectedType = 'Group';
    //     }
    //     if (this.check == false) {
    //         this.check = true;
    //     } else {
    //         this.check = false;

    //     }
    // }

     handleClick(e) {
        console.log('OUTPUT handleClick called: ', e.target.value);
        console.log('OUTPUT handleClick called:this.selectedType ', this.selectedType);
        retreiveActiveAllUsersOrGroups({ searchkey: e.target.value, selectedType: this.selectedType })
            .then(result => {
                let users = result;
                this.userOptions = result;


                console.log('OUTPUT :this.userOptions ', this.userOptions);
            })
            .catch(error => {
                console.log('OUTPUT handleClick error: ', error);

            });
        console.log('OUTPUT handleClick called:this.userOptions ', this.userOptions);
    }

    handleChange(e) {
        console.log('OUTPUT this.searchValue1111111111111: ', e.target.value);
        if (e.target.value == '') {
            this.searchValue = e.target.value;
            this.userOptions = [];
        } else {
            this.searchValue = e.target.value;
        }
        console.log('OUTPUT this.searchValue: ', this.searchValue);
    }

     clickHandler(event) {
        this.showPillContainer = true;
        let recId = event.target.getAttribute('data-recid');
        console.log('OUTPUT clickHandler called : ', recId);
        if (recId == this.ownerId) {
            this.__showToast('Error', "Can't share file with the file owner.");
        }
        if (this.__validateDuplicate(recId) && recId != null && recId != 'undefined' && recId != this.ownerId) {

            this.__selectedUsersId.push(recId);
            console.log('OUTPUT this.__selectedUsersId: ', this.__selectedUsersId);
            if (this.__selectedUsersId.length > 0) {
                this.disableShare = false;
            }
            let selecteduser = this.userOptions.find((curritem) => curritem.Id == recId);
            let iconName = selecteduser.isUser ? 'standard:user' : 'standard:orders';
            let pill = {
                type: 'icon',
                label: selecteduser.Name,
                name: selecteduser.Id,
                IconName: iconName,
                fallbackIconName: iconName,
                variant: 'circle',
                alternativeText: selecteduser.Name


            };
            this.selectedUsers = [...this.selectedUsers, pill];
            console.log('OUTPUT this.selectedUsers: ', this.selectedUsers);
        }
        this.searchValue = '';
        this.userOptions = [];
    }

    handleItemRemove(event) {
        const index = event.detail.index;
        this.__selectedUsersId.splice(index, 1);
        this.selectedUsers.splice(index, 1);
        if (this.__selectedUsersId.length > 0) {
            this.disableShare = false;
        } else {
            this.disableShare = true;
        }
    }

    handleShare() {
        console.log('OUTPUT : handleShare called==', this.contentVersionId + '  this.__selectedUsersId ' + this.__selectedUsersId + '  this.selectedAccess    ' + this.selectedAccess);

        shareFileWithMultipleUsersOrGroups({
            contentVersionId: this.contentVersionId,
            userOrGroupIds: this.__selectedUsersId,
            accessLevel: this.selectedAccess
        })
            .then(() => {
                console.log('After then block');
                this.__selectedUsersId = [];
                this.selectedUsers = [];
                this.showPillContainer = false;
                this.disableShare = true;
                this.members = [];
                this.closesharemodalHandler();
                this.__showToast('Success', 'File shared successfully!');
                return refreshApex(this.wiredResult);
            })
            .catch(error => {
                console.log('OUTPUT :error.body.message== ', error);
                this.__showToast('Error', 'Invalid sharing type '+ this.selectedAccess +' for some selected people. Please remove them and try again.' );
            });

    }

    // Remove member
    removeMember(event) {
        console.log('OUTPUTevent.target.dataset.title : ', JSON.stringify(event.currentTarget.title));
        console.log('OUTPUTevent.target.dataset.id : ', JSON.stringify(event.currentTarget.dataset.id));
        const entityId = event.currentTarget.dataset.id;
        // Logic to remove the member from the list
        console.log('OUTPUT this.members11 cWMId: ', this.members);
        
        console.log('OUTPUT entityId: ', entityId);
        if(this.ownerId != entityId){
        removeFileAccess({ contentVersionId: this.contentVersionId, userOrGroupId: entityId })
            .then(() => {
                this.members = this.members.filter((member) => member.entityId !== entityId);
        console.log('OUTPUT this.members 22cWMId: ', this.members);
                // Show success message
                this.__showToast('Success', 'File access removed successfully.', 'success');
            })
            .catch(error => {
                console.log('OUTPUT :error.body.message== ', error);
                // Show error message
                this.__showToast('Error', "Can't remove document's owner access", 'error');
            });
        }else{
            this.__showToast('Error', "Can't remove document's owner access", 'error');
        }

       
    }

    handleAccessChange(event) {
        this.selectedAccess = event.detail.value;
    }

    handleUpdateAccess(event){
        console.log('OUTPUT : ',event.detail.value);
        console.log('OUTPUTevent.target.dataset.id : ', JSON.stringify(event.currentTarget.dataset.id));
        const entityId = event.currentTarget.dataset.id;
        updateFileAccessLevel({ 
                contentVersionId: this.contentVersionId, 
                userOrGroupId: entityId, 
                newAccessLevel: event.detail.value
            })
            .then(() => {
                this.__showToast('Success', 'File access level updated successfully.', 'success');
                return refreshApex(this.wiredResult);
            })
            .catch(error => {
                console.log('OUTPUT : error',error);
                this.__showToast('Error', 'User has insufficient permission for '+event.detail.value+' access.' , 'error');
            });
    }



    closesharemodalHandler(){

        this.searchValue = '';
        this.showdropdown = false;
        this.values = [];
        this.selectedvalues = [];
        this.members = [];
        this.selectedAccess = 'Viewer';
        this.check = false;
        this.icon = false;
        this.showSearchBar = true;
        this.showPillContainer = true;
        this.selectedUsers = [];
        this.userOptions = '';
        this.__selectedUsersId = [];
        this.disableShare = true;
        this.contentWorkspaceId = '';
        this.selectedType = 'User';
        const dataEvent = new CustomEvent('closesharemodal', {
                detail: false
            });
            this.dispatchEvent(dataEvent);
    }

    __validateDuplicate(selectedRecord) {
        let isvalid = true;
        let isrecordalreadyselected = this.selectedUsers.find((curritem) => curritem.name == selectedRecord);
        let isrecordalreadysharewithselecteduser = this.members.find((curritem) => curritem.entityId == selectedRecord);
        if (isrecordalreadyselected) {
            isvalid = false;
            this.__showToast('Error', 'User is already selected.');
        } else if (isrecordalreadysharewithselecteduser) {
            isvalid = false;
            this.__showToast('info', 'Can not select this entity, file is already shared with this.');
        } else {
            isvalid = true;
        }
        return isvalid;
    }

    __showToast(toastType, toastMessage) {
        const event = new ShowToastEvent({
            title: toastType + '!',
            message: toastMessage,
            variant: toastType.toLowerCase()
        });
        this.dispatchEvent(event);
    }

}