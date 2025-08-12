#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';

interface SonarCloudConfig {
  token: string;
  organization?: string;
  url: string;
}

class SonarCloudMCPServer {
  private server: Server;
  private config: SonarCloudConfig;

  constructor() {
    this.server = new Server(
      {
        name: 'sonarcloud-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.config = this.loadConfig();
    this.setupHandlers();
  }

  private loadConfig(): SonarCloudConfig {
    // 1. Command line arguments
    const args = process.argv.slice(2);
    const config: Partial<SonarCloudConfig> = {};

    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--token':
          config.token = args[++i];
          break;
        case '--org':
        case '--organization':
          config.organization = args[++i];
          break;
        case '--url':
          config.url = args[++i];
          break;
        case '--config':
          const configFile = args[++i];
          try {
            const fileConfig = JSON.parse(readFileSync(configFile, 'utf8'));
            Object.assign(config, fileConfig);
          } catch (error) {
            console.error(`Failed to read config file ${configFile}:`, error);
          }
          break;
      }
    }

    // 2. Environment variables (override config file, but not CLI args)
    return {
      token: config.token || process.env.SONARCLOUD_TOKEN || process.env.SONARQUBE_TOKEN || '',
      organization: config.organization || process.env.SONARCLOUD_ORGANIZATION || process.env.SONARQUBE_ORG || '',
      url: config.url || process.env.SONARCLOUD_URL || process.env.SONARQUBE_URL || 'https://sonarcloud.io',
    };
  }

