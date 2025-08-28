# Parliament Fuel System - Heavy-Duty Render Deployment

This Django backend is configured for deployment on Render with **comprehensive data science, machine learning, and enterprise libraries**.

## 🚀 Quick Deploy to Render

1. **Connect your GitHub repository to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `waltergkaturuza/Parliament-Zimbabwe`
   - Select the `main` branch

2. **Configure the service:**
   - **Name**: `parliament-fuel-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 4 --timeout 120`
   - **Root Directory**: `backend`
   - **Plan**: `Starter` (recommended for heavy libraries)

3. **Environment Variables:**

   ```env
   PYTHON_VERSION=3.12.0
   DJANGO_SETTINGS_MODULE=config.settings.render
   DATABASE_URL=postgres://postgres.ofwxvaxnqbcergdsyzkj:74XTPTBFCaVipMaZ@aws-1-us-east-1.pooler.supabase.com:6543/postgres
   SECRET_KEY=[Auto-generate in Render]
   DEBUG=false
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Build time: ~15-20 minutes (due to heavy libraries)
   - Render will handle all the complex dependencies

## 📚 Comprehensive Library Stack

### **Data Science & Analytics**
- **Pandas** - Data manipulation and analysis
- **NumPy** - Numerical computing
- **SciPy** - Scientific computing
- **Matplotlib/Seaborn** - Data visualization
- **Plotly** - Interactive visualizations
- **Statsmodels** - Statistical analysis

### **Machine Learning & AI**
- **TensorFlow** - Deep learning framework
- **PyTorch** - Machine learning library
- **Scikit-learn** - Machine learning algorithms
- **Transformers** - NLP and language models
- **Hugging Face Hub** - Pre-trained models

### **Web & API Development**
- **FastAPI** - Modern API framework
- **Requests/httpx** - HTTP clients
- **BeautifulSoup/Scrapy** - Web scraping
- **Selenium** - Browser automation

### **Document & Image Processing**
- **OpenCV** - Computer vision
- **Tesseract OCR** - Text recognition
- **ReportLab/WeasyPrint** - PDF generation
- **python-docx** - Word documents
- **PDF2Image** - PDF processing

### **Performance & Async**
- **Celery/RQ** - Background tasks
- **asyncio/aiohttp** - Async processing
- **uvloop** - High-performance event loop

### **Development & Monitoring**
- **Jupyter/IPython** - Interactive development
- **pytest** - Testing framework
- **Sentry** - Error monitoring
- **Prometheus** - Metrics

## 🌟 API Endpoints

Once deployed:

- **Health Check**: `https://parliament-fuel-backend.onrender.com/`
- **API Info**: `https://parliament-fuel-backend.onrender.com/api/`
- **Admin Panel**: `https://parliament-fuel-backend.onrender.com/admin/`

## 💪 Why This Stack is Powerful

1. **Complete Data Pipeline**: From data ingestion to ML model deployment
2. **Enterprise Ready**: Monitoring, logging, and production optimizations
3. **Scalable**: Background tasks, caching, and async processing
4. **Versatile**: Handle text, images, documents, APIs, and real-time data
5. **Modern**: Latest versions of all major libraries

## 🔧 Build Process

The build process is optimized for heavy libraries:

1. **Staged Installation**: Core packages first, then specialized libraries
2. **No Cache**: Prevents storage issues with large packages
3. **Multiple Workers**: Gunicorn with 4 workers for performance
4. **Extended Timeout**: 120 seconds for heavy operations
5. **Large Disk**: 10GB storage for libraries and data

## 📊 Capabilities Showcase

Your API will showcase:

- **80+ Production Libraries** installed and ready
- **Data Science** capabilities with Pandas/NumPy
- **Machine Learning** with TensorFlow/PyTorch
- **Computer Vision** with OpenCV
- **NLP** with Transformers
- **Document Processing** with multiple formats
- **Real-time Processing** with WebSockets
- **Background Jobs** with Celery
- **API Documentation** with DRF Spectacular

## 🚀 Performance Optimizations

- **Gunicorn** with multiple workers
- **Redis** caching layer
- **Database** connection pooling
- **Static files** optimization
- **Async** request handling
- **Background** task processing

This deployment gives you a **production-ready, enterprise-grade** Django API capable of handling any data science, ML, or business requirement!
