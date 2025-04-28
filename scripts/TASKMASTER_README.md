# TaskMaster Integration

This project uses [TaskMaster](https://github.com/task-master-ai/task-master) for project management and task tracking through the Multi-Command Processor (MCP) server integration.

## Current Setup

- TaskMaster has been **initialized** in this project
- We're using the **global MCP server** for TaskMaster operations
- The `tasks.json` file in the `/tasks` directory is the main task definition file

## MCP vs CLI

While both interfaces are available, we prefer using the **MCP server** for TaskMaster operations for the following reasons:

1. **Better Performance**: The MCP server provides faster operations, especially for AI-intensive tasks
2. **Structured Data Exchange**: MCP tools return structured JSON data for better programmatic handling
3. **Richer Error Handling**: More detailed error information for troubleshooting
4. **Integration with Cursor**: Seamless integration with the Cursor IDE

## Key Files

- `/tasks/tasks.json`: The main task definition file managed by TaskMaster
- `/scripts/prd.txt`: The Product Requirements Document used to generate tasks
- `/scripts/task-complexity-report.json`: Task complexity analysis report

## Common MCP Operations

Instead of using the CLI commands directly, we use the MCP tools through Cursor:

| Operation | MCP Tool | 
|-----------|----------|
| List tasks | `get_tasks` |
| Find next task | `next_task` |
| Show task details | `get_task` |
| Update task status | `set_task_status` |
| Expand tasks | `expand_task` |
| Update tasks | `update_task` or `update_subtask` |

## MCP Server Status

The MCP server is a long-running process that handles TaskMaster operations. If you encounter issues with TaskMaster operations, you might need to:

1. Verify the MCP server is running (should start automatically with Cursor)
2. Check that the `ANTHROPIC_API_KEY` environment variable is set
3. Restart the MCP server if it's not responding (handled automatically by Cursor)

## Extending Tasks

When you need to add more functionality to the project:

1. Use `add_task` to create new top-level tasks
2. Use `expand_task` to break down complex tasks into subtasks
3. Use `add_subtask` to manually add subtasks to existing tasks

## Task Organization

- Tasks are executed sequentially according to their dependencies
- Completed tasks are marked with `status: "done"`
- We use the following status values: `"pending"`, `"in-progress"`, `"done"`, `"deferred"`, `"cancelled"`
- Use `validate_dependencies` to check for circular dependencies or other issues

## Using with Cursor

The Cursor IDE has special integration with TaskMaster through its MCP tools. You can trigger these tools directly within Cursor to manage your tasks without using the CLI commands. 