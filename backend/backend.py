from flask import Flask, request, jsonify
from openai import OpenAI
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize OpenAI clients for chat and embeddings
chat_client = OpenAI(
    base_url="http://tentris-ml.cs.upb.de:8501/v1", 
    api_key=os.getenv('OPENAI_API_KEY')
)

@app.route('/api/chat', methods=['POST'])
def chat_completion():
    data = request.json
    messages = data.get('messages', [])
    if not messages:
        return jsonify({'error': 'No messages provided'}), 400

    try:
        response = chat_client.chat.completions.create(
            model="tentris",
            messages=messages
        )
        ai_message = response.choices[0].message.content
        print("AI Response:", ai_message)  # Print the AI's response
        return jsonify({
            "choices": [{
                "message": {
                    "content": ai_message
                }
            }]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
