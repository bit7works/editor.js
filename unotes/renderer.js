const notebook = {
  name: '',
  path: '',
  data: {},

  reload: function () {
    document.getElementById('noteName').innerHTML = this.name;
  },
};

const tools = {
  header: {
    class: Header,
    inlineToolbar: ['marker', 'link'],
    config: {
      placeholder: 'Header',
    },
    shortcut: 'CMD+SHIFT+H',
  },

  image: SimpleImage,

  list: {
    class: NestedList,
    inlineToolbar: true,
    shortcut: 'CMD+SHIFT+L',
  },

  checklist: {
    class: Checklist,
    inlineToolbar: true,
  },

  quote: {
    class: Quote,
    inlineToolbar: true,
    config: {
      quotePlaceholder: 'Enter a quote',
      captionPlaceholder: 'Quote\'s author',
    },
    shortcut: 'CMD+SHIFT+O',
  },

  warning: Warning,

  marker: {
    class: Marker,
    shortcut: 'CMD+SHIFT+M',
  },

  code: {
    class: CodeTool,
    shortcut: 'CMD+SHIFT+C',
  },

  delimiter: Delimiter,

  inlineCode: {
    class: InlineCode,
    shortcut: 'CMD+SHIFT+I',
  },

  linkTool: LinkTool,

  raw: RawTool,

  embed: Embed,

  table: {
    class: Table,
    inlineToolbar: true,
    shortcut: 'CMD+ALT+T',
  },

};

const textOnReady = function () {
  //
  console.log('ready to go.');
};

const textOnChange = function (api, block) {
  console.log('Content changed. ', api, block);
  editor.save().then((payload) => {
    console.log('[EDITORJS PAYLOAD]>>> ', payload);
    window.electron.ipc.send('save-default-document', {
      content: JSON.stringify(payload),
    });
  })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.log('Failed to save content!', error);
    });
};

/**
 * To initialize the Editor, create a new instance with configuration object
 *
 * @see docs/installation.md for mode details
 */
let editor = null;
// let editor = new EditorJS({
//   autofocus: true,
//   holder: 'editorjs',
//   tools: tools,
//   // defaultBlock: 'paragraph',
//   data: notebook.data,
//   onReady: textOnReady,
//   onChange: textOnChange,
// });

// saveButton.addEventListener('click', function () {
//   editor.save()
//     .then((savedData) => {
//       cPreview.show(savedData, document.getElementById("output"));
//     })
//     .catch((error) => {
//       console.error('Saving error', error);
//     });
// });

window.onload = function () {
  const elements = {
    toolbar: document.getElementById('toolbar'),
    createNewNote: document.getElementById('createNewNote'),
    showNoteList: document.getElementById('showNoteList'),
  };

  elements.toolbar.addEventListener('dblclick', () => {
    window.electron.ipc.send('toolbar-clicked');
  });

  elements.createNewNote.addEventListener('click', () => {
    window.electron.ipc.send('create-local-document');
  });

  elements.showNoteList.addEventListener('click', () => {
    window.electron.ipc.send('open-local-document');
  });
  console.log('Renderer.js Loaded.');
  console.log('elements: ', elements);

  // open file.
  window.electron.ipcRenderer.send('open-default-document');

  window.electron.ipcRenderer.on('local-document-opened', (note) => {
    console.log('>>>> ', note.filePath);
    try {
      notebook.data = JSON.parse(note.content);
    } catch (error) {
      console.log('[x] ERROR ', error);
      notebook.data = {};
    }

    const filePath = note.filePath;

    notebook.path = filePath;
    notebook.name = String(filePath.replace(/^.*[\\\/]/, '').split('.')[0]).toLocaleUpperCase();

    if (editor instanceof EditorJS) {
      editor.destroy();
    }
    editor = new EditorJS({
      autofocus: true,
      tools: tools,
      onReady: textOnReady,
      onChange: textOnChange,
      data: notebook.data,
    });

    notebook.reload();
  });
};
