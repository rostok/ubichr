var html = "<table>";

html += CmdUtils.CommandList.map((c)=>{
    var r = "<tr>";
    r += "<!-- "+c.name+" -->";
    var i = ""; 
    if (c.icon) i = "<img height=16 src='"+c.icon+"'/>";
    r += "<td>"+i+"</td>";
    r += "<td>"+(c.builtIn?"":"<b>")+c.names.join(", ")+(c.builtIn?"":"</b>")+"</td>";
    r += "<td>"+c.description+"</td>";
    r += "</tr>";
    return r;
}).sort().join("\n");

html += "</table>";

document.body.innerHTML = html;
