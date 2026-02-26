import type { WalkthroughScreenshot } from '@/components/portfolio/walkthrough-section'

export const TEAMFLOW_WALKTHROUGH_SCREENSHOTS: WalkthroughScreenshot[] = [
  {
    src: '/screenshots/teamflow-kanban.png',
    width: 1280,
    height: 800,
    alt: 'TeamFlow Kanban board showing task columns with drag-and-drop cards organized by status: To Do, In Progress, and Done',
    steps: [
      {
        label: 'Kanban Columns',
        explanation: 'Tasks are organized into status columns so the whole team sees work progress at a glance.',
      },
      {
        label: 'Drag-and-Drop',
        explanation: 'Cards can be dragged between columns to update task status without opening a modal.',
      },
      {
        label: 'Task Status',
        explanation: 'Column headers display the status label and card count, giving an instant workload summary.',
      },
    ],
  },
  {
    src: '/screenshots/teamflow-presence.png',
    width: 1280,
    height: 800,
    alt: 'TeamFlow real-time presence indicators showing team members online status with green activity dots',
    steps: [
      {
        label: 'Online Indicators',
        explanation: 'Green activity dots show which team members are currently active in the workspace.',
      },
      {
        label: 'Live Updates',
        explanation: 'Presence state updates in real time via WebSocket so availability is always accurate.',
      },
    ],
  },
  {
    src: '/screenshots/teamflow-task-modal.png',
    width: 1280,
    height: 800,
    alt: 'TeamFlow task creation modal with fields for title, description, assignee selection, and priority level',
    steps: [
      {
        label: 'Task Title',
        explanation: 'A clear title field anchors the task record and appears on the Kanban card.',
      },
      {
        label: 'Assignee Selection',
        explanation: 'A dropdown lists all workspace members so ownership is assigned at creation time.',
      },
      {
        label: 'Priority Level',
        explanation: 'Priority tiers (Low / Medium / High) let teams triage and sort the backlog quickly.',
      },
    ],
  },
  {
    src: '/screenshots/teamflow-rbac.png',
    width: 1280,
    height: 800,
    alt: 'TeamFlow team management page showing role-based access control with member roles: Owner, Admin, and Member',
    steps: [
      {
        label: 'Member Roles',
        explanation: 'Each row displays the assigned role, enforcing who can manage settings or invite users.',
      },
      {
        label: 'Owner Badge',
        explanation: 'The Owner role is unique per workspace and cannot be removed, preventing lockout scenarios.',
      },
      {
        label: 'Access Control',
        explanation: 'Admins can promote or demote Members, while only the Owner can transfer ownership.',
      },
    ],
  },
  {
    src: '/screenshots/teamflow-audit-log.png',
    width: 1280,
    height: 800,
    alt: 'TeamFlow audit log displaying a chronological history of team actions with timestamps and actor names',
    steps: [
      {
        label: 'Action Log',
        explanation: 'Every significant event is recorded so teams can trace changes back to their source.',
      },
      {
        label: 'Timestamps',
        explanation: 'Precise timestamps show when each action occurred, supporting compliance and debugging.',
      },
      {
        label: 'Actor Names',
        explanation: 'Actor names make accountability clear by linking every change to the person who made it.',
      },
    ],
  },
]

export const DEVCOLLAB_WALKTHROUGH_SCREENSHOTS: WalkthroughScreenshot[] = [
  {
    src: '/screenshots/devcollab-workspace.png',
    width: 1280,
    height: 800,
    alt: 'DevCollab workspace overview showing the main activity feed with recent messages, posts, and collaboration activity',
    steps: [
      {
        label: 'Activity Feed',
        explanation: 'The central feed surfaces messages, code snippets, and posts in reverse-chronological order.',
      },
      {
        label: 'Workspace Posts',
        explanation: 'Long-form posts let developers share context and decisions that outlast chat messages.',
      },
    ],
  },
  {
    src: '/screenshots/devcollab-code-snippet.png',
    width: 1280,
    height: 800,
    alt: 'DevCollab code snippet post with Shiki syntax highlighting rendering a TypeScript function in color-coded blocks',
    steps: [
      {
        label: 'Shiki Highlighting',
        explanation: 'Shiki renders server-side syntax highlighting so code is readable without client JavaScript.',
      },
      {
        label: 'Language Badge',
        explanation: 'A language badge above the block sets reader expectations before they scan the code.',
      },
      {
        label: 'Code Content',
        explanation: 'Color-coded tokens map to semantic meaning, making logic and types immediately distinguishable.',
      },
    ],
  },
  {
    src: '/screenshots/devcollab-thread.png',
    width: 1280,
    height: 800,
    alt: 'DevCollab threaded discussion panel showing a message reply chain with @mention highlighting for referenced team members',
    steps: [
      {
        label: 'Reply Chain',
        explanation: 'Threaded replies keep conversations focused without polluting the main workspace feed.',
      },
      {
        label: '@Mention Highlight',
        explanation: '@Mentions are visually highlighted so referenced teammates notice them instantly.',
      },
      {
        label: 'Thread Depth',
        explanation: 'Visual indentation signals reply depth, making long discussions easy to follow.',
      },
    ],
  },
  {
    src: '/screenshots/devcollab-search.png',
    width: 1280,
    height: 800,
    alt: 'DevCollab Cmd+K search modal overlay showing full-text search results across messages, code snippets, and workspaces',
    steps: [
      {
        label: 'Search Modal',
        explanation: 'A full-screen overlay keeps users in flow while searching across the entire workspace.',
      },
      {
        label: 'Full-Text Results',
        explanation: 'Results span messages, code snippets, and workspace names so nothing gets buried.',
      },
      {
        label: 'Cmd+K Shortcut',
        explanation: 'The keyboard shortcut opens search instantly, keeping hands on the keyboard.',
      },
    ],
  },
  {
    src: '/screenshots/devcollab-activity.png',
    width: 1280,
    height: 800,
    alt: 'DevCollab activity feed and notification bell showing recent workspace events, mentions, and reply notifications',
    steps: [
      {
        label: 'Notification Bell',
        explanation: 'The bell icon in the header provides one-click access to all recent notifications.',
      },
      {
        label: 'Unread Badge',
        explanation: 'A numeric badge on the bell counts unseen notifications so nothing slips through.',
      },
      {
        label: 'Event Feed',
        explanation: 'The activity feed lists workspace events in order so teams stay aware of recent changes.',
      },
    ],
  },
]
