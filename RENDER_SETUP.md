# 📋 Instrucciones Render Deployment

## 🔗 Conectar repo a Render

1. Ve a [render.com/dashboard](https://render.com/dashboard)
2. Click en **"New +"** → **"Web Service"**
3. Selecciona el repo: `Daniel24k543/call-ia`
4. Render detectará automáticamente el `render.yaml` y creará ambos servicios

---

## 🖥️ Servicio 1: API Backend (Ya creado)

**Nombre:** `api-llamadas`  
**URL:** https://api-llamadas-jufb.onrender.com  
**Build:** `cd backend && npm install`  
**Start:** `cd backend && node index.js`

### Variables de Entorno requeridas:

```
GEMINI_API_KEY = tu_clave_de_gemini_aquí
```

**Cómo agregarlo en Render:**
1. En el Dashboard del servicio `api-llamadas`
2. Ve a **Environment** (lado izquierdo)
3. Click **"Add Environment Variable"**
4. Key: `GEMINI_API_KEY`
5. Value: Tu clave de API de Google Generative AI
6. Click **"Save"**

---

## 📊 Servicio 2: Frontend Dashboard (NUEVO - Crear)

**Nombre:** `panel-pedidos`  
**Build:** `cd frontend && npm install && npm run build`  
**Start:** `cd frontend && npm start`

### Variables de Entorno (Copiar estas):

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDHSgM2cW3ICt_ORMY4_Hes8wsNYS0nm34
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=erolive-adfe6.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=erolive-adfe6
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=erolive-adfe6.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=393729484144
NEXT_PUBLIC_FIREBASE_APP_ID=1:393729484144:web:effd11ea3ad9bcc52c5bb5
```

**Cómo crear el servicio:**
1. Dashboard Render → **"New +"** → **"Web Service"**
2. Selecciona `call-ia` repo
3. Name: `panel-pedidos`
4. Build Command: `cd frontend && npm install && npm run build`
5. Start Command: `cd frontend && npm start`
6. Environment: Node
7. Plan: Free
8. Click **"Create Web Service"**

**Luego agregar env vars:**
1. En el nuevo servicio → **Environment**
2. Agregar cada variable de Firebase
3. Click **"Save"** después de cada una

---

## 🔄 Auto-actualización (Auto-Deploy)

✅ **Render detectará cambios automáticamente:**
- Si haces push a `main` en GitHub → Render se redeploy automáticamente
- No necesitas hacer nada más
- Toma ~2-3 minutos por servicio

---

## 📍 URLs finales

Una vez deployado:

- **Backend API:** https://api-llamadas-jufb.onrender.com
- **Dashboard:** https://panel-pedidos-XXXX.onrender.com (Render la genera)

---

## 🔗 Retell Webhook URL

En Retell AI → Webhook Settings → **Agent Level Webhook URL:**

```
https://api-llamadas-jufb.onrender.com/webhook/retell
```

---

## ✅ Verificación

1. Accede a tu dashboard en: `https://panel-pedidos-XXXX.onrender.com`
2. Haz una llamada en Retell
3. Verifica que aparezca el pedido en el panel en tiempo real
4. Todos los logs aparecen en Render Dashboard → **Logs**

