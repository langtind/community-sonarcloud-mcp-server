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

1. Go to [SonarCloud](https://sonarcloud.io)
2. Navigate to **My Account** → **Security**
3. Generate a new token with appropriate permissions
4. Copy the token and add it to your configuration

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