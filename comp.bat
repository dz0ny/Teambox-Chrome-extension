del dist.zip /Q
del dist /s /Q
xcopy source dist\source /s
FOR %%G IN (source\js\*.js) DO java -jar compiler.jar --js %%G --js_output_file dist\%%G --summary_detail_level 3 --compilation_level SIMPLE_OPTIMIZATIONS
FOR %%G IN (source\css\*.css) DO java -jar css.jar %%G -o dist\%%G -v --charset utf-8 
"C:\Program Files\7-Zip\7z.exe" -tzip -mx=9 a .\dist\dist.zip .\dist\source\*
C:\Users\Janez\AppData\Local\Google\Chrome\Application\chrome.exe --pack-extension-key=%CD%\source.pem --pack-extension=%CD%\dist\source\ --no-message-box 
xcopy %CD%\dist\source.crx \\shramba\www\ext\ /Y
xcopy %CD%\update.xml \\shramba\www\ext\ /Y
pause
