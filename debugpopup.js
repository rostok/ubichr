$("iframe").remove();
$("<iframe src=options.html>")
.appendTo("html")
.css({right:0,top:0,width:1124,position:"absolute",height:"100%"})
.parent()
.css("overflow-y","hidden");