  private async promptForMissingConfig(): Promise<void> {
    if (!this.config.token) {
      const rl = createInterface({
        input: process.stdin,
        output: process.stderr, // Use stderr to not interfere with MCP protocol
      });

      this.config.token = await new Promise((resolve) => {
        rl.question('SonarCloud Token: ', (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      });
    }

    if (!this.config.organization) {
      const rl = createInterface({
        input: process.stdin,
        output: process.stderr,
      });

      this.config.organization = await new Promise((resolve) => {
        rl.question('SonarCloud Organization: ', (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      });
    }
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}) {
    const baseURL = this.config.url.endsWith('/') ? this.config.url.slice(0, -1) : this.config.url;
    const url = `${baseURL}/api${endpoint}`;

    const headers: Record<string, string> = {};
    if (this.config.token) {
      headers.Authorization = `Basic ${Buffer.from(`${this.config.token}:`).toString('base64')}`;
    }

    if (this.config.organization) {
      params.organization = this.config.organization;
    }

    try {
      const response = await axios.get(url, {
        headers,
        params,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 'Unknown';
        const message = error.response?.data?.errors?.[0]?.msg || error.message;
        throw new Error(`SonarCloud API Error: ${status} - ${message}`);
      }
      throw error;
    }
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_issues',
            description: 'Search for issues in SonarCloud projects',
            inputSchema: {
              type: 'object',
              properties: {
                project: {
                  type: 'string',
                  description: 'Project key to search in',
                },
                pullRequest: {
                  type: 'string',
                  description: 'Pull request ID to filter issues',
                },
                resolved: {
                  type: 'boolean',
                  description: 'Filter by resolved status',
                },
                severities: {
                  type: 'string',
                  description: 'Comma-separated list of severities (MAJOR, MINOR, etc.)',
                },
                types: {
                  type: 'string',
                  description: 'Comma-separated list of types (BUG, VULNERABILITY, CODE_SMELL)',
                },
                pageSize: {
                  type: 'number',
                  description: 'Number of results per page (max 500)',
                  default: 100,
                },
              },
            },
          },
          {
            name: 'get_measures',
            description: 'Get component measures/metrics',
            inputSchema: {
              type: 'object',
              properties: {
                component: {
                  type: 'string',
                  description: 'Component key (project, file, etc.)',
                },
                pullRequest: {
                  type: 'string',
                  description: 'Pull request ID',
                },
                metricKeys: {
                  type: 'string',
                  description: 'Comma-separated metric keys (sqale_index, coverage, ncloc, etc.)',
                  default: 'sqale_index,coverage,ncloc,reliability_rating,security_rating,bugs,vulnerabilities,code_smells',
                },
                strategy: {
                  type: 'string',
                  description: 'Component tree strategy (leaves, children)',
                  default: 'leaves',
                },
              },
              required: ['component'],
            },
          },
          {
            name: 'list_projects',
            description: 'List projects in the organization',
            inputSchema: {
              type: 'object',
              properties: {
                q: {
                  type: 'string',
                  description: 'Search query for project names',
                },
                pageSize: {
                  type: 'number',
                  description: 'Number of results per page',
                  default: 100,
                },
              },
            },
          },
          {
            name: 'get_pull_requests',
            description: 'List pull requests for a project',
            inputSchema: {
              type: 'object',
              properties: {
                project: {
                  type: 'string',
                  description: 'Project key',
                },
              },
              required: ['project'],
            },
          },
          {
            name: 'change_issue_status',
            description: 'Change the status of a SonarQube issue',
            inputSchema: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                  description: 'Issue key',
                },
                transition: {
                  type: 'string',
                  description: 'Transition to apply (confirm, falsepositive, wontfix, reopen)',
                },
              },
              required: ['key', 'transition'],
            },
          },
          {
            name: 'list_languages',
            description: 'List all programming languages supported',
            inputSchema: {
              type: 'object',
              properties: {
                q: {
                  type: 'string',
                  description: 'Pattern to match language keys/names',
                },
              },
            },
          },
          {
            name: 'search_metrics',
            description: 'Search for available metrics',
            inputSchema: {
              type: 'object',
              properties: {
                q: {
                  type: 'string',
                  description: 'Search query for metric names',
                },
                pageSize: {
                  type: 'number',
                  description: 'Number of results per page',
                  default: 100,
                },
              },
            },
          },
          {
            name: 'get_quality_gate_status',
            description: 'Get Quality Gate status for a project',
            inputSchema: {
              type: 'object',
              properties: {
                projectKey: {
                  type: 'string',
                  description: 'Project key',
                },
                branch: {
                  type: 'string',
                  description: 'Branch name',
                },
                pullRequest: {
                  type: 'string',
                  description: 'Pull request ID',
                },
              },
              required: ['projectKey'],
            },
          },
          {
            name: 'list_quality_gates',
            description: 'List all quality gates',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'show_rule',
            description: 'Show detailed information about a rule',
            inputSchema: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                  description: 'Rule key (e.g. typescript:S1481)',
                },
              },
              required: ['key'],
            },
          },
          {
            name: 'list_rule_repositories',
            description: 'List rule repositories',
            inputSchema: {
              type: 'object',
              properties: {
                language: {
                  type: 'string',
                  description: 'Language key to filter by',
                },
                q: {
                  type: 'string',
                  description: 'Search query',
                },
              },
            },
          },
          {
            name: 'get_raw_source',
            description: 'Get source code as raw text',
            inputSchema: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                  description: 'File key',
                },
                branch: {
                  type: 'string',
                  description: 'Branch name',
                },
                pullRequest: {
                  type: 'string',
                  description: 'Pull request ID',
                },
              },
              required: ['key'],
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_issues':
            return await this.searchIssues(args);
          case 'get_measures':
            return await this.getMeasures(args);
          case 'list_projects':
            return await this.listProjects(args);
          case 'get_pull_requests':
            return await this.getPullRequests(args);
          case 'change_issue_status':
            return await this.changeIssueStatus(args);
          case 'list_languages':
            return await this.listLanguages(args);
          case 'search_metrics':
            return await this.searchMetrics(args);
          case 'get_quality_gate_status':
            return await this.getQualityGateStatus(args);
          case 'list_quality_gates':
            return await this.listQualityGates(args);
          case 'show_rule':
            return await this.showRule(args);
          case 'list_rule_repositories':
            return await this.listRuleRepositories(args);
          case 'get_raw_source':
            return await this.getRawSource(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async searchIssues(args: any) {
    const params: Record<string, any> = {};
    
    if (args.project) params.componentKeys = args.project;
    if (args.pullRequest) params.pullRequest = args.pullRequest;
    if (args.resolved !== undefined) params.resolved = args.resolved;
    if (args.severities) params.severities = args.severities;
    if (args.types) params.types = args.types;
    params.ps = Math.min(args.pageSize || 100, 500);

    const data = await this.makeRequest('/issues/search', params);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            summary: {
              total: data.total,
              pages: Math.ceil(data.total / params.ps),
              effortTotal: data.effortTotal,
              debtTotal: data.debtTotal,
            },
            issues: data.issues,
            components: data.components,
          }, null, 2),
        },
      ],
    };
  }

  private async getMeasures(args: any) {
    const params: Record<string, any> = {
      component: args.component,
      metricKeys: args.metricKeys || 'sqale_index,coverage,ncloc,reliability_rating,security_rating,bugs,vulnerabilities,code_smells',
      strategy: args.strategy || 'leaves',
      ps: 500,
    };

    if (args.pullRequest) params.pullRequest = args.pullRequest;

    const data = await this.makeRequest('/measures/component_tree', params);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            summary: {
              total: data.paging?.total || 0,
              baseComponent: data.baseComponent,
            },
            components: data.components,
          }, null, 2),
        },
      ],
    };
  }

  private async listProjects(args: any) {
    const params: Record<string, any> = {
      ps: args.pageSize || 100,
    };

    if (args.q) params.q = args.q;

    const data = await this.makeRequest('/projects/search', params);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            summary: {
              total: data.paging?.total || 0,
              pageSize: data.paging?.pageSize || 0,
            },
            projects: data.components,
          }, null, 2),
        },
      ],
    };
  }

  private async getPullRequests(args: any) {
    const data = await this.makeRequest(`/project_pull_requests/list`, {
      project: args.project,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            pullRequests: data.pullRequests,
          }, null, 2),
        },
      ],
    };
  }

  private async changeIssueStatus(args: any) {
    const data = await this.makeRequest('/issues/do_transition', {
      issue: args.key,
      transition: args.transition,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            issue: data.issue,
            transitions: data.transitions,
          }, null, 2),
        },
      ],
    };
  }

  private async listLanguages(args: any) {
    const params: Record<string, any> = {};
    if (args.q) params.q = args.q;

    const data = await this.makeRequest('/languages/list', params);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            languages: data.languages,
          }, null, 2),
        },
      ],
    };
  }

  private async searchMetrics(args: any) {
    const params: Record<string, any> = {
      ps: args.pageSize || 100,
    };
    if (args.q) params.q = args.q;

    const data = await this.makeRequest('/metrics/search', params);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            summary: {
              total: data.total || 0,
              pageSize: data.ps || 0,
            },
            metrics: data.metrics,
          }, null, 2),
        },
      ],
    };
  }

  private async getQualityGateStatus(args: any) {
    const params: Record<string, any> = {
      projectKey: args.projectKey,
    };
    
    if (args.branch) params.branch = args.branch;
    if (args.pullRequest) params.pullRequest = args.pullRequest;

    const data = await this.makeRequest('/qualitygates/project_status', params);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            projectStatus: data.projectStatus,
          }, null, 2),
        },
      ],
    };
  }

  private async listQualityGates(args: any) {
    const data = await this.makeRequest('/qualitygates/list');

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            qualityGates: data.qualitygates,
            default: data.default,
          }, null, 2),
        },
      ],
    };
  }

  private async showRule(args: any) {
    const data = await this.makeRequest('/rules/show', {
      key: args.key,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            rule: data.rule,
          }, null, 2),
        },
      ],
    };
  }

  private async listRuleRepositories(args: any) {
    const params: Record<string, any> = {};
    if (args.language) params.language = args.language;
    if (args.q) params.q = args.q;

    const data = await this.makeRequest('/rules/repositories', params);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            repositories: data.repositories,
          }, null, 2),
        },
      ],
    };
  }

  private async getRawSource(args: any) {
    const params: Record<string, any> = {
      key: args.key,
    };
    
    if (args.branch) params.branch = args.branch;
    if (args.pullRequest) params.pullRequest = args.pullRequest;

    const data = await this.makeRequest('/sources/raw', params);

    return {
      content: [
        {
          type: 'text',
          text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async run() {
    try {
      // Validate configuration
      if (!this.config.token) {
        throw new Error('SONARCLOUD_TOKEN is required');
      }
      
      if (!this.config.organization) {
        throw new Error('SONARCLOUD_ORGANIZATION is required');
      }

      // Prompt for missing config only if running interactively
      if (process.stdin.isTTY && (!this.config.token || !this.config.organization)) {
        await this.promptForMissingConfig();
      }

      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('SonarCloud MCP server running on stdio');
      console.error(`Connected to organization: ${this.config.organization}`);
      console.error(`Using URL: ${this.config.url}`);
    } catch (error) {
      console.error('Failed to start SonarCloud MCP server:', error);
      process.exit(1);
    }
  }
}

const server = new SonarCloudMCPServer();
server.run().catch(console.error);