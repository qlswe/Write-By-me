import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  Share, 
  PlusSquare, 
  Globe, 
  Zap, 
  X, 
  WifiOff, 
  Terminal, 
  Copy, 
  Check, 
  Laptop, 
  Code, 
  Settings2, 
  ExternalLink,
  ShieldCheck,
  Play,
  Layers,
  Cpu,
  PackageCheck,
  Box,
  Binary,
  FileCode,
  Wrench,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  Command
} from 'lucide-react';
import { Language } from '../../data/translations';
import { usePWA } from '../../hooks/usePWA';
import { CustomSelect } from './CustomSelect';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

type TabType = 'mobile' | 'pc' | 'studio';
type PcScriptPlatform = 'windows-exe' | 'windows-ps' | 'windows-bat' | 'android-apk' | 'android-sh' | 'linux' | 'mac';

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose, lang }) => {
  const { canInstall, isInstalled, isIOS, installPWA } = usePWA();
  const [activeTab, setActiveTab] = useState<TabType>('mobile');
  const [installSuccess, setInstallSuccess] = useState(false);

  // Script Studio Customization Options
  const [targetPlatform, setTargetPlatform] = useState<PcScriptPlatform>('windows-exe');
  const [appName, setAppName] = useState('Aha Ministry');
  const [targetUrl, setTargetUrl] = useState('https://aha-raio.vercel.app');
  const [protocolHandler, setProtocolHandler] = useState('aha');
  const [windowWidth, setWindowWidth] = useState(1280);
  const [windowHeight, setWindowHeight] = useState(800);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedOneLiner, setCopiedOneLiner] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  const loc = (ruStr: string, enStr: string, byStr?: string, deStr?: string, frStr?: string, zhStr?: string) => {
    switch (lang) {
      case 'ru': return ruStr;
      case 'by': return byStr || ruStr;
      case 'de': return deStr || enStr;
      case 'fr': return frStr || enStr;
      case 'zh': return zhStr || enStr;
      default: return enStr;
    }
  };

  const isRu = lang === 'ru';

  const handleInstallClick = async () => {
    const success = await installPWA();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
        setInstallSuccess(false);
      }, 2000);
    }
  };

  // Generate Script Content based on platform and options
  const generateScript = (): { 
    code: string; 
    filename: string; 
    extension: string; 
    title: string; 
    oneLiner: string; 
    batWrapper?: { filename: string; code: string } 
  } => {
    const url = targetUrl || window.location.origin;
    const name = appName || 'Aha Ministry';
    const cleanName = name.replace(/[^a-zA-Z0-9_]/g, '_');

    switch (targetPlatform) {
      case 'windows-exe': {
        const psFilename = `build_${cleanName.toLowerCase()}_exe`;
        return {
          title: 'Windows Native EXE Compiler (C# Auto-Fallback)',
          filename: psFilename,
          extension: 'ps1',
          oneLiner: `powershell -ExecutionPolicy Bypass -NoProfile -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; .\\${psFilename}.ps1"`,
          batWrapper: {
            filename: `run_builder_${cleanName.toLowerCase()}`,
            code: `@echo off
title Build ${name} EXE
cd /d "%~dp0"
echo [AHA BUILDER] Launching PowerShell Compiler with ExecutionPolicy Bypass...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0${psFilename}.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [NOTE] Press any key if PowerShell window closed...
    pause
)
`
          },
          code: `# =========================================================
#  AHA MINISTRY - NATIVE WINDOWS EXE COMPILER (C# / .NET)
#  Compiles a standalone native ${name}.exe binary on Windows PC
# =========================================================
$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Building Standalone Windows Executable: ${name}.exe" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$AppName = "${name}"
$AppUrl = "${url}"
$ExeName = "${cleanName}.exe"
$Width = ${windowWidth}
$Height = ${windowHeight}

# Create output folder if needed
$CurrentDir = Get-Location
Write-Host "[INFO] Target Directory: $CurrentDir" -ForegroundColor Gray

# C# Source Code for Native Windows App Launcher
$Source = @"
using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace ${cleanName}Desktop {
    static class Program {
        [STAThread]
        static void Main(string[] args) {
            string targetUrl = "$AppUrl";
            string chromePath = @"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
            string chromePathx86 = @"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
            string edgePath = @"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
            string edgePath64 = @"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe";

            ProcessStartInfo psi = new ProcessStartInfo();
            if (File.Exists(chromePath)) {
                psi.FileName = chromePath;
                psi.Arguments = "--app=" + targetUrl + " --window-size=$Width,$Height --user-data-dir=\"" + Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\\\${cleanName}AppData\"";
            } else if (File.Exists(chromePathx86)) {
                psi.FileName = chromePathx86;
                psi.Arguments = "--app=" + targetUrl + " --window-size=$Width,$Height";
            } else if (File.Exists(edgePath)) {
                psi.FileName = edgePath;
                psi.Arguments = "--app=" + targetUrl + " --window-size=$Width,$Height";
            } else if (File.Exists(edgePath64)) {
                psi.FileName = edgePath64;
                psi.Arguments = "--app=" + targetUrl + " --window-size=$Width,$Height";
            } else {
                psi.FileName = targetUrl;
                psi.UseShellExecute = true;
            }
            
            try {
                Process.Start(psi);
            } catch (Exception ex) {
                MessageBox.Show("Error launching application: " + ex.Message, "$AppName", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
"@

# Locate C# Compiler (csc.exe) shipped with Windows .NET Framework
$CscCandidates = @(
    "$env:SystemRoot\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe",
    "$env:SystemRoot\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe",
    "$env:SystemRoot\\Microsoft.NET\\Framework64\\v3.5\\csc.exe",
    "$env:SystemRoot\\Microsoft.NET\\Framework\\v3.5\\csc.exe"
)

$CscPath = $null
foreach ($path in $CscCandidates) {
    if (Test-Path $path) {
        $CscPath = $path
        break
    }
}

if (-not $CscPath) {
    Write-Host "[WARNING] Windows C# Compiler (csc.exe) not found in standard .NET paths." -ForegroundColor Yellow
    Write-Host "[FALLBACK] Creating Native Windows VBScript & Batch Launchers..." -ForegroundColor Cyan
    
    # Fallback Batch launcher creation
    $BatPath = Join-Path $CurrentDir "launch_${cleanName.toLowerCase()}.bat"
    $BatLines = @("@echo off", "start msedge.exe --app=$AppUrl --window-size=$Width,$Height", "exit")
    Set-Content -Path $BatPath -Value $BatLines -Encoding ASCII
    
    # Create Desktop Shortcut
    $DesktopPath = [System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), "$AppName.lnk")
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($DesktopPath)
    $Shortcut.TargetPath = $BatPath
    $Shortcut.Description = "$AppName PC Launcher"
    $Shortcut.Save()
    
    Write-Host "[SUCCESS] Created Desktop Shortcut pointing to $BatPath" -ForegroundColor Green
    Start-Process $BatPath
    exit 0
}

Write-Host "[AHA EXE] Found C# Compiler at: $CscPath" -ForegroundColor DarkCyan
Write-Host "[AHA EXE] Compiling native Windows binary: $ExeName ..." -ForegroundColor Yellow

$TmpCS = [System.IO.Path]::GetTempFileName() + ".cs"
Set-Content -Path $TmpCS -Value $Source -Encoding UTF8

# Compile C# file into standalone EXE binary
$CompileProcess = Start-Process -FilePath $CscPath -ArgumentList "/target:winexe /out:\`"$ExeName\`" /r:System.Windows.Forms.dll \`"$TmpCS\`"" -Wait -NoNewWindow -PassThru
Remove-Item $TmpCS -ErrorAction SilentlyContinue

if (Test-Path $ExeName) {
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "[SUCCESS] Executable successfully created: $ExeName" -ForegroundColor Green
    Write-Host "Full File Path: $CurrentDir\\$ExeName" -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Green
    
    # Create Desktop Shortcut for the new EXE
    $DesktopPath = [System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), "$AppName.lnk")
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($DesktopPath)
    $Shortcut.TargetPath = "$CurrentDir\\$ExeName"
    $Shortcut.WorkingDirectory = "$CurrentDir"
    $Shortcut.Description = "$AppName Native PC Executable"
    $Shortcut.Save()
    
    Write-Host "[SHORTCUT] Desktop shortcut created at: $DesktopPath" -ForegroundColor Cyan
    
    # Launch new EXE
    Start-Process ".\\$ExeName"
} else {
    Write-Host "[ERROR] EXE compilation failed. Creating fallback Batch script..." -ForegroundColor Red
    $BatPath = Join-Path $CurrentDir "launch_${cleanName.toLowerCase()}.bat"
    $BatLines = @("@echo off", "start msedge.exe --app=$AppUrl --window-size=$Width,$Height", "exit")
    Set-Content -Path $BatPath -Value $BatLines -Encoding ASCII
    Start-Process $BatPath
}
`
        };
      }

      case 'windows-ps': {
        const psFilename = `install_${cleanName.toLowerCase()}_pc`;
        return {
          title: 'Windows PowerShell Desktop Shortcut (.ps1)',
          filename: psFilename,
          extension: 'ps1',
          oneLiner: `powershell -ExecutionPolicy Bypass -NoProfile -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; .\\${psFilename}.ps1"`,
          code: `# =========================================================
#  AHA MINISTRY - PC DESKTOP LAUNCHER BUILDER (Windows PowerShell)
# =========================================================
$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor Crimson
Write-Host "  Installing Native PC App: ${name}" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Crimson

$AppName = "${name}"
$AppUrl = "${url}"
$DesktopPath = [System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), "$AppName.lnk")
$StartMenuPath = [System.IO.Path]::Combine([System.Environment]::GetFolderPath('StartMenu'), "Programs", "$AppName.lnk")

# Locate Chrome or Edge
$BrowserPath = ""
if (Test-Path "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe") {
    $BrowserPath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
} elseif (Test-Path "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe") {
    $BrowserPath = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
} elseif (Test-Path "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe") {
    $BrowserPath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
} elseif (Test-Path "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe") {
    $BrowserPath = "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
} else {
    $BrowserPath = "msedge.exe"
}

# Create Desktop Shortcut
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($DesktopPath)
$Shortcut.TargetPath = $BrowserPath
$Shortcut.Arguments = "--app=$AppUrl --window-size=${windowWidth},${windowHeight}"
$Shortcut.Description = "${name} - Native Desktop PC Web-App"
$Shortcut.Save()

# Create Start Menu Shortcut
try {
    $StartShortcut = $WshShell.CreateShortcut($StartMenuPath)
    $StartShortcut.TargetPath = $BrowserPath
    $StartShortcut.Arguments = "--app=$AppUrl --window-size=${windowWidth},${windowHeight}"
    $StartShortcut.Save()
} catch {}

# Register Protocol Handler (${protocolHandler}://)
try {
    New-Item -Path "HKCU:\\Software\\Classes\\${protocolHandler}" -Force | Out-Null
    Set-ItemProperty -Path "HKCU:\\Software\\Classes\\${protocolHandler}" -Name "(default)" -Value "URL:${name} Protocol"
    Set-ItemProperty -Path "HKCU:\\Software\\Classes\\${protocolHandler}" -Name "URL Protocol" -Value ""
    New-Item -Path "HKCU:\\Software\\Classes\\${protocolHandler}\\shell\\open\\command" -Force | Out-Null
    Set-ItemProperty -Path "HKCU:\\Software\\Classes\\${protocolHandler}\\shell\\open\\command" -Name "(default)" -Value "'$BrowserPath' --app=$AppUrl"
} catch {}

Write-Host "========================================================" -ForegroundColor Green
Write-Host "[SUCCESS] PC Desktop App successfully installed!" -ForegroundColor Green
Write-Host "Shortcut created on your Desktop and Start Menu." -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Green
Start-Process $DesktopPath
`
        };
      }

      case 'windows-bat':
        return {
          title: 'Windows Batch Launcher (.bat)',
          filename: `run_${cleanName.toLowerCase()}_pc`,
          extension: 'bat',
          oneLiner: `run_${cleanName.toLowerCase()}_pc.bat`,
          code: `@echo off
:: =========================================================
::  AHA MINISTRY - WINDOWS BATCH LAUNCHER
:: =========================================================
title ${name} PC Desktop Launcher
cls
cd /d "%~dp0"
echo [AHA PC] Launching ${name} in Native App Window...

set APP_URL=${url}
set CHROME_64="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
set CHROME_86="C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
set EDGE_86="C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
set EDGE_64="C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"

if exist %CHROME_64% (
    start "" %CHROME_64% --app=%APP_URL% --window-size=${windowWidth},${windowHeight}
) else if exist %CHROME_86% (
    start "" %CHROME_86% --app=%APP_URL% --window-size=${windowWidth},${windowHeight}
) else if exist %EDGE_86% (
    start "" %EDGE_86% --app=%APP_URL% --window-size=${windowWidth},${windowHeight}
) else if exist %EDGE_64% (
    start "" %EDGE_64% --app=%APP_URL% --window-size=${windowWidth},${windowHeight}
) else (
    start "" "%APP_URL%"
)

echo [SUCCESS] Launched ${name}!
timeout /t 3 > nul
`
        };

      case 'android-apk':
        return {
          title: 'Android APK Gradle/Capacitor Build Script (.sh)',
          filename: `build_${cleanName.toLowerCase()}_apk`,
          extension: 'sh',
          oneLiner: `chmod +x build_${cleanName.toLowerCase()}_apk.sh && ./build_${cleanName.toLowerCase()}_apk.sh`,
          code: `#!/usr/bin/env bash
# =========================================================
#  AHA MINISTRY - ANDROID APK GRADLE/CAPACITOR BUILDER
#  Compiles a native APK package for Android smartphones
# =========================================================
set -e

APP_NAME="${name}"
APP_ID="com.aha.${cleanName.toLowerCase()}"
APP_URL="${url}"

echo "========================================================"
echo "  Building Android APK Package: $APP_NAME ($APP_ID)"
echo "========================================================"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is required to build Android APK."
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

# Initialize Capacitor Android Project
echo "[1/4] Installing Capacitor CLI and Android Platform..."
npm install @capacitor/core @capacitor/cli @capacitor/android

echo "[2/4] Initializing Capacitor Project..."
npx cap init "$APP_NAME" "$APP_ID" --web-dir "dist" || true

# Configure capacitor.config.json
cat <<EOF > capacitor.config.json
{
  "appId": "$APP_ID",
  "appName": "$APP_NAME",
  "webDir": "dist",
  "server": {
    "url": "$APP_URL",
    "cleartext": true
  },
  "android": {
    "allowMixedContent": true,
    "captureInput": true,
    "webContentsDebuggingEnabled": false
  }
}
EOF

echo "[3/4] Adding Android Native Project & Syncing..."
npx cap add android || true
npx cap sync android

echo "[4/4] Building APK Binary with Gradle..."
if [ -f "./android/gradlew" ]; then
    cd android
    chmod +x gradlew
    ./gradlew assembleDebug
    echo "========================================================"
    echo "[SUCCESS] Android APK built successfully!"
    echo "APK Location: android/app/build/outputs/apk/debug/app-debug.apk"
    echo "========================================================"
else
    echo "[INFO] Project created. Open Android Studio or run 'npx cap open android' to finish building."
fi
`
        };

      case 'linux':
        return {
          title: 'Linux Desktop Installer (.sh / .desktop)',
          filename: `install_${cleanName.toLowerCase()}_linux`,
          extension: 'sh',
          oneLiner: `chmod +x install_${cleanName.toLowerCase()}_linux.sh && ./install_${cleanName.toLowerCase()}_linux.sh`,
          code: `#!/usr/bin/env bash
# =========================================================
#  AHA MINISTRY - LINUX DESKTOP APP INSTALLER (.desktop)
# =========================================================
APP_NAME="${name}"
APP_URL="${url}"
DESKTOP_FILE="$HOME/.local/share/applications/aha-ministry.desktop"

echo "Installing $APP_NAME for Linux Desktop..."

mkdir -p "$HOME/.local/share/applications"

cat <<EOF > "$DESKTOP_FILE"
[Desktop Entry]
Version=1.0
Type=Application
Name=$APP_NAME
Comment=Aha Ministry Native Web Application
Exec=google-chrome --app=$APP_URL --window-size=${windowWidth},${windowHeight} || chromium --app=$APP_URL || xdg-open $APP_URL
Terminal=false
Categories=Utility;Network;
StartupWMClass=aha-ministry
EOF

chmod +x "$DESKTOP_FILE"

echo "[SUCCESS] Created desktop entry at $DESKTOP_FILE"
echo "You can now launch $APP_NAME from your Linux app menu!"
`
        };

      case 'mac':
        return {
          title: 'macOS Native Command Launcher (.command)',
          filename: `install_${cleanName.toLowerCase()}_mac`,
          extension: 'command',
          oneLiner: `chmod +x install_${cleanName.toLowerCase()}_mac.command && ./install_${cleanName.toLowerCase()}_mac.command`,
          code: `#!/usr/bin/env bash
# =========================================================
#  AHA MINISTRY - macOS NATIVE LAUNCHER (.command)
# =========================================================
APP_NAME="${name}"
APP_URL="${url}"

echo "Launching $APP_NAME on macOS..."

if [ -d "/Applications/Google Chrome.app" ]; then
    open -a "Google Chrome" --args --app="$APP_URL" --window-size=${windowWidth},${windowHeight}
elif [ -d "/Applications/Microsoft Edge.app" ]; then
    open -a "Microsoft Edge" --args --app="$APP_URL" --window-size=${windowWidth},${windowHeight}
else
    open "$APP_URL"
fi

echo "[SUCCESS] Launched $APP_NAME App Mode!"
`
        };

      case 'android-sh':
      default:
        return {
          title: 'Android Termux Mobile Shell Setup (.sh)',
          filename: `setup_${cleanName.toLowerCase()}_mobile`,
          extension: 'sh',
          oneLiner: `pkg install -y curl && termux-open-url "${url}"`,
          code: `#!/usr/bin/env bash
# =========================================================
#  AHA MINISTRY - MOBILE / TERMUX APP SCRIPT
# =========================================================
echo "Configuring ${name} Mobile Shell Environment..."

pkg update -y && pkg install -y nodejs curl termux-tools

# Register launcher script
mkdir -p ~/.shortcuts
cat <<'EOF' > ~/.shortcuts/launch_aha.sh
#!/usr/bin/env bash
termux-open-url "${url}"
EOF

chmod +x ~/.shortcuts/launch_aha.sh

echo "[SUCCESS] Mobile shortcut created in Termux!"
echo "Target URL: ${url}"
`
        };
    }
  };

  const currentScript = generateScript();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentScript.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyOneLiner = () => {
    navigator.clipboard.writeText(currentScript.oneLiner);
    setCopiedOneLiner(true);
    setTimeout(() => setCopiedOneLiner(false), 2000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([currentScript.code], { type: 'text/plain;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${currentScript.filename}.${currentScript.extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    // If there's a BAT wrapper, also offer to download it automatically for convenience
    if (currentScript.batWrapper) {
      setTimeout(() => {
        const batBlob = new Blob([currentScript.batWrapper!.code], { type: 'text/plain;charset=utf-8' });
        const batUrl = URL.createObjectURL(batBlob);
        const batLink = document.createElement('a');
        batLink.href = batUrl;
        batLink.download = `${currentScript.batWrapper!.filename}.bat`;
        document.body.appendChild(batLink);
        batLink.click();
        document.body.removeChild(batLink);
        URL.revokeObjectURL(batUrl);
      }, 500);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="bg-[#120d1d] border border-[#00f0ff]/30 rounded-3xl p-4 sm:p-6 md:p-8 w-full max-w-4xl shadow-[0_0_80px_rgba(0,240,255,0.15)] relative space-y-6 overflow-hidden my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glowing background highlights */}
          <div className="absolute top-0 left-1/4 w-80 h-40 bg-[#00f0ff]/15 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-80 h-40 bg-[#a855f7]/15 blur-3xl rounded-full pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-[#251c35] transition-colors cursor-pointer z-10"
          >
            <X size={22} />
          </button>

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#3d2b4f]/70 pb-5 pr-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#00f0ff] via-[#a855f7] to-[#ff4d4d] flex items-center justify-center text-black font-black shadow-lg shadow-[#00f0ff]/20 shrink-0">
                <PackageCheck size={30} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-2xl font-black text-white uppercase tracking-wider bg-gradient-to-r from-white via-cyan-200 to-purple-300 bg-clip-text text-transparent">
                    {loc('Центр Приложений (EXE, APK, PWA)', 'App Center (EXE, APK, PWA)', 'Цэнтр Дадаткаў (EXE, APK, PWA)', 'App-Zentrum (EXE, APK, PWA)', 'Centre d\'Applications (EXE, APK, PWA)', '应用中心 (EXE, APK, PWA)')}
                  </h2>
                  {isInstalled && (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-sm">
                      <ShieldCheck size={12} />
                      {loc('PWA Установа', 'PWA Active', 'PWA Актыўна', 'PWA Aktiv', 'PWA Actif', 'PWA 已激活')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-cyan-200/70 mt-1 font-medium">
                  {loc('Нативные EXE программы для ПК (Windows), APK для Android и PWA установка', 'Native Windows EXE executables, Android APK build scripts & standalone PWA launchers', 'Натыўныя EXE для ПК і APK для Android', 'Native Windows EXE-Dateien und Android APK', 'Exécutables Windows EXE et APK Android', '原生 Windows EXE 程序、Android APK 及 PWA 安装')}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-[#181126] border border-[#3d2b4f] rounded-2xl p-1.5 gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('mobile')}
              className={`flex-1 min-w-[130px] py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'mobile'
                  ? 'bg-gradient-to-r from-[#10b981] to-[#059669] text-white shadow-lg shadow-emerald-950/60 border border-emerald-400/40'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Smartphone size={17} />
              <span>{loc('Android APK / Mobile', 'Android APK / Mobile', 'Android APK', 'Android APK', 'Android APK', 'Android APK / 移动端')}</span>
            </button>

            <button
              onClick={() => setActiveTab('pc')}
              className={`flex-1 min-w-[130px] py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'pc'
                  ? 'bg-gradient-to-r from-[#00f0ff] via-[#3b82f6] to-[#6366f1] text-black font-black shadow-lg shadow-cyan-950/60 border border-cyan-300/50'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Binary size={17} />
              <span>{loc('ПК Windows EXE', 'PC Windows EXE', 'ПК Windows EXE', 'PC Windows EXE', 'PC Windows EXE', 'PC Windows EXE')}</span>
            </button>

            <button
              onClick={() => setActiveTab('studio')}
              className={`flex-1 min-w-[130px] py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'studio'
                  ? 'bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#ff4d4d] text-white shadow-lg shadow-purple-950/60 border border-pink-400/40'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Terminal size={17} />
              <span>{loc('Скрипт-Компилятор', 'Script Compiler', 'Скрыпт-Кампілятар', 'Skript-Kompiler', 'Compilateur', '脚本编译器')}</span>
            </button>
          </div>

          {/* TAB 1: ANDROID APK & MOBILE APPS */}
          {activeTab === 'mobile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Featured Android APK Card */}
              <div className="bg-gradient-to-br from-[#0c1626] via-[#11122b] to-[#1a0a24] border border-[#10b981]/50 p-5 rounded-2xl space-y-4 shadow-xl shadow-emerald-950/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#10b981]/20 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                      <Smartphone size={22} />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
                        <span>{loc('Нативный Android APK Пакет (v6.0)', 'Native Android APK Package (v6.0)', 'Натыўны Android APK Пакет', 'Natives Android APK Paket', 'Package APK Android', '原生 Android APK 安装包')}</span>
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">APK RELEASE</span>
                      </h3>
                      <p className="text-xs text-emerald-200/70 mt-0.5">
                        {loc('Готовый установочный файл с встроенным высокоскоростным движком WebView', 'Ready-to-install Android package with embedded high-performance WebView engine', 'Спампаваць готовый APK файл для смартфона', 'Fertige Android APK-Datei für Ihr Smartphone', 'Fichier APK prêt à installer', '带有内置高性能 WebView 引擎的 Android 安装包')}
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://wbm-static.my1.ru/app-debug-inst.apk"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-[#10b981] to-[#059669] hover:brightness-110 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer border border-emerald-300/40 shrink-0"
                  >
                    <Download size={18} />
                    <span>{loc('Скачать APK Файл (5 МБ)', 'Download APK File (5MB)', 'Спампаваць APK (5 МБ)', 'APK Herunterladen (5MB)', 'Télécharger APK (5 Mo)', '下载 APK (5MB)')}</span>
                  </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="bg-[#080d19] border border-[#10b981]/20 p-2.5 rounded-xl text-center">
                    <span className="text-gray-400 block text-[10px]">{loc('Поддержка:', 'OS Version:', 'Падтрымка:', 'Unterstützung:', 'Support:', '支持：')}</span>
                    <span className="text-emerald-300 font-bold">Android 5.0 - 15+</span>
                  </div>
                  <div className="bg-[#080d19] border border-[#10b981]/20 p-2.5 rounded-xl text-center">
                    <span className="text-gray-400 block text-[10px]">{loc('Ускорение:', 'Hardware Accel:', 'Паскарэнне:', 'Beschleunigung:', 'Accélération:', '硬件加速：')}</span>
                    <span className="text-emerald-300 font-bold">GPU WebGL 2.0</span>
                  </div>
                  <div className="bg-[#080d19] border border-[#10b981]/20 p-2.5 rounded-xl text-center">
                    <span className="text-gray-400 block text-[10px]">{loc('Синхронизация:', 'Sync Engine:', 'Сінхранізацыя:', 'Synchronisation:', 'Synchronisation:', '同步引擎：')}</span>
                    <span className="text-emerald-300 font-bold">Firestore Real-time</span>
                  </div>
                  <div className="bg-[#080d19] border border-[#10b981]/20 p-2.5 rounded-xl text-center">
                    <span className="text-gray-400 block text-[10px]">{loc('Офлайн режим:', 'Offline Mode:', 'Аўтаномны рэжым:', 'Offline-Modus:', 'Mode hors ligne:', '离线模式：')}</span>
                    <span className="text-emerald-300 font-bold">SW Service Worker</span>
                  </div>
                </div>
              </div>

              {/* PWA 1-Click Installation & Official Vercel Domains */}
              <div className="bg-[#0e0a17] border border-[#3d2b4f] p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Globe size={18} />
                    <h4 className="font-bold text-xs uppercase">{loc('Официальные Vercel Домены Приложения', 'Official Vercel App Domains', 'Афіцыйныя Vercel Дамены', 'Offizielle Vercel-Domains', 'Domaines Vercel Officiels', '官方 Vercel 应用域名')}</h4>
                  </div>
                  <span className="text-[10px] text-cyan-300 bg-cyan-500/20 border border-cyan-400/30 px-2 py-0.5 rounded-full font-bold">HTTPS Vercel Edge</span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  {loc('Для установки Web-App и обхода блокировок используйте эти быстрые официальные адреса:', 'Use these fast official addresses to access and install the Web-App:', 'Для ўстаноўкі Web-App і абыходу блакіровак выкарыстоўвайце гэтыя адрасы:', 'Verwenden Sie diese offiziellen Adressen für den Zugriff auf die Web-App:', 'Utilisez ces adresses officielles pour accéder à la Web-App :', '使用以下官方地址访问并安装 Web-App：')}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a 
                    href="https://aha-raio.vercel.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-[#171026] hover:bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-300 font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-md"
                  >
                    <span>aha-raio.vercel.app</span>
                    <ExternalLink size={14} />
                  </a>
                  <a 
                    href="https://ministry-ahahi.vercel.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-[#171026] hover:bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-300 font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-md"
                  >
                    <span>ministry-ahahi.vercel.app</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#0e0a17] border border-[#3d2b4f] p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Zap size={18} />
                    <h4 className="font-bold text-xs uppercase">{loc('PWA Мобильный ярлык', 'PWA Mobile Shortcut', 'PWA Мабільны ярлык', 'PWA Mobil-Shortcut', 'Raccourci PWA Mobile', 'PWA 移动快捷方式')}</h4>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    {loc('Установка без сторонних файлов за 1 секунду прямо из браузера Chrome или Edge.', 'Install instantly without downloading files directly from your mobile Chrome or Edge browser.', 'Устаноўка за 1 секунду з браўзера.', '1-Sekunden-Installation direkt aus dem Browser.', 'Installation en 1 seconde depuis le navigateur.', '直接从 Chrome 或 Edge 移动浏览器 1 秒即时安装。')}
                  </p>
                  {canInstall && (
                    <button
                      onClick={handleInstallClick}
                      className="w-full py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Download size={15} />
                      <span>{loc('Установить PWA на экран', 'Install PWA to Home Screen', 'Усталяваць PWA на экран', 'PWA auf Bildschirm installieren', 'Installer PWA sur l\'écran', '安装 PWA 到主屏幕')}</span>
                    </button>
                  )}
                </div>

                <div className="bg-[#0e0a17] border border-[#3d2b4f] p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Code size={18} />
                    <h4 className="font-bold text-xs uppercase">{loc('Скрипт Сборки APK', 'APK Build Script', 'Скрыпт Зборкі APK', 'APK-Skript-Skript', 'Script de Compilation APK', 'APK 编译脚本')}</h4>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    {loc('Сгенерируйте и запустите Bash скрипт для самостоятельной компиляции APK с помощью Gradle / Capacitor.', 'Generate Bash script to compile custom Android APK with Capacitor / Gradle.', 'Сгенерируйте скрипт зборкі APK.', 'Generieren Sie ein Bash-Skript zur APK-Kompilierung.', 'Générez un script Bash pour compiler votre APK.', '生成 Bash 脚本以使用 Capacitor / Gradle 编译自定义 Android APK。')}
                  </p>
                  <button
                    onClick={() => {
                      setTargetPlatform('android-apk');
                      setActiveTab('studio');
                    }}
                    className="w-full py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Wrench size={15} />
                    <span>{loc('Открыть Скрипт APK Сборки', 'Open APK Build Script', 'Адкрыць Скрыпт APK', 'APK-Skript öffnen', 'Ouvrir Script APK', '打开 APK 编译脚本')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: PC WINDOWS EXE APPLICATIONS */}
          {activeTab === 'pc' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Featured Windows EXE Compiler Header */}
              <div className="bg-gradient-to-br from-[#0a1828] via-[#0d1f38] to-[#18112e] border border-[#00f0ff]/50 p-5 rounded-2xl space-y-4 shadow-xl shadow-cyan-950/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#00f0ff]/20 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 flex items-center justify-center">
                      <Binary size={22} />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
                        <span>{loc('Нативный Исполняемый Файл для ПК (Aha_Ministry.exe)', 'Native PC Executable Binary (Aha_Ministry.exe)', 'Натыўны Выканальны Файл для ПК', 'Nationale Ausführbare PC-Datei', 'Fichier Exécutable PC', '原生 PC 可执行文件 (Aha_Ministry.exe)')}</span>
                        <span className="bg-[#00f0ff]/20 text-cyan-300 border border-[#00f0ff]/40 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">WINDOWS EXE</span>
                      </h3>
                      <p className="text-xs text-cyan-200/70 mt-0.5">
                        {loc('Автоматическая компиляция .exe файла прямо на вашем Windows ПК через встроенный C# csc.exe compiler', 'Compiles standalone .exe binary directly on your Windows PC via built-in C# compiler (csc.exe)', 'Скампілюйце выканальны .exe файл на вашым ПК', 'Kompiliert eine eigenständige .exe-Datei direkt auf Ihrem Windows-PC', 'Compilez un fichier .exe directement sur votre PC Windows', '通过内置的 C# csc.exe 编译器直接在 Windows PC 上自动编译 .exe 文件')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setTargetPlatform('windows-exe');
                      setActiveTab('studio');
                    }}
                    className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-[#00f0ff] via-[#3b82f6] to-[#6366f1] hover:brightness-110 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 cursor-pointer border border-cyan-200/50 shrink-0"
                  >
                    <Binary size={18} />
                    <span>{loc('Сгенерировать EXE Компилятор', 'Generate EXE Compiler', 'Згенераваць EXE Компилятор', 'EXE-Kompiler Generieren', 'Générer Compilateur EXE', '生成 EXE 编译器')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-[#08101c] border border-[#00f0ff]/20 p-3 rounded-xl flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-[#00f0ff] shrink-0" />
                    <div>
                      <h5 className="text-white font-bold text-xs">{loc('Без установки лишних программ', 'Zero Third-Party Downloads', 'Без устаноўкі праграм', 'Keine Drittanbieter-Downloads', 'Sans téléchargements tierces', '无需下载第三方软件')}</h5>
                      <p className="text-gray-400 text-[10px]">{loc('Использует штатный C# компилятор Windows', 'Uses built-in Windows .NET Framework', 'Выкарыстоўвае C# компилятор Windows', 'Verwendet Windows C#-Kompiler', 'Utilise le compilateur C# de Windows', '使用 Windows 内置 C# 编译器')}</p>
                    </div>
                  </div>

                  <div className="bg-[#08101c] border border-[#00f0ff]/20 p-3 rounded-xl flex items-center gap-3">
                    <Box size={18} className="text-[#00f0ff] shrink-0" />
                    <div>
                      <h5 className="text-white font-bold text-xs">{loc('Автономное Окно App Mode', 'Standalone App Window Mode', 'Аўтаномнае Вакно App', 'Isoliertes App-Fenster', 'Fenêtre App Autonome', '独立 App 模式窗口')}</h5>
                      <p className="text-gray-400 text-[10px]">{loc('Запуск без рамок браузера и адресов', 'Frameless clean interface window', 'Запуск без рамак браўзера', 'Ohne Browser-Rahmen', 'Sans bordures de navigateur', '无浏览器边框和地址栏')}</p>
                    </div>
                  </div>

                  <div className="bg-[#08101c] border border-[#00f0ff]/20 p-3 rounded-xl flex items-center gap-3">
                    <Sparkles size={18} className="text-[#00f0ff] shrink-0" />
                    <div>
                      <h5 className="text-white font-bold text-xs">{loc('Ярлык Рабочего Стола', 'Desktop & Start Menu Shortcut', 'Ярлык Рабочага Стола', 'Desktop-Verknüpfung', 'Raccourci Bureau', '桌面与`开始`菜单快捷方式')}</h5>
                      <p className="text-gray-400 text-[10px]">{loc('Автоматическое создание и запуск .exe', 'Auto-creates .exe & desktop shortcut', 'Аўтаматычнае стварэнне .exe', 'Automatische Erstellung von .exe', 'Création automatique de .exe', '自动创建并运行 .exe')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other PC Formats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#0e0a17] border border-[#3d2b4f] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <FileCode size={16} />
                    <span className="font-bold text-xs uppercase">{loc('PowerShell Ярлык (.ps1)', 'PowerShell Launcher (.ps1)', 'PowerShell Ярлык', 'PowerShell Launcher', 'PowerShell Launcher', 'PowerShell 启动器 (.ps1)')}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-tight">
                    {loc('Скрипт регистрации системного протокола aha:// и ярлыков Windows', 'Registers custom aha:// system protocol handler and Windows shortcuts', 'Скрыпт рэгістрацыі пратакола.', 'Registriert aha:// System-Protokoll.', 'Enregistre le protocole aha://.', '注册 custom aha:// 系统协议和 Windows 快捷方式')}
                  </p>
                  <button
                    onClick={() => {
                      setTargetPlatform('windows-ps');
                      setActiveTab('studio');
                    }}
                    className="w-full mt-2 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Code size={14} />
                    <span>{loc('Открыть .ps1 Скрипт', 'Open .ps1 Script', 'Адкрыць .ps1 Скрыпт', '.ps1-Skript öffnen', 'Ouvrir Script .ps1', '打开 .ps1 脚本')}</span>
                  </button>
                </div>

                <div className="bg-[#0e0a17] border border-[#3d2b4f] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Terminal size={16} />
                    <span className="font-bold text-xs uppercase">{loc('Linux / macOS Скрипты', 'Linux / macOS Launchers', 'Linux / macOS Скрыпты', 'Linux / macOS Skripte', 'Scripts Linux / macOS', 'Linux / macOS 启动脚本')}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-tight">
                    {loc('Создание файловых ярлыков .desktop для Linux и .command для macOS', 'Creates native .desktop entries for Linux and .command launchers for macOS', 'Скрыпты для Linux і macOS.', 'Erstellt .desktop und .command Skripte.', 'Crée des scripts .desktop et .command.', '生成适用于 Linux 的 .desktop 快捷方式 and macOS 的 .command 启动脚本')}
                  </p>
                  <button
                    onClick={() => {
                      setTargetPlatform('linux');
                      setActiveTab('studio');
                    }}
                    className="w-full mt-2 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Code size={14} />
                    <span>{loc('Открыть Linux/macOS Скрипт', 'Open Linux/macOS Script', 'Адкрыць Скрыпт', 'Linux/macOS Skript öffnen', 'Ouvrir Script Linux/macOS', '打开 Linux/macOS 脚本')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: SCRIPT STUDIO & COMPILER */}
          {activeTab === 'studio' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Studio Parameters Form */}
              <div className="bg-[#0b0716] border border-[#3d2b4f] p-4 sm:p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#3d2b4f]/60">
                  <span className="text-xs font-black uppercase tracking-wider text-pink-400 flex items-center gap-2">
                    <Settings2 size={18} />
                    {loc('Скрипт-Компилятор и Параметры Сборки', 'Script Compiler & Build Parameters', 'Скрыпт-Кампілятар і Параметры', 'Skript-Kompiler & Parameter', 'Compilateur et Paramètres', '脚本编译器与编译参数')}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300 bg-[#171028] px-2 py-0.5 rounded border border-cyan-500/30">
                    AHA COMPILER v6.0
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Platform Selector */}
                  <div>
                    <label className="text-[10px] text-gray-300 font-bold uppercase tracking-wider block mb-1">
                      {loc('Целевой Формат / Платформа:', 'Target Platform / Format:', 'Мэтавы Формат:', 'Ziel-Plattform:', 'Format Cible:', '目标格式/平台：')}
                    </label>
                    <CustomSelect
                      value={targetPlatform}
                      onChange={(val) => setTargetPlatform(val as PcScriptPlatform)}
                      className="!px-3 !py-2 !rounded-xl !text-xs !bg-[#18102a] !border-[#00f0ff]/40 !text-cyan-300"
                      options={[
                        { value: "windows-exe", label: "Windows Native Executable Binary (.exe)" },
                        { value: "windows-ps", label: "Windows PowerShell Installer (.ps1)" },
                        { value: "windows-bat", label: "Windows Batch Launcher (.bat)" },
                        { value: "android-apk", label: "Android Capacitor Gradle Build (.sh)" },
                        { value: "android-sh", label: "Android Termux Mobile Shell (.sh)" },
                        { value: "linux", label: "Linux Desktop (.sh / .desktop)" },
                        { value: "mac", label: "macOS Desktop Command (.command)" }
                      ]}
                    />
                  </div>

                  {/* App Title */}
                  <div>
                    <label className="text-[10px] text-gray-300 font-bold uppercase tracking-wider block mb-1">
                      {loc('Название Приложения:', 'App Name:', 'Назва:', 'App-Titel:', 'Nom de l\'Application:', '应用名称：')}
                    </label>
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      className="w-full bg-[#18102a] border border-[#3d2b4f] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                    />
                  </div>
                </div>

                {/* Target App URL ($AppUrl) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block">
                      {loc('URL Адрес Приложения ($AppUrl):', 'Target App URL ($AppUrl):', 'URL Адрас ($AppUrl):', 'Ziel-App-URL ($AppUrl):', 'URL Cible ($AppUrl):', '目标应用 URL ($AppUrl)：')}
                    </label>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {loc('Пресеты:', 'Presets:', 'Прэсэты:', 'Presets:', 'Préréglages:', '预设：')}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="w-full bg-[#18102a] border border-cyan-500/40 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-[#ff4d4d]"
                    placeholder="https://aha-raio.vercel.app"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setTargetUrl('https://aha-raio.vercel.app')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                        targetUrl === 'https://aha-raio.vercel.app' 
                          ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400' 
                          : 'bg-[#18102a] text-gray-400 border-[#3d2b4f] hover:text-white'
                      }`}
                    >
                      aha-raio.vercel.app
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetUrl('https://ministry-ahahi.vercel.app')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                        targetUrl === 'https://ministry-ahahi.vercel.app' 
                          ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400' 
                          : 'bg-[#18102a] text-gray-400 border-[#3d2b4f] hover:text-white'
                      }`}
                    >
                      ministry-ahahi.vercel.app
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetUrl(window.location.origin)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                        targetUrl === window.location.origin 
                          ? 'bg-purple-500/30 text-purple-300 border-purple-400' 
                          : 'bg-[#18102a] text-gray-400 border-[#3d2b4f] hover:text-white'
                      }`}
                    >
                      {loc('Текущий хост', 'Current host', 'Бягучы хост', 'Aktueller Host', 'Hôte actuel', '当前主机')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">{loc('Ширина Окна (px):', 'Window Width:', 'Шырыня:', 'Breite:', 'Largeur:', '窗口宽度：')}</label>
                    <input
                      type="number"
                      value={windowWidth}
                      onChange={(e) => setWindowWidth(Number(e.target.value))}
                      className="w-full bg-[#18102a] border border-[#3d2b4f] rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">{loc('Высота Окна (px):', 'Window Height:', 'Вышыня:', 'Höhe:', 'Hauteur:', '窗口高度：')}</label>
                    <input
                      type="number"
                      value={windowHeight}
                      onChange={(e) => setWindowHeight(Number(e.target.value))}
                      className="w-full bg-[#18102a] border border-[#3d2b4f] rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">{loc('Протокол Handler:', 'Protocol:', 'Пратакол:', 'Protokoll:', 'Protocole:', '协议处理：')}</label>
                    <input
                      type="text"
                      value={protocolHandler}
                      onChange={(e) => setProtocolHandler(e.target.value)}
                      className="w-full bg-[#18102a] border border-[#3d2b4f] rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                      placeholder="aha"
                    />
                  </div>
                </div>
              </div>

              {/* FAST ONE-LINER LAUNCH COMMAND */}
              <div className="bg-[#0b1424] border border-[#00f0ff]/40 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Command size={14} className="text-[#00f0ff]" />
                    {loc('Мгновенная команда для Терминала / Консоли (Запуск в 1 клик):', 'Instant Terminal One-Liner (1-Click Run):', 'Мгненная каманда для Тэрмінала:', 'Sofortige Terminal-Befehlszeile:', 'Commande Rapide Terminal:', '终端一键即时运行命令：')}
                  </span>
                  <button
                    onClick={handleCopyOneLiner}
                    className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {copiedOneLiner ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copiedOneLiner ? loc('Скопировано!', 'Copied!', 'Скапіявана!', 'Kopiert!', 'Copié !', '已复制！') : loc('Скопировать команду', 'Copy Command', 'Капіяваць каманду', 'Befehl Kopieren', 'Copier Commande', '复制命令')}</span>
                  </button>
                </div>
                <div className="bg-[#050912] p-2.5 rounded-xl border border-cyan-500/20 font-mono text-[11px] text-emerald-300 overflow-x-auto select-all">
                  <code>{currentScript.oneLiner}</code>
                </div>
              </div>

              {/* Code Output Block */}
              <div className="bg-[#06040b] border border-[#3d2b4f] rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#140e22] border-b border-[#3d2b4f]/60 flex-wrap gap-2">
                  <span className="text-[11px] font-mono font-bold text-cyan-300 flex items-center gap-2">
                    <FileCode size={15} className="text-[#00f0ff]" />
                    <span>{currentScript.filename}.{currentScript.extension}</span>
                    <span className="text-[10px] text-gray-400 font-normal hidden sm:inline">({currentScript.title})</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-1.5 bg-[#251c35] hover:bg-[#3d2b4f] text-gray-200 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-[#3d2b4f]"
                    >
                      {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedCode ? loc('Скопировано', 'Copied', 'Скапіявана', 'Kopiert', 'Copié', '已复制') : loc('Копировать код', 'Copy Code', 'Капіяваць код', 'Code Kopieren', 'Copier Code', '复制代码')}</span>
                    </button>

                    <button
                      onClick={handleDownloadScript}
                      className="px-4 py-1.5 bg-gradient-to-r from-[#ff4d4d] to-[#ec4899] hover:brightness-110 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Download size={14} />
                      <span>{loc('Скачать Скрипт', 'Download Script', 'Спампаваць Скрыпт', 'Skript Herunterladen', 'Télécharger Script', '下载脚本')}</span>
                    </button>
                  </div>
                </div>

                <pre className="p-4 text-[11px] font-mono text-cyan-300 leading-relaxed overflow-x-auto max-h-60 no-scrollbar selection:bg-[#ff4d4d] selection:text-black">
                  <code>{currentScript.code}</code>
                </pre>
              </div>

              {/* Troubleshooting Accordion */}
              <div className="bg-[#181126] border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
                <button
                  onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                  className="w-full flex items-center justify-between text-left text-amber-300 font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle size={16} className="text-amber-400 animate-pulse" />
                    <span>{loc('Почему скрипт может не запускаться? (Инструкция по решению)', 'Script not running? (Troubleshooting Guide)', 'Почему скрипт может не запускаться?', 'Skript läuft nicht?', 'Le script ne s\'exécute pas ?', '脚本无法运行？（故障排除指南）')}</span>
                  </span>
                  <span className="text-xs text-amber-400 font-mono underline">{showTroubleshoot ? loc('Скрыть', 'Hide', 'Схаваць', 'Ausblenden', 'Masquer', '隐藏') : loc('Показать', 'Show', 'Паказаць', 'Anzeigen', 'Afficher', '显示')}</span>
                </button>

                {showTroubleshoot && (
                  <div className="space-y-2 text-[11px] text-gray-300 pt-2 border-t border-amber-500/20 leading-relaxed">
                    <div className="bg-[#0b0813] p-2.5 rounded-xl border border-amber-500/20 space-y-1">
                      <span className="text-amber-400 font-bold block">1. Windows блокирует .ps1 файл (Execution Policy):</span>
                      <p className="text-gray-400">
                        В Windows PowerShell по умолчанию отключён запуск внешних файлов. Чтобы запустить скрипт, скачайте вместе с ним файл <strong>.bat</strong> или скопируйте команду из синей рамки выше и вставьте в консоль PowerShell.
                      </p>
                    </div>

                    <div className="bg-[#0b0813] p-2.5 rounded-xl border border-amber-500/20 space-y-1">
                      <span className="text-amber-400 font-bold block">2. Запуск Batch файла .bat в 1 клик:</span>
                      <p className="text-gray-400">
                        Скачайте вариант <strong>Windows Batch Launcher (.bat)</strong> — он запускается обычным двойным кликом мыши без настроек системы и создаёт окно приложения.
                      </p>
                    </div>

                    <div className="bg-[#0b0813] p-2.5 rounded-xl border border-amber-500/20 space-y-1">
                      <span className="text-amber-400 font-bold block">3. Права доступа на Linux / macOS / Android:</span>
                      <p className="text-gray-400">
                        Выполните в терминале команду разрешения исполнения: <code className="text-cyan-300">chmod +x script.sh</code> (или <code className="text-cyan-300">chmod +x script.command</code>) перед запуском.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-[#3d2b4f]/60 flex items-center justify-between">
            <span className="text-[10px] text-cyan-200/50 font-mono flex items-center gap-1.5">
              <Cpu size={13} className="text-[#00f0ff]" />
              AHA NATIVE ENGINE v6.0 &bull; WINDOWS EXE & ANDROID APK COMPILERS
            </span>

            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#251c35] hover:bg-[#3d2b4f] text-gray-200 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-[#3d2b4f] shadow-md"
            >
              {loc('Закрыть', 'Close', 'Зачыніць', 'Schließen', 'Fermer', '关闭')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
