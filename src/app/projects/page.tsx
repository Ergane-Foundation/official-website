import { ProjectsExplorer } from '@/components/ProjectsExplorer';
import { getProjects } from '@/lib/data';
import { pageMeta } from '@/lib/meta';

export const metadata = pageMeta('Projects', 'Open-source projects maintained under the Ergane Foundation.');
export const revalidate = 3600;

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <ProjectsExplorer
      projects={projects.map(({ slug, name, domain, tagline, language, stars, forks, license }) => ({ slug, name, domain, tagline, language, stars, forks, license }))}
    />
  );
}
