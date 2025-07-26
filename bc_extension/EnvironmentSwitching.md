# BC Online Environment Switching Guide

## Current Configuration: ✅ SANDBOX 23.0.0.0

### ✅ app.json - Sandbox 23.0.0.0
```json
{
  "platform": "23.0.0.0",
  "application": "23.0.0.0", 
  "runtime": "11.0",
  "dependencies": [
    {
      "name": "System Application",
      "version": "23.0.0.0"
    },
    {
      "name": "Base Application", 
      "version": "23.0.0.0"
    }
  ]
}
```

### ✅ launch.json - Sandbox
```json
{
  "environmentType": "Sandbox",
  "environmentName": "Sandbox",
  "tenant": "086c4475-d0ef-4d2b-871c-4e078a083db5"
}
```

## How to Switch to Production 26.3.0.0

### 1. Update app.json:
```json
{
  "platform": "26.0.0.0", 
  "application": "26.0.0.0",
  "runtime": "13.0",
  "dependencies": [
    {
      "name": "System Application",
      "version": "26.0.0.0"
    },
    {
      "name": "Base Application",
      "version": "26.0.0.0" 
    }
  ]
}
```

### 2. Update launch.json:
```json
{
  "environmentName": "Production"
}
```

### 3. Clean symbols:
```powershell
Remove-Item .alpackages -Recurse -Force
```

### 4. Download symbols:
- Ctrl+Shift+P → "AL: Download Symbols"

## Next Steps:
1. Try "AL: Download Symbols" now
2. Should work with Sandbox 23.0.0.0 configuration
3. If successful, compile and test extension
4. When ready for Production, use switching guide above
