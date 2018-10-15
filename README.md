# jquery-bootstrap-niord
>


## Description
Extend niord.js with methods to display data in modal-windows etc.

## Installation
### bower
`bower install https://github.com/FCOO/jquery-bootstrap-niord.git --save`

## Demo
http://FCOO.github.io/jquery-bootstrap-niord/demo/ 

## Usage

    ns.Message.prototype.popoverContent      = function()             //Return a bs-object for popover or tooltips
    ns.Message.prototype.bsPopoverOptions    = function()             //Return a object to be used in $.fn.bsPopover(...)
    ns.Message.prototype.bsModalSmallOptions = function(modalOptions) //Return options to create a small version for $.bsModal
    ns.Message.prototype.bsModalOptions      = function(modalOptions) //Return standard options to create a $.bsModal
    ns.Message.prototype.asModalSmall        = function(modalOptions) //Return a bsModal created with bsModalSmallOptions
    ns.Message.prototype.asModal             = function(modalOptions) //Return a bsModal created with bsModalOptions

<!--  
### options
| Id | Type | Default | Description |
| :--: | :--: | :-----: | --- |
| options1 | boolean | true | If <code>true</code> the ... |
| options2 | string | null | Contain the ... |

### Methods

    .methods1( arg1, arg2,...): Do something
    .methods2( arg1, arg2,...): Do something else
-->


## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/FCOO/jquery-bootstrap-niord/LICENSE).

Copyright (c) 2018 [FCOO](https://github.com/FCOO)

## Contact information

Niels Holt nho@fcoo.dk
