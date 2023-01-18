<template>
    <div>
        <heading class="mb-6">Unmatched Milestones</heading>

        <loader v-if="gettingRows" class="my-3 bg-40"></loader>

        <card class="flex flex-col justify-center" v-if="files.length > 0">
            <div>
                <div class="flex border-b border-40">
                    <div class="py-6 px-8">
                        <label class="inline-block text-80 pt-2 leading-tight" for="filename">Filter by filename</label>
                    </div>
                    <div class="py-6 px-8 w-1/2">
                        <select class="form-control form-select mb-3 w-full" name="filename" id="filename" @change="getRows()" v-model="fileFilter">
                            <option value="" disabled="disabled" :selected="fileFilter === null">Choose File</option>
                            <option v-bind:value="file.Filename" v-for="file in files" :selected="fileFilter === file.Filename">{{ file.Filename }}</option>
                        </select>
                    </div>
                    <div class="py-6 px-8">
                        <button
                            type="button"
                            @click.prevent="resetFilter"
                            class="btn text-80 font-normal h-9 px-3 mr-3 btn-link"
                        >
                            {{__('Clear')}}
                        </button>
                    </div>
                </div>
            </div>

            <div class="overflow-x-auto" v-if="!gettingRows && rows.length > 0">
                <table class="table w-full">
                    <thead>
                    <tr>
                        <th v-for="field in fields" class="text-left">{{ field }}</th>
                        <th>&nbsp;</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="row in rows">
                        <td v-for="field in fields">
                            <span class="whitespace-no-wrap text-left">{{ row[field] }}</span>
                        </td>
                        <td>
                            <button class="btn btn-default btn-primary" @click="startMatch(row)" type="button">Match</button>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </card>

        <div v-if="!gettingRows && rows.length === 0" class="flex flex-col justify-center">
            <p class="bg-primary p-3 text-20 mt-3">There are no rows to match.</p>
        </div>

        <portal to="modals">
            <transition name="modal" v-if="showModal">
                <modal>

                    <form @submit.prevent class="bg-white rounded-lg shadow-lg overflow-hidden"
                          autocomplete="off"
                          @keydown="handleKeydown"
                          @submit.prevent.stop="match"
                    >
                        <heading :level="2" class="pt-8 px-8">Search to match an address
                        </heading>
                        <div class="px-8 py-3">
                            <div class="overflow-x-auto">
                                <table class="table w-full">
                                    <thead>
                                    <tr>
                                        <th v-for="field in fields" class="text-left">{{ field }}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <tr>
                                        <td v-for="field in fields">
                                            <span class="whitespace-no-wrap text-left">{{ selectedRow[field] }}</span>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="px-8 py-3">
                            <div class="flex">
                                <input type="text" title="search" v-model="searchTerm" placeholder="Search for address" class="w-full form-control form-input form-input-bordered flex-auto">
                                <button
                                    :disabled="working || searchTerm.length === 0"
                                    type="button"
                                    class="btn btn-default btn-primary ml-3"
                                    v-bind:class="{ 'btn-disabled': searching || searchTerm.length === 0}"
                                    @click="search"
                                >Search
                                </button>
                            </div>
                            <loader v-if="searching" width="30" class="my-3"></loader>
                            <div style="max-height: 200px; overflow-y: auto" class="my-3">
                                <div v-for="result in searchResults" v-bind:class="{ 'bg-40 shadow-md': matchedAddress && result.id === matchedAddress.id}" class="p-3" @click="setMatch(result)">
                                    <span>{{ result.full_address }}</span>
                                </div>
                                <p v-if="searchResults.length === 0" class="bg-primary p-3 text-20">
                                    There are no results, please check your search term and try again, or flag as unmatchable.
                                </p>
                            </div>
                        </div>
                        <div class="px-8 py-3 flex justify-end">
                            <button
                                dusk="cancel-action-button"
                                type="button"
                                @click.prevent="handleClose"
                                class="btn text-80 font-normal h-9 px-3 mr-3 btn-link"
                            >
                                {{__('Cancel')}}
                            </button>
                            <button
                                dusk="confirm-action-button"
                                :disabled="working || matchedAddress == null"
                                type="submit"
                                class="btn btn-default btn-primary"
                                v-bind:class="{ 'btn-disabled': working || matchedAddress == null}"
                            >
                                <loader v-if="working" width="30"></loader>
                                <span v-else>Match</span>
                            </button>
                        </div>
                        <hr>
                        <div class="px-8 py-6 bg-30">

                            <p class="mb-4">If you can't find an address to match against you can flag this row as unmatched so it will be hidden from this view.</p>
                            <button
                                type="button"
                                @click.prevent="noMatch"
                                class="btn font-normal h-9 px-3 mr-3 btn-danger rounded-lg"
                            >
                                {{__('Can\'t Match')}}
                            </button>
                        </div>
                    </form>

                </modal>
            </transition>

            <transition name="modal" v-if="showUnMatchModal">
                <modal>
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden w-action">
                        <div>
                            <heading :level="2" class="pt-8 px-8">Flag as unmatchable?</heading>

                            <p class="text-80 px-8 my-8">
                                {{__('Are you sure you want to flag this row as unmatchable?')}}
                            </p>

                            <div class="bg-30 px-6 py-3 flex">
                                <div class="flex items-center ml-auto">
                                    <button
                                        dusk="cancel-action-button"
                                        type="button"
                                        @click.prevent="handleCloseUnMatch"
                                        class="btn text-80 font-normal h-9 px-3 mr-3 btn-link"
                                    >
                                        {{__('Cancel')}}
                                    </button>

                                    <button
                                        dusk="confirm-action-button"
                                        :disabled="working"
                                        type="button"
                                        class="btn btn-default btn-danger"
                                        @click="unmatched"
                                    >
                                        <loader v-if="working" width="30"></loader>
                                        <span v-else>{{__('Flag as unmatchable')}}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </modal>
            </transition>
        </portal>


    </div>
