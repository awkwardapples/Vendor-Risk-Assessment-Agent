#   Vendor Risk Asessment AI Agent

This is a lightweight, end-to-end AI Vendor Risk Assessment Agent prototype designed to be demoed at Cognita REPLY.

**to change localhost ports:**

If you want backend on 9100 and frontend on 9101:
backend/.env:

*API_KEY_OPENAI=your_actual_api_key_here*
*BACKEND_PORT=9100*

frontend/.env:

*VITE_BACKEND_URL=http://localhost:9100/*

frontend/package.json:

*{*
  *"scripts": {*
   * "dev": "vite --port 9101"*
 * }*
*}*