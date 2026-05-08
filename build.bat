@echo off
cd /d D:\WorkBuddy\20260331205655\client
if exist .vite rmdir /s /q .vite
if exist dist rmdir /s /q dist
call npm run build
if exist dist\assets\Home*.js (
    echo Build SUCCESS
) else (
    echo Build FAILED - no dist
)
