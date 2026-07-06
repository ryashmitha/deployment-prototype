# Aurora MCP Setup Workflow

This workflow guides the automated setup of Aurora MCP for less technical users.

## Setup Steps

### 1. Check Node.js Installation

```bash
node --version
```

**If not installed:**
- Provide clear instructions for their OS
- macOS: `brew install node` or download from nodejs.org
- Windows: Download installer from nodejs.org
- Linux: Use package manager (apt, yum, etc.)

### 2. Determine Installation Location

Ask user where they want to install Aurora MCP, or suggest:
- macOS/Linux: `~/Documents/GitHub/aurora-mcp`
- Windows: `C:\Users\[username]\Documents\GitHub\aurora-mcp`

Store this path for later use.

### 3. Clone Aurora MCP Repository

```bash
git clone https://github.com/appian/aurora-mcp.git [installation-path]
```

**If git not installed:**
- Provide download link: https://github.com/appian/aurora-mcp/archive/refs/heads/main.zip
- Guide user to extract to chosen location

### 4. Install Dependencies

```bash
cd [installation-path]
npm install
```

Monitor output for errors. Common issues:
- Network problems: Suggest retry
- Permission errors: Suggest using sudo (macOS/Linux) or running as admin (Windows)

### 5. Build the Server

```bash
npm run build
```

Verify `build/index.js` exists after completion.

### 6. Configure GitHub Token (Avoid Rate Limiting)

Create `.env` file in the Aurora MCP directory to configure GitHub access:

```bash
cd [installation-path]
cp .env.example .env
```

Edit the `.env` file with the user's GitHub token:

```bash
GITHUB_TOKEN=your_github_token_here
GITHUB_OWNER=appian-design
GITHUB_REPO=aurora
```

**GitHub Token Setup:**
1. Go to https://github.com/settings/personal-access-tokens
2. Click "Generate new token" (classic)
3. Give it a name like "Aurora MCP"
4. Select scopes: `public_repo` (for public repositories)
5. Generate and copy the token
6. Paste into the `.env` file

**Why this matters:**
- Without a token, GitHub API has strict rate limits (60 requests/hour)
- With a token, you get 5,000 requests/hour
- This prevents "API rate limit exceeded" errors during documentation fetching

### 7. Update Kiro Configuration

Update `.kiro/settings/mcp.json` with the full absolute path to the Aurora MCP server:

```json
{
  "mcpServers": {
    "design-system": {
      "command": "node",
      "args": [
        "[installation-path]/build/index.js"
      ],
      ...
    }
  }
}
```

**Important:** 
- Use the full absolute path (e.g., `/Users/username/Documents/GitHub/aurora-mcp/build/index.js`)
- Don't use `~` or environment variables
- Restart Kiro after updating the configuration

### 8. Test the Connection

Try listing design system categories to verify the connection works:
```
List available Aurora design system categories
```

If successful, setup is complete!

## Error Handling

### Node.js Not Found
- Provide installation instructions
- Wait for user to install
- Retry check

### Git Clone Fails
- Check internet connection
- Verify GitHub is accessible
- Offer manual download option

### npm install Fails
- Check error message
- Common fixes:
  - Clear npm cache: `npm cache clean --force`
  - Delete node_modules and retry
  - Check npm registry access

### Build Fails
- Check Node.js version (needs 16+)
- Review build errors
- Suggest checking Aurora MCP repository issues

### MCP Connection Fails
- Verify the path in `.kiro/settings/mcp.json` is correct and absolute
- Ensure path points to `build/index.js` in the Aurora MCP directory
- Verify build/index.js exists at that path
- Restart Kiro to reload the configuration
- Test running server directly: `node [installation-path]/build/index.js`
- Check Kiro MCP server status in UI

### GitHub Rate Limit Errors
- Verify `.env` file exists in Aurora MCP directory
- Check `GITHUB_TOKEN` is set correctly in the `.env` file
- Verify token has `public_repo` scope
- Test token: `curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/rate_limit`
- Restart Kiro after updating the token

## Success Criteria

Setup is successful when:
1. ✅ Node.js is installed and accessible
2. ✅ Aurora MCP is cloned/downloaded
3. ✅ Dependencies are installed
4. ✅ Server is built (build/index.js exists)
5. ✅ `.env` file is created in Aurora MCP directory with `GITHUB_TOKEN`
6. ✅ `.kiro/settings/mcp.json` is updated with full absolute path
7. ✅ Kiro is restarted to load the configuration
8. ✅ MCP server responds to test query

## Post-Setup Message

Once complete, inform the user:

"✅ Aurora MCP is set up and ready! 

**Important:** Please restart Kiro to load the MCP server configuration, then you can start generating SAIL interfaces.

**GitHub Token Configured:** Your GitHub token is set up to avoid API rate limiting when fetching documentation.

After restart, try asking:
- 'Create a dashboard with KPI cards'
- 'Generate a form for customer data entry'
- 'Build a work queue interface'

The Aurora Design System and SAIL syntax guidance will be available to help you build professional Appian interfaces."
