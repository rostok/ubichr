@echo off
del ..\dist\ubichr.zip
cd ..
for /f "tokens=* usebackq" %%f in (`underscore -i manifest.json extract version`) do (
set var=%%f
)
set var2=%var:"=%
set var=%var2:.=%
echo %var%
7z a dist\ubichr-%var%.zip lib/* res/* help.css options.css popup.css help.html options.html popup.html result.html background.js commands.js cmdutils.js core.js help.js options.js popup.js result.js selection.js utils.js manifest.json
cd dist