from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify({
        'status': 'success',
        'message': 'Flask is working!',
        'port': os.environ.get('PORT', 'not set'),
        'python_version': os.sys.version
    })

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

@app.route('/api/health/')
def api_health():
    return jsonify({'status': 'api healthy'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False)
