# ubichr
My humble attempt to create [Ubiquity](https://wiki.mozilla.org/Labs/Ubiquity) alternative for Chrome and Firefox Quantum browsers.

# how to
Currently this is only a dev repo. To use it follow 'Load the extension' section here https://developer.chrome.com/extensions/getstarted

People wanting to remove irritating 'disable developer mode popup' please follow [the neat binary hack of chrome.dll](https://stackoverflow.com/questions/30287907/how-to-get-rid-of-disable-developer-mode-extensions-pop-up/30361260)

# license & origins
MIT license

Most of the code is based on http://github.com/cosimo/ubiquity-opera/ however no license info is available.

# adding commands
You can add your custom commands using built-in editor (CodeMirror) or modify commands.js. The syntax is quite simple and self explanatory

## basic command:
```javascript
CmdUtils.CreateCommand({
    name: "example", 
    description: "A short description of your command.",
    author: "Your Name",
    icon: "http://www.mozilla.com/favicon.ico",
    execute: function execute(args) {
        alert("EX:You input: " + args.text, this);
    },
    preview: function preview(pblock, args) {
        pblock.innerHTML = "PV:Your input is " + args.text + ".";
    },
});
```
Use CmdUtils.CreateCommand and provide object with ```name``` string and ```preview``` and ```execute``` functions. The ```execute``` function takes argument which is an object containing text property - a single string following command. The ```preview``` function also has pblock argument pointing to div in a popup for various output.

## command with some action
```javascript
CmdUtils.CreateCommand({
    name: "google-search",
    preview: "Search on Google for the given words",
    execute: CmdUtils.SimpleUrlBasedCommand(
        "http://www.google.com/search?client=opera&num=1&q={text}&ie=utf-8&oe=utf-8"
    )
});
```

Note that execute is created using ```CmdUtils.SimpleUrlBasedCommand()``` the output function will substitute {text} and {location} template literals with actual argument and current tab url.

## getting outside data with async / await
```javascript
CmdUtils.CreateCommand({
    name: "imdb",
    description: "Searches for movies on IMDb",
    icon: "http://www.imdb.com/favicon.ico",
    preview: async function preview(pblock, {text: text}) {
        pblock.innerHTML = "Searches for movies on IMDb";
        var doc = await CmdUtils.get("http://www.imdb.com/find?q="+encodeURIComponent(text)+"&s=tt&ref_=fn_al_tt_mr" );
        pblock.innerHTML = "<table>"+jQuery("table.findList", doc).html()+"</table>";
    },
    execute: CmdUtils.SimpleUrlBasedCommand(
        //"http://www.imdb.com/find?s=all&q={text}&x=0&y=0"
        "http://www.imdb.com/find?q={text}&s=tt&ref_=fn_al_tt_mr"
    )
});
```

Note that ```preview``` function is defined with ```async``` keyword. This will allow to avoid callback hell when getting data with GET request (```CmdUtils.get(url)```). 
