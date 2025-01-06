import { LightningElement, wire, api, track } from 'lwc';
import getLibraryMembers from '@salesforce/apex/LibraryManageMemberController.getLibraryMembers';
import getLibraryInfo from '@salesforce/apex/LibraryManageMemberController.getLibraryInfo';
import deleteContentWorkspaceMember from '@salesforce/apex/LibraryManageMemberController.deleteContentWorkspaceMember';
import retreiveActiveUsersOrGroups from '@salesforce/apex/LibraryManageMemberController.retreiveActiveUsersOrGroups';
import retreiveActiveAllUsersOrGroups from '@salesforce/apex/LibraryManageMemberController.retreiveActiveAllUsersOrGroups';
import shareContentWorkspace from '@salesforce/apex/LibraryManageMemberController.shareContentWorkspace';
import updateMemberRole from '@salesforce/apex/LibraryManageMemberController.updateMemberRole';
import { refreshApex } from '@salesforce/apex';
import Id from "@salesforce/user/Id";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
export default class LibraryManageMember extends NavigationMixin(LightningElement) {

    @api contentWorkspaceId;
    // @api isModalOpen = false;
    @track searchValue = '';
    @track showdropdown = false;
    @track values = [];
    @track selectedvalues = [];
    @track members = [];
    @track selectedAccess = 'Viewer';
    @track check = false;
    @track icon = false;
    showSearchBar = true;
    // showPillContainer = true;
    showPillContainer = false;
    selectedUsers = [];
    userOptions = '';
    __selectedUsersId = [];
    disableAdd = true;
    userId = Id;
    ownerId = '';
    selectedType = 'Group';
    libraryName = '';
    wiredResult;

    accessOptions = [
        { label: 'Viewer', value: 'Viewer' },
        { label: 'Author', value: 'Author' },
        { label: 'Library Administrator', value: 'Admin' }
    ];

    @wire(getLibraryInfo, { contentWorkspaceId: '$contentWorkspaceId' })
    wiredLibrary({ error, data }) {
        if (data) {
            this.libraryName = data.Name;
            this.ownerId = data.CreatedById;
            
        } else if (error) {
            console.log('OUTPUT this.error: ', error);

        }
    }

    @wire(getLibraryMembers, { contentWorkspaceId: '$contentWorkspaceId' })
    wiredMembers(result) {
        console.log('Wire method called getLibraryMembers');
        this.wiredResult = result;

        // const { data, error } = result;
        if (result.data) {
            this.members = result.data;  // Handle the data response
            console.log('OUTPUT :this.members fro wire== ', this.members);
        }

    }

    // Open Modal
    openModal() {
        console.log('OUTPUT : openModal called ');
        this.isModalOpen = true;
        //this.loadAllMembers();
        console.log('content workspace id in managemember =-> ', this.contentWorkspaceId);
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

        
        if (searchInput && userOptionsList) {
        // Check if the click was outside the search input and the user options list
        if (!searchInput.contains(event.target) && !userOptionsList.contains(event.target)) {
            this.userOptions = []; // Clear userOptions when clicking outside
        }
    } else {
        console.log('One of the elements (searchInput or userOptionsList) is null.');
    }

    }


