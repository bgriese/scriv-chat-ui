# Multi-Provider Chat UI

A flexible chat interface that supports multiple AI providers:
- **OpenAI Assistants API** - Stateful conversations with custom assistants
- **OpenAI Chat Completions** - Direct API calls for simple chat
- **n8n Webhooks** - Integration with your existing n8n workflows

## Features

- 🤖 **Multi-Provider Support**: Switch between OpenAI Assistants, OpenAI Chat, and n8n workflows
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🧵 **Thread Management**: Persistent conversations with OpenAI Assistants
- 🔧 **Assistant Selection**: Choose from your available OpenAI assistants
- 💬 **Real-time Messaging**: Live chat interface with typing indicators
- 🎨 **Modern UI**: Clean, dark-mode compatible interface with Tailwind CSS

## Setup

### 1. Environment Variables

Copy the example environment file and configure your API keys:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Required for OpenAI providers
OPENAI_API_KEY=your_openai_api_key_here

# Required for n8n provider
N8N_WEBHOOK_URL=your_n8n_webhook_url_here

# Optional: n8n API access
N8N_API_URL=your_n8n_api_url_here
N8N_API_KEY=your_n8n_api_key_here

# Optional: Default assistant
DEFAULT_ASSISTANT_ID=asst_your_default_assistant_id
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

### OpenAI Assistants

1. Set your `OPENAI_API_KEY` in `.env.local`
2. Create assistants in the [OpenAI Assistant Playground](https://platform.openai.com/assistants)
3. Select "OpenAI Assistant" as the provider
4. Choose your assistant from the dropdown
5. Start chatting - conversations are persistent across page reloads

### OpenAI Chat

1. Set your `OPENAI_API_KEY` in `.env.local`
2. Select "OpenAI Chat" as the provider
3. Start chatting - uses standard chat completions API

### n8n Integration

1. Create a webhook workflow in n8n that accepts POST requests
2. Set `N8N_WEBHOOK_URL` to your webhook endpoint
3. Select "n8n Workflow" as the provider
4. Your messages will be sent to n8n for processing

## API Endpoints

- `GET /api/assistants` - List available OpenAI assistants
- `POST /api/chat` - Send messages to any provider
- `GET /api/chat` - Check API status and available providers

## Architecture

```
src/
├── app/
│   ├── api/          # Next.js API routes
│   ├── globals.css   # Global styles
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── components/       # React components
├── services/         # Provider service classes
└── types/           # TypeScript type definitions
```

## Contributing

This is a starting template - feel free to extend it with:
- Additional AI providers (Anthropic Claude, Google Gemini, etc.)
- File upload support for assistants
- Conversation persistence with database
- User authentication
- Real-time collaboration features

## License

MIT