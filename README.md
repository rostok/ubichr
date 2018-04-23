# ubichr
My humble attempt to create [Ubiquity](https://wiki.mozilla.org/Labs/Ubiquity) alternative for Chrome and Firefox Quantum browsers.

# installation
To install use chrome web store https://chrome.google.com/webstore/search/ubichr

# how to install dev version
To install latest commited version please follow 'Load the extension' section here https://developer.chrome.com/extensions/getstarted

People wanting to remove irritating 'disable developer mode popup' please follow [the neat binary hack of chrome.dll](https://stackoverflow.com/questions/30287907/how-to-get-rid-of-disable-developer-mode-extensions-pop-up/30361260)

# license & origins
MIT license

Most of the code is based on http://github.com/cosimo/ubiquity-opera/

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
Use ```CmdUtils.CreateCommand()``` and provide object with ```name``` string and ```preview``` and ```execute``` functions. The ```execute``` function takes argument which is an object containing ```text``` property - a single string following command. The ```preview``` function also has ```pblock``` parameter pointing to popup div for various output.

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
    execute: CmdUtils.SimpleUrlBasedCommand("http://www.imdb.com/find?q={text}&s=tt&ref_=fn_al_tt_mr")
});
```

Here the ```preview``` function is defined with ```async``` keyword. This will allow to avoid callback hell when getting data with GET request (```CmdUtils.get(url)```). Note the destructuring assignment singling out the ```text``` parameter in ```preview``` function. Note: final implementation uses one liner with ```jQuery.load()```.


## search command with iframe preview
```javascript
CmdUtils.makeSearchCommand({
  name: ["qwant"],
  description: "Searches quant.com",
  author: {name: "Your Name", email: "your-mail@example.com"},
  icon: "https://www.qwant.com/favicon-152.png?1503916917494",
  url: "https://www.qwant.com/?q={QUERY}&t=all",
  prevAttrs: {zoom: 0.75, scroll: [100/*x*/, 0/*y*/], anchor: ["c_13", "c_22"]},
});

```
The ```CmdUtils.makeSearchCommand()``` (provided by Sebres) simplifies even more common web fetching. Instead of loading part of HTML and parsing it with JQuery an iframe is created in UbiChr results area. Extra parameters allow to scale and translate it.

## alternatives
Svalorzen has forked UbiChr and created UbiShell which has more shell like UI with piping and command options. Check it out here: https://github.com/Svalorzen/UbiShell
