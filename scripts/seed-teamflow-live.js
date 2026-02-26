// Run with: docker exec -i <teamflow-api-container> node < scripts/seed-teamflow-live.js
// No tsx, no faker needed. Uses @prisma/client + bcrypt already in the API image.
//
// Credentials after seed:
//   demo1@teamflow.dev / Password123  (ADMIN)
//   demo2@teamflow.dev / Password123  (MANAGER)
//   demo3@teamflow.dev / Password123  (MEMBER)

const { PrismaClient } = require('/app/node_modules/@prisma/client');
const bcrypt = require('/app/node_modules/bcrypt');
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'demo1@teamflow.dev' } });
  if (existing) {
    console.log('Already seeded — skipping');
    return;
  }

  const hash = await bcrypt.hash('Password123', 10);

  // Create users
  const admin = await prisma.user.create({
    data: { email: 'demo1@teamflow.dev', name: 'Alex Admin', password: hash, role: 'ADMIN', emailVerified: new Date() },
  });
  const manager = await prisma.user.create({
    data: { email: 'demo2@teamflow.dev', name: 'Morgan Manager', password: hash, role: 'MANAGER', emailVerified: new Date() },
  });
  const member = await prisma.user.create({
    data: { email: 'demo3@teamflow.dev', name: 'Sam Member', password: hash, role: 'MEMBER', emailVerified: new Date() },
  });
  console.log('✓ Users created (3)');

  // Create organization
  const org = await prisma.organization.create({
    data: { name: 'Demo Workspace', slug: 'demo-workspace' },
  });

  // Create memberships
  await prisma.membership.createMany({
    data: [
      { userId: admin.id, organizationId: org.id, role: 'ADMIN' },
      { userId: manager.id, organizationId: org.id, role: 'MANAGER' },
      { userId: member.id, organizationId: org.id, role: 'MEMBER' },
    ],
  });
  console.log('✓ Organization + memberships created');

  // Create labels
  const labelColors = [
    { name: 'Bug', color: '#ef4444' },
    { name: 'Feature', color: '#3b82f6' },
    { name: 'Enhancement', color: '#f97316' },
    { name: 'Design', color: '#06b6d4' },
  ];
  const labels = [];
  for (const l of labelColors) {
    labels.push(await prisma.label.create({ data: { ...l, organizationId: org.id } }));
  }

  // Create 2 projects
  const projectA = await prisma.project.create({
    data: {
      name: 'Product Launch',
      description: 'Ship Q1 features: real-time collaboration, RBAC, and audit logging.',
      status: 'ACTIVE',
      organizationId: org.id,
    },
  });

  const projectB = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Modernise company website with improved navigation and responsive layouts.',
      status: 'ACTIVE',
      organizationId: org.id,
    },
  });
  console.log('✓ Projects created (2)');

  // Task definitions per project
  const tasks = [
    // Product Launch tasks
    { title: 'Set up auth middleware with JWT', status: 'DONE', priority: 'HIGH', projectId: projectA.id, assigneeId: admin.id, createdById: admin.id, labelIdx: 1 },
    { title: 'Implement RBAC permission matrix', status: 'DONE', priority: 'HIGH', projectId: projectA.id, assigneeId: manager.id, createdById: admin.id, labelIdx: 0 },
    { title: 'Add WebSocket real-time task updates', status: 'IN_PROGRESS', priority: 'HIGH', projectId: projectA.id, assigneeId: admin.id, createdById: admin.id, labelIdx: 1 },
    { title: 'Wire up audit log events', status: 'IN_PROGRESS', priority: 'MEDIUM', projectId: projectA.id, assigneeId: manager.id, createdById: manager.id, labelIdx: 2 },
    { title: 'Drag-and-drop task prioritisation', status: 'TODO', priority: 'MEDIUM', projectId: projectA.id, assigneeId: member.id, createdById: manager.id, labelIdx: 3 },
    { title: 'Write E2E tests for auth flows', status: 'TODO', priority: 'MEDIUM', projectId: projectA.id, assigneeId: member.id, createdById: admin.id, labelIdx: 1 },
    { title: 'Lighthouse CI gating at 90+', status: 'TODO', priority: 'LOW', projectId: projectA.id, assigneeId: null, createdById: admin.id, labelIdx: 2 },
    { title: 'Fix CORS headers on API', status: 'BLOCKED', priority: 'URGENT', projectId: projectA.id, assigneeId: manager.id, createdById: manager.id, labelIdx: 0 },
    // Website Redesign tasks
    { title: 'Matrix digital rain canvas hero', status: 'DONE', priority: 'HIGH', projectId: projectB.id, assigneeId: admin.id, createdById: admin.id, labelIdx: 3 },
    { title: 'Implement Lenis smooth scroll', status: 'DONE', priority: 'MEDIUM', projectId: projectB.id, assigneeId: admin.id, createdById: admin.id, labelIdx: 2 },
    { title: 'WCAG AA colour palette migration', status: 'DONE', priority: 'HIGH', projectId: projectB.id, assigneeId: manager.id, createdById: admin.id, labelIdx: 3 },
    { title: 'GSAP ScrollTrigger parallax sections', status: 'IN_PROGRESS', priority: 'MEDIUM', projectId: projectB.id, assigneeId: admin.id, createdById: admin.id, labelIdx: 3 },
    { title: 'Spring-physics magnetic CTAs', status: 'TODO', priority: 'MEDIUM', projectId: projectB.id, assigneeId: member.id, createdById: manager.id, labelIdx: 2 },
    { title: 'Add real screenshots to case studies', status: 'TODO', priority: 'HIGH', projectId: projectB.id, assigneeId: manager.id, createdById: admin.id, labelIdx: 3 },
    { title: 'Performance budget — Lighthouse 90+', status: 'BLOCKED', priority: 'MEDIUM', projectId: projectB.id, assigneeId: null, createdById: admin.id, labelIdx: 2 },
  ];

  const positionMap = {};
  const createdTasks = [];
  for (const t of tasks) {
    const key = `${t.projectId}:${t.status}`;
    positionMap[key] = (positionMap[key] || 0);
    const { labelIdx, ...taskData } = t;
    const task = await prisma.task.create({
      data: {
        ...taskData,
        description: 'Auto-generated demo task for portfolio showcase.',
        position: positionMap[key]++,
        labels: { connect: [{ id: labels[labelIdx].id }] },
      },
    });
    createdTasks.push(task);
  }
  console.log(`✓ Tasks created (${createdTasks.length})`);

  // Add a few comments per task
  const commentLines = [
    'Looks good to me — nice clean implementation.',
    'I can take this on once the blocker is resolved.',
    'Completed and deployed to staging. Tested across Chrome + Firefox.',
    'Left a few notes inline — worth a quick review before merging.',
    'This one is more complex than estimated. Adding subtasks.',
  ];

  let commentCount = 0;
  for (let i = 0; i < createdTasks.length; i++) {
    const task = createdTasks[i];
    const author = i % 3 === 0 ? admin : i % 3 === 1 ? manager : member;
    await prisma.comment.create({
      data: {
        content: commentLines[i % commentLines.length],
        taskId: task.id,
        authorId: author.id,
      },
    });
    commentCount++;
  }
  console.log(`✓ Comments created (${commentCount})`);

  // Audit log entries
  const actions = ['TASK_CREATED', 'TASK_STATUS_CHANGED', 'TASK_ASSIGNED', 'COMMENT_CREATED'];
  for (let i = 0; i < 20; i++) {
    const actor = i % 3 === 0 ? admin : i % 3 === 1 ? manager : member;
    const task = createdTasks[i % createdTasks.length];
    await prisma.auditLog.create({
      data: {
        entityType: 'Task',
        entityId: task.id,
        action: actions[i % actions.length],
        actorId: actor.id,
        outcome: 'SUCCESS',
        timestamp: new Date(Date.now() - (20 - i) * 3600000),
      },
    });
  }
  console.log('✓ Audit log entries created (20)');

  console.log('');
  console.log('Seed complete — TeamFlow demo workspace ready');
  console.log('  Login:   https://teamflow.fernandomillan.me/login');
  console.log('  Admin:   demo1@teamflow.dev / Password123');
  console.log('  Manager: demo2@teamflow.dev / Password123');
  console.log('  Member:  demo3@teamflow.dev / Password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
