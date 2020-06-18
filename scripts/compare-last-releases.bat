@echo off
cd ..\dist
setlocal enabledelayedexpansion
set c=0
for /f %%x in ('dir /b /o-d ubichr-*.zip') do (
	set b=!a!
	set a=%%x
	set /a c=!c!+1
	if !c!==2 goto done
)
:done
::echo !a! !b! !c!

if not exist !a! goto error
if not exist !b! goto error

rmdir /s /q a
rmdir /s /q b

7z.exe x -oa !a! 
7z.exe x -ob !b! 

kdiff a b
goto end


:error
echo nonexistentfileerror

:end