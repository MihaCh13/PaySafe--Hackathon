import os
from app import create_app
from app.extensions import socketio

app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == '__main__':
    app.run(host='localhost', port=8000, debug=True, use_reloader=False)
