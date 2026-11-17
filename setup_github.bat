@echo off
echo ====================================================
echo   NYX - Setup do Repositorio GitHub
echo ====================================================
echo.

REM Verifica se o gh CLI esta instalado
where gh >nul 2>&1
if errorlevel 1 (
    echo [ERRO] gh CLI nao encontrado!
    echo Instale em: https://cli.github.com/
    pause
    exit /b 1
)

REM Verifica autenticacao
gh auth status >nul 2>&1
if errorlevel 1 (
    echo [INFO] Voce precisa fazer login no GitHub primeiro.
    echo Executando gh auth login...
    gh auth login
    if errorlevel 1 (
        echo [ERRO] Falha na autenticacao.
        pause
        exit /b 1
    )
)

echo [OK] Autenticado no GitHub!
echo.

REM Define diretorio do repo
set "REPO_DIR=%~dp0"
cd /d "%REPO_DIR%"

REM Remove remote antigo se existir (pode ter ficado errado da tentativa anterior)
git remote remove origin 2>nul

REM Inicializa git se necessario
if not exist ".git" (
    echo [1/5] Inicializando repositorio git...
    git init
    git branch -M main
) else (
    echo [1/5] Repositorio git ja existe.
)

REM Cria o repositorio no GitHub na conta Nitrox-hub
echo [2/5] Criando repositorio no GitHub (Nitrox-hub)...
gh repo create Nitrox-hub/nyx --public --description "Nyx - AI Desktop Companion | Personal AI assistant inspired by Neuro-sama with 2D pixel art avatar, personality system, and desktop integration" --source . --remote origin 2>nul
if errorlevel 1 (
    echo [INFO] Repositorio pode ja existir. Configurando remote...
    git remote add origin https://github.com/Nitrox-hub/nyx.git 2>nul
    if errorlevel 1 (
        echo [INFO] Remote 'origin' ja configurado.
    )
)

REM Adiciona todos os arquivos
echo [3/5] Adicionando arquivos...
git add -A

REM Commit inicial
echo [4/5] Criando commit inicial...
git commit -m "Initial commit: Nyx AI Desktop Companion"

REM Push
echo [5/5] Enviando para o GitHub...
git push -u origin main

echo.
echo ====================================================
echo   PRONTO! Repositorio criado com sucesso!
echo ====================================================
echo.
echo Acesse: https://github.com/Nitrox-hub/nyx
echo.
pause
