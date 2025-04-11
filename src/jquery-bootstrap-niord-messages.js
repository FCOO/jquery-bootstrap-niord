/****************************************************************************
	jquery-bootstrap-niord-messages.js,

	(c) 2018, FCOO

	https://github.com/FCOO/jquery-bootstrap-niord
	https://github.com/FCOO

****************************************************************************/

(function ($, i18next, window/*, document, undefined*/) {
	"use strict";

    //Create namespace
    window.Niord = window.Niord || {};
	var ns = window.Niord;


    function treeList2SelectList( treeList, level, resultList, firstItem ){
        level = level || 0;
        resultList = resultList || (firstItem ? [firstItem] : []);
        $.each(treeList, function(index, obj){
            var str = '';
            for (var i=0; i < level; i++)
                str = str + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';

            resultList.push({
                id       : obj.id,
                text     : [str, obj.name],
                textClass: level ? '' : ['','fw-bold'],
                _textStyle: ['', 'warning']
            });
            resultList = treeList2SelectList( obj.children, level+1, resultList );
        });
        return resultList;
    }

    /******************************************************
    Messages._selectFromTree
    ******************************************************/
/*
    ns.Messages.prototype._selectFromTree = function(id, onSelect, selectedId){
        var idUppercase = id.toUpperCase(),
            modalFormId = id+'ModalForm';

        this.selectFromTree_onSelect = onSelect;

        var modalForm = this[modalFormId] = this[modalFormId] || $.bsModalForm({
            header  : {icon: ns.options.partIcon[idUppercase], text:'niord:SELECT_'+idUppercase},
            footer  : '',
            scroll  : true,
            content : {
                type: 'selectlist',
                id  : 'tree',
                list: treeList2SelectList(this[id+'TreeList']),
            },
            show    : false,
            onSubmit: $.proxy(this._selectFromTree_onSelect, this),

        });
        modalForm.edit({tree: selectedId ? selectedId : -1});
    };

    ns.Messages.prototype._selectFromTree_onSelect = function( data ){
        this.selectFromTree_onSelect( data.tree );
    };
*/

    /******************************************************
    Messages.selectArea
    ******************************************************/
/*
    ns.Messages.prototype.selectArea = function(onSelect, selectedId){
        this._selectFromTree('area', onSelect, selectedId);
    };
*/

    /******************************************************
    Messages.selectCategory
    ******************************************************/
/*
    ns.Messages.prototype.selectCategory = function(onSelect, selectedId){
        this._selectFromTree('category', onSelect, selectedId);
    };
*/

    /******************************************************
    Messages.tableColumns
    ******************************************************/
    ns.Messages.prototype.tableColumns = function(small){
        return small ?
            [{
                id: 'id', noWrap: false, header: 'No shown', createContent: $.proxy(this._createTableCellContent, this),
                sortable: true, sortBy: $.proxy(this._sortMessage, this)
            }] :
            [
                { id: 'icon',    noWrap: false,  header: '&nbsp;',                 align: 'center', width:'2em' },
                { id: 'shortId', noWrap: true,   header: 'Id',                     align: 'center' },
                { id: 'date',    noWrap: true,   header: {da:'Dato', en:'Date'},   align: 'center', vfFormat: ns.options.vfFormatId.date, sortable: true, sortBy:'moment_date', sortDefault: true/*'desc'*/},
                { id: 'area',    noWrap: false,  header: {text:'niord:AREA'},      align: 'left',
                    //Options for sorting by area
                    sortable: true,
                    sortHeader: true,
                    _sortIndex:1000,
                    updateAfterSorting: true,

                    //Sort by full area-title
                    getSortContent: function(content){ return content.full; },

                    //Display only sub-area when list is sorted by area
                    createContent: function(content, $td, sortBy){
                        $td._bsAddHtml(sortBy ? content.sub : content.full);
                    },

                    //Use default area-title as header for sorted groups
                    getHeaderContent: function(content){ return content.normal; },
                    createHeaderContent: function(content, $span){ $span._bsAddHtml(content); },
                },
                { id: 'title',   noWrap: false,  header: {da:'Titel', en:'Title'}, align: 'left',   _sortable: true, _sortHeader: true, _sortIndex:1000}
            ];
    };


    /******************************************************
    Messages.asModal
    Will display a list of all messages as
    1: One column with all info, or
    2: Four columns with id, date, area, and title
    ******************************************************/
    ns.Messages.prototype.asModal = function(){
        var _this = this,
            forceFilterDomain = this.forceFilterDomain,
            forceFilter       = this.forceFilter || {};

        this.forceFilterDomain = null;
        this.forceFilter       = null;

        //Close any message-modal
        if (this.bsModalMessage)
            this.bsModalMessage.close();

        if (!this.bsModal){
            //Check screen size and select between small and normal size table
            var displayInSmallTable = ns.options.isSet('smallTableWithAllMessages');

            this.bsTableOptions = {
                verticalBorder   : true,
                selectable       : true,
                allowZeroSelected: false,
                allowReselect    : true,
                showHeader       : !displayInSmallTable,                    
                onChange         : $.proxy(this.messageAsModal, this ),
                columns          : this.tableColumns(displayInSmallTable)
                    
            };

            //Create table and add data
            this.bsTable = $.bsTable(this.bsTableOptions);
            $.each(this.messages, function(id, message){
                _this.bsTable.addRow( message.asTableRow() );
            });

            var buttons = [];
            if (ns.publications)
                buttons.push( ns.publications._showAllButtonOptions() );
            buttons.push(
                {icon: ns.options.resetFilterIcon, text:{da:'Nulstil', en:'Reset'}, onClick: $.proxy(this.resetFilter, this)},
                {icon: ns.options.filterIcon,      text:{da:'Filter', en:'Filter'}, onClick: $.proxy(this.filterAsModalForm, this)}
            );

            const modalInFullScreen = ns.options.isSet('modalInFullScreen');
            var bsModalOptions = {
                header     : '',
                buttons    : buttons,

                extraWidth          : !modalInFullScreen,
                fullScreenWithBorder: modalInFullScreen,
                allowFullScreen     : !modalInFullScreen,                             

                static     : true,
                show       : false,
                footer     : {text: '&nbsp;'}
            };

            if (displayInSmallTable){
                //Change padding in fixed-content. It will be used for selectbox with "sort by.."
                bsModalOptions.fixedContentOptions = {
                    noVerticalPadding  : false,
                    noHorizontalPadding: false
                };
            }

            //Create the modal
            this.bsModal = this.bsTable.asModal( bsModalOptions );
            this.$bsModalHeader = this.bsModal.bsModal.$header;
            this.$bsModalFooter = this.bsModal.bsModal.$footer;

            //In small-mode: Hide first column and hide table header and add selectbox with sorting options
            if (displayInSmallTable){
                $.bsSelectBox({
                    fullWidth : true,
                    selectedId: this.sortBsTableBy || 'sort_date_desc',
                    onChange  : $.proxy(this._sortBsTable, this),
                    items     : [
                        {id:'sort_date_asc',   icon: 'fa-sort-numeric-down',   text: {da: 'Sorter efter DATO (ældste først)', en:'Sort by DATE (oldest first)'}},
                        {id:'sort_date_desc',  icon: 'fa-sort-numeric-up-alt', text: {da: 'Sorter efter DATO (nyeste først)', en:'Sort by DATE (newest first)'}},
                        {id:'sort_area_asc',   icon: 'fa-sort-alpha-down',     text: {da: 'Sorter efter OMRÅDE (a - z)', en:'Sort by AREA (a - z)'}},
                        {id:'sort_area_desc',  icon: 'fa-sort-alpha-up-alt',   text: {da: 'Sorter efter OMRÅDE (z - a)', en:'Sort by AREA (z - a)'}},
                    ]
                }).appendTo(this.bsModal.bsModal.$fixedContent);
            }
        }

        //If forceFilterDomain is set => Filter by domain
        if (forceFilterDomain){
            var filterDomainId = 'ALL';
            getDomainIdList().forEach( id => {
                if ( id.toUpperCase().includes(forceFilterDomain.toUpperCase()) )
                    filterDomainId = id;
            });
            forceFilter = {
                domainId: filterDomainId,
                area    : 'ALL',
                chart   : 'ALL',
                category: 'ALL'
            };
        }

        this.filter(forceFilter);

        //Display the modal with the table
        this.bsModal.show();
        return this;
    };

    /******************************************************
    Messages._showAllButtonOptions
    ******************************************************/
    ns.Messages.prototype._showAllButtonOptions = function(){
        return {
            icon   : 'fa-th-list',
            text   : {da:'Vis alle', en:'Show all'},
            class  : 'min-width-5em',
            onClick: ns.asModal( this )
        };
    };

    /******************************************************
    Messages._createTableCellContent
    ******************************************************/
    ns.Messages.prototype._createTableCellContent = function(id, $element){
        var tableRows = this.getMessage(id).asTableRow();
        $element
            ._bsAddHtml({text: tableRows.shortId})
            ._bsAddHtml('&nbsp;-&nbsp;')
            ._bsAddHtml({vfFormat: ns.options.vfFormatId.date, vfValue: tableRows.date})
            .append('<br>')
            ._bsAddHtml(tableRows.area.full)
            .append('<br>')
            ._bsAddHtml({text: tableRows.title, textClass:'fw-bold'});
    },

    /******************************************************
    Messages._sortBsTable
    ******************************************************/
    ns.Messages.prototype._sortBsTable = function(id){
        //id = sort_SORTBY_DIR
        this.sortBsTableBy = id;
        var ids = id.split('_'),
            dir = ids[2];
        this._sortBsTableBy = ids[1];

        this.bsTable.sortBy(0, dir);
    };


    /******************************************************
    Messages._sortMessage
    ******************************************************/
    ns.Messages.prototype._sortMessage = function(id1, id2){
        var message1 = this.getMessage(id1),
            message2 = this.getMessage(id2),
            result;

        switch (this._sortBsTableBy){
            case 'date': result = message1.publishDateFrom - message2.publishDateFrom; break;
            case 'area': result = message1.areaTitle[i18next.language].localeCompare(message2.areaTitle[i18next.language]); break;
            default    : result = 0;
        }
        return result;
    };


    /******************************************************
    Messages.messageAsModal
    ******************************************************/
    ns.Messages.prototype.messageAsModal = function(id){
        this.getMessage(id, function( message ){
            message.asModal();
        });
    };


    /******************************************************
    Messages.filterAsModalForm
    Edit a filter-record = {domainId, area, chart, category}
    ******************************************************/
    function getDomainIdList(){
        return ns.options.fa_fe_combined ? ['nw', 'nm', 'fa-fe'] : ['nw', 'nm', 'fe', 'fa'];
    }

    ns.Messages.prototype.filterAsModalForm = function(){

        if (!this.filterBsModalForm){

            var modalEditOptions = {
                    header: {
                        icon: ns.options.filterIcon,
                        text: {da:'Filter', en:'Filter'},
                    },
                    closeWithoutWarning: true,
                    buttons:[{
                        icon   : ns.options.resetFilterIcon,
                        text   : {da:'Nulstil', en:'Reset'},
                        onClick: $.proxy( function(){
                                     this.filterBsModalForm.setValues({
                                         domainId: 'ALL',
                                         area    : 'ALL',
                                         chart   : 'ALL',
                                         category: 'ALL'
                                     });
                                 }, this )
                    }],
                    onSubmit: $.proxy(this.filter, this),
                    scroll  : false,
                    content : []
                },
            defaultSelectItem = function(){
                return {id:'ALL', text:{da:'** ALLE **', en:'** ALL **'}};
            };

            //Selectbox with domainId
            var domainOptions = {
                id       : 'domainId',
                type     : 'selectbutton',
                label    : {da:'Type', en:'Type'},
                fullWidth: true,
                items    : [defaultSelectItem()]
            };

            getDomainIdList().forEach( id => {
                domainOptions.items.push({
                    id  : id,
                    text: 'niord:'+id+'_plural'
                });
            });
            modalEditOptions.content.push(domainOptions);


            //Selectbox with area, chart, category
            modalEditOptions.content.push({
                id       : 'area',
                type     : 'selectbutton',
                label    : 'niord:AREA',
                fullWidth: true,
                items    : treeList2SelectList(this.areaTreeList, 0, null, defaultSelectItem()),
            });

            //Selectbox with chart
            var allCharts  = {},
                chartItems = [defaultSelectItem()];
            $.each(this.childList, function(index, message){ $.extend(allCharts, message.charts); });
            $.each(allCharts, function(id, chart){
                chartItems.push({
                    id  : chart.id,
                    text: chart.chartNumber + (chart.internationalNumber ? ' (INT' + chart.internationalNumber + ')' : '')
                });
            });

            modalEditOptions.content.push({
                id       : 'chart',
                type     : 'selectbutton',
                label    : 'niord:CHART',
                fullWidth: true,
                items    : chartItems,
            });

            //Selectbox with category
            modalEditOptions.content.push({
                id       : 'category',
                type     : 'selectbutton',
                label    : 'niord:CATEGORY',
                fullWidth: true,
                items    : treeList2SelectList(this.categoryTreeList, 0, null, defaultSelectItem()),
            });


            this.filterBsModalForm =  $.bsModalForm(modalEditOptions);
        }

        var filterOptions = this.filterOptions || {};
        $.each(['domainId', 'area', 'chart', 'category'], function(index, id){
            filterOptions[id] = filterOptions[id] || 'ALL';
        });

        this.filterBsModalForm.edit(filterOptions);
    };

    /******************************************************
    Messages._updateFilterInfo
    ******************************************************/
    ns.Messages.prototype._updateFilterInfo = function(){
        function hasValue(value){ return (value && (value != 'ALL')); }

        var _this         = this,
            textArray     = [{icon: ns.options.filterIcon}],
            filterOptions = this.filterOptions,
            filterExist   = false;

        $.each(this.filterOptions, function(id, value){
           if (hasValue(value)){
                filterExist = true;
                var valueObj = null,
                    prefix   = null,
                    postfix  = null;
                switch (id){
                    case 'domainId':
                        valueObj = {text: 'niord:'+value+'_plural'};
                        if (hasValue(filterOptions.area) || hasValue(filterOptions.chart))
                            postfix = {da:'i', en:'in'};

                        break;
                    case 'area'    :
                        valueObj = _this.getArea(value).bsObject();
                        if (hasValue(filterOptions.chart))
                            postfix = '/';

                        break;
                    case 'chart'   :
                        prefix = 'niord:CHART';
                        valueObj = _this.getChart(value).bsObject();

                        break;
                    case 'category':
                        if (hasValue(filterOptions.domainId) || hasValue(filterOptions.area) || hasValue(filterOptions.chart))
                            prefix = {da:'. Kategori:', en:'. Category:'};
                        else
                            prefix = {da:'Kategori:', en:'Category:'};

                        valueObj = _this.getCategory(value).bsObject();

                        break;
                }
                if (prefix)
                    textArray.push(prefix);
                textArray.push(valueObj);
                if (postfix)
                    textArray.push(postfix);
           }
        });

        //Update footer and header with filter-info
        this.$bsModalFooter
            .empty()
            ._bsAddHtml(filterExist ? textArray : '&nbsp;');

        //Find icon for header
        var headerIcon = '';
        $.each(this.filterOptions, function(id, value){
            if (headerIcon || (value == 'ALL'))
                return;
            switch (id){
                case 'domainId': headerIcon = ns.options.domainIcon[value] || '__TAKEN__'; break;
                case 'area'    : headerIcon = ns.options.partIcon.AREA     || '__TAKEN__'; break;
                case 'chart'   : headerIcon = ns.options.partIcon.CHART    || '__TAKEN__'; break;
                case 'category': headerIcon = ns.options.partIcon.CATEGORY || '__TAKEN__'; break;
            }
        });

        if (textArray.length)
            textArray[0] = headerIcon && (headerIcon != '__TAKEN__') ? {icon: headerIcon} : '';

        var $headerIconContainer = $( this.$bsModalHeader.find('.header-icon-container') ).detach();
        this.$bsModalHeader
            .empty()
            ._bsAddHtml(filterExist ? textArray : '&nbsp;')
            .append( $headerIconContainer );
    };

    /******************************************************
    Messages.filter
    ******************************************************/
    ns.Messages.prototype.filter = function(filterOptions){
        this.filterOptions = filterOptions;

        var _this = this;
        if (this.bsTable)
            this.bsTable.filterTable(function(rowData, id){
                var message = _this.getMessage(rowData.id || id);
                return message ? message.filter(_this.filterOptions) : false;
            });

        this._updateFilterInfo();
    };

    /******************************************************
    Messages.resetFilter
    ******************************************************/
    ns.Messages.prototype.resetFilter = function(){
        this.filterOptions = null;
        this._updateFilterInfo();
        if (this.bsTable)
            this.bsTable.resetFilterTable();
    };

} (jQuery, this.i18next, this, document));