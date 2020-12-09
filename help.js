var interval;

function showHelp(type) {
    console.log("showhelp");
    var html = "<table>\n";
    html += CmdUtils.CommandList.filter((c)=>{return (c.builtIn==true) == type}).map((c)=>{
        var r = "<tr>";
        r += "<!-- "+c.name+" -->";
        var i = c.icon || ""; 
        if (i.length>3) 
            i = "<img height='16px' src='"+c.icon+"'/>";
        else
            i = "<span style='font-size:1em; height:16px;vertical-align:middle;margin:0px'>"+i+"</span>"            
        r += "<td>"+i+"</td>";
        r += "<td>"+(c.builtIn?"":"<b>")+c.names.join(", ")+(c.builtIn?"":"</b>")+"</td>";
        r += "<td>"+c.description+"</td>";
        r += "</tr>";

        if (!c.builtIn) clearInterval(interval);
        return r;
    }).sort().join("\n");

    html += "</table>";

    return html;
}

function help() {
    $("#builtin").html( showHelp(true) );
    $("#custom").html( showHelp(false) );
}

help();
var interval = setInterval( help, 1000 );