---
name: "aurora-setup"
displayName: "Aurora Setup"
description: "Automates the complete setup of the Aurora MCP server for SAIL interface generation in Kiro IDE. Handles cloning, building, and configuring the Aurora design system server."
keywords: ["aurora", "mcp", "setup", "sail", "appian", "design-system", "installation"]
author: "Appian"
---

# Aurora Setup

Automates the complete setup of the Aurora MCP server for SAIL interface generation in Kiro IDE.

## Overview

This Power handles the entire Aurora MCP setup process automatically:

1. **Checks prerequisites** - Verifies Node.js is installed
2. **Clones Aurora MCP** - Downloads the server from GitHub
3. **Installs dependencies** - Runs npm install
4. **Builds the server** - Compiles the MCP server
5. **Configures Kiro** - Updates `.kiro/settings/mcp.json` with the correct path
6. **Validates setup** - Tests the connection

## Available Steering Files

This power includes detailed workflow documentation:

- **setup-workflow.md** - Complete step-by-step setup process with error handling and troubleshooting

To access the detailed workflow, use:
```
readSteering with powerName="aurora-setup", steeringFile="setup-workflow.md"
```

## When to Use

Run this Power when:
- Setting up this template for the first time
- The Aurora MCP server path has changed
- You need to rebuild the Aurora MCP server
- Troubleshooting connection issues

## Usage

Simply activate this Power and ask:
```
Set up Aurora MCP for me
```

The Power will guide you through any decisions and handle the technical details automatically.

## What You'll Need

- Internet connection (to clone the repository)
- Disk space (~50MB for the Aurora MCP server)
- Permission to install npm packages

## After Setup

Once complete, you can start generating SAIL interfaces immediately. The Power will confirm when everything is ready.
