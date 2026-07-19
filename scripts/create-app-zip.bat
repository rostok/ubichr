@echo off
cd ..
for /f "tokens=* usebackq" %%f in (`underscore -i manifest.json extract version`) do (
set var=%%f
)
set var2=%var:"=%
set var=%var2:.=%
echo %var%
if exist dist\ubichr-%var%.zip del dist\ubichr-%var%.zip
7z a dist\ubichr-%var%.zip lib/* res/* help.css options.css popup.css help.html options.html popup.html result.html sandbox.html service_worker.js sandbox.js sandbox-bridge.js commands.js commands-legacy.js context.js cmdutils.js core.js help.js options.js popup.js result.js selection.js utils.js manifest.json tests.js tests.html debugpopup.js debugpopup.html
cd dist