</template>

<script>
    export default {
        data: () => ({
            rows: [],
            errors: [],
            fields: [
                'Address1',
                'Address2',
                'Address3',
                'Address4',
                'Address5',
                'Postcode',
                'MilestoneType',
                'Filename'
            ],
            showModal: false,
            searchResults: [],
            searchTerm: '',
            matchedAddress: null,
            selectedRow: null,
            working: false,
            searching: false,
            showUnMatchModal: false,
            gettingRows: true,
            gettingFiles: true,
            files: [],
            fileFilter: null
        }),
        mounted() {
            this.getRows();
            this.getFiles();
        },
        methods: {
            getRows() {
                this.gettingRows = true;
                let url = '/nova-vendor/unmatched-milestones';
                if (this.fileFilter && this.fileFilter !== '') {
                    url += '?file_name=' + this.fileFilter;
                }
                Nova.request().get(url)
                    .then(response => {
                        this.rows = response.data;
                        this.gettingRows = false;
                    })
                    .catch(error => {
                        console.error(error.response.message);
                        this.gettingRows = false;
                        this.$toasted.show(error.response.message, {type: 'error'});
                    });
            },
            resetFilter() {
                this.fileFilter = null;
                this.getRows();
            },
            getFiles() {
                this.gettingRows = true;
                Nova.request().get('/nova-vendor/unmatched-milestones/files')
                    .then(response => {
                        this.files = response.data;
                        this.gettingFiles = false;
                    })
                    .catch(error => {
                        console.error(error.response.message);
                        console.error(Object.keys(error));
                        this.gettingFiles = false;
                        this.$toasted.show(error.response.message, {type: 'error'});
                    });
            },
            startMatch(row) {
                this.showModal = true;
                this.searchTerm = row['Address1'] + ' ' + row['Postcode'];
                this.selectedRow = row;
                this.searchResults = [];
                this.search();
            },
            search() {
                this.debouncer(() => {
                    this.searching = true;
                    Nova.request().get('/nova-vendor/unmatched-milestones/address/match?search=' + this.searchTerm)
                        .then(response => {
                            this.searchResults = response.data;
                            this.searching = false;
                        })
                        .catch(error => console.error(error));
                });
            },
            setMatch(address) {
                this.matchedAddress = address;
            },
            match() {
                this.working = true;
                Nova.request().put('/nova-vendor/unmatched-milestones/document/' + this.selectedRow.id, {address_id: this.matchedAddress.id})
                    .then(response => {
                        this.$toasted.show('Match Complete!', {type: 'success'});
                        this.getRows();
                        this.working = false;
                        this.handleClose();
                    })
                    .catch(error => {
                        console.error(error.response);
                        console.error(error.response.data.message);
                        this.working = false;
                        this.$toasted.show(error.response.data.message, {type: 'error'});
                    })
            },
            noMatch() {
                this.showModal = false;
                this.showUnMatchModal = true;
            },
            unmatched() {
                this.working = true;
                Nova.request().put('/nova-vendor/unmatched-milestones/document/' + this.selectedRow.id + '/no-match')
                    .then(response => {
                        this.$toasted.show('Flagged as unmatchable', {type: 'success'});
                        this.getRows();
                        this.working = false;
                        this.handleClose();
                        this.showUnMatchModal = false;
                    })
                    .catch(error => {
                        console.error(error.response);
                        console.error(error.response.data.message);
                        this.working = false;
                        this.$toasted.show(error.response.data.message, {type: 'error'});
                    })
            },
            handleCloseUnMatch() {
                this.showUnMatchModal = false;
                this.showModal = true;
            },
            /**
             * Close the modal.
             */
            handleClose() {
                this.showModal = false;
                this.searchResults = [];
                this.selectedRow = null;
                this.matchedAddress = null;
                this.searchTerm = '';
            },
            /**
             * Stop propogation of input events unless it's for an escape or enter keypress
             */
            handleKeydown(e) {
                if (['Escape', 'Enter'].indexOf(e.key) !== -1) {
                    return
                }

                e.stopPropagation()
            },
            debouncer: _.debounce(callback => callback(), 500),
        },
    }
</script>

<style>

</style>
