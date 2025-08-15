# SonarCloud MCP Server

[![npm version](https://img.shields.io/npm/v/community-sonarcloud-mcp-server.svg)](https://www.npmjs.com/package/community-sonarcloud-mcp-server)
[![npm downloads](https://img.shields.io/npm/dt/community-sonarcloud-mcp-server.svg)](https://www.npmjs.com/package/community-sonarcloud-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/langtind/community-sonarcloud-mcp-server.svg)](https://github.com/langtind/community-sonarcloud-mcp-server/issues)

A TypeScript-based Model Context Protocol (MCP) server that provides AI assistants with seamless access to SonarCloud data. Query code quality metrics, issues, pull requests, and project information directly from your AI tools.

## Why This Server?

- **No Docker Required**: Unlike SonarSource's official Docker-based MCP server, this is a lightweight TypeScript solution
- **AI-Optimized**: Returns JSON data structured for optimal AI consumption and analysis
- **Comprehensive API Coverage**: 12 tools covering all major SonarCloud endpoints
- **Flexible Authentication**: Multiple auth methods including environment variables, CLI args, and config files
- **Claude Code Integration**: Perfect for use with Anthropic's Claude Code and other MCP-compatible AI tools

## Installation

```bash
npm install -g community-sonarcloud-mcp-server
```

Or run directly with npx:

```bash
npx community-sonarcloud-mcp-server
```

## Configuration

### Method 1: Environment Variables
```bash
export SONARCLOUD_TOKEN="your_token_here"
export SONARCLOUD_ORGANIZATION="your_org_here"
export SONARCLOUD_URL="https://sonarcloud.io"  # Optional, defaults to sonarcloud.io
```

### Method 2: Command Line Arguments
```bash
npx community-sonarcloud-mcp-server --token "your_token" --org "your_org" --url "https://sonarcloud.io"
```

### Method 3: Config File
Create a config file and use:
```bash
npx community-sonarcloud-mcp-server --config ./sonarcloud-config.json
```

Config file format:
```json
{
  "token": "your_sonarcloud_token",
  "organization": "your_organization_key", 
  "url": "https://sonarcloud.io"
}
```

### Method 4: Interactive Prompts
If token/organization is missing and running interactively, the server will prompt for them.

**Priority order:** CLI args > Environment vars > Config file > Prompts

## Available Tools

This server provides 12 comprehensive tools for SonarCloud integration:

### Core Project & Issue Management
- **`list_projects`** - List all projects in your organization
- **`search_issues`** - Search and filter issues by project, severity, type, status
- **`get_pull_requests`** - List pull requests for a specific project
- **`change_issue_status`** - Mark issues as confirmed, false positive, won't fix, or reopen

### Code Quality & Metrics
- **`get_measures`** - Get detailed metrics (coverage, bugs, vulnerabilities, code smells, technical debt)
- **`search_metrics`** - Discover available metrics and their descriptions
- **`get_quality_gate_status`** - Check if projects pass quality gates
- **`list_quality_gates`** - List all available quality gate configurations

### Rules & Analysis
- **`show_rule`** - Get detailed information about specific coding rules
- **`list_rule_repositories`** - Browse rule repositories by language
- **`list_languages`** - See all supported programming languages

### Source Code
- **`get_raw_source`** - Retrieve raw source code for any file in your projects

Each tool returns structured JSON data optimized for AI analysis and decision-making.

## Quick Setup

### VS Code

[![Install for VS Code](https://img.shields.io/badge/VS_Code-Install_Community_SonarCloud_MCP-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=community-sonarcloud-mcp&inputs=%5B%7B%22id%22%3A%22SONARCLOUD_TOKEN%22%2C%22type%22%3A%22promptString%22%2C%22description%22%3A%22SonarCloud%20Token%22%2C%22password%22%3Atrue%7D%2C%7B%22id%22%3A%22SONARCLOUD_ORGANIZATION%22%2C%22type%22%3A%22promptString%22%2C%22description%22%3A%22SonarCloud%20Organization%20Key%22%2C%22password%22%3Afalse%7D%5D&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22community-sonarcloud-mcp-server%22%5D%2C%22env%22%3A%7B%22SONARCLOUD_TOKEN%22%3A%22%24%7Binput%3ASONARCLOUD_TOKEN%7D%22%2C%22SONARCLOUD_ORGANIZATION%22%3A%22%24%7Binput%3ASONARCLOUD_ORGANIZATION%7D%22%7D%7D)

### Claude Code

For [Anthropic's Claude Code](https://claude.ai/code) CLI tool, use this one-liner:

```bash
claude mcp add-json sonarcloud '{
  "command": "npx", 
  "args": ["community-sonarcloud-mcp-server"],
  "env": {
    "SONARCLOUD_TOKEN": "your-token-here",
    "SONARCLOUD_ORGANIZATION": "your-org-key"
  }
}' -s local
```

Verify the connection with:
```bash
claude mcp list
```

## Manual Configuration

Add this server to your MCP configuration file (`.mcp.json` for Claude Code):

### Option 1: Environment Variables (Recommended)
```json
{
  "mcpServers": {
    "community-sonarcloud-mcp": {
      "command": "npx",
      "args": ["community-sonarcloud-mcp-server"],
      "env": {
        "SONARCLOUD_TOKEN": "your_token_here",
        "SONARCLOUD_ORGANIZATION": "your_org_here"
      }
    }
  }
}
```

### Option 2: Direct Installation
```bash
npm install -g community-sonarcloud-mcp-server
```

Then reference the global installation:
```json
{
  "mcpServers": {
    "community-sonarcloud-mcp": {
      "command": "sonarcloud-mcp",
      "env": {
        "SONARCLOUD_TOKEN": "your_token_here",
        "SONARCLOUD_ORGANIZATION": "your_org_here"
      }
    }
  }
}
```

### Getting Your SonarCloud Token

1. Go to [SonarCloud Security Settings](https://sonarcloud.io/account/security)
2. Click **Generate Tokens**
3. Give your token a name (e.g., "Claude Code MCP")
4. Set token permissions:
   - **Browse**: Required for viewing projects and issues
   - **Execute Analysis**: Optional (only needed for CI/CD integration)
5. Generate the token and copy it immediately (you won't see it again)
6. Add the token to your configuration

### Finding Your Organization Key

Your organization key is found in the URL when viewing your SonarCloud organization:
- URL format: `https://sonarcloud.io/organizations/{your-org-key}`
- Example: For URL `https://sonarcloud.io/organizations/my-company`, the key is `my-company`

⚠️ **Security Note**: Never commit your SonarCloud token to version control. Store it securely as an environment variable.

## Troubleshooting

### "SONARCLOUD_TOKEN is required" error
- Ensure your token is properly set in environment variables or config
- Check that the token hasn't been revoked or expired in SonarCloud
- Verify the token has the correct permissions (Browse is minimum required)

### "Failed to connect" in Claude Code
- Verify the organization name matches exactly (case-sensitive)
- Check that your organization key is correct (found in SonarCloud URL)
- Ensure the token has access to the specified organization
- Try running the server directly: `SONARCLOUD_TOKEN="your_token" SONARCLOUD_ORGANIZATION="your_org" npx community-sonarcloud-mcp-server`

### "No projects found" or empty responses
- Verify your token has Browse permissions for the organization
- Check that projects exist in the specified organization
- Ensure your user account has access to the organization's projects

### MCP Server not starting
- Check that Node.js version is compatible (14+)
- Verify npm/npx is working correctly
- Try installing globally first: `npm install -g community-sonarcloud-mcp-server`

## Usage Examples

Once configured, you can ask your AI assistant questions like:

- "What projects do I have in SonarCloud?"
- "Show me all bugs in my main project"
- "What's the test coverage for my latest pull request?"
- "List all critical security vulnerabilities" 
- "Show me the quality gate status for project X"
- "What coding rules are failing in this project?"

The server will automatically query SonarCloud and return structured data for analysis.

## Development

```bash
git clone https://github.com/langtind/community-sonarcloud-mcp-server.git
cd community-sonarcloud-mcp-server
npm install
npm run dev
```

### Building

```bash
npm run build
npm start
```

### Testing

```bash
# Test the server directly
SONARCLOUD_TOKEN="your_token" SONARCLOUD_ORGANIZATION="your_org" npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol this server implements
- [SonarCloud](https://sonarcloud.io/) - The service this server integrates with
- [Claude Code](https://claude.ai/code) - AI coding assistant that works great with this server