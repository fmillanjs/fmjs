import { db } from '@/lib/db';
import { updates, projects, profile } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import Updates from '@/components/Updates';
import Projects from '@/components/Projects';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

export const revalidate = 60; // Revalidate every 60 seconds

async function getData() {
  try {
    const [profileData, updatesData, projectsData] = await Promise.all([
      db.select().from(profile).limit(1),
      db.select().from(updates).orderBy(desc(updates.createdAt)).limit(20),
      db.select().from(projects).orderBy(desc(projects.createdAt)),
    ]);

    return {
      profile: profileData[0] || null,
      updates: updatesData,
      projects: projectsData,
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      profile: null,
      updates: [],
      projects: [],
    };
  }
}

export default async function Home() {
  const { profile: profileData, updates: updatesData, projects: projectsData } = await getData();

  // Calculate stats
  const startDate = profileData?.startDate ? new Date(profileData.startDate) : new Date();
  const today = new Date();
  const daysBuilding = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Hero profile={profileData} />

        <Stats
          projectCount={projectsData.length}
          daysBuilding={daysBuilding}
          updatesCount={updatesData.length}
        />

        <Updates updates={updatesData} />

        <Projects projects={projectsData} />

        <Newsletter />

        <Footer />
      </div>
    </main>
  );
}
