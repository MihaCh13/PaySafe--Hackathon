from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/health')
def get_health():
	return jsonify({"ok": True})

if __name__ == '__main__':
	app.run(debug=False, port=8000, host='localhost')