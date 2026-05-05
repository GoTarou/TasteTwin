@echo off
echo ==========================================
echo TasteTwin Backend Environment Setup
echo ==========================================

echo [1/3] Creating Python Virtual Environment (.venv)...
python -m venv .venv

echo [2/3] Activating Virtual Environment...
call .venv\Scripts\activate.bat

echo [3/3] Installing Required Dependencies...
pip install --upgrade pip
pip install -r requirements.txt

echo.
echo ==========================================
echo Setup Complete!
echo.
echo To start working, always activate the environment first:
echo Run: .venv\Scripts\activate
echo.
echo To download the Food-101 dataset, run:
echo python download_food101.py
echo ==========================================
pause
