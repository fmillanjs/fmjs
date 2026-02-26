export interface Screenshot {
  src: string
  width: number
  height: number
  alt: string
  label: string
}

export const TEAMFLOW_SCREENSHOTS: Screenshot[] = [
  {
    src: '/screenshots/teamflow-kanban.png',
    width: 1280,
    height: 800,
    alt: 'TeamFlow Kanban board showing task columns with drag-and-drop cards organized by status: To Do, In Progress, and Done',
    label: 'Kanban Board',
  },
  {
    src: '/screenshots/teamflow-presence.png',
    width: 1280,
    height: 800,
    alt: 'TeamFlow real-time presence indicators showing team members online status with green activity dots',
    label: 'Real-Time Presence',
  },
  {
    src: '/screenshots/teamflow-task-modal.png',
    width: 1280,
    height: 800,
    alt: 'TeamFlow task creation modal with fields for title, description, assignee selection, and priority level',
    label: 'Task Creation & Assignment',
  },
  {
    src: '/screenshots/teamflow-rbac.png',
    width: 1280,
    height: 800,
    alt: 'TeamFlow team management page showing role-based access control with member roles: Owner, Admin, and Member',
    label: 'Role-Based Access Control',
  },
  {
    src: '/screenshots/teamflow-audit-log.png',
    width: 1280,
    height: 800,
    alt: 'TeamFlow audit log displaying a chronological history of team actions with timestamps and actor names',
    label: 'Audit Log',
  },
]

export const DEVCOLLAB_SCREENSHOTS: Screenshot[] = [
  {
    src: '/screenshots/devcollab-workspace.png',
    width: 1280,
    height: 800,
    alt: 'DevCollab workspace overview showing the main activity feed with recent messages, posts, and collaboration activity',
    label: 'Workspace Feed',
  },
  {
    src: '/screenshots/devcollab-code-snippet.png',
    width: 1280,
    height: 800,
    alt: 'DevCollab code snippet post with Shiki syntax highlighting rendering a TypeScript function in color-coded blocks',
    label: 'Code Snippets with Shiki',
  },
  {
    src: '/screenshots/devcollab-thread.png',
    width: 1280,
    height: 800,
    alt: 'DevCollab threaded discussion panel showing a message reply chain with @mention highlighting for referenced team members',
    label: 'Threaded Discussions',
  },
  {
    src: '/screenshots/devcollab-search.png',
    width: 1280,
    height: 800,
    alt: 'DevCollab Cmd+K search modal overlay showing full-text search results across messages, code snippets, and workspaces',
    label: 'Cmd+K Full-Text Search',
  },
  {
    src: '/screenshots/devcollab-activity.png',
    width: 1280,
    height: 800,
    alt: 'DevCollab activity feed and notification bell showing recent workspace events, mentions, and reply notifications',
    label: 'Activity & Notifications',
  },
]
