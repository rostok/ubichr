// Legacy/deprecated commands - moved here for reference
// Users can copy these to the custom script editor if needed

CmdUtils.CreateCommand({
    name: "answers-search",
    description: "Search Answers.com for:",
    author: {},
    icon: "http://www.answers.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Search Answers.com for:",
    execute: CmdUtils.SimpleUrlBasedCommand('https://www.answers.com/search?q={text}')
});

CmdUtils.CreateCommand({
    name: "ask-search",
    description: "Search Ask.com for the given words",
    author: {},
    icon: "http://www.ask.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Search Ask.com for the given words:",
    execute: CmdUtils.SimpleUrlBasedCommand('https://www.ask.com/web?q={text}')
});

CmdUtils.CreateCommand({
    name: "bugzilla",
    description: "Perform a bugzilla search for",
    author: {},
    icon: "http://www.mozilla.org/favicon.ico",
    homepage: "",
    license: "",
    preview: "Perform a bugzilla search for",
    execute: CmdUtils.SimpleUrlBasedCommand("https://bugzilla.mozilla.org/buglist.cgi?query_format=specific&order=relevance+desc&bug_status=__open__&content={text}")
});

CmdUtils.CreateCommand({
    name: "cpan",
    icon: "https://metacpan.org/favicon.ico",
    description: "Search for a CPAN package information",
    homepage: "",
    author: {
        name: "Cosimo Streppone",
        email: "cosimo@cpan.org"
    },
    license: "",
    preview: "Search for a CPAN package information",
    execute: CmdUtils.SimpleUrlBasedCommand(
        "https://metacpan.org/search?q={text}"
    )
});
