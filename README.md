# chatbot


## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/dice-group/chatbot.git
    cd chatbot
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

## Backend Server Setup

1. Create a `.env.local` file in the root of the project:

    ```bash
    touch .env.local
    ```

2. Add your OpenAI API key to the `.env.local` file:

    ```
    OPENAI_API_KEY=your_openai_api_key_here
    ```

3. Run the backend server with the following command:

    ```bash
    node --env-file=.env.local backend/server.js
    ```

## Frontend Setup

1. To start the frontend server, use:

    ```bash
    npm run dev
    ```

2. Once the development server is running, open your browser and navigate to:

    ```
    http://localhost:3000/
    ```