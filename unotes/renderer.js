const dateFormat = (function () {
  var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
    timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
    timezoneClip = /[^-+\dA-Z]/g,
    pad = function (val, len) {
      val = String(val);
      len = len || 2;
      while (val.length < len) {
        val = '0' + val;
      }

      return val;
    };

  // Regexes and supporting functions are cached through closure
  return function (date, mask, utc) {
    var dF = dateFormat;

    // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
    if (arguments.length == 1 && Object.prototype.toString.call(date) == '[object String]' && !/\d/.test(date)) {
      mask = date;
      date = undefined;
    }

    // Passing date through Date applies Date.parse, if necessary
    date = date ? new Date(date) : new Date();
    if (isNaN(date)) {
      throw SyntaxError('invalid date');
    }

    mask = String(dF.masks[mask] || mask || dF.masks['default']);

    // Allow setting the utc argument via the mask
    if (mask.slice(0, 4) == 'UTC:') {
      mask = mask.slice(4);
      utc = true;
    }

    var	_ = utc ? 'getUTC' : 'get',
      d = date[_ + 'Date'](),
      D = date[_ + 'Day'](),
      m = date[_ + 'Month'](),
      y = date[_ + 'FullYear'](),
      H = date[_ + 'Hours'](),
      M = date[_ + 'Minutes'](),
      s = date[_ + 'Seconds'](),
      L = date[_ + 'Milliseconds'](),
      o = utc ? 0 : date.getTimezoneOffset(),
      flags = {
        d: d,
        dd: pad(d),
        ddd: dF.i18n.dayNames[D],
        dddd: dF.i18n.dayNames[D + 7],
        m: m + 1,
        mm: pad(m + 1),
        mmm: dF.i18n.monthNames[m],
        mmmm: dF.i18n.monthNames[m + 12],
        yy: String(y).slice(2),
        yyyy: y,
        h: H % 12 || 12,
        hh: pad(H % 12 || 12),
        H: H,
        HH: pad(H),
        M: M,
        MM: pad(M),
        s: s,
        ss: pad(s),
        l: pad(L, 3),
        L: pad(L > 99 ? Math.round(L / 10) : L),
        t: H < 12 ? 'a' : 'p',
        tt: H < 12 ? 'am' : 'pm',
        T: H < 12 ? 'A' : 'P',
        TT: H < 12 ? 'AM' : 'PM',
        Z: utc ? 'UTC' : (String(date).match(timezone) || [ '' ]).pop().replace(timezoneClip, ''),
        o: (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
        S: ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10],
      };

    return mask.replace(token, function ($0) {
      return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
  };
}());

// Some common format strings
dateFormat.masks = {
  default: 'ddd mmm dd yyyy HH:MM:ss',
  shortDate: 'm/d/yy',
  mediumDate: 'mmm d, yyyy',
  longDate: 'mmmm d, yyyy',
  fullDate: 'dddd, mmmm d, yyyy',
  shortTime: 'h:MM TT',
  mediumTime: 'h:MM:ss TT',
  longTime: 'h:MM:ss TT Z',
  isoDate: 'yyyy-mm-dd',
  isoTime: 'HH:MM:ss',
  isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
  isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'",
};

// Internationalization strings
dateFormat.i18n = {
  dayNames: [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  ],
  monthNames: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
  ],
};

// For convenience...
Date.prototype.format = function (mask, utc) {
  return dateFormat(this, mask, utc);
};

// APP.

const notebook = {
  name: '',
  path: '',
  data: {},
  lastSaveAt: 0,

  reload: function () {
    document.getElementById('noteName').innerHTML = this.name;

    let lastSaveAt = this.lastSaveAt;
    if (lastSaveAt) {
      lastSaveAt = (new Date(lastSaveAt)).format("mmmm d, yyyy 'at' HH:MM:ss");
    } else {
      lastSaveAt = (new Date()).format("mmmm d, yyyy 'at' HH:MM:ss");
    }
    document.getElementById('dateline').innerHTML = lastSaveAt;
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

  window.electron.ipcRenderer.on('local-document-updated', (note) => {
    try {
      const data = JSON.parse(note.content);
      notebook.lastSaveAt = data.time;

      notebook.reload();
    } catch (error) {
      console.log('[x] ERROR ', error);
    }
  });

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
    notebook.lastSaveAt = notebook.data.time;

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
