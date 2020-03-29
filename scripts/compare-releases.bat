@echo off
if not exist %1 goto error
if not exist %2 goto error

7z x -oa %1 
7z x -ob %2 

kdiff a b
goto end


:error
echo compare-releases r1.zip r2.zip

:end