define(function (require, exports, module) {
    'use strict';

    var CommandManager  = brackets.getModule('command/CommandManager'),
        Menus           = brackets.getModule('command/Menus'),
        EditorManager   = brackets.getModule('editor/EditorManager'),
        ExtensionUtils  = brackets.getModule("utils/ExtensionUtils"),
        iris            = require('iris');

    var lastTyped   = '';
    var range       = null; //{start: 0; end: 0}
    window.editor = EditorManager.getActiveEditor();
    var colorRegExp = new RegExp("#(?:[a-f\\d]{6}|[a-f\\d]{3})|" +    // #FFFFFF or #FFF    
        "rgb\\((?:(?:\\s*\\d+\\s*,){2}\\s*\\d+|(?:\\s*\\d+(?:\\.\\d+)?%\\s*,){2}\\s*\\d+(?:\\.\\d+)?%)\\s*\\)|" +
        "rgba\\((?:(?:\\s*\\d+\\s*,){3}|(?:\\s*\\d+(?:\\.\\d+)?%\\s*,){3})\\s*\\d+(?:\\.\\d+)?\\s*\\)", "gi");

    
    // Add command to menu.
    if ( menu !== undefined ) {
        menu.addMenuDivider();
        menu.addMenuItem( COMMAND_ID, 'Ctrl-Alt-T' );
    }

    function preventHistory(){
        var history = editor._codeMirror.getHistory();
        history.done = history.done.slice(0, preventTo+3);
        editor._codeMirror.setHistory(history);
    }
    var preventTo = 0;
    // Append Color
    function appendColor(color) {
        if( editor ) {

            var doc = editor.document;
            var spos = {
                s: editor._codeMirror.getCursor(true),
                e: editor._codeMirror.getCursor(false)
            }

            if ( range != null ) {
                doc.replaceRange(color, spos.s, spos.s);
                editor.setSelection(spos.s, {line: spos.s.line, ch: spos.s.ch + color.length});
                range = null;
                
            } else if(doc.getRange( spos.s, spos.e ).match(colorRegExp)) {
                doc.replaceRange(color, spos.s, spos.e );
                editor.setSelection(spos.s, {line: spos.s.line, ch: spos.s.ch + color.length});
                
            }
        }
    }

    // Append UI Stylesheet
    (function appendDefaultStyle(){
        // Insert default overlay style at the beginning of head, so any custom style can overwrite it.
        var styleUrl = ExtensionUtils.getModulePath(module, "default.css");
        var style = $('<link rel="stylesheet" type="text/css" />');
        $(document.head).prepend(style);
        $(style).attr('href', styleUrl);
    })();

    // Create color picker
    var colorPicker = $(
        [
            '<div id="color-picker-container" style="',
            'position: absolute; left: 50px; top: 50px; z-index:9999;',
            '" />'
        ].join('')
    ).iris({onchange: appendColor});
    $('body').append(colorPicker);
    var pickerContainer = $('#color-picker-container');
    var picker = function(option, value) {
        if(value) {
            $(colorPicker).iris(option, value); 

        } else if ( option == 'show' ) {
            
            if ( preventTo != 0 ) {
                preventHistory();
            }
            preventTo = editor._codeMirror.getHistory().done.length;

            $(colorPicker).iris('show');

            var cursorEl = $('.CodeMirror:visible > .CodeMirror-cursors > .CodeMirror-cursor');
            var selEl = $('.CodeMirror:visible > div:eq(0) > textarea');

            var left = cursorEl.length ? cursorEl.offset().left : (
             selEl.offset().left );

            var top = cursorEl.length ? cursorEl.offset().top+cursorEl.outerHeight() : (
             selEl.offset().top + selEl.outerHeight() );

            pickerContainer.css({
                'left': left,
                'top': top 
            });

            left = pickerContainer.offset().left;
            top = pickerContainer.offset().top;

            if ( left + pickerContainer.outerWidth() > $('body').outerWidth() ) {
                left = (cursorEl.length ? cursorEl.offset().left : (
             selEl.offset().left) ) - pickerContainer.outerWidth();
            }


            if ( top + pickerContainer.outerHeight() > $('body').outerHeight() ) {
                top = (cursorEl.length ? 
                    cursorEl.offset().top : (
             selEl.offset().top) ) - pickerContainer.outerHeight();
            }

            pickerContainer.css({
                'left': left,
                'top': top
            });

            
        } else if( option == 'hide') {
            if ( preventTo != 0 ) {
                preventHistory();
            }
            preventTo = 0;
            $(colorPicker).iris('hide');
        } else {
            $(colorPicker).iris(option);
        }
    };

    // Color picker container appending to body
    

    // Active Editor
    $(EditorManager).on("activeEditorChange", function(e, activeEditor, prevEditor) {
        editor = activeEditor;
        if ( editor && editor._codeMirror ) {
            registerEvents(editor._codeMirror);
            picker('hide');
        }
    });


    function editorInputRead(e, o){
        lastTyped += o.text.join('');

        if ( lastTyped.match(/-{0,}color\s{0,}[:|=]/gi) ) {
            lastTyped = '';
            range = true;
            picker('show');
        } else {
            picker('hide');
        }
    }

    function selectionIsColor(){
        var spos = {
            s: editor._codeMirror.getCursor(true),
            e: editor._codeMirror.getCursor(false)
        }
        return editor.document.getRange( spos.s, spos.e ).match(colorRegExp);
    }

    function getSelectedColor(){
        var spos = {
            s: editor._codeMirror.getCursor(true),
            e: editor._codeMirror.getCursor(false)
        }
        if (selectionIsColor()){
            return editor.document.getRange( spos.s, spos.e );
        } else {
            return '#ffffff';
        }
    }

    function registerEvents(editor) {
        editor.on('inputRead', editorInputRead);
        editor.on('dblclick', function(){
            
            if (selectionIsColor()){
                picker('color', getSelectedColor());
                picker('show');
            }
        });
    }

    $('.main-view').on('click', function(){
        picker('hide');

    });

    // Register Command
    var COMMAND_ID  = 'mikailcolak.bracketsColorPicker.show'
    var menu        = Menus.getMenu( Menus.AppMenuBar.VIEW_MENU );
    CommandManager.register( 'Show ColorPicker', COMMAND_ID, function(){
        range = true;
        picker('show');
    });

    if ( menu ){
        menu.addMenuDivider();
        menu.addMenuItem( COMMAND_ID, 'Ctrl-Alt-K');
    }

    
});
