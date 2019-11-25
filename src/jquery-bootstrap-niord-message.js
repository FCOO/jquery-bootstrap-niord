/****************************************************************************
	jquery-bootstrap-niord-message.js,

	(c) 2018, FCOO

	https://github.com/FCOO/jquery-bootstrap-niord
	https://github.com/FCOO

    Extend window.Niord.message with

    size can one of:
        "XSMALL":
        "SMALL" :
        "NORMAL":
        "LARGE" :

****************************************************************************/

(function ($, i18next, window/*, document, undefined*/) {
	"use strict";
    //Create namespace
    window.Niord = window.Niord || {};
	var ns = window.Niord;

    //Extend Niord.options
    ns.options = $.extend( true, {

        //domainIcon = options for icon for popup and modal header for each domain
        domainIcon: {

        },


        //partIcon = Font-awesome icon for header of the different parts
        partIcon: {
            MAP        : 'fa-map-marker',
            REFERENCE  : 'fa-link',
            CATEGORY   : 'fa-folder',
            TIME       : 'fa-clock',
            DETAILS    : 'fa-info',
            PROHIBITION: 'fa-times',
            SIGNALS    : 'fa-volume-up',
            NOTE       : 'far fa-sticky-note',
            ATTACHMENT : 'fa-paperclip',
            AREA       : 'far fa-square',
            CHART      : 'fa-map',
            PUBLICATION: 'fa-book-open',
            SOURCE     : 'fa-copyright'
        },

        //partFooter = Footer to the different parts
        partFooter: {
            //TIME       : {icon:'fa-clock', text:'Godt'}
        },

        //modalFooter = Footer in modal
        modalFooter     : null,
        modalSmallFooter: null,

        //vfFormatId = id for the format to use for date, time and position (latLng) when using the jquery-value-format
        vfFormatId: {
            time        : '', //Typical "16:00" in selected timezone
            date        : '', //Typical "24. Dec 2018" in selected timezone
            date_weekday: '', //Typical "Monday 24. Dec 2018" in selected timezone
            date_long   : '', //Typical "24. December 2018" in selected timezone
            latLng      : ''  //A la N12&deg;34'56" E12&deg;34'56"
        },


        openNewModal         : true,  //Boolean or function. If true a "new"-icon in small-modal will open a new modal. Typical used if small modals are use as popups and the screen is widther
        normalModalExtendable: false, //Boolean or function. If true the mormal modal can extend to a version with map and inlined attachments. Typical on desktops


        createMap: null, //function($element, message, options): function to create a map inside $element and displaying the message.geoJSON

        isSet: function( id ){
            var value = ns.options[id];
            return !!value && ($.isFunction(value) ? value() : !!value);
        }

    }, ns.options || {} );

    //Translate the different domains and part headers
    i18next.addPhrases('niord', {
        'nw'         : {da:'Navigationsadvarsel',            en:'Navigational Warning'   }, //domain = niord-nw: All Danish navigational warnings are produced in the "niord-nw" domain.
        'nw_plural'  : {da:'Navigationsadvarsler',           en:'Navigational Warnings'  },
        'nm'         : {da:'Efterretning for Søfarende',     en:'Notice to Mariners'     }, //domain = niord-nm: All Danish Notices to Mariners are produced in the "niord-nm" domain.
        'nm_plural'  : {da:'Efterretninger for Søfarende',   en:'Notices to Mariners'    },
        'fa'         : {da:'Skydeområde',                    en:'Firing Area'            }, //domain = niord-fa: All Danish firing areas are defined as miscellaneous Notices to Mariners in the "niord-fa" domain.
        'fa_plural'  : {da:'Skydeområder',                   en:'Firing Areas'           },
        'fe'         : {da:'Skydeøvelse',                    en:'Firing Exercise'        }, //domain = niord-fe: The actual firing exercises are maintained as local navigational warnings in the "niord-fe" domain.
        'fe_plural'  : {da:'Skydeøvelser',                   en:'Firing Exercises'       },

        'MAP'        : {da: 'Kort',          en:'Map'          },
        'REFERENCE'  : {da: 'Referencer',    en:'References'   },
        'reference'  : {da: 'Referencer',    en:'References'   },
        'CATEGORY'   : {da: 'Kategorier',    en:'Categories'   },
        'TIME'       : {da: 'Tid',           en:'Time'         } ,
        'DETAILS'    : {da: 'Detaljer',      en:'Details'      },
        'PROHIBITION': {da: 'Forbud',        en:'Prohibition'  },
        'SIGNALS'    : {da: 'Skydesignaler', en:'Signals'      },
        'NOTE'       : {da: 'Note',          en:'Note'         },
        'ATTACHMENT' : {da: 'Vedhæftninger', en:'Attachments'  },
        'AREA'       : {da: 'Område',        en:'Area'         },
        'CHART'      : {da: 'Søkort',        en:'Charts'       },
        'PUBLICATION': {da: 'Publikationer', en:'Publications' },
        'SOURCE'     : {da: 'Kilde',         en:'Source'       }
    });

    //Translate reference types
    i18next.addPhrases('niord', {
//      REFERENCE: Is not shown
        REPETITION          : {da:'(Gentagelse)',             en:'(Repetition)'                 },
        REPETITION_NEW_TIME : {da:'(Gentagelse med ny tid)',  en:'(Repetition with new time)'   },
        CANCELLATION        : {da:'(Udgår)',                  en:'(Cancelled)'                  },
        UPDATE              : {da:'(Ajourført gentagelse)',   en:'(Updated repetition)'         }
    });

    //List of ids for different type of message-part or group of info. 'MAP' is used internally
    var defaultPartIdList   = ['REFERENCE', 'CATEGORY', 'TIME', 'DETAILS', 'PROHIBITION', 'SIGNALS', 'NOTE', 'ATTACHMENT', 'AREA', 'CHART', 'PUBLICATION', 'SOURCE'],
        fullPartIdList      = ['MAP'].concat(defaultPartIdList);

    //Link to list of message = Messages.asModal: Create and open a modal-window with all messages, filtered and sorted
    var currentMessages = null;
    function messagesAsModal(){
        var $this    = $(this),
            messages = $this.data('niord-link-messages');

        messages.asModal({
            filterBy: {
                listId: $this.data('niord-link-id'),
                objId : $this.data('niord-link-value')
            }
        });
    }


    //trim(str) trim str for leading and tail space and punctuation
    function trim( str ){
        return str.replace(/^[\., ]+|[\., ]+$/g, "");
    }

    /******************************************************
    Message.bsHeaderOptions
    Return a object to be used in headers in bs-objects
    ******************************************************/
    ns.Message.prototype.bsHeaderOptions = function(size){
        size = size ? size.toUpperCase() : 'SMALL';
        var result = { text: [this.shortId || this.mainType] };
        switch (size){
            case 'SMALL':
                //Nothing
                break;
            case 'NORMAL':
                result.text.push('-', this.shortTitle );
                break;
            case 'LARGE':
                result.text.push('-', this.title );
                break;
        }

        //Add icon
        result.icon = ns.options.domainIcon[this.domainId] || null;

        return result;
    };

    /******************************************************
    Message.bsFixedContent
    Return a object to be used as fixedContent in bs-objects
    ******************************************************/
    ns.Message.prototype.bsFixedContent = function(size){
        size = size ? size.toUpperCase() : 'SMALL';
        var fixedContentTextClass     = 'd-block text-center',
            fixedContentBoldTextClass = fixedContentTextClass + ' font-weight-bold',
            tempResult = [],
            result = [];
        switch (size){
            case 'SMALL':
                tempResult.push(
                    {text: this.subAreaTitle, textClass: fixedContentTextClass},
                    {text: this.shortTitle,   textClass: fixedContentBoldTextClass}
                );
                break;
            case 'NORMAL':
                tempResult.push(
                    {text: this.areaTitle,    textClass: fixedContentTextClass},
                    {text: this.subAreaTitle, textClass: fixedContentTextClass},
                    {text: this.shortTitle,   textClass: fixedContentBoldTextClass}
                );
                break;
            case 'LARGE':
                tempResult.push({text: this.title, textClass: fixedContentBoldTextClass});
                break;
        }
        $.each( tempResult, function( index, obj ){
            if (obj.text)
                result.push(obj);
        });
        return result;
    };

    /*******************************************************************
    CREATE CONTENT OF DIFFERENT PARTS
    *******************************************************************/
    //linkToModal - Return a bsObject with text and link to open a modal-window with a list og messages sorted or filtered
    function linkToModal( text, linkId, linkValue, postText ){
        var result = {
                text: text,
                textClass: 'text-nowrap'
            };

        if (linkId && linkValue && currentMessages && currentMessages.asModal){
            result.link = messagesAsModal;
            result.textData = {
                'niord-link-id'      : linkId,
                'niord-link-value'   : linkValue,
                'niord-link-messages': currentMessages
            };
        }

        if (postText)
            result = [result, postText];

        return result;
    }

    /*******************************************************************
    parentList = create a list of text/links with triangle between
    *******************************************************************/
    function parentList( obj, linkId, childrenList, parent ){
        var result = childrenList || [],
            bsObj = linkToModal( obj.name, linkId, obj.id );
        if (result.length)
            result[0].icon = 'fa-caret-right';

        //Insert bsObj at the start of result-array
        result = [bsObj].concat(result);

        result = obj.parent ? parentList( obj.parent, linkId, result ) : result;
        if (parent){
            if (result.length)
                result[0].icon = 'fa-caret-right';
            result = [parent].concat(result);
        }
        return result;
    }

    /*******************************************************************
    Extend different part-classes with bsObject = methods added to some of
    the classes from niord.js to allow the creation of object for
    jquery-bootstrap display-objects
    *******************************************************************/
    ns.Attachment.prototype.bsObject = function(){
        var _this = this,
            modalHeader = [];
        if (this.message.shortId)
            modalHeader.push(this.message.shortId+': ');
        modalHeader.push(this.caption);

        return {
            text: this.caption,
            link: function(){ $.bsModalFile( _this.path, {  header: modalHeader } ); }
        };
    };

    ns.Chart.prototype.bsObject = function(){
        return linkToModal(
            this.chartNumber + (this.internationalNumber ? ' (INT' + this.internationalNumber + ')' : ''),
            'chart', this.id
        );
    };

    ns.Area.prototype.bsObject = function(){
        return linkToModal(
            this.name,
            'area', this.id
        );
    };

    ns.Reference.prototype.bsObject = function(){
        return linkToModal(
            this.messageId,
            'message',
            this.messageId,
            this.type && (this.type != 'REFERENCE') ? {text:'niord:'+this.type} : null
       );
    };

    //Internal methods
    ns.Message.prototype.getList = function(id){
        return this[id.toLowerCase()+'List'];
    };
    ns.Message.prototype.has = function( id ){ //return true;
        return this.getList(id) && this.getList(id).length;
    };
    ns.Message.prototype.each = function( id, func ){
        var _this = this;
        $.each( this.getList(id), function( index, obj ){
            func( obj, _this );
        });
    };

    /******************************************************
    Message.bsAccordionOptions
    Return a object with options for $.fn.bsAccordion(...)
    ******************************************************/
    ns.Message.prototype.bsAccordionOptions = function(options, resultOptions){
        options = options || {};
        var partIdList = options.partIdList || fullPartIdList,
            _this = this,
            partIsOpen = false,
            messageContent = [],
            addPart, openPart, bsPart, list;

        currentMessages = this.messages;

        //*******************************************************************************
        function bsPartAsParentList(listId, childrenList, parent){
            if (!_this.has(listId)) return;
            addPart = true;
            bsPart.content = [];
            _this.each( listId, function( part ){
                //Create list of part
                bsPart.content.push(
                    $('<div/>')
                        .addClass('parent-list-container')
                        ._bsAddHtml( parentList( part, listId, childrenList, parent ) )
                );
            });
        }
        //*******************************************************************************
        function _getMomentFormated( m, id, defaultMethod ){
            var vfFormatId = ns.options.vfFormatId[id];
            if (vfFormatId)
                return {vfFormat: vfFormatId, vfValue: m };
            else
                return $('<span/>').text( m.tzMoment()[defaultMethod]() );
        }


        //*******************************************************************************
        function getDate( m )         { return _getMomentFormated( m, 'date',         'dateFormat' ); }
        function getDateWeekday( m )  { return _getMomentFormated( m, 'date_weekday', 'dateFormat' ); }
        function getDateLong( m )     { return _getMomentFormated( m, 'date_long',    'dateFormat' ); }
        function getTime( m )         { return _getMomentFormated( m, 'time',         'timeFormat' ); }
        //*******************************************************************************
        $.each( partIdList, function( index, partId ){

            var hasPart = _this.has(partId);

            bsPart = {
                header : {
                    icon: ns.options.partIcon[partId]+' fa-fw',
                    text: 'niord:'+partId
                },
                content: {},
                footer: ns.options.partFooter[partId]
            };
            addPart = false;
            openPart = false;

            switch (partId){
                //****************************
                case 'MAP':
                    if (ns.options.createMap && _this.geoJSON){
                        addPart = true;
                        bsPart.content = $('<div/>');
                        ns.options.createMap( bsPart.content, _this, options );
                    }
                    break;

                //****************************
                case 'REFERENCE':
                    if (hasPart){
                        addPart = true;
                        bsPart.content = {
                            type   : 'list',
                            columns: [{noWrap: true, fixedWidth: true}],
                            content: []
                        };
                        //Create list of references
                        _this.each( 'reference', function( reference ){
                            bsPart.content.content.push( reference.bsObject() );
                        });
                    }
                    break;

                //****************************
                case 'CATEGORY':
                    if (hasPart && (_this.domainId == 'NW')){
                        bsPartAsParentList(
                            'category', null,
                            linkToModal('niord:'+_this.domainId.toLowerCase(), 'domain', _this.domainId)
                        );
                    }
                    break;

                //****************************
                case 'TIME':
                    if (hasPart){
                        addPart = true;
                        openPart = true;

                        bsPart.content = {
                            type             : 'table',
                            styleClass       :'time-period',
                            verticalBorder   : false,
                            notFullWidth     : true,
                            centerInContainer: true,

                            defaultColunmOptions: {
                                align        : 'left',
                                verticalAlign: 'top',
                                noWrap       : true,
                                fixedWidth   : true
                            },
                            columns: [
                                {id: 'date',                   header: {text: {da:'Dato',  en:'Date' }} },
                                {id: 'start', align: 'center', header: {text: options.fullDate ? {da:'Start kl.', en:'Start Hour'} : {da:'Start', en:'Start' } } },
                                {id: 'end',   align: 'center', header: {text: options.fullDate ? {da:'Slut kl.',  en:'End Hour'  } : {da:'Slut',  en:'End'   } } },
                            ]
                        };

                        var content = bsPart.content.content = [],
                            rowClassName = bsPart.content.rowClassName = [],
                            now = moment(),
                            fromState,   //= -1: starts in  past, +1: starts in future, 0: not existe
                            toState,     //= -1: ends in  past,   +1: ends in future,   0: not existe
                            periodState; //= -2: starts and end in past, 0: starts in past end in future, +2: starts and ends in future
                            //Test now = moment('2018-10-10T22:00');

                        _this.each('time', function( messagePart ){
                            $.each( messagePart.eventDates, function( index, eventDate ){
                                fromState = eventDate.fromDate ? (eventDate.fromDate.isBefore(now) ? -1 : +1) : 0;
                                toState   = eventDate.toDate   ? (eventDate.toDate.isBefore(now)   ? -1 : +1) : 0;

                                //Add class-names to row-element to set past- or future-color on edge
                                var nextRowClassNames = [];
                                if (fromState)
                                    nextRowClassNames.push( fromState == -1 ? 'start-before-now' : 'start-after-now' );
                                if (toState)
                                    nextRowClassNames.push( toState   == -1 ? 'end-before-now'   : 'end-after-now' );

                                //Add now-colored top-border if previous period is in past and this period is in future
                                if ((periodState == -2) && (fromState + toState == +2))
                                    nextRowClassNames.push('first-after-now');

                                periodState = fromState + toState;

                                rowClassName.push( nextRowClassNames.join(' ') );

                                var endContent = null;
                                if (eventDate.toDate){
                                    endContent = getTime( eventDate.toDate );
                                    //Check if  toDate is another day (in current timezone) that fromDate => add (+N) after end-time (N = differens id 'days'
                                    if (eventDate.fromDate){
                                        endContent = [endContent];
                                        if (eventDate.fromDate.tzMoment().dateFormat() != eventDate.toDate.tzMoment().dateFormat()){
                                            var dayDiff = 0,
                                                tempFromDate = moment( eventDate.fromDate );
                                            while (tempFromDate.isBefore(eventDate.toDate)){
                                                dayDiff++;
                                                tempFromDate.add(1, 'd');
                                            }
                                            endContent.push({ text: '<sup>(+'+dayDiff+')</sup>'});
                                        }
                                    }
                                }

                                content.push({
                                    date   : eventDate.fromDate ? (options.fullDate ? getDateWeekday(eventDate.fromDate) : getDate( eventDate.fromDate )) : null,
                                    start  : eventDate.fromDate ? getTime( eventDate.fromDate ) : null,
                                    end    : endContent
                                });
                            });
                        });
                    }
                    break;

                //****************************
                case 'DETAILS':
                case 'PROHIBITION':
                case 'SIGNALS':
                case 'NOTE':
                    if (hasPart){
                        addPart = true;
                        openPart = (partId == 'DETAILS');
                        bsPart.content = [];
                        _this.each(partId, function( messagePart ){

                            //Add subject if it isn't already displayed as smallTitle
                            if (!!messagePart.subject && (trim(messagePart.subject.da) != trim(_this.shortTitle.da)) )
                                bsPart.content.push({
                                    text         : messagePart.subject,
                                    textClassName: 'd-block font-weight-bold'
                                });

                            if (messagePart.details)
                                bsPart.content.push({
                                    text         : messagePart.details,
                                    textClassName: 'd-block'
                                });

                        });
                    }

                    break;

                //****************************
                case 'ATTACHMENT':
                    if (hasPart){
                        addPart = true;
                        bsPart.content = {
                            type   : 'list',
                            content: []
                        };
                        _this.each( 'attachment', function( attachment ){
                            if (options.largeVersion){
                                bsPart.content.content.push({
                                    type    : 'fileView',
                                    fileName: attachment.path,
                                    header  : attachment.caption
                                });
                            }
                            else
                                bsPart.content.content.push( attachment.bsObject() );
                        });
                    }
                    break;

                //****************************
                case 'AREA':
                    addPart = true;
                    list = bsPart.content = [];

                    //Append visinity temporary
                    if (_this.vicinity){
                        var vicinityAsArea = new ns.Area({});
                        vicinityAsArea.name = _this.vicinity;
                        _this.areaLevelList.push([vicinityAsArea]);
                    }
                    $.each( _this.areaLevelList, function( level, areaList ){
                        $.each( areaList, function( index, area ){
                            var areaBsObject = area.bsObject();
                            if (!index && level)
                                areaBsObject.icon = 'fa-caret-right';
                            if (index)
                                list.push({text:'/'});
                            list.push(areaBsObject);
                        });
                    });

                    if (_this.vicinity)
                        _this.areaLevelList.pop();



                    break;

                //****************************
                case 'CHART':
                    if (hasPart){
                        addPart = true;
                        bsPart.content = {
                            type   : 'list',
                            content: []
                        };
                        _this.each( 'chart', function( chart ){
                            bsPart.content.content.push( chart.bsObject() );
                        });
                    }
                    break;

                //****************************
                case 'PUBLICATION':
                    addPart = true;
                    bsPart.content = {
                        type: 'list',
                        verticalAlign: 'top',
                        styleClass: 'display-anchor-as-block ',
                        content: []
                    };
                    list = bsPart.content.content;

                    if (hasPart){
                        var hr = {da:'', en:''},
                            addHr = false;
                        $.each( _this.publicationList, function( id, publication ){
                            if (publication.text.da) hr.da = '<hr>';
                            if (publication.text.en) hr.en = '<hr>';
                            list.push({
                                text: publication.text,
                                link: function(){ $.bsModalFile( publication.link, {  header: publication.text } ); }
                            });
                            addHr = true;
                        });
                        if (addHr)
                            list.push(hr);
                    }
                    list.push({text: 'niord:publications', link: $.proxy(ns.publications.show, ns.publications) });

                    break;

                //****************************
                case 'SOURCE':
                    addPart = true;
                    bsPart.content = {
                        type: 'list',
                        verticalAlign: 'top',
                        columns: [{align: 'right', noWrap: true, fixedWidth: true}],
                        content: []
                    };
                    list = bsPart.content.content;
                    if (_this.source)
                        list.push([{da:'Kilde:', en:'Source:'}, _this.source]);

                    if (_this.publishDateFrom)
                        list.push([{da:'Publiceret:', en:'Publish:'}, getDateLong( _this.publishDateFrom) ]);
                    break;
            }


            if (addPart){
                if (openPart && !partIsOpen){
                    bsPart.selected = true;
                    partIsOpen = true;
                }
                messageContent.push( bsPart );
                if (options.onlyOne)
                    return false;
            }
        });
        currentMessages = null;
        return $.extend({type: 'accordion',list: messageContent }, resultOptions || {});
    }; //end of ns.Message.prototype.bsAccordionOptions


    /******************************************************
    Message.popoverContent
    Return a bs-object for popover or tooltips
    ******************************************************/
    ns.Message.prototype.popoverContent = function(){
        var result = [];
        if (this.shortId)
            result.push({text: this.shortId, textClass: 'text-monospace _d-block'});
        if (this.subAreaTitle)
            result.push({text: this.subAreaTitle, textClass: 'text-center d-block'});
        if (this.shortTitle)
            result.push({text: this.shortTitle, textClass: 'text-center d-block'});
        return result;
    };

    /******************************************************
    Message.bsPopoverOptions
    Return a object to be used in $.fn.bsPopover(...)
    ******************************************************/
    ns.Message.prototype.bsPopoverOptions = function(){
        return {
            content: $('<div/>')._bsAddHtml( this.popoverContent() )
        };
    };

    /******************************************************
    Message.bsModalOptions
    Return options to create a small version for $.bsModal
    ******************************************************/
    ns.Message.prototype.bsModalSmallOptions = function(modalOptions){
        var result = {
                header      : this.bsHeaderOptions(),
                fixedContent: this.bsFixedContent(),
                footer      : ns.options.modalSmallFooter,

                //Extend the modal if ns.options.openNewModal is set
                onNew                : ns.options.isSet('openNewModal') ? $.proxy(this.asModal, this) : null,
                closeButton          : false,
                modalContentClassName: 'niord-modal-content'
            },
            //Normal content is only part 'TIME' or part 'DETAILS' or this.title
            content = this.bsAccordionOptions({partIdList: ['TIME', 'DETAILS'], onlyOne: true});
            if (content.list.length)
                result.content = $.extend(content, {neverClose: true});
            else
                result.content = this.bsHeaderOptions('LARGE');

        //Extende content = full list of parts
        result.extended = {
            fixedContent: this.bsFixedContent('NORMAL'),
            content     : this.bsAccordionOptions({partIdList: defaultPartIdList}),
            footer      : ns.options.modalFooter
        };

        return $.extend(true, result, modalOptions || {} );
    };

    /******************************************************
    Message.bsModalOptions
    Return standard options to create a $.bsModal
    ******************************************************/
    ns.Message.prototype.bsModalOptions = function(modalOptions){
        var result = {
                header      : this.bsHeaderOptions('NORMAL'),
                fixedContent: this.bsFixedContent('NORMAL'),
                content     : this.bsAccordionOptions({fullDate: true}),

                footer      : ns.options.modalFooter,

                flexWidth   : true,

                static               : true,
                modalContentClassName: 'niord-modal-content',
            };

        //Extend the modal if ns.options.normalModalExtendable is set
        if (ns.options.isSet('normalModalExtendable'))
            result.extended = {
                header      : this.bsHeaderOptions('LARGE'),
                fixedContent: this.bsFixedContent('LARGE'),
                content     : this.bsAccordionOptions({fullDate: true, largeVersion: true}, {allOpen: true, neverClose: true}),
                footer      : true,

                flexWidth   : true,
                extraWidth  : true,
            };

        return $.extend(true, result, modalOptions || {} );
    },


    /******************************************************
    Message.asModalSmall
    ******************************************************/
    ns.Message.prototype.asModalSmall = function(modalOptions){
        this.bsModal = $.bsModal( this.bsModalSmallOptions(modalOptions) );
        return this.bsModal;
    };

    /******************************************************
    Message.asModal
    ******************************************************/
    ns.Message.prototype.asModal = function(modalOptions){
        this.bsModal = $.bsModal( this.bsModalOptions(modalOptions) );
        return this.bsModal;
    };


    /***********************************************************
    ************************************************************
    Messages
    ************************************************************
    ***********************************************************/

    /******************************************************
    Messages.asModal
    ******************************************************/
    ns.Messages.prototype.asModal_MANGLER = function(){
//    ns.Messages.prototype.asModal = function(modalOptions){
  /*
        var listId = modalOptions.filterBy.listId,
            objId  = modalOptions.filterBy.objId;

        //console.log('messagesAsModal', messages, $(this).data('niord-link-id'), $(this).data('niord-link-value'), $(this).data('niord-link-messages'));
var count = 0;
        $.each(this.childList, function(index, message){
//            console.log(message);//, message[listId+'List']);
            $.each( message.getList(listId), function( index, obj ){
                if (obj.id == objId){
                    console.log('FOUND', message.getList(listId));
                    count++;
                    return false;
                }
            });
        });
console.log('COUNT', count);

console.log( 'objId', objId );
console.log( 'listId', listId );
console.log( this.getCategory( objId ) );

console.log( this );
*/
    };

} (jQuery, this.i18next, this, document));