# Signal Chat

A secure messaging application with end-to-end encryption using the Signal Protocol.

## Features

- End-to-end encryption using Signal Protocol
- Real-time messaging
- User authentication
- Password reset functionality
- Open chat lobby
- Modern, responsive UI

## Tech Stack

### Frontend

- React
- Material-UI
- Socket.IO Client
- Signal Protocol
- Axios

### Backend

- Node.js
- Express
- MongoDB
- Socket.IO
- JWT Authentication
- Signal Protocol

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Git

### Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd [repository-name]
```

2. Install dependencies:

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Set up environment variables:

```bash
# In the server directory
cp .env.example .env
# Edit .env with your configuration

# In the client directory
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development servers:

```bash
# Start the server (from server directory)
npm run dev

# Start the client (from client directory)
npm start
```

## Development

- Client runs on: <http://localhost:3000>
- Server runs on: <http://localhost:5000>

## Deployment

The application is configured for deployment on Render.com. See `render.yaml` for configuration details.

## License

MIT License
