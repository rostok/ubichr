var interval;

function showHelp(type) {
    console.log("showhelp");
    var html = "<table>\n";
    html += CmdUtils.CommandList.filter((c)=>{return (c.builtIn==true) == type}).map((c)=>{
        var r = "<tr>";
        r += "<!-- "+c.name+" -->";
        var i = ""; 
        if (c.icon) i = "<img height=16 src='"+c.icon+"'/>";
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