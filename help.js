var interval;

function showHelp(type) {
    console.log("showhelp");
    var html = "<table>\n";
    html += CmdUtils.CommandList.filter((c)=>{return (c.builtIn==true) == type}).map((c)=>{
        var r = "<tr>";
        r += "<!-- "+c.name+" -->";
        var i = c.icon || ""; 
        if (i.length>3) 
            i = "<img class='icon' height='16px' src='"+c.icon+"' />";
        else
            i = "<span class='texticon'>"+i+"</span>"            
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
    $(".icon").on("error", function(){ $(this).attr('src', 'res/spacer.png'); });    
}

help();
var interval = setInterval( help, 1000 );