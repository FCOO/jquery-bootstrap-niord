/****************************************************************************
	jquery-bootstrap-niord-publications.js,

	(c) 2018, FCOO

	https://github.com/FCOO/jquery-bootstrap-niord
	https://github.com/FCOO

    See http://nautiskinformation.soefartsstyrelsen.dk/index.html#/publications

****************************************************************************/

(function ($, i18next, window/*, document, undefined*/) {
	"use strict";
    //Create namespace
    window.Niord = window.Niord || {};
	var ns = window.Niord;

    //Translate the title for the differnet publication-groups
    i18next.addPhrases('niord', {
        'publications': {da: 'Aktive EfS og publikationer',    en:'Active NtM and Publications'   },
    });

    /******************************************************
    *******************************************************
    Publications
    *******************************************************
    ******************************************************/
    ns.Publications.prototype.show = function(){
        this.getPublications( $.proxy( this.asModal, this ) );
    };

    ns.Publications.prototype.asModal = function(){
        var options = {
                header   : {
                    icon: ns.options.partIcon.PUBLICATIONS,
                    text: 'niord:publications'
                },
                flexWidth: true,
                content: {
                    type     : 'accordion',
                    multiOpen: true,
                    allOpen  : true,
                    list     : []
                },
                remove: true,
                show: true
            },
            list = '',
            lastCategory = '';

        $.each( this.childList, function( index, publication ){
            var category = publication.category.id;
            if (category != lastCategory){
                //Add new group of publications
                var accordionOptions = {
                    header : publication.category.name,
                    content: {
                        type     : 'list',
                        noBorder : false,
                        noPadding: false,
                        content: []
                    }
                };
                list = accordionOptions.content.content;
                options.content.list.push(accordionOptions);
                lastCategory = category;
            }
            list.push(publication._listItem());
        });
        $.bsModal( options );
    };


    /******************************************************
    *******************************************************
    Publication
    *******************************************************
    ******************************************************/
    ns.Publication.prototype._listItem = function(){
        return {
            text: this.title,
            link: $.modalFileLink(
                      this.link, {
                          header: {
                              icon: ns.options.partIcon.PUBLICATIONS,
                              text: this.title
                          }
                      })
        };
    };

} (jQuery, this.i18next, this, document));