    clickHandler(event) {
        this.showPillContainer = true;
        let recId = event.target.getAttribute('data-recid');
        console.log('OUTPUT clickHandler called : ', recId);
        if (recId == this.ownerId) {
            this.__showToast('Error', "Can't share library with the library owner.");
        }
        if (this.__validateDuplicate(recId) && recId != null && recId != 'undefined' && recId != this.ownerId) {

            this.__selectedUsersId.push(recId);
            console.log('OUTPUT this.__selectedUsersId: ', this.__selectedUsersId);
            if (this.__selectedUsersId.length > 0) {
                this.disableAdd = false;
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
            this.disableAdd = false;
        } else {
            this.disableAdd = true;
        }
    }

    handleIconclick() {
        console.log('handleIconclick called===', this.check);
        if (this.check == false) {
            this.check = true;
        } else {
            this.check = false;

        }
    }

    handleselect(e) {
        console.log(e.currentTarget.dataset.name);
        if (e.currentTarget.dataset.name == 'User') {
            this.icon = true;
            this.selectedType = 'User';
        } else {
            this.icon = false;
            this.selectedType = 'Group';
        }
        if (this.check == false) {
            this.check = true;
        } else {
            this.check = false;

        }
    }

    handleMainDivClick() {
        this.showSearchBar = true;
        // this.showPillContainer = true;
        // this.showPillContainer = false;

    }


    // Close Modal
    closeModal() {
        console.log('close modal called');
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
        this.disableAdd = true;
        this.contentWorkspaceId = '';
        this.selectedType = 'Group';
        // this.isModalOpen = false;
        const dataEvent = new CustomEvent('closemanagemembermodal', {
                detail: false
            });
            this.dispatchEvent(dataEvent);
    }

    get showPillContainer() {
        return this.selectedUsers.length > 0 ? true : false;
    }


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


    // Add Member when 'Add' button is clicked
    addMember() {

        console.log('OUTPUT : addMember called==', this.contentWorkspaceId + '  this.__selectedUsersId ' + this.__selectedUsersId + '  this.selectedAccess    ' + this.selectedAccess);
        shareContentWorkspace({
            contentWorkspaceId: this.contentWorkspaceId,
            memberIds: this.__selectedUsersId,
            permissionType: this.selectedAccess
        })
            .then(() => {
                console.log('After then block');
                this.__selectedUsersId = [];
                this.selectedUsers = [];
                this.showPillContainer = false;
                this.disableAdd = true;
                this.members = [];

                this.__showToast('Success', 'Content Workspace shared successfully!');
                return refreshApex(this.wiredResult);
            })
            .catch(error => {
                console.log('OUTPUT :error.body.message== ', error.body.message);
                this.__showToast('Error', 'Failed to share workspace: ' + error.body.message);
            });

    }


    // Handle member role change
    handleMemberRoleChange(event) {
        console.log('OUTPUT handleMemberRoleChange called: ', event.detail.value);
        console.log('OUTPUT handleMemberRoleChange called cWMId: ', event.currentTarget.dataset.id);
        const newRole = event.detail.value;

        const cWMId = event.currentTarget.dataset.id;

        const memberIndex = this.members.findIndex(member => member.cWMId === cWMId);
        // if (memberIndex !== -1) {
        //     this.members[memberIndex].memberRole = newRole;  // Update the role locally

        // Call Apex method to update the role on the server
        updateMemberRole({
            contentWorkspaceMemberId: cWMId,
            newRole: newRole
        })
            .then(() => {
                console.log('Role updated successfully for member: ' + cWMId);
                // Optionally show a toast notification here
                this.__showToast('Success', 'Member access updated successfully!');
                return refreshApex(this.wiredResult);
            })
            .catch(error => {
                console.error('Error updating role:', error);
                // Handle error, e.g., by showing a toast notification
            });
        //}
    }

    // Remove member
    removeMember(event) {
        console.log('OUTPUTevent.target.dataset.title : ', JSON.stringify(event.currentTarget.title));
        console.log('OUTPUTevent.target.dataset.id : ', JSON.stringify(event.currentTarget.dataset.id));
        const cWMId = event.currentTarget.dataset.id;
        const memberId = event.currentTarget.dataset.memberid;
        // Logic to remove the member from the list
        console.log('OUTPUT this.members11 cWMId: ', this.members);
        console.log('OUTPUT cWMId: ', cWMId);
        console.log('OUTPUT memberId: ', memberId);
        console.log('OUTPUT this.ownerId: ', this.ownerId);
        if(this.ownerId != memberId){
        deleteContentWorkspaceMember({ contentWorkspaceMemberId: cWMId })
            .then(() => {
                this.members = this.members.filter((member) => member.cWMId !== cWMId);
        console.log('OUTPUT this.members 22cWMId: ', this.members);
                this.__showToast('Success', 'Member access revoked successfully!');

            })
            .catch((error) => {
                this.__showToast('Error', error.body.message);
            });
             }else{
            this.__showToast('Error', "Can't remove library's owner access", 'error');
        }
    }

    // Handle Access Level change
    handleAccessChange(event) {
        this.selectedAccess = event.detail.value;
    }

    __validateDuplicate(selectedRecord) {
        let isvalid = true;
        let isrecordalreadyselected = this.selectedUsers.find((curritem) => curritem.name == selectedRecord);
        let isrecordalreadysharewithselecteduser = this.members.find((curritem) => curritem.memberId == selectedRecord);
        if (isrecordalreadyselected) {
            isvalid = false;
            this.__showToast('Error', 'User is already selected.');
        } else if (isrecordalreadysharewithselecteduser) {
            isvalid = false;
            this.__showToast('info', 'Can not select this entity, Library is already shared with this.');
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