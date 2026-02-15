import { PrismaClient, UserRole, ProjectStatus, TaskStatus, TaskPriority } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo workspace...');

  // 1. Create Demo Organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Demo Workspace',
      slug: 'demo-workspace',
    },
  });
  console.log('✓ Created organization:', organization.name);

  // 2. Create Demo Users (10 users)
  const demoUsers = [];
  const userRoles: UserRole[] = [
    UserRole.ADMIN,      // demo1
    UserRole.MANAGER,    // demo2
    UserRole.MANAGER,    // demo3
    UserRole.MEMBER,     // demo4
    UserRole.MEMBER,     // demo5
    UserRole.MEMBER,     // demo6
    UserRole.MEMBER,     // demo7
    UserRole.MEMBER,     // demo8
    UserRole.MEMBER,     // demo9
    UserRole.MEMBER,     // demo10
  ];

  const hashedPassword = await bcrypt.hash('Password123', 10);

  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.upsert({
      where: { email: `demo${i}@teamflow.dev` },
      update: {},
      create: {
        email: `demo${i}@teamflow.dev`,
        name: faker.person.fullName(),
        password: hashedPassword,
        role: userRoles[i - 1],
        emailVerified: new Date(),
      },
    });
    demoUsers.push(user);
  }
  console.log(`✓ Created ${demoUsers.length} users`);

  // 3. Create Memberships
  for (const user of demoUsers) {
    await prisma.membership.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        organizationId: organization.id,
        role: user.role,
      },
    });
  }
  console.log(`✓ Created ${demoUsers.length} memberships`);

  // 4. Create Labels (8 labels)
  const labelData = [
    { name: 'Bug', color: '#ef4444' },
    { name: 'Feature', color: '#3b82f6' },
    { name: 'Documentation', color: '#22c55e' },
    { name: 'Enhancement', color: '#f97316' },
    { name: 'Urgent', color: '#f43f5e' },
    { name: 'Design', color: '#06b6d4' },
    { name: 'Backend', color: '#64748b' },
    { name: 'Frontend', color: '#eab308' },
  ];

  const labels = [];
  for (const labelInfo of labelData) {
    const label = await prisma.label.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: labelInfo.name,
        },
      },
      update: {},
      create: {
        name: labelInfo.name,
        color: labelInfo.color,
        organizationId: organization.id,
      },
    });
    labels.push(label);
  }
  console.log(`✓ Created ${labels.length} labels`);

  // 5. Create Projects (3 projects)
  const projectData = [
    {
      name: 'Product Launch',
      description: 'Launch new product features and enhancements for Q1. Focus on user experience improvements, performance optimizations, and new integrations.',
      status: ProjectStatus.ACTIVE,
    },
    {
      name: 'Website Redesign',
      description: 'Modernize the company website with fresh design, improved navigation, and responsive layouts. Target completion by end of quarter.',
      status: ProjectStatus.ACTIVE,
    },
    {
      name: 'Q1 Marketing Campaign',
      description: 'Social media and content marketing campaign for product awareness. Includes blog posts, videos, and influencer partnerships.',
      status: ProjectStatus.ARCHIVED,
    },
  ];

  const projects = [];
  for (const projectInfo of projectData) {
    const project = await prisma.project.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: projectInfo.name,
        },
      },
      update: {},
      create: {
        name: projectInfo.name,
        description: projectInfo.description,
        status: projectInfo.status,
        organizationId: organization.id,
      },
    });
    projects.push(project);
  }
  console.log(`✓ Created ${projects.length} projects`);

  // 6. Create Tasks (15-20 per project)
  const allTasks = [];
  const statusDistribution = [
    { status: TaskStatus.TODO, weight: 30 },
    { status: TaskStatus.IN_PROGRESS, weight: 25 },
    { status: TaskStatus.DONE, weight: 30 },
    { status: TaskStatus.BLOCKED, weight: 15 },
  ];

  const priorityDistribution = [
    { priority: TaskPriority.LOW, weight: 20 },
    { priority: TaskPriority.MEDIUM, weight: 35 },
    { priority: TaskPriority.HIGH, weight: 30 },
    { priority: TaskPriority.URGENT, weight: 15 },
  ];

  const getWeightedRandom = <T extends { weight: number }>(items: T[]): T => {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    for (const item of items) {
      random -= item.weight;
      if (random <= 0) return item;
    }
    return items[items.length - 1];
  };

  for (const project of projects) {
    const taskCount = faker.number.int({ min: 15, max: 20 });
    const statusPositions: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
      BLOCKED: 0,
    };

    for (let i = 0; i < taskCount; i++) {
      const status = getWeightedRandom(statusDistribution).status;
      const priority = getWeightedRandom(priorityDistribution).priority;
      const creator = faker.helpers.arrayElement(demoUsers);
      const assignee = Math.random() > 0.2 ? faker.helpers.arrayElement(demoUsers) : null;

      // Random due dates: some past (overdue), some future, some null
      let dueDate: Date | null = null;
      const dueDateRoll = Math.random();
      if (dueDateRoll < 0.3) {
        // Past (overdue)
        dueDate = faker.date.past({ days: 30 });
      } else if (dueDateRoll < 0.7) {
        // Future
        dueDate = faker.date.future({ days: 60 });
      }

      const position = statusPositions[status]++;

      // Connect 1-3 random labels
      const taskLabels = faker.helpers.arrayElements(labels, { min: 1, max: 3 });

      const task = await prisma.task.create({
        data: {
          title: faker.hacker.phrase(),
          description: faker.lorem.paragraphs(2),
          status,
          priority,
          position,
          dueDate,
          projectId: project.id,
          assigneeId: assignee?.id,
          createdById: creator.id,
          labels: {
            connect: taskLabels.map(label => ({ id: label.id })),
          },
        },
      });
      allTasks.push(task);
    }
  }
  console.log(`✓ Created ${allTasks.length} tasks across ${projects.length} projects`);

  // 7. Create Comments (2-5 per task)
  let totalComments = 0;
  for (const task of allTasks) {
    const commentCount = faker.number.int({ min: 2, max: 5 });
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < commentCount; i++) {
      const author = faker.helpers.arrayElement(demoUsers);
      // Earlier comments have earlier dates
      const createdAt = new Date(
        fourteenDaysAgo.getTime() +
        (now.getTime() - fourteenDaysAgo.getTime()) * (i / commentCount)
      );

      await prisma.comment.create({
        data: {
          content: faker.lorem.paragraph(),
          taskId: task.id,
          authorId: author.id,
          createdAt,
        },
      });
      totalComments++;
    }
  }
  console.log(`✓ Created ${totalComments} comments`);

  // 8. Create Audit Log entries (20-30 entries)
  const auditActions = [
    'TASK_CREATED',
    'TASK_STATUS_CHANGED',
    'TASK_ASSIGNED',
    'COMMENT_CREATED',
  ];

  const auditCount = faker.number.int({ min: 20, max: 30 });
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < auditCount; i++) {
    const action = faker.helpers.arrayElement(auditActions);
    const actor = faker.helpers.arrayElement(demoUsers);
    const task = faker.helpers.arrayElement(allTasks);
    const timestamp = new Date(
      fourteenDaysAgo.getTime() + Math.random() * (now.getTime() - fourteenDaysAgo.getTime())
    );

    let changes = null;
    if (action === 'TASK_STATUS_CHANGED') {
      const statuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE, TaskStatus.BLOCKED];
      const fromStatus = faker.helpers.arrayElement(statuses);
      const toStatus = faker.helpers.arrayElement(statuses.filter(s => s !== fromStatus));
      changes = { previous: fromStatus, current: toStatus };
    }

    await prisma.auditLog.create({
      data: {
        entityType: 'Task',
        entityId: task.id,
        action,
        actorId: actor.id,
        outcome: 'SUCCESS',
        changes,
        timestamp,
      },
    });
  }
  console.log(`✓ Created ${auditCount} audit log entries`);

  console.log('\n🎉 Demo workspace seeded successfully!');
  console.log('Login credentials: demo1@teamflow.dev / Password123');
  console.log(`Total: ${demoUsers.length} users, ${projects.length} projects, ${allTasks.length} tasks, ${totalComments} comments`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
