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

The ```args``` object properties for ```execute``` command are as follows:

* text: text passed as argument
* _selection: currently selected text on tab
* _cmd: current command structure
* _opt_idx: selected option (optional), -1 by default
* _opt_val: value of option element set in data-option-value attribute


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

## commands with options
Version 0.1.0.16 adds options inside preview. To define them just mark any DOM element with data-option attribute and optional data-option-value. Once preview is shown you can navigate through options using Ctrl+up or Ctrl+down keys. Executing command with Enter will pass extra properties into args object. Here's a brief example:
```javascript
CmdUtils.CreateCommand({
    name: "optionexample",
    execute: function execute(args) {
      	CmdUtils.setTip("chosen option idx:"+args._opt_idx+" chosen option val:"+args._opt_val);
    },
    preview: function preview(pblock, args) {
        pblock.innerHTML  = "<div data-option data-option-value=one>option 1</div>";
        pblock.innerHTML += "<div data-option data-option-value=two>option 2</div>";
        pblock.innerHTML += "<div data-option data-option-value=thr>option 3</div>";
        pblock.innerHTML += "<div data-option data-option-value=fou>option 4</div>";
        pblock.innerHTML += "<div data-option data-option-value=fiv>option 5</div>";
    },
});

```
A more advanced example is IMDB movie lookup command. Unnecessary elements were removed for clarity.
```javascript
CmdUtils.CreateCommand({
    name: "imdb",
    preview: async function define_preview(pblock, {text: text}) {
        pblock.innerHTML = "Searches for movies on IMDb";
        if (text.trim()!="") 
        jQuery(pblock).loadAbs("http://www.imdb.com/find?q="+encodeURIComponent(text)+"&s=tt&ref_=fn_al_tt_mr table.findList", ()=>{
            jQuery(pblock).find(".findResult").each((i,e)=>{
                jQuery(e).attr("data-option","");
                jQuery(e).attr("data-option-value", jQuery(e).find("a").first().attr("href"));
            });
        });
    },
    execute: function execute(args) {
        var opt = args._opt_val || "";
        if(opt.includes("://")) 
            CmdUtils.addTab(opt);
        else {
            execute = CmdUtils.SimpleUrlBasedCommand("http://www.imdb.com/find?s=tt&ref_=fn_al_tt_mr&q={text}");
            execute(args)
        }
    }
});
```
Inside ```preview``` after the results are loaded jQuery is used to iterate over all ```.findResult``` elements and mark them with ```data-option``` attribute. Also ```data-option-value``` is set with URL.

The ```execute``` function check if option was set and if it is an URL (includes ```://```). If so another browser tab is added. In case it was not defined standard tab with search results is opened.

# alternatives
Svalorzen has forked UbiChr and created UbiShell which has more shell like UI with piping and command options. Check it out here: https://github.com/Svalorzen/UbiShell
