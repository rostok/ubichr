// jshint ignore:start
CmdUtils.CreateCommand({
    names: ["diki", "english-diki", "ling", "english-ling"],
    description: "szuka tlumaczenia slowa w diki.pl",
    author: { name: "rostok" },
    license: "MIT",
    icon: "https://www.diki.pl/favicon.ico",
    old_execute: CmdUtils.SimpleUrlBasedCommand("https://www.diki.pl/slownik-angielskiego?q={text}"),
    loaddiki: async function(url) {
      var doc = await CmdUtils.get(url);
      doc = jQuery(".diki-results-left-column", doc);
      doc.find(".eTutorPromotionalLink").remove();          // promo banner
      doc.find(".audioIcon, .hasRecording").remove();       // audio buttons (dead in popup)
      doc.find(".additionalSentencesShow, .additionalSentences .hiddenElement").remove();
      doc.find("ins, script, iframe, .adsbygoogle, [id^='div-gpt-ad']").remove();
      return doc.html();
    },
    execute: function(args) {
      args.text = args.text.trim().toLowerCase();
      args._cmd.old_execute(args);
    },
    preview: async function preview(pblock, {text:text}) {
        text = text.trim().toLowerCase();
        if (text === "") {
            pblock.innerHTML = "finds word definition in diki.pl";
        } else {
            var doc = await this.loaddiki("https://www.diki.pl/slownik-angielskiego?q=" + encodeURIComponent(text));
            jQuery(pblock).html(doc);
        }
    },
});
// jshint ignore:end
