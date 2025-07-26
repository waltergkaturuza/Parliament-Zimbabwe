# BUSINESS CENTRAL ONLINE DEPLOYMENT GUIDE
## Parliament Fuel System Lite

### 🌐 **Your BC Online Environment Details**
- **Tenant ID**: `086c4475-d0ef-4d2b-871c-4e078a083db5`
- **Environment**: `Production`
- **URL**: `https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production`
- **Type**: Business Central Online (Cloud)

---

## 🚀 **BC ONLINE DEPLOYMENT STEPS**

### **Step 1: Package Your Extension**

#### In VS Code (Current Window):
1. **Install AL Language Extension** (if not already installed)
   - Press `Ctrl+Shift+X`
   - Search "AL Language"
   - Install Microsoft AL Language extension

2. **Download Symbols** (Required for BC Online)
   - Press `Ctrl+Shift+P`
   - Type: `AL: Download Symbols`
   - Wait for symbols to download (may take 2-3 minutes)

3. **Package Extension**
   - Press `Ctrl+Shift+P`
   - Type: `AL: Package`
   - Extension will compile to `.app` file in output folder

### **Step 2: Deploy via Business Central Admin Center**

#### Access Admin Center:
1. **Navigate to**: [Business Central Admin Center](https://admin.businesscentral.dynamics.com/)
2. **Login** with your Microsoft 365 admin account
3. **Select Environment**: `Production` (Tenant: 086c4475-d0ef-4d2b-871c-4e078a083db5)

#### Upload Extension:
1. **Go to**: Environments → Production → Apps
2. **Click**: "Upload Extension"
3. **Select**: Your `.app` file from the output folder
4. **Click**: "Deploy" and wait for installation

### **Step 3: Alternative - Direct Upload via BC Web Client**

#### If you have admin access in BC:
1. **Open**: [Your BC Production Environment](https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production)
2. **Navigate**: Search for "Extension Management"
3. **Click**: "Upload Extension"
4. **Select**: Your `.app` file
5. **Install**: Follow the installation wizard

---

## 🔧 **POST-DEPLOYMENT CONFIGURATION**

### **Step 1: Assign Permissions**
In your BC Online environment:

1. **Navigate to**: Users (Search for "Users")
2. **Select User**: Choose users who need fuel management access
3. **Permission Sets**: 
   - Click "Permission Sets"
   - Add: "Fuel Manager Objects" (ID: 50110)
4. **Save Changes**

### **Step 2: Set User Profiles**
1. **For each user**:
   - Go to User Card
   - Set "Profile" to: "FUEL MANAGER"
   - Save

### **Step 3: Verify Installation**
1. **Login as fuel manager user**
2. **Check Role Center**: Should see "Fuel Manager" role center
3. **Test Navigation**: Verify all fuel management pages load

---

## ⚠️ **BC ONLINE SPECIFIC CONSIDERATIONS**

### **Permissions & Licensing**
- ✅ Users need appropriate BC Online licenses
- ✅ Admin permissions required for extension installation
- ✅ Custom object access included in standard BC licensing

### **Security & Compliance**
- ✅ Extension follows BC Online security standards
- ✅ No external dependencies or API calls
- ✅ Data stays within BC Online environment

### **Updates & Maintenance**
- ✅ Extension updates require re-uploading via Admin Center
- ✅ BC Online automatic updates won't affect your extension
- ✅ Object ID range (50110-50149) is safe for custom extensions

---

## 🧪 **TESTING CHECKLIST**

### **Immediate Tests (After Deployment)**
- [ ] User can login and see Fuel Manager Role Center
- [ ] Activities tiles display transaction counts
- [ ] "New Transaction" action works
- [ ] Permission sets are applied correctly

### **Functional Tests**
- [ ] Create new fuel transaction
- [ ] Edit transaction details (fuel type, amount, etc.)
- [ ] Approve/reject workflow works
- [ ] Fuel rates setup accessible and editable
- [ ] Summary reports generate correctly

### **Multi-User Tests**
- [ ] Multiple users can access simultaneously
- [ ] Transaction approval workflow between different users
- [ ] Data integrity maintained across sessions

---

## 🔄 **ROLLBACK PLAN**

### **If Issues Occur:**
1. **In Admin Center**:
   - Go to Apps
   - Find "Parliament Fuel System Lite"
   - Click "Uninstall"

2. **Or in BC Web Client**:
   - Extension Management
   - Select extension
   - Choose "Uninstall"

---

## 📞 **BC ONLINE SUPPORT**

### **Microsoft Support Channels**
- **BC Online Support**: Available through Microsoft 365 Admin Center
- **Documentation**: [BC Online Extension Management](https://docs.microsoft.com/dynamics365/business-central/)

### **Extension-Specific Support**
- **Extension**: Parliament Fuel System Lite v1.0.0.0
- **Publisher**: Parliament IT
- **Object Range**: 50110-50149

---

## 🎯 **QUICK START COMMANDS**

### **In VS Code (Current Session)**
```
1. Ctrl+Shift+P → "AL: Download Symbols" → Wait
2. Ctrl+Shift+P → "AL: Package" → Wait for .app file
3. Navigate to output folder → Find .app file
4. Upload to BC Admin Center or BC Web Client
```

### **Your Environment URLs**
- **Production BC**: https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production
- **Admin Center**: https://admin.businesscentral.dynamics.com/

---

## ✅ **YOU'RE READY TO DEPLOY!**

Your extension is configured for Business Central Online. The main difference from on-premise is that you'll upload the .app file through the web interface rather than using PowerShell commands.

**Next Step**: Package the extension using VS Code, then upload via BC Admin Center or directly in your BC environment.

---
*Extension configured for BC Online Cloud deployment*  
*Target Environment: Production (086c4475-d0ef-4d2b-871c-4e078a083db5)*
